import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { buildHospitalPopupHtml } from '../utils/hospitalPopup.js'
import { useHospitalStore } from '../stores/hospital.js'
import {
  addFavoriteHospital,
  buildHospitalListQuery,
  buildNearbyHospitalQuery,
  fetchHospitals,
  fetchMapHospitals,
  fetchNearbyHospitals,
  normalizeHospital,
  removeFavoriteHospital,
  TAIPEI_CENTER,
} from '../api/hospitals.js'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

function createAbortableAxiosDeferred(config = {}) {
  const deferred = createDeferred()
  const rejectAsCanceled = () => deferred.reject(new axios.CanceledError('canceled'))

  if (config.signal?.aborted) rejectAsCanceled()
  else config.signal?.addEventListener('abort', rejectAsCanceled, { once: true })

  return deferred
}

test('醫院清單查詢只送出保留的篩選條件與分頁，不再送診療動物篩選', () => {
  const query = buildHospitalListQuery({
    keyword: '仁愛',
    city: '台北市',
    district: '大安區',
    animalType: 'cat',
    page: 2,
    limit: 20,
    is24H: true,
    favoritesOnly: true,
    sort: 'name',
  })

  assert.deepEqual(query, {
    keyword: '仁愛',
    city: '台北市',
    district: '大安區',
    is_24h: true,
    favorites_only: true,
    sort: 'name',
    page: 2,
    limit: 20,
  })
  assert.equal('animal_type' in query, false)
  assert.equal('animalType' in query, false)
  assert.equal('isOpenOnly' in query, false)
})

test('附近醫院查詢使用目前或預設位置，不再送診療動物篩選', () => {
  assert.deepEqual(
    buildNearbyHospitalQuery({
      location: { lat: 25.033964, lng: 121.564468 },
      radius: 10,
      limit: 12,
      animalType: 'dog',
    }),
    {
      lat: 25.033964,
      lng: 121.564468,
      radius: 10,
      limit: 12,
    },
  )

  assert.deepEqual(buildNearbyHospitalQuery({ radius: 5, limit: 20 }), {
    lat: TAIPEI_CENTER[0],
    lng: TAIPEI_CENTER[1],
    radius: 5,
    limit: 20,
  })
})

test('醫院頁透過清單 API 載入並正規化醫院資料', async () => {
  const originalGet = axios.get
  const calls = []

  axios.get = async (url, config) => {
    calls.push({ url, config })
    return {
      data: {
        hospitals: [
          {
            id: 'h-1',
            name: '仁愛動物醫院',
            city: '台北市',
            district: '大安區',
            address: '仁愛路',
            phone: '02-0000-0000',
            latitude: '25.033964',
            longitude: '121.564468',
            animal_types: [{ slug: 'cat', name: '貓' }],
            distance_km: '1.234',
            is_open: true,
            is_24h: false,
            business_hours: '09:00 - 21:00',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
        },
      },
    }
  }

  try {
    const result = await fetchHospitals({ keyword: '仁愛', animalType: 'cat', page: 1, limit: 20 })

    assert.equal(calls[0].url.endsWith('/api/v1/hospitals'), true)
    assert.deepEqual(calls[0].config.params, {
      keyword: '仁愛',
      page: 1,
      limit: 20,
    })
    assert.equal(result.success, true)
    assert.deepEqual(result.hospitals[0], {
      id: 'h-1',
      name: '仁愛動物醫院',
      city: '台北市',
      district: '大安區',
      address: '仁愛路',
      phone: '02-0000-0000',
      latitude: 25.033964,
      longitude: 121.564468,
      lat: 25.033964,
      lng: 121.564468,
      animalTypes: [
        {
          slug: 'cat',
          name: '貓',
          verificationStatus: '',
          source: '',
        },
      ],
      categories: ['貓'],
      distanceKm: 1.234,
      distance: 1.234,
      isOpen: true,
      is24H: false,
      businessHours: '09:00 - 21:00',
      rating: 0,
      reviewCount: 0,
      isFavorite: false,
      animal_types: [{ slug: 'cat', name: '貓' }],
      business_hours: '09:00 - 21:00',
      distance_km: '1.234',
      is_open: true,
      is_24h: false,
    })
  } finally {
    axios.get = originalGet
  }
})

test('Nearby API fallback result can feed list and map marker data', async () => {
  const originalGet = axios.get
  const calls = []

  axios.get = async (url, config) => {
    calls.push({ url, config })
    return {
      data: {
        hospitals: [
          {
            id: 'taipei-h-1',
            name: '台北中心動物醫院',
            latitude: 25.034,
            longitude: 121.566,
          },
        ],
      },
    }
  }

  try {
    const result = await fetchNearbyHospitals({ radius: 5, limit: 20 })

    assert.equal(calls[0].url.endsWith('/api/v1/hospitals/nearby'), true)
    assert.deepEqual(calls[0].config.params, {
      lat: 25.033,
      lng: 121.5654,
      radius: 5,
      limit: 20,
    })
    assert.equal(result.success, true)
    assert.equal(result.hospitals[0].id, 'taipei-h-1')
    assert.equal(Number.isFinite(result.hospitals[0].latitude), true)
    assert.equal(Number.isFinite(result.hospitals[0].longitude), true)
  } finally {
    axios.get = originalGet
  }
})

test('Nearby API 已登入時應帶 Authorization header', async () => {
  const originalGet = axios.get
  const calls = []

  globalThis.localStorage = {
    getItem(key) {
      return key === 'pawpal_token' ? 'token-123' : null
    },
  }

  axios.get = async (url, config) => {
    calls.push({ url, config })
    return { data: { hospitals: [] } }
  }

  try {
    await fetchNearbyHospitals({ radius: 5, limit: 20 })

    assert.equal(calls[0].config.headers.Authorization, 'Bearer token-123')
  } finally {
    axios.get = originalGet
    delete globalThis.localStorage
  }
})

test('Map API passes AbortSignal and distinguishes cancellation from failures', async () => {
  const originalGet = axios.get
  const calls = []

  axios.get = (url, config) => {
    const deferred = createAbortableAxiosDeferred(config)
    calls.push({ url, config, deferred })
    return deferred.promise
  }

  try {
    const bounds = { north: 25.1, south: 25, east: 121.6, west: 121.5 }
    const controller = new AbortController()
    const canceledRequest = fetchMapHospitals(bounds, { signal: controller.signal })

    assert.equal(calls[0].url.endsWith('/api/v1/hospitals/map'), true)
    assert.equal(calls[0].config.signal, controller.signal)
    assert.deepEqual(calls[0].config.params, bounds)

    controller.abort()
    assert.deepEqual(await canceledRequest, {
      success: false,
      canceled: true,
      hospitals: [],
      total: 0,
      truncated: false,
    })

    const failedRequest = fetchMapHospitals(bounds)
    calls[1].deferred.reject(new Error('地圖服務暫時無法載入'))

    assert.deepEqual(await failedRequest, {
      success: false,
      canceled: false,
      hospitals: [],
      total: 0,
      truncated: false,
      message: '地圖服務暫時無法載入',
    })
  } finally {
    axios.get = originalGet
  }
})

test('New hospital map request aborts the stale request without stale state commits', async () => {
  const originalGet = axios.get
  const requests = []

  axios.get = (url, config) => {
    const deferred = createAbortableAxiosDeferred(config)
    requests.push({ url, config, deferred })
    return deferred.promise
  }

  setActivePinia(createPinia())
  const store = useHospitalStore()

  try {
    store.mapHospitals = [{ id: 'current-marker', name: '目前顯示的醫院' }]
    store.mapTruncated = true
    const firstBounds = { north: 25.1, south: 25, east: 121.6, west: 121.5 }
    const secondBounds = { north: 25.2, south: 25.1, east: 121.7, west: 121.6 }
    const firstRequest = store.loadMapHospitals(firstBounds)
    const firstSignal = requests[0].config.signal
    const secondRequest = store.loadMapHospitals(secondBounds)

    assert.equal(firstSignal.aborted, true)
    assert.notEqual(requests[1].config.signal, firstSignal)
    assert.equal(requests[1].config.signal.aborted, false)

    assert.equal((await firstRequest).canceled, true)
    assert.deepEqual(store.mapHospitals.map(({ id }) => id), ['current-marker'])
    assert.equal(store.mapTruncated, true)
    assert.equal(store.mapError, '')
    assert.equal(store.mapLoading, true)

    requests[1].deferred.resolve({
      data: {
        hospitals: [{ id: 'latest-marker', name: '最新範圍醫院' }],
        total: 1,
        truncated: false,
      },
    })
    await secondRequest

    assert.deepEqual(store.mapHospitals.map(({ id }) => id), ['latest-marker'])
    assert.equal(store.mapTruncated, false)
    assert.equal(store.mapError, '')
    assert.equal(store.mapLoading, false)
  } finally {
    store.$dispose()
    axios.get = originalGet
  }
})

test('Map request sequencing rejects stale commits when cancellation is too late', async () => {
  const originalGet = axios.get
  const requests = []

  axios.get = (url, config) => {
    const deferred = createDeferred()
    requests.push({ url, config, deferred })
    return deferred.promise
  }

  setActivePinia(createPinia())
  const store = useHospitalStore()

  try {
    const staleRequest = store.loadMapHospitals({ north: 25.1, south: 25, east: 121.6, west: 121.5 })
    const currentRequest = store.loadMapHospitals({ north: 25.2, south: 25.1, east: 121.7, west: 121.6 })

    assert.equal(requests[0].config.signal.aborted, true)
    requests[1].deferred.resolve({
      data: { hospitals: [{ id: 'current-marker' }], total: 1, truncated: false },
    })
    await currentRequest

    requests[0].deferred.resolve({
      data: { hospitals: [{ id: 'stale-marker' }], total: 1, truncated: true },
    })
    await staleRequest

    assert.deepEqual(store.mapHospitals.map(({ id }) => id), ['current-marker'])
    assert.equal(store.mapTruncated, false)
    assert.equal(store.mapError, '')
    assert.equal(store.mapLoading, false)
  } finally {
    store.$dispose()
    axios.get = originalGet
  }
})

test('Hospital store disposal aborts the active map request without committing state', async () => {
  const originalGet = axios.get
  const requests = []

  axios.get = (url, config) => {
    const deferred = createAbortableAxiosDeferred(config)
    requests.push({ url, config, deferred })
    return deferred.promise
  }

  setActivePinia(createPinia())
  const store = useHospitalStore()

  try {
    store.mapHospitals = [{ id: 'preserved-marker', name: '保留的醫院' }]
    store.mapTruncated = true
    const request = store.loadMapHospitals({ north: 25.1, south: 25, east: 121.6, west: 121.5 })
    const signal = requests[0].config.signal
    const stateBeforeDispose = {
      ids: store.mapHospitals.map(({ id }) => id),
      truncated: store.mapTruncated,
      error: store.mapError,
      loading: store.mapLoading,
    }

    store.$dispose()

    assert.equal(signal.aborted, true)
    assert.equal((await request).canceled, true)
    assert.deepEqual(
      {
        ids: store.mapHospitals.map(({ id }) => id),
        truncated: store.mapTruncated,
        error: store.mapError,
        loading: store.mapLoading,
      },
      stateBeforeDispose,
    )
  } finally {
    axios.get = originalGet
  }
})

test('enterHospitalPage 同步清除搜尋與地圖暫存並保留 regions 快取', () => {
  setActivePinia(createPinia())
  const store = useHospitalStore()

  store.hospitals = [{ id: 'old-list' }]
  store.mapHospitals = [{ id: 'old-marker' }]
  store.regions = [{ city: '台北市', districts: ['大安區'] }]
  store.filters = {
    keyword: '仁愛',
    city: '台北市',
    district: '大安區',
    is24H: true,
    favoritesOnly: true,
    sort: 'relevance',
  }
  store.pagination = { page: 3, limit: 20, total: 45, totalPages: 3 }
  store.mode = 'nearby'
  store.selectedHospitalId = 'old-list'
  store.isLoading = true
  store.mapLoading = true
  store.errorMessage = '舊清單錯誤'
  store.mapError = '舊地圖錯誤'
  store.mapTruncated = true
  store.locationFallbackMessage = '舊定位提示'
  store.hasRealLocation = true

  store.enterHospitalPage()

  assert.deepEqual(store.filters, {
    keyword: '',
    city: '',
    district: '',
    is24H: false,
    favoritesOnly: false,
    sort: 'name',
  })
  assert.deepEqual(store.pagination, { page: 1, limit: 20, total: 0, totalPages: 0 })
  assert.deepEqual(store.hospitals, [])
  assert.deepEqual(store.mapHospitals, [])
  assert.deepEqual(store.regions, [{ city: '台北市', districts: ['大安區'] }])
  assert.equal(store.mode, 'list')
  assert.equal(store.selectedHospitalId, null)
  assert.equal(store.isLoading, false)
  assert.equal(store.mapLoading, false)
  assert.equal(store.errorMessage, '')
  assert.equal(store.mapError, '')
  assert.equal(store.mapTruncated, false)
  assert.equal(store.locationFallbackMessage, '')
  assert.equal(store.hasRealLocation, false)
})

test('enterHospitalPage 使舊清單成功與失敗回應失效', async () => {
  const originalGet = axios.get
  const requests = []

  axios.get = (url, config) => {
    const deferred = createDeferred()
    requests.push({ url, config, deferred })
    return deferred.promise
  }

  try {
    setActivePinia(createPinia())
    const successStore = useHospitalStore()
    const staleSuccess = successStore.loadHospitals({ keyword: '舊查詢' })
    successStore.enterHospitalPage()
    requests[0].deferred.resolve({
      data: {
        hospitals: [{ id: 'stale-list' }],
        pagination: { page: 2, limit: 20, total: 21, total_pages: 2 },
      },
    })
    await staleSuccess

    assert.deepEqual(successStore.hospitals, [])
    assert.deepEqual(successStore.pagination, { page: 1, limit: 20, total: 0, totalPages: 0 })
    assert.equal(successStore.errorMessage, '')
    assert.equal(successStore.isLoading, false)

    setActivePinia(createPinia())
    const failureStore = useHospitalStore()
    const staleFailure = failureStore.loadHospitals({ keyword: '舊失敗' })
    failureStore.enterHospitalPage()
    requests[1].deferred.reject(new Error('舊清單錯誤'))
    await staleFailure

    assert.deepEqual(failureStore.hospitals, [])
    assert.equal(failureStore.errorMessage, '')
    assert.equal(failureStore.isLoading, false)
  } finally {
    axios.get = originalGet
  }
})

test('enterHospitalPage 中止舊地圖請求且不允許回填', async () => {
  const originalGet = axios.get
  const requests = []

  axios.get = (url, config) => {
    const deferred = createAbortableAxiosDeferred(config)
    requests.push({ url, config, deferred })
    return deferred.promise
  }

  try {
    setActivePinia(createPinia())
    const store = useHospitalStore()
    const request = store.loadMapHospitals({ north: 25.1, south: 25, east: 121.6, west: 121.5 })
    const signal = requests[0].config.signal

    store.enterHospitalPage()

    assert.equal(signal.aborted, true)
    assert.equal((await request).canceled, true)
    assert.deepEqual(store.mapHospitals, [])
    assert.equal(store.mapError, '')
    assert.equal(store.mapLoading, false)
    assert.equal(store.mapTruncated, false)
  } finally {
    axios.get = originalGet
  }
})

test('首頁入口醫院快照只在下一次 enterHospitalPage 被消耗一次', () => {
  setActivePinia(createPinia())
  const store = useHospitalStore()
  const entryHospital = {
    id: 'home-hospital',
    name: '首頁動物醫院',
    latitude: 25.033,
    longitude: 121.5654,
  }

  store.queueHospitalEntrySelection(entryHospital)
  store.enterHospitalPage()

  assert.equal(store.selectedHospitalId, entryHospital.id)
  assert.deepEqual(store.selectedHospital, entryHospital)
  assert.deepEqual(store.hospitals, [])
  assert.deepEqual(store.mapHospitals, [])

  store.enterHospitalPage()

  assert.equal(store.selectedHospitalId, null)
  assert.equal(store.selectedHospital, null)
})

test('入口醫院快照會讓位給最新結果，頁內改選則清除 fallback', () => {
  setActivePinia(createPinia())
  const store = useHospitalStore()

  store.queueHospitalEntrySelection({ id: 7, name: '首頁舊名稱', latitude: 25, longitude: 121 })
  store.enterHospitalPage()
  store.hospitals = [{ id: 7, name: '清單最新名稱', latitude: 25, longitude: 121 }]

  assert.equal(store.selectedHospital.name, '清單最新名稱')

  store.hospitals = []
  store.selectHospital(9)

  assert.equal(store.selectedHospitalId, 9)
  assert.equal(store.selectedHospital, null)
})

test('評論載入與成功 CRUD 會同步僅存在於入口快照的醫院摘要', async () => {
  const originalGet = axios.get
  const originalPost = axios.post
  const originalPatch = axios.patch
  const originalDelete = axios.delete
  const summaries = [
    { average_rating: 4.2, review_count: 8 },
    { average_rating: 4.4, review_count: 9 },
    { average_rating: 4.1, review_count: 9 },
    { average_rating: 4.0, review_count: 8 },
  ]

  axios.get = async () => ({ data: { summary: summaries[0], reviews: [] } })
  axios.post = async () => ({ data: { summary: summaries[1] } })
  axios.patch = async () => ({ data: { summary: summaries[2] } })
  axios.delete = async () => ({ data: { summary: summaries[3] } })

  setActivePinia(createPinia())
  const store = useHospitalStore()
  const entryHospital = {
    id: 'entry-only',
    name: '入口限定動物醫院',
    latitude: 25.033,
    longitude: 121.5654,
    rating: 3.5,
    reviewCount: 5,
  }

  try {
    store.queueHospitalEntrySelection(entryHospital)
    store.enterHospitalPage()
    store.isLoading = true
    store.mapLoading = true

    await store.loadHospitalReviews(entryHospital.id)
    assert.deepEqual(store.hospitals, [])
    assert.deepEqual(store.mapHospitals, [])
    assert.deepEqual(store.getHospitalById(entryHospital.id), {
      ...entryHospital,
      rating: 4.2,
      reviewCount: 8,
      average_rating: 4.2,
      review_count: 8,
    })

    store.isLoading = false
    store.mapLoading = false
    store.errorMessage = '清單載入失敗'
    store.mapError = '地圖載入失敗'

    await store.submitHospitalReview(entryHospital.id, { rating: 5, comment: '值得推薦' })
    assert.equal(store.getHospitalById(entryHospital.id).rating, 4.4)
    assert.equal(store.getHospitalById(entryHospital.id).reviewCount, 9)

    await store.updateHospitalReview(entryHospital.id, 1, { rating: 4, comment: '更新內容' })
    assert.equal(store.getHospitalById(entryHospital.id).rating, 4.1)
    assert.equal(store.getHospitalById(entryHospital.id).reviewCount, 9)

    await store.deleteHospitalReview(entryHospital.id, 1)
    assert.deepEqual(store.getHospitalById(entryHospital.id), {
      ...entryHospital,
      rating: 4,
      reviewCount: 8,
      average_rating: 4,
      review_count: 8,
    })
    assert.equal(store.selectedHospital, store.getHospitalById(entryHospital.id))
    assert.equal(store.errorMessage, '清單載入失敗')
    assert.equal(store.mapError, '地圖載入失敗')
  } finally {
    store.$dispose()
    axios.get = originalGet
    axios.post = originalPost
    axios.patch = originalPatch
    axios.delete = originalDelete
  }
})

test('無效入口醫院不會建立 pending selection', () => {
  setActivePinia(createPinia())
  const store = useHospitalStore()

  store.queueHospitalEntrySelection({ id: 'valid', name: '先前候選' })
  store.queueHospitalEntrySelection(null)
  store.enterHospitalPage()
  assert.equal(store.selectedHospitalId, null)
  assert.equal(store.selectedHospital, null)

  store.queueHospitalEntrySelection({ name: '缺少 id' })
  store.enterHospitalPage()
  assert.equal(store.selectedHospitalId, null)
  assert.equal(store.selectedHospital, null)
})

test('Current map failures remain visible and retry the last bounds', async () => {
  const originalGet = axios.get
  const calls = []

  axios.get = async (url, config) => {
    calls.push({ url, config })
    if (calls.length === 1) throw new Error('地圖服務暫時無法載入')
    return {
      data: {
        hospitals: [{ id: 'retried-marker', name: '重試後醫院' }],
        total: 1,
        truncated: false,
      },
    }
  }

  setActivePinia(createPinia())
  const store = useHospitalStore()

  try {
    const bounds = { north: 25.1, south: 25, east: 121.6, west: 121.5 }
    await store.loadMapHospitals(bounds)

    assert.equal(store.mapError, '地圖服務暫時無法載入')
    assert.equal(store.mapLoading, false)

    await store.retryMapQuery()

    assert.deepEqual(calls.map(({ config }) => config.params), [bounds, bounds])
    assert.deepEqual(store.mapHospitals.map(({ id }) => id), ['retried-marker'])
    assert.equal(store.mapError, '')
    assert.equal(store.mapLoading, false)
  } finally {
    store.$dispose()
    axios.get = originalGet
  }
})

test('Hospital store retry preserves fallback and real-location semantics', async () => {
  const originalGet = axios.get
  const calls = []

  axios.get = async (url, config) => {
    calls.push({ url, config })
    throw new Error('附近醫院暫時無法載入')
  }

  try {
    setActivePinia(createPinia())
    const fallbackStore = useHospitalStore()

    await fallbackStore.loadNearbyHospitals({ locationError: '定位權限遭拒' })
    await fallbackStore.retryCurrentQuery()

    assert.equal(calls.length, 2)
    assert.deepEqual(calls.map(({ config }) => config.params), [
      { lat: TAIPEI_CENTER[0], lng: TAIPEI_CENTER[1], radius: 5, limit: 20 },
      { lat: TAIPEI_CENTER[0], lng: TAIPEI_CENTER[1], radius: 5, limit: 20 },
    ])
    assert.equal(fallbackStore.hasRealLocation, false)
    assert.equal(fallbackStore.locationFallbackMessage, '定位權限遭拒')
    assert.equal(fallbackStore.filters.sort, 'name')

    setActivePinia(createPinia())
    const locatedStore = useHospitalStore()
    const location = { lat: 25.0478, lng: 121.5319 }

    await locatedStore.loadNearbyHospitals({ location, radius: 10, limit: 12 })
    await locatedStore.retryCurrentQuery()

    assert.deepEqual(calls.slice(2).map(({ config }) => config.params), [
      { lat: location.lat, lng: location.lng, radius: 10, limit: 12 },
      { lat: location.lat, lng: location.lng, radius: 10, limit: 12 },
    ])
    assert.equal(locatedStore.hasRealLocation, true)
    assert.equal(locatedStore.locationFallbackMessage, '')
  } finally {
    axios.get = originalGet
  }
})

test('Newer full-search nearby request supersedes stale home response, error, and completion', async () => {
  const originalGet = axios.get
  const requests = []
  const location = { lat: 25.033964, lng: 121.564468 }

  axios.get = (url, config) => {
    const deferred = createDeferred()
    requests.push({ url, config, deferred })
    return deferred.promise
  }

  try {
    setActivePinia(createPinia())
    const store = useHospitalStore()
    const homeRequest = store.loadNearbyHospitals({ location, radius: 5, limit: 3 })
    const fullSearchRequest = store.loadNearbyHospitals({ location, radius: 5, limit: 20 })

    assert.equal(requests[0].config.params.limit, 3)
    assert.equal(requests[1].config.params.limit, 20)

    requests[1].deferred.resolve({
      data: {
        hospitals: [{ id: 'full-search-hospital', name: '完整搜尋醫院', distance_km: 0.8 }],
      },
    })
    await fullSearchRequest

    requests[0].deferred.resolve({
      data: { hospitals: [{ id: 'stale-home-hospital', name: '舊首頁醫院', distance_km: 0.4 }] },
    })
    await homeRequest

    assert.deepEqual(store.visibleHospitals.map(({ id }) => id), ['full-search-hospital'])
    assert.deepEqual(store.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 })
    assert.equal(store.errorMessage, '')
    assert.equal(store.isLoading, false)

    setActivePinia(createPinia())
    const errorStore = useHospitalStore()
    const staleErrorRequest = errorStore.loadNearbyHospitals({ location, radius: 5, limit: 3 })
    const currentRequest = errorStore.loadNearbyHospitals({ location, radius: 5, limit: 20 })

    requests[3].deferred.resolve({
      data: {
        hospitals: [{ id: 'current-hospital', name: '目前醫院', distance_km: 1.2 }],
      },
    })
    await currentRequest

    requests[2].deferred.reject(new Error('舊首頁錯誤'))
    await staleErrorRequest

    assert.deepEqual(errorStore.visibleHospitals.map(({ id }) => id), ['current-hospital'])
    assert.deepEqual(errorStore.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 })
    assert.equal(errorStore.errorMessage, '')
    assert.equal(errorStore.isLoading, false)
  } finally {
    axios.get = originalGet
  }
})

test('醫院 store 在取得真實定位後維持情境排序規則', async () => {
  const originalGet = axios.get
  const calls = []
  const location = { lat: 25.0478, lng: 121.5319 }

  axios.get = async (url, config) => {
    calls.push({ url, params: config.params })
    return { data: { hospitals: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } }
  }

  try {
    setActivePinia(createPinia())
    const contextualStore = useHospitalStore()

    await contextualStore.loadNearbyHospitals({ locationError: '尚未取得定位' })
    assert.equal(contextualStore.filters.sort, 'name')

    await contextualStore.loadNearbyHospitals({ location })
    assert.equal(contextualStore.filters.sort, 'distance')

    await contextualStore.setLocationFilter({ city: '台北市', district: '大安區' })
    await contextualStore.set24H(true)

    for (const call of calls.slice(2)) {
      assert.equal(call.params.sort, 'distance')
      assert.equal(call.params.lat, location.lat)
      assert.equal(call.params.lng, location.lng)
    }
    assert.deepEqual(calls[2].params.city, '台北市')
    assert.deepEqual(calls[2].params.district, '大安區')
    assert.equal(calls[3].params.is_24h, true)
    assert.equal('animal_type' in calls[3].params, false)

    setActivePinia(createPinia())
    const explicitStore = useHospitalStore()
    await explicitStore.setSort('name')
    await explicitStore.loadNearbyHospitals({ location })
    assert.equal(explicitStore.filters.sort, 'name')
    await explicitStore.set24H(true)
    assert.equal(calls.at(-1).params.sort, 'name')
    assert.equal(calls.at(-1).params.lat, location.lat)
    assert.equal(calls.at(-1).params.lng, location.lng)
  } finally {
    axios.get = originalGet
  }
})

test('Hospital store list search sends only real coordinates across relevance, page, and retry', async () => {
  const originalGet = axios.get
  const calls = []
  const location = { lat: 25.0478, lng: 121.5319 }

  axios.get = async (url, config) => {
    calls.push({ url, params: config.params })
    return {
      data: {
        hospitals: [],
        pagination: {
          page: config.params.page ?? 1,
          limit: config.params.limit ?? 20,
          total: 0,
          total_pages: 0,
        },
      },
    }
  }

  try {
    setActivePinia(createPinia())
    const locatedStore = useHospitalStore()
    await locatedStore.loadNearbyHospitals({ location })
    await locatedStore.setKeyword('仁愛')
    await locatedStore.setPage(2)
    await locatedStore.retryCurrentQuery()

    const locatedListCalls = calls.filter(({ url }) => url.endsWith('/api/v1/hospitals'))
    assert.equal(locatedListCalls.length, 3)
    assert.deepEqual(locatedListCalls.map(({ params }) => ({
      keyword: params.keyword,
      sort: params.sort,
      lat: params.lat,
      lng: params.lng,
      page: params.page,
    })), [
      { keyword: '仁愛', sort: 'relevance', ...location, page: 1 },
      { keyword: '仁愛', sort: 'relevance', ...location, page: 2 },
      { keyword: '仁愛', sort: 'relevance', ...location, page: 2 },
    ])

    setActivePinia(createPinia())
    const fallbackStore = useHospitalStore()
    await fallbackStore.loadNearbyHospitals({ locationError: '定位權限遭拒' })
    await fallbackStore.setKeyword('仁愛')
    await fallbackStore.retryCurrentQuery()

    const fallbackListCalls = calls
      .filter(({ url }) => url.endsWith('/api/v1/hospitals'))
      .slice(locatedListCalls.length)
    assert.equal(fallbackListCalls.length, 2)
    for (const { params } of fallbackListCalls) {
      assert.equal(params.keyword, '仁愛')
      assert.equal(params.sort, 'relevance')
      assert.equal(params.lat, undefined)
      assert.equal(params.lng, undefined)
    }
  } finally {
    axios.get = originalGet
  }
})

test('setFavoritesOnly 觸發重新查詢並帶上 favorites_only 參數', async () => {
  const originalGet = axios.get
  const calls = []

  axios.get = async (url, config) => {
    calls.push({ url, config })
    return { data: { hospitals: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } } }
  }

  try {
    setActivePinia(createPinia())
    const store = useHospitalStore()

    await store.setFavoritesOnly(true)

    assert.equal(store.filters.favoritesOnly, true)
    assert.equal(calls.at(-1).config.params.favorites_only, true)
    assert.equal(store.pagination.page, 1)
  } finally {
    axios.get = originalGet
  }
})

test('toggleFavoriteHospital 成功時應就地更新該醫院的 isFavorite', async () => {
  const originalGet = axios.get
  const originalPost = axios.post
  const originalDelete = axios.delete

  axios.get = async () => ({
    data: {
      hospitals: [{ id: 1, name: '仁愛動物醫院', is_favorite: false }],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    },
  })
  axios.post = async () => ({ data: { message: '已加入收藏' } })
  axios.delete = async () => ({ data: { message: '已取消收藏' } })

  try {
    setActivePinia(createPinia())
    const store = useHospitalStore()
    await store.loadHospitals()

    const addResult = await store.toggleFavoriteHospital(1, false)
    assert.equal(addResult.success, true)
    assert.equal(store.hospitals[0].isFavorite, true)

    const removeResult = await store.toggleFavoriteHospital(1, true)
    assert.equal(removeResult.success, true)
    assert.equal(store.hospitals[0].isFavorite, false)
  } finally {
    axios.get = originalGet
    axios.post = originalPost
    axios.delete = originalDelete
  }
})

test('toggleFavoriteHospital 失敗時不應變更該醫院的 isFavorite', async () => {
  const originalGet = axios.get
  const originalPost = axios.post

  axios.get = async () => ({
    data: {
      hospitals: [{ id: 1, name: '仁愛動物醫院', is_favorite: false }],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    },
  })
  axios.post = async () => {
    const error = new Error('Request failed with status code 409')
    error.response = { status: 409, data: { message: '此醫院已收藏' } }
    throw error
  }

  try {
    setActivePinia(createPinia())
    const store = useHospitalStore()
    await store.loadHospitals()

    const result = await store.toggleFavoriteHospital(1, false)

    assert.equal(result.success, false)
    assert.equal(result.message, '此醫院已收藏')
    assert.equal(store.hospitals[0].isFavorite, false)
  } finally {
    axios.get = originalGet
    axios.post = originalPost
  }
})

test('僅顯示收藏模式取消收藏後應重新查詢並同步清單與分頁', async () => {
  const originalGet = axios.get
  const originalDelete = axios.delete
  let getCallCount = 0

  axios.get = async () => {
    getCallCount += 1
    if (getCallCount === 1) {
      return {
        data: {
          hospitals: [
            { id: 1, name: '仁愛動物醫院', is_favorite: true },
            { id: 2, name: '大安動物醫院', is_favorite: true },
          ],
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        },
      }
    }

    return {
      data: {
        hospitals: [{ id: 2, name: '大安動物醫院', is_favorite: true }],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      },
    }
  }
  axios.delete = async () => ({ data: { message: '已取消收藏' } })

  try {
    setActivePinia(createPinia())
    const store = useHospitalStore()
    await store.setFavoritesOnly(true)

    assert.equal(store.hospitals.length, 2)
    assert.equal(store.pagination.total, 2)

    const result = await store.toggleFavoriteHospital(1, true)

    assert.equal(result.success, true)
    assert.equal(getCallCount, 2)
    assert.equal(store.hospitals.length, 1)
    assert.equal(store.hospitals[0].id, 2)
    assert.equal(store.pagination.total, 1)
  } finally {
    axios.get = originalGet
    axios.delete = originalDelete
  }
})

test('Hospital list request passes favorites_only and normalizes is_favorite', async () => {
  const originalGet = axios.get
  const calls = []

  axios.get = async (url, config) => {
    calls.push({ url, config })
    return {
      data: {
        hospitals: [{ id: 'h-3', name: '收藏動物醫院', is_favorite: true }],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      },
    }
  }

  try {
    const result = await fetchHospitals({ favoritesOnly: true, page: 1, limit: 20 })

    assert.equal(calls[0].config.params.favorites_only, true)
    assert.equal(result.hospitals[0].isFavorite, true)
  } finally {
    axios.get = originalGet
  }
})

test('addFavoriteHospital 成功時應回傳 success 與訊息', async () => {
  const originalPost = axios.post
  const calls = []

  axios.post = async (url, body, config) => {
    calls.push({ url, body, config })
    return { data: { message: '已加入收藏' } }
  }

  try {
    const result = await addFavoriteHospital(15)

    assert.equal(calls[0].url.endsWith('/api/v1/hospitals/15/favorite'), true)
    assert.deepEqual(result, { success: true, message: '已加入收藏' })
  } finally {
    axios.post = originalPost
  }
})

test('addFavoriteHospital 重複收藏時應透傳後端 409 訊息', async () => {
  const originalPost = axios.post

  axios.post = async () => {
    const error = new Error('Request failed with status code 409')
    error.response = { status: 409, data: { message: '此醫院已收藏' } }
    throw error
  }

  try {
    const result = await addFavoriteHospital(15)

    assert.deepEqual(result, { success: false, message: '此醫院已收藏' })
  } finally {
    axios.post = originalPost
  }
})

test('removeFavoriteHospital 成功時應回傳 success 與訊息', async () => {
  const originalDelete = axios.delete
  const calls = []

  axios.delete = async (url, config) => {
    calls.push({ url, config })
    return { data: { message: '已取消收藏' } }
  }

  try {
    const result = await removeFavoriteHospital(15)

    assert.equal(calls[0].url.endsWith('/api/v1/hospitals/15/favorite'), true)
    assert.deepEqual(result, { success: true, message: '已取消收藏' })
  } finally {
    axios.delete = originalDelete
  }
})

test('removeFavoriteHospital 收藏不存在時應透傳後端 404 訊息', async () => {
  const originalDelete = axios.delete

  axios.delete = async () => {
    const error = new Error('Request failed with status code 404')
    error.response = { status: 404, data: { message: '此收藏不存在，請重新確認' } }
    throw error
  }

  try {
    const result = await removeFavoriteHospital(15)

    assert.deepEqual(result, { success: false, message: '此收藏不存在，請重新確認' })
  } finally {
    axios.delete = originalDelete
  }
})

test('normalizeHospital exposes stable frontend shape', () => {
  const normalized = normalizeHospital({
    id: 'h-2',
    name: '毛毛醫院',
    animal_types: [{ slug: 'dog', name: '狗' }],
    latitude: null,
    longitude: '121.5',
    is_24h: true,
  })

  assert.equal(normalized.id, 'h-2')
  assert.equal(normalized.latitude, null)
  assert.equal(normalized.longitude, 121.5)
  assert.equal(normalized.isOpen, true)
  assert.equal(normalized.is24H, true)
  assert.equal(normalized.businessHours, '24 小時營業')
  assert.deepEqual(normalized.categories, ['狗'])
  assert.equal(normalized.isFavorite, false)
})

test('醫院 store 管理查詢結果狀態與保留的篩選操作', () => {
  const store = readSource('../stores/hospital.js')

  assert.match(store, /defineStore\('hospital'/)
  assert.match(store, /const hospitals = ref\(\[\]\)/)
  assert.match(store, /const pagination = ref/)
  assert.match(store, /const filters = ref/)
  assert.match(store, /keyword/)
  assert.match(store, /city/)
  assert.match(store, /district/)
  assert.doesNotMatch(store, /animalType/)
  assert.match(store, /is24H: false/)
  assert.match(store, /const mode = ref\('list'\)/)
  assert.match(store, /const selectedHospitalId = ref\(null\)/)
  assert.match(store, /const isLoading = ref\(false\)/)
  assert.match(store, /const errorMessage = ref\(''\)/)
  assert.match(store, /const isEmpty = computed/)
  assert.match(store, /mapHospitals = ref/)
  assert.match(store, /listRequestId/)
  assert.match(store, /mapRequestId/)
  assert.match(store, /function set24H/)
  assert.doesNotMatch(store, /setAnimalType/)
  assert.match(store, /function retryCurrentQuery/)
  assert.match(store, /updateHospitalReviewRequest/)
  assert.match(store, /deleteHospitalReviewRequest/)
  assert.match(store, /async function updateHospitalReview/)
  assert.match(store, /async function deleteHospitalReview/)
})

test('Hospital store separates list mode, nearby mode, pagination and Taipei fallback', () => {
  const store = readSource('../stores/hospital.js')

  assert.match(store, /fetchHospitals\(query\)/)
  assert.match(store, /fetchNearbyHospitals\(query\)/)
  assert.match(store, /pagination\.value\.page = 1/)
  assert.match(store, /return loadHospitals\(\{ page: 1 \}\)/)
  assert.match(store, /pagination\.value\.page = Number\(page\)/)
  assert.match(store, /TAIPEI_CENTER\[0\]/)
  assert.match(store, /TAIPEI_CENTER\[1\]/)
  assert.match(store, /locationFallbackMessage/)
  assert.doesNotMatch(store, /navigator\.geolocation/)
})

test('醫院元件使用 store 資料且搜尋列不再呈現診療動物篩選', () => {
  const hospitalView = readSource('../views/HospitalView.vue')
  const hospitalList = readSource('../components/hospital/HospitalList.vue')
  const mapView = readSource('../components/hospital/MapView.vue')
  const marker = readSource('../components/hospital/HospitalMarker.vue')
  const searchBar = readSource('../components/hospital/SearchBar.vue')

  assert.match(hospitalView, /useHospitalStore/)
  assert.match(hospitalView, /hospitalStore\.loadNearbyHospitals/)
  assert.match(hospitalView, /onBeforeMount\(\(\) => \{\s*hospitalStore\.enterHospitalPage\(\)\s*\}\)/)
  assert.match(hospitalView, /loadNearbyHospitals\(\{ requestLocation: false \}\)/)
  assert.match(hospitalView, /:hospitals="visibleHospitals"/)
  assert.match(hospitalView, /@select-hospital="selectHospital"/)

  assert.match(hospitalList, /defineProps\(\{[\s\S]*hospitals/)
  assert.match(hospitalList, /isLoading/)
  assert.match(hospitalList, /errorMessage/)
  assert.match(hospitalList, /isEmpty/)
  assert.match(hospitalList, /重新查詢/)

  assert.match(mapView, /const merged = \[\.\.\.props\.hospitals\]/)
  assert.match(mapView, /Number\.isFinite\(hospital\?\.latitude\)/)
  assert.match(mapView, /Number\.isFinite\(hospital\?\.longitude\)/)
  assert.match(mapView, /selectedHospital/)
  assert.match(marker, /emit\('select'\)/)
  assert.match(marker, /props\.hospital\.latitude/)
  assert.match(marker, /props\.hospital\.longitude/)

  assert.match(searchBar, /hospitalStore\.setKeyword/)
  assert.match(searchBar, /hospitalStore\.setLocationFilter/)
  assert.doesNotMatch(searchBar, /HOSPITAL_ANIMAL_TYPES/)
  assert.doesNotMatch(searchBar, /hospitalStore\.setAnimalType/)
  assert.doesNotMatch(searchBar, /診療動物/)
  assert.match(searchBar, /hospitalStore\.set24H/)
  assert.match(searchBar, /hospitalStore\.setFavoritesOnly/)
  assert.doesNotMatch(searchBar, /只顯示營業中/)
})

test('HospitalCard 收藏 Toggle 套用防重複送出 guard clause 並要求登入', () => {
  const hospitalCard = readSource('../components/hospital/HospitalCard.vue')

  assert.match(hospitalCard, /useAuthStore/)
  assert.match(hospitalCard, /useHospitalStore/)
  assert.match(hospitalCard, /useToastStore/)
  assert.match(hospitalCard, /const isFavoriteToggling = ref\(false\)/)
  assert.match(
    hospitalCard,
    /const toggleFavorite = async \(\) => \{\s*if \(isFavoriteToggling\.value\) return/,
  )
  assert.match(
    hospitalCard,
    /if \(!authStore\.isLoggedIn\) \{\s*toastStore\.showToast\('請先登入後再收藏醫院', 'error'\)\s*return\s*\}/,
  )
  assert.match(hospitalCard, /hospitalStore\.toggleFavoriteHospital\(props\.hospital\.id, isFav\.value\)/)
  assert.match(
    hospitalCard,
    /if \(result\.success\) \{\s*toastStore\.showToast\(result\.message\)\s*\} else \{\s*toastStore\.showToast\(result\.message, 'error'\)\s*\}/,
  )
  assert.match(hospitalCard, /finally \{\s*isFavoriteToggling\.value = false\s*\}/)
  assert.match(hospitalCard, /:disabled="isFavoriteToggling"/)
  assert.doesNotMatch(hospitalCard, /useFavoriteHospitalStore/)
})

test('Hospital list selection issues repeatable map focus requests', () => {
  const hospitalView = readSource('../views/HospitalView.vue')

  assert.match(hospitalView, /const selectionRequestId = ref\(0\)/)
  assert.match(
    hospitalView,
    /function selectHospital\(hospitalId\) \{\s*hospitalStore\.selectHospital\(hospitalId\)\s*selectionRequestId\.value \+= 1\s*\}/,
  )
  assert.match(hospitalView, /:selection-request-id="selectionRequestId"/)
})

test('手機版點選醫院列表卡片後會平滑捲動回地圖', () => {
  const hospitalView = readSource('../views/HospitalView.vue')

  assert.match(hospitalView, /const mapSectionRef = ref\(null\)/)
  assert.match(hospitalView, /const stackedHospitalMapQuery = '\(max-width: 1279px\)'/)
  assert.match(
    hospitalView,
    /function isStackedHospitalMapLayout\(\) \{[\s\S]*?window\.matchMedia\(stackedHospitalMapQuery\)\.matches[\s\S]*?window\.innerWidth <= 1279/,
  )
  assert.match(
    hospitalView,
    /function scrollMapIntoViewOnStackedLayout\(\) \{[\s\S]*?nextTick\(\(\) => \{[\s\S]*?mapSectionRef\.value\?\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/,
  )
  assert.match(
    hospitalView,
    /function selectHospitalFromList\(hospitalId\) \{\s*selectHospital\(hospitalId\)\s*scrollMapIntoViewOnStackedLayout\(\)\s*\}/,
  )
  assert.match(hospitalView, /<div\s+ref="mapSectionRef"[\s\S]*?<MapView/)
  assert.match(hospitalView, /@select-hospital="selectHospitalFromList"/)
})

test('Map selection delegates move completion and popup lifecycle to the coordinator', () => {
  const mapView = readSource('../components/hospital/MapView.vue')
  const coordinator = readSource('../utils/hospitalMapSelection.js')

  assert.match(mapView, /selectionRequestId:\s*\{\s*type: Number,\s*default: 0/)
  assert.match(mapView, /function hasValidHospitalCoordinates\(hospital\)/)
  assert.match(mapView, /createHospitalMapSelectionCoordinator/)
  assert.match(mapView, /revealHospitalClusterMarker/)
  assert.match(mapView, /selectionCoordinator\.focus\(hospital \?\? null\)/)
  assert.match(mapView, /nextTick\(selectionCoordinator\.requestClusterSync\)/)
  assert.match(
    mapView,
    /\[props\.selectedHospitalId, props\.selectionRequestId, props\.selectedHospital\]/,
  )
  assert.match(
    mapView,
    /selectedHospital\.value \? focusSelectedHospital\(\) : false/,
  )
  assert.match(coordinator, /map\.once\('moveend', pendingMoveEnd\)/)
  assert.match(coordinator, /map\.flyTo\(\[hospital\.latitude, hospital\.longitude\], targetZoom\)/)
  assert.match(coordinator, /clusterLayer\._inZoomAnimation > 0/)
  assert.match(coordinator, /clusterLayer\.once\('animationend', animationEndHandler\)/)
  assert.match(coordinator, /clusterLayer\.zoomToShowLayer\(marker/)
  assert.match(coordinator, /marker\.once\('popupopen', handlePopupOpen\)/)
  assert.match(coordinator, /syncQueued = true/)
  assert.match(coordinator, /syncClusters\(\{ restoreOpenPopup: true \}\)/)
})

test('Map ready 等待初始聚焦移動完成，無移動時直接排程 bounds refresh', () => {
  const mapView = readSource('../components/hospital/MapView.vue')

  assert.match(mapView, /createMapBoundsScheduler/)
  assert.match(
    mapView,
    /beforeProgrammaticMove:\s*boundsScheduler\.cancel/,
  )
  assert.match(
    mapView,
    /function focusSelectedHospital\(\) \{\s*const hospital = selectedHospital\.value\s*return selectionCoordinator\.focus\(hospital \?\? null\)\s*\}/,
  )
  assert.match(
    mapView,
    /const didMoveForInitialFocus = selectedHospital\.value \? focusSelectedHospital\(\) : false\s*if \(!selectedHospital\.value\) syncClusters\(\)\s*if \(!didMoveForInitialFocus\) scheduleBounds\(\)/,
  )
  assert.match(mapView, /@moveend="scheduleBounds"/)
  assert.match(mapView, /@zoomend="scheduleBounds"/)
  assert.match(mapView, /:center="initialCenter"/)
  assert.doesNotMatch(mapView, /const center = computed\(/)
})

test('Map bounds refresh restores an open popup without refocusing or auto-pan', () => {
  const mapView = readSource('../components/hospital/MapView.vue')

  assert.doesNotMatch(mapView, /syncClusters\(\{ reopenSelected: true \}\)/)
  assert.match(mapView, /selectedMarker\?\.isPopupOpen\(\)/)
  assert.match(mapView, /popup\.options\.autoPan = false/)
  assert.match(mapView, /marker\.openPopup\(\)/)
})

test('Hospital page no longer imports static hospital data for page results', () => {
  const hospitalView = readSource('../views/HospitalView.vue')
  const hospitalList = readSource('../components/hospital/HospitalList.vue')
  const mapView = readSource('../components/hospital/MapView.vue')

  assert.doesNotMatch(hospitalView, /@\/data\/hospitals/)
  assert.doesNotMatch(hospitalList, /@\/data\/hospitals/)
  assert.doesNotMatch(mapView, /@\/data\/hospitals/)
})

test('Clustered hospital popup restores compact branded content and safe actions', () => {
  const html = buildHospitalPopupHtml({
    name: '安心 <script>alert(1)</script>',
    address: '仁愛路 "一段"',
    phone: '02-1234-5678',
    latitude: 25.033,
    longitude: 121.5654,
    is24H: true,
  })
  assert.match(html, /hospital-popup-card__address/)
  assert.match(html, /安心 &lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /hospital-popup-card__badge">24H/)
  assert.match(html, /href="tel:0212345678"/)
  assert.match(html, /google\.com\/maps\/dir\/\?api=1&amp;destination=/)
  assert.match(html, /target="_blank" rel="noopener noreferrer"/)
})

test('Clustered hospital popup omits unavailable optional content', () => {
  const html = buildHospitalPopupHtml({ name: '安心醫院', latitude: 25, longitude: 121 })
  assert.match(html, /地址資訊未提供/)
  assert.doesNotMatch(html, /撥打電話/)
  assert.doesNotMatch(html, /hospital-popup-card__badge/)
  assert.match(html, /Google Maps 導航/)
})
