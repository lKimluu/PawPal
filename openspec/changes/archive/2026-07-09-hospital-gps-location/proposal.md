## Why

首頁目前有「最近醫院」卡片區塊，後續需要依使用者位置取得最近三筆醫院；醫院地圖也需要讓未登入訪客使用定位功能。先建立全站共享 GPS 定位能力，讓 HomeView 與 HospitalView 都能讀取同一份使用者座標，並為後續附近醫院 API 串接打基礎。

## What Changes

- 新增全站共享 location Pinia store，使用瀏覽器 Geolocation API 取得使用者目前 latitude 與 longitude。
- HomeView 載入時自動觸發 GPS 定位，未登入訪客與已登入會員都適用。
- HomeView 顯示定位中、定位成功與定位錯誤狀態；首頁最近醫院卡片本 change 仍保留假資料。
- HospitalView 使用同一個 location store，提供重新取得目前位置入口。
- MapView 接收使用者位置，定位成功後將 Leaflet 地圖中心移動到使用者目前位置。
- MapView 顯示使用者位置 Marker，與現有醫院 Marker 分開呈現。
- 處理瀏覽器不支援、使用者拒絕權限、定位逾時、位置不可用與其他定位錯誤。
- 延續 Vue 3 Composition API、Pinia、Leaflet 與現有 UI 風格，不安裝新套件。

## Non-Goals

- 不串接 GET /api/v1/hospitals。
- 不串接 GET /api/v1/hospitals/nearby。
- 不修改後端程式碼。
- 不實作附近醫院搜尋、不顯示 distanceKm。
- 不把首頁三張最近醫院卡片改成 API 資料。
- 不大幅重構 HomeView、HospitalView、MapView、HospitalList 或現有醫院假資料流程。
- 不將使用者位置送到後端、localStorage 或資料庫。

## Capabilities

### New Capabilities

- `hospital-gps-location`: 前端能在首頁自動請求瀏覽器定位、保存使用者目前座標，並讓醫院地圖用該座標更新 Leaflet 中心與顯示使用者位置 Marker。

### Modified Capabilities

(none)

## Impact

- Affected specs: hospital-gps-location
- Affected code:
  - New: src/stores/location.js, src/test/locationStore.test.js, src/test/hospitalGpsView.test.js
  - Modified: src/views/HomeView.vue, src/views/HospitalView.vue, src/components/hospital/MapView.vue
  - Removed: none
