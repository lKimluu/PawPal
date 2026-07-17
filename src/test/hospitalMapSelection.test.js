import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createHospitalMapSelectionCoordinator,
  createMapBoundsScheduler,
  createSpiderfyPopupSyncGuard,
  resolveHospitalMapInitialCenter,
  revealHospitalClusterMarker,
} from '../utils/hospitalMapSelection.js'

function createMap({
  atTarget = false,
  zoom = 13,
  onCall = () => {},
  onMoveEnd = () => {},
  stopEmitsMoveEnd = false,
} = {}) {
  const listeners = new Map()
  const calls = []

  function record(call) {
    calls.push(call)
    onCall(call)
  }

  return {
    calls,
    once(event, handler) {
      listeners.set(event, handler)
    },
    off(event, handler) {
      if (listeners.get(event) === handler) {
        listeners.delete(event)
        record(['off', event])
      }
    },
    stop() {
      record(['stop'])
      if (stopEmitsMoveEnd) onMoveEnd()
    },
    flyTo(position, nextZoom) {
      record(['flyTo', position, nextZoom])
    },
    getZoom() {
      return zoom
    },
    isAtTarget() {
      return atTarget
    },
    fire(event) {
      const handler = listeners.get(event)
      listeners.delete(event)
      handler?.()
      if (event === 'moveend') onMoveEnd()
    },
    listener(event) {
      return listeners.get(event)
    },
  }
}

const hospitals = {
  first: { id: 1, latitude: 25.033, longitude: 121.5654 },
  second: { id: 2, latitude: 25.041, longitude: 121.57 },
}

test('地圖初始中心只依建立當下資料按優先順序解析', () => {
  const fallbackCenter = [25.033, 121.5654]
  const userLocation = { lat: 25.033964, lng: 121.564468 }

  assert.deepEqual(
    resolveHospitalMapInitialCenter({
      selectedHospital: hospitals.second,
      userLocation,
      hospitals: [hospitals.first],
      fallbackCenter,
    }),
    [25.041, 121.57],
  )
  assert.deepEqual(
    resolveHospitalMapInitialCenter({ userLocation, hospitals: [hospitals.first], fallbackCenter }),
    [25.033964, 121.564468],
  )
  assert.deepEqual(
    resolveHospitalMapInitialCenter({ hospitals: [hospitals.first, hospitals.second], fallbackCenter }),
    [25.037, 121.5677],
  )
  assert.deepEqual(resolveHospitalMapInitialCenter({ hospitals: [], fallbackCenter }), fallbackCenter)
})

test('同一次 moveend 與 zoomend 只執行一個 debounced bounds request', () => {
  const timers = new Map()
  let nextTimerId = 0
  let boundsRequestCount = 0
  const scheduler = createMapBoundsScheduler({
    onBounds: () => {
      boundsRequestCount += 1
    },
    setTimer(callback) {
      nextTimerId += 1
      timers.set(nextTimerId, callback)
      return nextTimerId
    },
    clearTimer(timerId) {
      timers.delete(timerId)
    },
  })

  scheduler.schedule()
  scheduler.schedule()

  assert.equal(timers.size, 1)
  timers.values().next().value()
  assert.equal(boundsRequestCount, 1)
})

test('醫院聚焦前取消 pending bounds，最終 moveend 仍可重新排程', () => {
  const timers = new Map()
  let nextTimerId = 0
  let boundsRequestCount = 0
  const scheduler = createMapBoundsScheduler({
    onBounds: () => {
      boundsRequestCount += 1
    },
    setTimer(callback) {
      nextTimerId += 1
      timers.set(nextTimerId, callback)
      return nextTimerId
    },
    clearTimer(timerId) {
      timers.delete(timerId)
    },
  })

  scheduler.schedule()
  const pendingTimerId = nextTimerId
  scheduler.cancel()

  assert.equal(timers.has(pendingTimerId), false)
  timers.get(pendingTimerId)?.()
  assert.equal(boundsRequestCount, 0)

  scheduler.schedule()
  timers.get(nextTimerId)?.()
  assert.equal(boundsRequestCount, 1)
})

test('stop 觸發的 moveend 不留下 bounds timer，只有 flyTo 完成後重新排程', () => {
  const timers = new Map()
  let nextTimerId = 0
  let boundsRequestCount = 0
  const scheduler = createMapBoundsScheduler({
    onBounds: () => {
      boundsRequestCount += 1
    },
    setTimer(callback) {
      nextTimerId += 1
      timers.set(nextTimerId, callback)
      return nextTimerId
    },
    clearTimer(timerId) {
      timers.delete(timerId)
    },
  })
  const map = createMap({
    stopEmitsMoveEnd: true,
    onMoveEnd: scheduler.schedule,
  })
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: () => false,
    syncClusters: () => {},
    revealMarker: () => {},
    beforeProgrammaticMove: scheduler.cancel,
  })

  scheduler.schedule()
  coordinator.focus(hospitals.first)

  assert.equal(timers.size, 0)
  assert.deepEqual(map.calls.slice(-2), [
    ['stop'],
    ['flyTo', [25.033, 121.5654], 15],
  ])

  map.fire('moveend')
  assert.equal(timers.size, 1)
  timers.values().next().value()
  assert.equal(boundsRequestCount, 1)
})

test('清除醫院選取時保留 pending bounds request', () => {
  const timers = new Map()
  let nextTimerId = 0
  let boundsRequestCount = 0
  const focusCalls = []
  let selectedHospital = hospitals.first
  const scheduler = createMapBoundsScheduler({
    onBounds: () => {
      boundsRequestCount += 1
    },
    setTimer(callback) {
      nextTimerId += 1
      timers.set(nextTimerId, callback)
      return nextTimerId
    },
    clearTimer(timerId) {
      timers.delete(timerId)
    },
  })
  const focusSelectedHospital = () => {
    if (selectedHospital) scheduler.cancel()
    focusCalls.push(selectedHospital ?? null)
  }

  scheduler.schedule()
  const pendingTimerId = nextTimerId
  selectedHospital = null
  focusSelectedHospital()

  assert.equal(timers.has(pendingTimerId), true)
  assert.deepEqual(focusCalls, [null])
  timers.get(pendingTimerId)?.()
  assert.equal(boundsRequestCount, 1)
})

function createClusterLayer(animationCount = 0) {
  const listeners = new Map()
  const zoomCalls = []

  return {
    _inZoomAnimation: animationCount,
    zoomCalls,
    once(event, handler) {
      listeners.set(event, handler)
    },
    off(event, handler) {
      if (listeners.get(event) === handler) listeners.delete(event)
    },
    fire(event) {
      const handler = listeners.get(event)
      listeners.delete(event)
      handler?.()
    },
    zoomToShowLayer(marker, callback) {
      zoomCalls.push({ marker, callback })
    },
  }
}

function createPopupMarker({ spiderfied = false } = {}) {
  const listeners = new Map()
  let isOpen = false

  return {
    ...(spiderfied ? { _preSpiderfyLatlng: { lat: 25.033, lng: 121.5654 } } : {}),
    once(event, handler) {
      listeners.set(event, handler)
    },
    off(event, handler) {
      if (listeners.get(event) === handler) listeners.delete(event)
    },
    openPopup() {
      isOpen = true
      const handler = listeners.get('popupopen')
      listeners.delete('popupopen')
      handler?.()
    },
    isPopupOpen() {
      return isOpen
    },
    closePopup() {
      isOpen = false
      const handler = listeners.get('popupclose')
      listeners.delete('popupclose')
      handler?.()
    },
    listenerCount(event) {
      return listeners.has(event) ? 1 : 0
    },
  }
}

for (const hospitalCount of [2, 3]) {
  test(`${hospitalCount} 間同座標醫院展開 popup 時延後 rebuild，關閉後只同步一次`, () => {
    const marker = createPopupMarker({ spiderfied: true })
    const syncCalls = []
    const guard = createSpiderfyPopupSyncGuard({
      onDeferredSync: (options) => syncCalls.push(options),
    })

    marker.openPopup()
    assert.equal(guard.deferIfNeeded(marker, { restoreOpenPopup: true }), true)
    assert.equal(guard.deferIfNeeded(marker, { restoreOpenPopup: true }), true)
    assert.deepEqual(syncCalls, [])
    assert.equal(marker.listenerCount('popupclose'), 1)

    marker.closePopup()
    assert.deepEqual(syncCalls, [{ restoreOpenPopup: false }])
    assert.equal(marker.listenerCount('popupclose'), 0)
  })
}

test('新的選取會取消舊 spiderfy popupclose listener', () => {
  const oldMarker = createPopupMarker({ spiderfied: true })
  const syncCalls = []
  const guard = createSpiderfyPopupSyncGuard({
    onDeferredSync: (options) => syncCalls.push(options),
  })

  oldMarker.openPopup()
  guard.deferIfNeeded(oldMarker, { restoreOpenPopup: true })
  guard.cancel()
  oldMarker.closePopup()

  assert.deepEqual(syncCalls, [])
  assert.equal(oldMarker.listenerCount('popupclose'), 0)
})

test('非 spiderfy marker 不延後既有 popup 同步', () => {
  const marker = createPopupMarker()
  const guard = createSpiderfyPopupSyncGuard({
    onDeferredSync: () => assert.fail('一般 marker 不應觸發延後同步'),
  })

  marker.openPopup()
  assert.equal(guard.deferIfNeeded(marker, { restoreOpenPopup: true }), false)
  assert.equal(marker.listenerCount('popupclose'), 0)
})

test('群組動畫完全結束後才展開 marker 並開啟 popup', () => {
  const clusterLayer = createClusterLayer(2)
  const marker = createPopupMarker()
  let popupOpenCount = 0

  revealHospitalClusterMarker({
    clusterLayer,
    marker,
    isCurrentMarker: () => true,
    onPopupOpen: () => {
      popupOpenCount += 1
    },
  })

  assert.equal(clusterLayer.zoomCalls.length, 0)
  clusterLayer._inZoomAnimation = 1
  clusterLayer.fire('animationend')
  assert.equal(clusterLayer.zoomCalls.length, 0)

  clusterLayer._inZoomAnimation = 0
  clusterLayer.fire('animationend')
  assert.equal(clusterLayer.zoomCalls.length, 1)

  clusterLayer.zoomCalls[0].callback()
  assert.equal(marker.isPopupOpen(), true)
  assert.equal(popupOpenCount, 1)
})

test('沒有 cluster 動畫時立即交給 zoomToShowLayer；取消後不執行舊 callback', () => {
  const clusterLayer = createClusterLayer()
  const marker = createPopupMarker()
  let popupOpenCount = 0
  const cancel = revealHospitalClusterMarker({
    clusterLayer,
    marker,
    isCurrentMarker: () => true,
    onPopupOpen: () => {
      popupOpenCount += 1
    },
  })

  assert.equal(clusterLayer.zoomCalls.length, 1)
  cancel()
  clusterLayer.zoomCalls[0].callback()
  assert.equal(marker.isPopupOpen(), false)
  assert.equal(popupOpenCount, 0)
})

test('等待 cluster 動畫期間取消選取會移除 animationend listener', () => {
  const clusterLayer = createClusterLayer(1)
  const marker = createPopupMarker()
  const cancel = revealHospitalClusterMarker({
    clusterLayer,
    marker,
    isCurrentMarker: () => false,
    onPopupOpen: () => assert.fail('過期選取不得開啟 popup'),
  })

  cancel()
  clusterLayer._inZoomAnimation = 0
  clusterLayer.fire('animationend')
  assert.equal(clusterLayer.zoomCalls.length, 0)
})

test('選取醫院會等待 moveend，且 popup 開啟前延後 marker rebuild', () => {
  const map = createMap()
  const syncCalls = []
  const revealCalls = []
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: (currentMap) => currentMap.isAtTarget(),
    syncClusters: (options) => syncCalls.push(options),
    revealMarker: (hospitalId, onPopupOpen) => revealCalls.push({ hospitalId, onPopupOpen }),
  })

  coordinator.focus(hospitals.first)

  assert.deepEqual(syncCalls, [{ restoreOpenPopup: false }])
  assert.equal(revealCalls.length, 0)
  assert.deepEqual(map.calls.at(-1), ['flyTo', [25.033, 121.5654], 15])

  coordinator.requestClusterSync()
  assert.equal(syncCalls.length, 1)

  map.fire('moveend')
  assert.equal(revealCalls.length, 1)
  assert.equal(revealCalls[0].hospitalId, 1)
  assert.equal(syncCalls.length, 1)

  revealCalls[0].onPopupOpen()
  assert.deepEqual(syncCalls.at(-1), { restoreOpenPopup: true })
})

test('新的醫院選取會取消舊 listener，只有最新 generation 能開 popup', () => {
  const map = createMap()
  const syncCalls = []
  const revealCalls = []
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: () => false,
    syncClusters: (options) => syncCalls.push(options),
    revealMarker: (hospitalId, onPopupOpen) => revealCalls.push({ hospitalId, onPopupOpen }),
  })

  coordinator.focus(hospitals.first)
  const staleMoveEnd = map.listener('moveend')
  coordinator.requestClusterSync()
  coordinator.focus(hospitals.second)

  staleMoveEnd()
  assert.deepEqual(revealCalls, [])
  assert.deepEqual(syncCalls, [
    { restoreOpenPopup: false },
    { restoreOpenPopup: false },
  ])

  map.fire('moveend')
  assert.equal(revealCalls.length, 1)
  assert.equal(revealCalls[0].hospitalId, 2)
})

test('清除醫院選取會取消舊 focus callback，不再開啟 popup', () => {
  const map = createMap()
  const revealCalls = []
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: () => false,
    syncClusters: () => {},
    revealMarker: (hospitalId) => revealCalls.push(hospitalId),
  })

  coordinator.focus(hospitals.first)
  const staleMoveEnd = map.listener('moveend')
  coordinator.focus(null)

  assert.equal(map.listener('moveend'), undefined)
  staleMoveEnd()
  assert.deepEqual(revealCalls, [])
})

test('清除醫院選取會完成 focus 期間排隊的 marker sync', () => {
  const map = createMap()
  const syncCalls = []
  const revealCalls = []
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: () => false,
    syncClusters: (options) => syncCalls.push(options),
    revealMarker: (hospitalId) => revealCalls.push(hospitalId),
  })

  coordinator.focus(hospitals.first)
  const staleMoveEnd = map.listener('moveend')
  coordinator.requestClusterSync()
  coordinator.focus(null)

  assert.equal(map.listener('moveend'), undefined)
  assert.deepEqual(syncCalls, [
    { restoreOpenPopup: false },
    { restoreOpenPopup: true },
  ])
  staleMoveEnd()
  assert.deepEqual(revealCalls, [])
  assert.equal(syncCalls.length, 2)
})

test('清除醫院選取會先移除 moveend listener，再停止未完成的 flyTo', () => {
  const events = []
  const map = createMap({ onCall: (call) => events.push(call) })
  const revealCalls = []
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: () => false,
    syncClusters: (options) => events.push(['sync', options]),
    revealMarker: (hospitalId) => revealCalls.push(hospitalId),
  })

  coordinator.focus(hospitals.first)
  const staleMoveEnd = map.listener('moveend')
  coordinator.requestClusterSync()
  coordinator.focus(null)

  assert.deepEqual(events.slice(-3), [
    ['off', 'moveend'],
    ['stop'],
    ['sync', { restoreOpenPopup: true }],
  ])
  staleMoveEnd()
  assert.deepEqual(revealCalls, [])
})

test('醫院移動已完成時清除選取不會停止其他地圖操作', () => {
  const map = createMap()
  let cancelRevealCount = 0
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: () => false,
    syncClusters: () => {},
    revealMarker: () => () => {
      cancelRevealCount += 1
    },
  })

  coordinator.focus(hospitals.first)
  map.fire('moveend')
  coordinator.focus(null)

  assert.equal(cancelRevealCount, 1)
  assert.equal(map.calls.filter(([name]) => name === 'stop').length, 1)
})

test('已在目標位置會直接開 popup；無效座標不操作地圖', () => {
  const map = createMap({ atTarget: true, zoom: 16 })
  const revealCalls = []
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: (currentMap) => currentMap.isAtTarget(),
    syncClusters: () => {},
    revealMarker: (hospitalId) => revealCalls.push(hospitalId),
  })

  coordinator.focus(hospitals.first)
  assert.deepEqual(revealCalls, [1])
  assert.equal(map.calls.some(([name]) => name === 'flyTo'), false)

  coordinator.focus({ id: 3, latitude: null, longitude: 121.5 })
  assert.deepEqual(revealCalls, [1])
  assert.equal(map.calls.filter(([name]) => name === 'flyTo').length, 0)
})

test('popup 完成後的一般 marker sync 不會再次移動地圖', () => {
  const map = createMap({ atTarget: true, zoom: 15 })
  const syncCalls = []
  let completePopup
  const coordinator = createHospitalMapSelectionCoordinator({
    getMap: () => map,
    isAtTarget: (currentMap) => currentMap.isAtTarget(),
    syncClusters: (options) => syncCalls.push(options),
    revealMarker: (_hospitalId, onPopupOpen) => {
      completePopup = onPopupOpen
    },
  })

  coordinator.focus(hospitals.first)
  completePopup()
  coordinator.requestClusterSync()

  assert.deepEqual(syncCalls, [
    { restoreOpenPopup: false },
    { restoreOpenPopup: true },
  ])
  assert.equal(map.calls.some(([name]) => name === 'flyTo'), false)
})
