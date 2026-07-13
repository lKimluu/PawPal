import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { setActivePinia, createPinia } from 'pinia'

import { useLocationStore } from '../stores/location.js'

function setupStore() {
  setActivePinia(createPinia())
  return useLocationStore()
}

function setNavigator(value) {
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
  })
}

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

test('location store 初始狀態與清除錯誤', () => {
  const store = setupStore()

  assert.equal(store.userLocation, null)
  assert.equal(store.isLocating, false)
  assert.equal(store.locationError, '')
  assert.equal(store.hasRequestedLocation, false)
  assert.equal(store.permissionState, 'unknown')

  store.locationError = '定位失敗，請稍後再試'
  store.clearLocationError()

  assert.equal(store.locationError, '')
})

test('requestCurrentLocation 成功時保存經緯度並清空錯誤', async () => {
  const store = setupStore()
  store.locationError = '定位失敗，請稍後再試'

  setNavigator({
    permissions: {
      async query(permission) {
        assert.deepEqual(permission, { name: 'geolocation' })
        return { state: 'prompt' }
      },
    },
    geolocation: {
      getCurrentPosition(success, _error, options) {
        assert.deepEqual(options, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
        success({
          coords: {
            latitude: 25.033964,
            longitude: 121.564468,
          },
        })
      },
    },
  })

  const result = await store.requestCurrentLocation()

  assert.equal(result, true)
  assert.deepEqual(store.userLocation, { lat: 25.033964, lng: 121.564468 })
  assert.equal(store.locationError, '')
  assert.equal(store.isLocating, false)
  assert.equal(store.hasRequestedLocation, true)
  assert.equal(store.permissionState, 'prompt')
})

test('requestCurrentLocation pending 期間維持 loading 且不重複呼叫 geolocation', async () => {
  const store = setupStore()
  let callCount = 0
  let resolvePosition

  setNavigator({
    geolocation: {
      getCurrentPosition(success) {
        callCount += 1
        resolvePosition = success
      },
    },
  })

  const firstRequest = store.requestCurrentLocation()
  const secondRequest = store.requestCurrentLocation()
  await Promise.resolve()

  assert.equal(callCount, 1)
  assert.equal(store.isLocating, true)
  assert.equal(store.hasRequestedLocation, true)

  resolvePosition({
    coords: {
      latitude: 25.033964,
      longitude: 121.564468,
    },
  })

  assert.equal(await firstRequest, true)
  assert.equal(await secondRequest, true)

  assert.equal(store.isLocating, false)
  assert.deepEqual(store.userLocation, { lat: 25.033964, lng: 121.564468 })
})

test('requestCurrentLocation 處理瀏覽器不支援定位且保留既有位置', async () => {
  const store = setupStore()
  store.userLocation = { lat: 25.033964, lng: 121.564468 }
  setNavigator({})

  const result = await store.requestCurrentLocation()

  assert.equal(result, false)
  assert.deepEqual(store.userLocation, { lat: 25.033964, lng: 121.564468 })
  assert.equal(store.locationError, '此瀏覽器不支援定位功能')
  assert.equal(store.isLocating, false)
  assert.equal(store.hasRequestedLocation, true)
})

test('requestCurrentLocation 在定位權限已封鎖時提示網站設定並不呼叫 geolocation', async () => {
  const store = setupStore()
  let callCount = 0

  setNavigator({
    permissions: {
      async query(permission) {
        assert.deepEqual(permission, { name: 'geolocation' })
        return { state: 'denied' }
      },
    },
    geolocation: {
      getCurrentPosition() {
        callCount += 1
      },
    },
  })

  const result = await store.requestCurrentLocation()

  assert.equal(result, false)
  assert.equal(callCount, 0)
  assert.equal(store.permissionState, 'denied')
  assert.equal(store.locationError, '定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試')
  assert.equal(store.isLocating, false)
  assert.equal(store.hasRequestedLocation, true)
})

test('requestCurrentLocation 轉換 Geolocation 錯誤訊息且不丟例外', async () => {
  const errorCases = [
    { code: 1, message: '定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試' },
    { code: 2, message: '目前無法取得位置，請稍後再試' },
    { code: 3, message: '定位逾時，請重新取得目前位置' },
    { code: 99, message: '定位失敗，請稍後再試' },
  ]

  for (const errorCase of errorCases) {
    const store = setupStore()

    setNavigator({
      geolocation: {
        getCurrentPosition(_success, error) {
          error({ code: errorCase.code })
        },
      },
    })

    const result = await store.requestCurrentLocation()

    assert.equal(result, false)
    assert.equal(store.locationError, errorCase.message)
    assert.equal(store.isLocating, false)
    assert.equal(store.userLocation, null)
  }
})

test('location store 不呼叫醫院 API 或 axios', () => {
  const source = readSource('../stores/location.js')

  assert.doesNotMatch(source, /axios/)
  assert.doesNotMatch(source, /\/api\/v1\/hospitals/)
  assert.doesNotMatch(source, /\/api\/v1\/hospitals\/nearby/)
})
