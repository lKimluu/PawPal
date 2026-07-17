import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { buildHospitalPopupHtml } from '../utils/hospitalPopup.js'
import { useHospitalStore } from '../stores/hospital.js'
import {
  buildHospitalListQuery,
  buildNearbyHospitalQuery,
  fetchHospitals,
  fetchNearbyHospitals,
  normalizeHospital,
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

test('Hospital list query supports filters and pagination', () => {
  const query = buildHospitalListQuery({
    keyword: '仁愛',
    city: '台北市',
    district: '大安區',
    animalType: 'cat',
    page: 2,
    limit: 20,
    is24H: true,
    sort: 'name',
  })

  assert.deepEqual(query, {
    keyword: '仁愛',
    city: '台北市',
    district: '大安區',
    animal_type: 'cat',
    is_24h: true,
    sort: 'name',
    page: 2,
    limit: 20,
  })
  assert.equal('animalType' in query, false)
  assert.equal('isOpenOnly' in query, false)
})

test('Nearby hospital query uses current or fallback location', () => {
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
      animal_type: 'dog',
    },
  )

  assert.deepEqual(buildNearbyHospitalQuery({ radius: 5, limit: 20 }), {
    lat: TAIPEI_CENTER[0],
    lng: TAIPEI_CENTER[1],
    radius: 5,
    limit: 20,
  })
})

test('Hospital page loads hospitals from the list API using normalized data', async () => {
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
      animal_type: 'cat',
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

test('Hospital store reconciles contextual sorting when real location becomes available', async () => {
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
    await contextualStore.setAnimalType('cat')
    await contextualStore.set24H(true)

    for (const call of calls.slice(2)) {
      assert.equal(call.params.sort, 'distance')
      assert.equal(call.params.lat, location.lat)
      assert.equal(call.params.lng, location.lng)
    }
    assert.deepEqual(calls[2].params.city, '台北市')
    assert.deepEqual(calls[2].params.district, '大安區')
    assert.equal(calls[3].params.animal_type, 'cat')
    assert.equal(calls[4].params.is_24h, true)

    setActivePinia(createPinia())
    const explicitStore = useHospitalStore()
    await explicitStore.setSort('name')
    await explicitStore.loadNearbyHospitals({ location })
    assert.equal(explicitStore.filters.sort, 'name')
    await explicitStore.set24H(true)
    assert.equal(calls.at(-1).params.sort, 'name')
    assert.equal(calls.at(-1).params.lat, undefined)
    assert.equal(calls.at(-1).params.lng, undefined)
  } finally {
    axios.get = originalGet
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
})

test('Hospital store owns query result state and filter actions', () => {
  const store = readSource('../stores/hospital.js')

  assert.match(store, /defineStore\('hospital'/)
  assert.match(store, /const hospitals = ref\(\[\]\)/)
  assert.match(store, /const pagination = ref/)
  assert.match(store, /const filters = ref/)
  assert.match(store, /keyword/)
  assert.match(store, /city/)
  assert.match(store, /district/)
  assert.match(store, /animalType/)
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
  assert.match(store, /function retryCurrentQuery/)
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

test('Hospital components use store-owned data for list, map, selection, and states', () => {
  const hospitalView = readSource('../views/HospitalView.vue')
  const hospitalList = readSource('../components/hospital/HospitalList.vue')
  const mapView = readSource('../components/hospital/MapView.vue')
  const marker = readSource('../components/hospital/HospitalMarker.vue')
  const searchBar = readSource('../components/hospital/SearchBar.vue')

  assert.match(hospitalView, /useHospitalStore/)
  assert.match(hospitalView, /hospitalStore\.loadNearbyHospitals/)
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
  assert.match(searchBar, /hospitalStore\.setAnimalType/)
  assert.match(searchBar, /hospitalStore\.set24H/)
  assert.doesNotMatch(searchBar, /只顯示營業中/)
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
  assert.match(mapView, /if \(selectedHospital\.value\) \{\s*focusSelectedHospital\(\)/)
  assert.match(coordinator, /map\.once\('moveend', pendingMoveEnd\)/)
  assert.match(coordinator, /map\.flyTo\(\[hospital\.latitude, hospital\.longitude\], targetZoom\)/)
  assert.match(coordinator, /clusterLayer\._inZoomAnimation > 0/)
  assert.match(coordinator, /clusterLayer\.once\('animationend', animationEndHandler\)/)
  assert.match(coordinator, /clusterLayer\.zoomToShowLayer\(marker/)
  assert.match(coordinator, /marker\.once\('popupopen', handlePopupOpen\)/)
  assert.match(coordinator, /syncQueued = true/)
  assert.match(coordinator, /syncClusters\(\{ restoreOpenPopup: true \}\)/)
})

test('Map ready and bounds refresh do not issue duplicate viewport requests', () => {
  const mapView = readSource('../components/hospital/MapView.vue')

  assert.match(mapView, /createMapBoundsScheduler/)
  assert.match(
    mapView,
    /beforeProgrammaticMove:\s*boundsScheduler\.cancel/,
  )
  assert.match(
    mapView,
    /function focusSelectedHospital\(\) \{\s*const hospital = selectedHospital\.value\s*selectionCoordinator\.focus\(hospital \?\? null\)\s*\}/,
  )
  assert.match(
    mapView,
    /if \(selectedHospital\.value\) \{\s*focusSelectedHospital\(\)\s*\} else \{\s*syncClusters\(\)\s*scheduleBounds\(\)/,
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
