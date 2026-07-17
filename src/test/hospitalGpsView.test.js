import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

test('HomeView 使用共享 location 與 hospital stores 並在 mounted 依序載入附近醫院', () => {
  const homeView = readSource('../views/HomeView.vue')

  assert.match(homeView, /useLocationStore/)
  assert.match(homeView, /useHospitalStore/)
  assert.match(homeView, /storeToRefs\(locationStore\)/)
  assert.match(homeView, /onMounted\(async \(\) => \{\s*await locationStore\.requestCurrentLocation\(\)/)
  assert.match(
    homeView,
    /hospitalStore\.loadNearbyHospitals\(\{\s*location: userLocation\.value,\s*locationError: '',\s*radius: 5,\s*limit: 3/,
  )
  assert.match(homeView, /onBeforeUnmount/)
  assert.match(homeView, /if \(!isHomeActive\) return/)
  assert.doesNotMatch(homeView, /useAuthStore/)
  assert.doesNotMatch(homeView, /isLoggedIn/)
})

test('HomeView 以 API 資料呈現三張摘要與 loading、empty、error、fallback 狀態', () => {
  const homeView = readSource('../views/HomeView.vue')

  assert.match(homeView, /正在取得目前位置/)
  assert.match(homeView, /已取得目前位置/)
  assert.match(homeView, /locationError/)
  assert.match(homeView, /locationFallbackMessage/)
  assert.match(homeView, /homeHospitals = computed\(\(\) => visibleHospitals\.value\.slice\(0, 3\)\)/)
  assert.match(homeView, /v-for="hospital in homeHospitals"/)
  assert.match(homeView, /formatDistance\(hospital\.distanceKm\)/)
  assert.match(homeView, /numericDistance\.toFixed\(1\)/)
  assert.match(homeView, /PetLoadingRunner/)
  assert.doesNotMatch(homeView, /isSummaryLoading"[\s\S]{0,200}animate-pulse/)
  assert.match(homeView, /附近 5 公里內暫無醫院/)
  assert.match(homeView, /\{\{ errorMessage \}\}/)
  assert.match(homeView, /最近醫院/)
  assert.doesNotMatch(homeView, /嗨嗨動物醫院/)
  assert.doesNotMatch(homeView, /勝勝動物醫院/)
})

test('HomeView 保留展示用營業中且卡片先選取再導頁', () => {
  const homeView = readSource('../views/HomeView.vue')

  assert.match(homeView, /營業中/)
  assert.match(
    homeView,
    /const openHospital = \(hospitalId\) => \{\s*hospitalStore\.selectHospital\(hospitalId\)\s*router\.push\('\/hospital'\)/,
  )
  assert.match(homeView, /@click="openHospital\(hospital\.id\)"/)
  assert.match(homeView, /<RouterLink\s+to="\/hospital"[\s\S]*?>\s*立即搜尋醫院/)
  assert.doesNotMatch(homeView, /loadNearbyHospitals\([\s\S]{0,180}(is_24h|isOpen|is24H)/)
})

test('HospitalView 使用共享 location store 並將 userLocation 傳給 MapView', () => {
  const hospitalView = readSource('../views/HospitalView.vue')
  const router = readSource('../router/index.js')

  assert.match(hospitalView, /useLocationStore/)
  assert.match(hospitalView, /useHospitalStore/)
  assert.match(hospitalView, /storeToRefs\(locationStore\)/)
  assert.match(hospitalView, /locationStore\.requestCurrentLocation\(\)/)
  assert.match(hospitalView, /:user-location="userLocation"/)
  assert.match(hospitalView, /hospitalStore\.loadNearbyHospitals/)
  assert.match(hospitalView, /loadNearbyHospitals\(\{ requestLocation: false \}\)/)
  assert.match(
    router,
    /path: '\/hospital'[\s\S]*?component: \(\) => import\('\@\/views\/HospitalView\.vue'\)/,
  )
  assert.doesNotMatch(router, /path: '\/hospital'[\s\S]*?requiresAuth: true/)
})

test('HospitalView 顯示定位狀態與重新取得目前位置入口', () => {
  const hospitalView = readSource('../views/HospitalView.vue')

  assert.match(hospitalView, /定位中\.\.\./)
  assert.match(hospitalView, /已取得目前位置/)
  assert.match(hospitalView, /locationError/)
  assert.match(hospitalView, /重新取得目前位置/)
  assert.match(hospitalView, /搜尋附近醫院/)
  assert.match(hospitalView, /台北市中心/)
  assert.match(hospitalView, /重新檢查定位權限/)
  assert.match(hospitalView, /瀏覽器網址列或網站設定允許 PawPal 使用定位/)
  assert.match(hospitalView, /permissionState/)
  assert.match(hospitalView, /:disabled="isLocating"/)
  assert.doesNotMatch(hospitalView, /<p v-if="locationFallbackMessage"/)
})

test('MapView 只解析一次初始中心，bounds marker 更新不再重新置中', () => {
  const mapView = readSource('../components/hospital/MapView.vue')
  const mapStatusOverlay = readSource('../components/hospital/MapStatusOverlay.vue')

  assert.match(mapView, /resolveHospitalMapInitialCenter/)
  assert.match(mapView, /const initialCenter = ref\(/)
  assert.match(mapView, /selectedHospital: selectedHospital\.value/)
  assert.match(mapView, /userLocation: props\.userLocation/)
  assert.match(mapView, /hospitals: validHospitals\.value/)
  assert.match(mapView, /fallbackCenter: TAIPEI_CENTER/)
  assert.match(mapView, /:center="initialCenter"/)
  assert.doesNotMatch(mapView, /const center = computed\(/)
  assert.match(mapView, /const merged = \[\.\.\.props\.hospitals\]/)
  assert.match(mapView, /L\.markerClusterGroup\(\)/)
  assert.doesNotMatch(mapView, /defaultHospitals/)
  assert.match(
    mapStatusOverlay,
    /v-if="errorMessage"[\s\S]*?class="absolute left-24 top-4[^"]*max-w-xs/,
  )
})

test('HospitalView 重新定位成功才清除選取，MapView 再移到新位置一次', () => {
  const hospitalView = readSource('../views/HospitalView.vue')
  const mapView = readSource('../components/hospital/MapView.vue')

  assert.match(
    hospitalView,
    /const locationSucceeded = await locationStore\.requestCurrentLocation\(\)[\s\S]*?if \(locationSucceeded\) \{\s*hospitalStore\.selectHospital\(null\)/,
  )
  assert.match(mapView, /mapObject\.value\.closePopup\(\)/)
  assert.match(mapView, /mapObject\.value\.panTo\(\[latitude, longitude\]\)/)
  assert.match(mapView, /props\.selectedHospitalId !== null/)
})

test('MapView 使用獨立使用者位置 marker 並顯示 popup', () => {
  const mapView = readSource('../components/hospital/MapView.vue')
  const mapMarkers = readSource('../utils/hospitalMapMarkers.js')

  assert.match(mapView, /LMarker/)
  assert.match(mapView, /userLocationIcon/)
  assert.match(mapMarkers, /user-location-marker-halo/)
  assert.match(mapMarkers, /user-location-marker-pin/)
  assert.match(mapView, /你目前的位置/)
  assert.match(mapView, /markerById[\s\S]*?<LMarker/)
  assert.doesNotMatch(mapView, /userLocation[\s\S]{0,200}:hospital=/)
  assert.doesNotMatch(mapView, /user-location-marker-dot/)
})

test('Home page GPS completion triggers nearby API through the shared hospital store', () => {
  const homeView = readSource('../views/HomeView.vue')

  assert.match(homeView, /locationStore\.requestCurrentLocation\(\)/)
  assert.match(homeView, /useHospitalStore/)
  assert.match(homeView, /hospitalStore\.loadNearbyHospitals/)
  assert.doesNotMatch(homeView, /fetchHospitals/)
  assert.doesNotMatch(homeView, /fetchNearbyHospitals/)
  assert.doesNotMatch(homeView, /\/api\/v1\/hospitals/)
})
