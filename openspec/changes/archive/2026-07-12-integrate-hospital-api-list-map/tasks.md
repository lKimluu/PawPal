## 1. API service 與資料正規化

- [x] 1.1 建立 `src/api/hospitals.js`，提供 `GET /api/v1/hospitals` 與 `GET /api/v1/hospitals/nearby` 呼叫函式，確保一般列表 query 使用 keyword、city、district、animal_type、page、limit，附近醫院 query 使用 lat、lng、radius、limit、animal_type；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital list query supports filters and pagination 與 Nearby hospital query uses current or fallback location 的 query param contract。
- [x] 1.2 依 Normalize backend hospitals before components render them，將後端 snake_case hospital response 正規化為前端穩定 shape，包含 id、name、city、district、address、phone、latitude、longitude、animalTypes、distanceKm、isOpen、is24H、businessHours；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital page loads hospitals from the list API 使用 normalized data。

## 2. Hospital Store 查詢狀態

- [x] 2.1 新增 `src/stores/hospital.js` 並依 Use Hospital Store as the single source of query results 管理 hospitals、visibleHospitals、pagination、filters、mode、selectedHospitalId、isLoading、errorMessage 與 empty state；filters 需保留 keyword、city、district、animalType、isOpenOnly、isEmergencyOnly；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital store owns query result state。
- [x] 2.2 實作一般醫院清單載入 action，讓搜尋與 API 篩選可透過 Hospital Store 呼叫 `GET /api/v1/hospitals` 並寫入目前查詢結果；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital list query supports filters and pagination。
- [x] 2.3 依 Separate list mode and nearby mode explicitly 實作搜尋、縣市、行政區、animal_type、isOpenOnly、isEmergencyOnly 與分頁 actions：搜尋或 API 篩選重設 page 為 1，分頁切換保留目前條件，isOpenOnly 與 isEmergencyOnly 只套用前端 visibleHospitals 且不送未定義 query param；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital list query supports filters and pagination。
- [x] 2.4 依 Keep location ownership in location store and use Taipei fallback 實作附近醫院查詢 action：優先使用外部傳入或 location store 提供的 userLocation 呼叫 `GET /api/v1/hospitals/nearby`，沒有 userLocation、GPS 拒絕或定位失敗時改用 `TAIPEI_CENTER = [25.033, 121.5654]` 呼叫 nearby API；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Nearby hospital query uses current or fallback location。
- [x] 2.5 實作 loading、API error、location fallback/error、empty state 與 retry current query 行為，確保一般列表與附近醫院失敗都可顯示對應狀態，且沒有使用者定位時仍可用 Taipei fallback nearby 結果顯示清單與 Marker；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital page exposes loading, error, and empty states。

## 3. 醫院頁與清單地圖整合

- [x] 3.1 更新 `src/views/HospitalView.vue`，實作 Hospital page loads nearby hospitals on initial render：頁面初次載入 Hospital Store 的 nearby 資料；若已有 userLocation 則用使用者座標，否則用 Taipei fallback，並將 locationError 與附近醫院查詢入口整合到頁面流程；完成後以 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js` 驗證醫院頁 API 載入、fallback nearby 結果可供清單與地圖使用，以及 Home page GPS remains API-free。
- [x] 3.2 更新 `src/components/hospital/HospitalList.vue`、`src/components/hospital/HospitalCard.vue`、`src/components/hospital/SearchBar.vue`，讓 HospitalList 顯示 Hospital Store 的目前查詢結果，搜尋、只顯示營業中、24 小時急診與其他篩選會觸發 store actions，並呈現 loading、error、empty state；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital store owns query result state 與 Hospital page exposes loading, error, and empty states。
- [x] 3.3 更新 `src/components/hospital/MapView.vue` 與 `src/components/hospital/HospitalMarker.vue`，讓 Marker 使用 Hospital Store 同一份目前篩選後結果，只渲染具有 latitude 與 longitude 的醫院，並在清單點擊時定位至 Marker、Marker 點擊時同步 selectedHospitalId；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital store owns query result state 的 list/map 同源、open-only、24-hour emergency 與 selected hospital scenarios。
- [x] 3.4 移除醫院頁相關 component 對 `src/data/hospitals.js` 的依賴，保留 favorite hospital 靜態資料問題於本 change 範圍外；完成後以 `node --test src/test/hospitalApiIntegration.test.js` 驗證 Hospital page loads hospitals from the list API 的 static data removal scenario。

## 4. 驗證

- [x] 4.1 依 Test API integration with source-level and store-level checks 補齊 `src/test/hospitalApiIntegration.test.js` 與更新 `src/test/hospitalGpsView.test.js`，覆蓋 API query params、Hospital Store state、一般列表、nearby、沒有 userLocation 時使用 `TAIPEI_CENTER = [25.033, 121.5654]`、只顯示營業中、24 小時急診、list/map 同源、無經緯度不顯示 Marker、loading/error/empty state，以及 Home page GPS remains API-free；完成後以 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js` 驗證。
- [x] 4.2 執行完整前端驗證，確認 `npm run build` 通過，並記錄既有 chunk size warning 是否仍存在；完成後將 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js` 與 `npm run build` 結果寫入交付訊息。

## 5. 後端搜尋與地圖契約修訂

- [x] 5.1 依 Hospital APIs expose reliable 24-hour and map data 與 Provide hybrid search submission and reliable filters，擴充 hospitals query schema、controller 與 response mapping，支援 `is_24h`、`sort=relevance|distance|name`、distance 所需 lat/lng，以及 `is_24h`、`emergency_available`、`distance_km` 回傳；以 `cd backend && node --test test/hospitals.schema.test.js test/hospitals.controller.test.js` 驗證合法 query 與缺少座標時 HTTP 400 繁中訊息。
- [x] 5.2 依 Hospital list supports contextual sorting and pagination 與 Use contextual sorting and explicit location semantics，實作名稱命中優先於 city、district、address 的 relevance CASE 排序、distance 排序、name 排序與 city/district/name/id 穩定次排序，且所有排序保留分頁；以 `cd backend && node --test test/hospitals.service.test.js` 驗證排名、距離與跨頁穩定性。
- [x] 5.3 依 Hospital regions use database-backed dependent options，新增 `GET /api/v1/hospitals/regions` 並回傳 `{ regions: [{ city, districts }] }`，城市與行政區只來自現有醫院資料且穩定排序；以 backend route/controller/service tests 驗證成功 shape、空資料與錯誤回應。
- [x] 5.4 依 Hospital map follows the visible bounds 與 Query map by visible bounds with clustering，新增 `GET /api/v1/hospitals/map` 的 bounds 驗證與查詢，只回傳邊界內有座標醫院、最多 1,000 筆並提供 `total`、`truncated`；以 backend schema/route/service tests 驗證邊界、無效座標、上限與截斷。

## 6. 前端獨立查詢狀態與 API

- [x] 6.1 依 Hospital list and map use independent query state 與 Separate list and map query state，擴充 `src/api/hospitals.js` 與 `src/stores/hospital.js`，讓 list、map、regions 各自具有結果、loading、error、retry 與 lastQuery，且搜尋與地圖操作互不覆寫；以 `node --test src/test/hospitalApiIntegration.test.js` 驗證三套 API contract 與 list/map 分流。
- [x] 6.2 依 Superseded hospital responses cannot commit state 與 Ignore superseded responses independently，為 list 與 map action 建立獨立 request sequence，success、failure、finally 與 retry 只允許最新 ID 更新狀態；以可控 deferred promises 模擬舊請求最後完成，驗證結果、pagination、error、selection 與 loading 都維持最新請求狀態。
- [x] 6.3 依 Initial list uses nearby location with an explicit fallback，初次清單使用真實定位距離排序，定位不可用時以 `TAIPEI_CENTER` 載入並標示台北中心附近；一般搜尋在無真實定位時停用 distance；以 HospitalView/store tests 覆蓋定位成功、拒絕、失敗與 fallback 不冒充使用者距離。

## 7. 搜尋清單體驗

- [x] 7.1 依 Hospital list provides hybrid search controls 與 Provide hybrid search submission and reliable filters，讓 keyword 僅由 Enter／搜尋鍵提交，city、district、animal type、`is_24h` 與 sort 變更後立即查詢第一頁，移除 open-only，清除條件立即載入未篩選第一頁；以 SearchBar component/source tests 驗證每種觸發時機與 query。
- [x] 7.2 依 Hospital regions use database-backed dependent options，將 city/district 改為 API 驅動連動選單，切換 city 時先清除不相容 district，regions 失敗時顯示錯誤與 retry 而非文字輸入；以 component/store tests 驗證選項、清除順序、失敗與重試。
- [x] 7.3 依 Hospital list supports contextual sorting and pagination 與 Use contextual sorting and explicit location semantics，新增相關度／距離／名稱排序和頁碼控制，套用情境預設、無定位停用距離、翻頁保留條件，並以 API `total` 顯示總筆數；以 HospitalList/SearchBar tests 驗證排序預設、選項可用性與分頁狀態。

## 8. 地圖視野、群聚與選取

- [x] 8.1 依 Hospital map follows the visible bounds 與 Query map by visible bounds with clustering，讓 MapView 在 `moveend`／`zoomend` 停止 300ms 後只用最新 bounds 查詢，顯示獨立 loading/error/retry 與 `truncated` 放大提示；以 fake timers 驗證 debounce、最新 bounds 與不影響清單。
- [x] 8.2 依 Hospital map clusters dense markers，加入 Vue Leaflet 相容的 clustering dependency，群聚重疊 Marker、放大後展開，統計只使用 map results 且不顯示目前營業中；以 build、component tests 與 Marker rendering assertions 驗證群聚及統計。
- [x] 8.3 依 List selection navigates the independent map 與 Preserve one-way selection navigation，點清單醫院時移動地圖、為 bounds 外醫院建立去重的暫時 Marker 並開啟 popup，且 Marker 操作不改清單條件、結果或分頁；以 MapView/HospitalView tests 驗證 bounds 內外選取與下一次 bounds response 整合。

## 9. 完整驗證

- [x] 9.1 更新與執行 hospital 前後端測試，確認所有新增 Requirement 名稱對應情境均被覆蓋，再執行 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js`、`npm run build`、`cd backend && npm test`，並記錄通過結果與既有非阻擋 warning。

## 10. 地圖 Popup 視覺修訂

- [x] 10.1 依 Clustered hospital markers display a trusted compact information card 與 Render compact trusted popup content safely，在 `MapView.vue` 建立安全 popup builder，恢復原版圓角、陰影、標題與地址色塊，條件式顯示 24H 與電話，並以有限座標建立 Google Maps directions；以 frontend hospital tests 驗證缺少電話、非 24H、空地址及 HTML 特殊字元均符合契約。
- [x] 10.2 驗證 popup 修訂不改變 clustering、bounds、清單導覽與 list/map 分流，執行 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js` 與 `npm run build`，兩者通過後記錄既有非阻擋 chunk-size warning。

## 11. Fallback 重試狀態修正

- [x] 11.1 依 Initial list uses nearby location with an explicit fallback 與 Preserve original nearby retry input，在 `src/stores/hospital.js` 讓 nearby `lastQuery` 保存原始定位輸入、只在 API query 套用 `TAIPEI_CENTER`；以 `src/test/hospitalApiIntegration.test.js` 的 Pinia store 測試驗證 fallback 請求失敗後重試仍維持 `hasRealLocation === false`、fallback 訊息與距離排序限制，並驗證真實定位重試不回歸。
- [x] 11.2 執行 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js`、`npm run build` 與 `cd backend && npm test`，確認 fallback retry 修正不影響醫院頁整合與後端契約，並在交付訊息記錄通過結果及既有非阻擋 warning。

## 12. 真實定位情境排序修正

- [x] 12.1 依 Hospital list supports contextual sorting and pagination 與 Reconcile contextual sort when real location becomes available，在 `src/stores/hospital.js` 區分系統情境預設與使用者明確排序：`hasRealLocation` 從 false 轉為 true 且無 keyword 時，將仍由系統控制的 `name` 預設切換為 `distance`，但保留使用者明確選擇；以 `src/test/hospitalApiIntegration.test.js` 的 Pinia store 測試驗證後續 city、district、animal type、`is_24h` 查詢使用真實座標與正確排序，並驗證明確 `name` 排序不被定位狀態覆寫。
- [x] 12.2 執行 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js` 與 `npm run build`，確認真實定位後的篩選查詢、fallback 距離限制、keyword relevance、明確排序及既有醫院頁流程均通過，並記錄任何非阻擋 warning。
