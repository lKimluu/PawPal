import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

function readSource(path) {
  const url = new URL(path, import.meta.url)
  return existsSync(url) ? readFileSync(url, 'utf8') : ''
}

test('HomeView 使用共享 location store 並在 mounted 自動定位', () => {
  const homeView = readSource('../views/HomeView.vue')

  assert.match(homeView, /useLocationStore/)
  assert.match(homeView, /storeToRefs\(locationStore\)/)
  assert.match(homeView, /onMounted\(\(\) => \{\s*locationStore\.requestCurrentLocation\(\)/)
  assert.doesNotMatch(homeView, /useAuthStore/)
  assert.doesNotMatch(homeView, /isLoggedIn/)
})

test('HomeView 顯示定位狀態且保留最近醫院假資料卡片', () => {
  const homeView = readSource('../views/HomeView.vue')

  assert.match(homeView, /正在取得目前位置/)
  assert.match(homeView, /已取得目前位置/)
  assert.match(homeView, /locationError/)
  assert.match(homeView, /最近醫院/)
  assert.match(homeView, /嗨嗨動物醫院/)
  assert.match(homeView, /勝勝動物醫院/)
})

test('HospitalView 使用共享 location store 並將 userLocation 傳給 MapView', () => {
  const hospitalView = readSource('../views/HospitalView.vue')
  const router = readSource('../router/index.js')

  assert.match(hospitalView, /useLocationStore/)
  assert.match(hospitalView, /storeToRefs\(locationStore\)/)
  assert.match(hospitalView, /locationStore\.requestCurrentLocation\(\)/)
  assert.match(hospitalView, /:user-location="userLocation"/)
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
  assert.match(hospitalView, /重新檢查定位權限/)
  assert.match(hospitalView, /瀏覽器網址列或網站設定允許 PawPal 使用定位/)
  assert.match(hospitalView, /permissionState/)
  assert.match(hospitalView, /:disabled="isLocating"/)
})

test('MapView 以 userLocation 優先置中並保留既有醫院中心 fallback', () => {
  const mapView = readSource('../components/hospital/MapView.vue')

  assert.match(mapView, /userLocation/)
  assert.match(mapView, /if \(userPosition\.value\) return userPosition\.value/)
  assert.match(mapView, /if \(validHospitals\.value\.length === 0\) return TAIPEI_CENTER/)
  assert.match(mapView, /sourceHospitals/)
  assert.match(mapView, /defaultHospitals/)
  assert.match(mapView, /HospitalMarker/)
})

test('MapView 使用獨立使用者位置 marker 並顯示 popup', () => {
  const mapView = readSource('../components/hospital/MapView.vue')

  assert.match(mapView, /LMarker/)
  assert.match(mapView, /userLocationIcon/)
  assert.match(mapView, /user-location-marker-halo/)
  assert.match(mapView, /user-location-marker-pin/)
  assert.match(mapView, /你目前的位置/)
  assert.match(mapView, /<HospitalMarker[\s\S]*?<LMarker/)
  assert.doesNotMatch(mapView, /userLocation[\s\S]{0,200}:hospital=/)
  assert.doesNotMatch(mapView, /user-location-marker-dot/)
})
