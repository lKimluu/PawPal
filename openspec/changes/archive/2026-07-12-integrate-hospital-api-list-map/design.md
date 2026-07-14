## Context

目前醫院頁已經有 `HospitalView`、`HospitalList`、`MapView` 與共享 `locationStore`。Home 頁會取得使用者 GPS 並存到 location store；HospitalView 也能觸發定位。後端已提供 `GET /api/v1/hospitals` 與 `GET /api/v1/hospitals/nearby`，但前端醫院清單與地圖仍主要依賴靜態 `src/data/hospitals.js`。

這個 change 要把醫院頁的資料來源改成後端 API，並確保 HospitalList 與 Leaflet Marker 使用同一份目前查詢結果，避免清單與地圖各自查詢或各自維護不同資料。

## Goals / Non-Goals

**Goals:**

- 以前端 API service 串接 `GET /api/v1/hospitals` 與 `GET /api/v1/hospitals/nearby`。
- 以 Hospital Store 作為醫院頁目前查詢結果的單一資料來源。
- 初次載入顯示附近醫院清單；若 location store 已有使用者 GPS 位置則使用該座標，沒有定位或定位失敗時使用 `TAIPEI_CENTER = [25.033, 121.5654]` 查詢附近醫院。
- 搜尋、縣市、行政區、診療動物種類與分頁都由 Hospital Store 組 query 重新查詢 API；只顯示營業中與 24 小時急診由 Hospital Store 保留為前端篩選條件並套用到目前查詢結果。
- HospitalList 與 MapView 使用同一批目前查詢結果；沒有經緯度的醫院只出現在清單，不出現在 Marker。
- 清單與 Marker 點擊同步目前選取醫院，清單點擊時地圖定位到對應 Marker。
- 顯示 Loading、Error、Empty State 與 GPS 拒絕或定位失敗狀態。
- 移除醫院頁與醫院地圖清單對 `src/data/hospitals.js` 的依賴。

**Non-Goals:**

- 不修改後端 API contract、資料庫 schema 或 hospitals route。
- 不改變 Home 頁 GPS 行為；Home 頁取得定位時仍不得呼叫 hospitals API。
- 不新增後端營業中或 24 小時急診 query param；若後端未提供對應參數，本 change 以前端篩選目前查詢結果為準。
- 不重做地圖視覺樣式、Marker icon 或整體 UI layout。
- 不把 favorite hospital store 改成 API 驅動；若收藏功能仍依賴靜態資料，另開 change 處理。
- 不新增自動輪詢或背景重新整理。

## Decisions

### Use Hospital Store as the single source of query results

新增 `src/stores/hospital.js` 管理目前查詢結果、分頁、篩選條件、查詢模式、selectedHospitalId、loading、error 與 empty state。HospitalView 呼叫 store actions，HospitalList 與 MapView 接收或讀取同一份 store state，不在 component 內各自呼叫 API。

替代方案是 HospitalList 和 MapView 各自 fetch，但會造成清單、Marker、pagination 與 selected hospital 不一致，尤其 nearby 與一般列表切換時更容易出現兩套資料。

### Separate list mode and nearby mode explicitly

Hospital Store 維護目前查詢模式：一般列表使用 `GET /api/v1/hospitals`，附近醫院使用 `GET /api/v1/hospitals/nearby`。一般列表支援 keyword、city、district、animal_type、page、limit；附近醫院使用 lat、lng、radius、limit、animal_type。進入搜尋、縣市或行政區篩選時回到一般列表模式並重設 page 為 1；使用附近醫院查詢時優先以 location store 的 userLocation 作為座標來源，沒有 userLocation 時使用 `TAIPEI_CENTER = [25.033, 121.5654]` 作為 fallback 座標。既有「只顯示營業中」與「24 小時急診」選項不送到後端；因目前後端 hospitals response 尚未保證提供營業狀態，`isOpenOnly` 預設關閉，避免初次 nearby 結果被全部濾掉。Hospital Store 以 normalized hospital 的 `isOpen` 與 `is24H` 套用前端篩選，並讓清單與 Marker 共用篩選後結果。

這樣能避免附近醫院結果和一般分頁結果混在同一個 query contract 裡，也避免在 nearby endpoint 上傳遞不支援的 city/district/page query。

### Normalize backend hospitals before components render them

API service 或 Hospital Store 需要將後端 hospital row 正規化成前端 component 穩定使用的 shape。至少包含 id、name、city、district、address、phone、latitude、longitude、animalTypes、distanceKm、isOpen、is24H、businessHours 等欄位；若後端使用 snake_case，例如 animal_types、distance_km、is_open 或 is_24h，store 應轉成 camelCase。MapView 使用 `latitude` 與 `longitude` 判斷是否產生 Marker，SearchBar 的營業中/24H 篩選使用 `isOpen` 與 `is24H`。

這讓 component 不需要知道後端欄位命名差異，也讓測試能直接驗證清單和 Marker 共享同一份 normalized data。

### Keep location ownership in location store and use Taipei fallback

GPS 定位仍由 `src/stores/location.js` 管理。Hospital Store 不直接呼叫 `navigator.geolocation`；HospitalView 在需要附近醫院時先透過 location store 取得或使用既有 userLocation，再把 lat/lng 傳給 Hospital Store 查詢 nearby API。若沒有 userLocation，或 GPS 拒絕/失敗導致無法取得座標，Hospital Store 使用 `TAIPEI_CENTER = [25.033, 121.5654]` 查詢 nearby API，並可顯示定位錯誤或 fallback 提示。

這保留既有責任分工：location store 管定位，Hospital Store 管醫院 API 查詢。也確保沒有使用者定位時，HospitalList 與 MapView 仍使用同一批附近醫院資料，而不是只有清單有資料、地圖沒有醫院 Marker。

### Test API integration with source-level and store-level checks

新增或更新前端測試，覆蓋 API service query param、Hospital Store actions、HospitalView 初次載入、搜尋篩選重設頁碼、分頁保留條件、HospitalList/MapView 使用同一份資料、營業中與 24H 前端篩選、無經緯度不顯示 Marker、nearby 查詢優先使用 userLocation，以及沒有 userLocation 時使用 `TAIPEI_CENTER`。既有 `hospitalGpsView.test.js` 需繼續確認 Home 頁定位不呼叫 hospitals API。

## Implementation Contract

**Behavior:** 醫院頁初次載入會顯示 `GET /api/v1/hospitals/nearby` 回傳的附近醫院資料；若尚無使用者定位則用 `TAIPEI_CENTER = [25.033, 121.5654]` 查詢。清單與地圖 Marker 使用 Hospital Store 的同一份目前查詢結果。沒有經緯度的醫院仍在清單中，但不產生 Marker。使用者點擊清單或 Marker 後，目前選取醫院同步更新；清單點擊會讓地圖定位到對應 Marker。

**Interface / data shape:** 新增 `src/api/hospitals.js`，提供一般清單查詢與附近醫院查詢函式。新增 `useHospitalStore`，公開 actions：載入一般醫院、載入附近醫院、設定搜尋關鍵字、設定縣市/行政區、設定診療動物種類、設定只顯示營業中、設定 24 小時急診、切換頁碼、選取醫院、清除錯誤或重置查詢。Store state 至少包含 hospitals、visibleHospitals、pagination、filters、mode、selectedHospitalId、isLoading、errorMessage。filters 至少包含 keyword、city、district、animalType、isOpenOnly、isEmergencyOnly。前端傳給一般列表 API 的診療動物種類 query key 必須是 `animal_type`；isOpenOnly 與 isEmergencyOnly 不作為後端 query param。

**Failure modes:** 一般清單 API 失敗時顯示 API error state 並保留可重試能力。附近醫院 API 失敗時顯示 nearby error state，且不破壞一般清單查詢能力。GPS 拒絕授權、尚未定位或定位失敗時，nearby 查詢改用 `TAIPEI_CENTER = [25.033, 121.5654]`；畫面可顯示定位錯誤或 fallback 提示，但仍必須顯示以 fallback 座標查到的清單與地圖 Marker。查無資料時顯示 empty state。

**Acceptance criteria:** `node --test` 相關前端測試必須覆蓋 Hospital Store、API query params、list/map 同源資料、nearby query、loading/error/empty state 與 Home 頁不呼叫 hospitals API。`npm run build` 必須通過。

**Scope boundaries:** 本 change 僅限前端醫院 API service、Hospital Store、HospitalView、hospital components 與前端測試。不修改 backend、不改 location store 的 GPS contract、不重做收藏醫院資料來源。

## Risks / Trade-offs

- [Risk] 清單和地圖使用不同資料來源造成畫面不一致 → Mitigation: Hospital Store 作為單一資料來源，HospitalList 與 MapView 都使用 store state。
- [Risk] nearby 和一般列表 query 條件混用 → Mitigation: Store 明確區分 list mode 與 nearby mode，並只傳各 endpoint 支援的 query。
- [Risk] 營業中/24H 被誤當成後端 query param 導致 API contract 不一致 → Mitigation: Store 將 isOpenOnly/isEmergencyOnly 保留為前端篩選，API service 不送出未定義參數。
- [Risk] 後端 snake_case 欄位外洩到 component → Mitigation: API service 或 Store normalize hospital shape。
- [Risk] GPS 被拒絕導致 nearby 查詢沒有座標且地圖沒有醫院 Marker → Mitigation: 沒有 userLocation 時使用 `TAIPEI_CENTER = [25.033, 121.5654]` 作為 nearby fallback 座標。
- [Risk] 移除靜態資料依賴後空資料畫面不好判讀 → Mitigation: 明確新增 loading、error、empty state 測試。

## Ingest Revision Context

第一階段已完成 Hospital Store 與兩個既有 API 的整合，但「清單和地圖共用目前結果」不符合修訂後的產品意圖。地圖是空間瀏覽工具，只應反映使用者目前視野；清單是條件搜尋工具，必須保留自己的表單、排序與分頁。以下決策取代本文件前述與 list/map 同源、前端 open-only／24H 共用篩選及不修改後端相關的決策；已完成內容保留為歷史脈絡。

## Revised Goals / Non-Goals

**Goals:**

- 讓清單與地圖擁有獨立結果、查詢生命週期及錯誤狀態。
- 地圖依 bounds 自動更新、群聚標記並限制單次 payload。
- 提供可由資料庫可靠支援的搜尋、連動地區、24H、排序與分頁。
- 防止所有 superseded hospital requests 提交過時狀態。

**Non-Goals:**

- 不新增營業時段資料，不推算「目前營業中」。
- 不讓任何搜尋條件影響地圖 bounds 結果。
- 不把台北市中心假裝成使用者定位；它只作為無定位時的初始附近基準與預設地圖中心。
- 不改造 favorite hospital store。

## Revised Decisions

### Separate list and map query state

Hospital Store 維護 `listHospitals` 與 `mapHospitals` 兩套狀態，以及各自的 loading、error、lastQuery 和 request sequence。元件不得從另一套結果推導自己的資料。替代方案是沿用單一陣列，但會讓關鍵字搜尋清除地圖視野結果，或讓地圖移動覆寫清單分頁，因此不採用。

### Query map by visible bounds with clustering

MapView 在 Leaflet `moveend`／`zoomend` 後 debounce 300ms，傳送 north、south、east、west 至 map endpoint。後端只回傳邊界內具有座標的醫院，最多 1,000 筆並回傳 `total` 與 `truncated`；前端以群聚呈現，截斷時提示放大地圖。圓形 nearby 查詢無法準確代表矩形視野，因此不作為 bounds 替代。

### Provide hybrid search submission and reliable filters

keyword 只在 Enter 或搜尋鍵提交；city、district、animal type、`is_24h` 與排序改變時立即查詢並重設 page。地區選項由 regions endpoint 提供，city 改變時清除不屬於該 city 的 district。移除 `isOpenOnly` UI 與行為，因資料庫沒有足以推算當下營業狀態的營業時間。

### Use contextual sorting and explicit location semantics

清單支援 `relevance`、`distance`、`name`。有 keyword 預設 relevance；無 keyword 且有真實定位時預設 distance；沒有真實定位時預設 name 並停用 distance。初次載入可用台北中心查 nearby，但一般搜尋不得把該 fallback 標示為使用者距離。相關度以名稱命中優先，再依 city、district、address 命中，最後以 city、district、name、id 穩定排序。

### Ignore superseded responses independently

每次 list 或 map action 啟動時遞增自己的 request sequence，並捕捉該次 ID。只有 ID 仍等於最新 sequence 的 success、failure 與 finally 分支可以更新結果、pagination、error、selection 或 loading。retry 亦建立新 ID；不要求 Axios cancellation 才能保證正確性。

### Preserve one-way selection navigation

點擊清單卡片時，地圖 fly/pan 至該院座標、將該院加入目前可呈現 Marker 並開啟 popup；其後由新 bounds 查詢接手地圖資料。點擊地圖 Marker 不改變搜尋條件、清單結果或分頁。

## Revised Implementation Contract

**Behavior:** 初次進頁的清單顯示真實定位附近醫院；無定位時顯示明確的「台北市中心附近」fallback。一般搜尋與地圖視野完全分流。搜尋條件只更新清單；地圖停止操作 300ms 後只依最新 bounds 更新並群聚。點擊清單醫院會導覽並開啟地圖 Marker。過時 response 不得更新任何可觀察狀態。

**Interfaces:** `GET /api/v1/hospitals` 新增 `is_24h`、`sort=relevance|distance|name`，distance 必須搭配有效 lat/lng，response hospital 回傳 `is_24h`、`emergency_available`，距離查詢另回傳 `distance_km`。`GET /api/v1/hospitals/regions` 回傳 `{ regions: [{ city, districts: string[] }] }`。`GET /api/v1/hospitals/map` 接受 north/south/east/west，回傳 `{ hospitals, total, truncated }`，只包含有座標且位於邊界內的醫院，最多 1,000 筆。

**Failure modes:** list 與 map 的錯誤各自在自己的區域顯示並可重試，不得清空另一套成功資料。定位失敗時初始附近使用 `TAIPEI_CENTER = [25.033, 121.5654]` 並顯示 fallback；一般搜尋停用 distance。regions 失敗時地區選單顯示錯誤與重試，不退回自由文字輸入。

**Acceptance criteria:** backend schema/service/route tests 覆蓋新增 query、bounds、上限、排序與 region shape；frontend tests 覆蓋兩套狀態、hybrid submit、分頁、selection navigation、debounce、群聚提示與 out-of-order completion。`npm test`、`npm run build` 及 `cd backend && npm test` 必須通過。

**Scope boundaries:** in scope 為 hospitals backend query API、frontend hospital API/store/view/components、群聚 dependency 與測試；out of scope 為營業時段、即時營業判斷、收藏資料源及 Home 頁 GPS contract。

## Revised Risks / Trade-offs

- [Risk] 全台視野回傳過多 Marker → Mitigation: bounds、1,000 筆硬上限、`truncated` 提示與 clustering。
- [Risk] list 與 map 分流後選取醫院不在地圖快取 → Mitigation: 以選取醫院資料建立暫時 Marker，bounds response 到達後再去重整合。
- [Risk] relevance SQL 在大型資料量效能下降 → Mitigation: 使用明確 CASE ranking 與穩定次排序，保留後續全文索引優化空間。
- [Risk] 多個請求完成順序不固定 → Mitigation: list/map 獨立 request sequence，所有 state commit 都檢查最新 ID。

## Popup Presentation Revision

### Render compact trusted popup content safely

Marker clustering 使用 Leaflet imperative markers，因此不能直接恢復 `HospitalMarker.vue` 的 Vue `LPopup` template。MapView 應以單一 popup HTML builder 重建原版卡片視覺，輸出名稱、地址、可選 24H 標籤、可選電話按鈕與 Google Maps 導航。醫院文字必須 HTML escape；電話值只保留撥號可接受字元並進行 attribute encoding；導航 URL 使用有限數值座標組成並以 `target="_blank" rel="noopener noreferrer"` 開啟。

**Behavior:** 點擊醫院 Marker 或由清單導覽後開啟的 popup 顯示品牌圓角精簡卡片。有電話才顯示撥號按鈕，導航固定以醫院座標開啟 Google Maps；非 24H 不顯示 24H 標籤。

**Failure modes:** 空地址顯示「地址資訊未提供」；空電話不渲染撥號；非有限座標的醫院不建立 Marker 或導航。使用者提供型文字不得成為 HTML element、event attribute 或任意 URL。

**Acceptance criteria:** frontend tests 驗證內容條件、安全 escaping、電話與導航連結；hospital tests 與 `npm run build` 通過。

**Scope boundaries:** 僅修改地圖 popup builder、對應樣式與前端測試；不修改 API、Store、搜尋、群聚與 bounds 行為。

## Fallback Retry State Revision

### Preserve original nearby retry input

`loadNearbyHospitals` 將呼叫端輸入與 API 傳輸 query 視為兩種不同資料：`lastQuery` 保存原始 `location`、`locationError`、`radius`、`limit`，而送往 `fetchNearbyHospitals` 的 query 才將無效或缺少的 location 轉成 `TAIPEI_CENTER`。替代方案是在轉換後 query 旁保存 `isFallback`，但會製造可互相矛盾的重複狀態，因此不採用。

**Behavior:** nearby fallback 查詢失敗並重試時，API 仍收到台北中心座標，但 Hospital Store 的 `hasRealLocation` 維持 false、`userCoordinates` 維持 null、fallback 訊息維持可見，且一般搜尋不得啟用距離排序。真實定位的 nearby 重試仍保存並使用原座標。

**Interface / data shape:** `loadNearbyHospitals({ location = null, locationError = '', radius = 5, limit = 20 })` 簽名不變；內部 `lastQuery` 的 nearby `query` 保存上述原始輸入，不保存套用 fallback 後的座標。

**Failure modes:** API 連續失敗只更新目前 list error，不得把 fallback 座標提升為使用者定位。過時 request 仍依既有 request ID 規則不得提交狀態。

**Acceptance criteria:** Pinia store 測試模擬 nearby fallback 失敗後呼叫 `retryCurrentQuery()`，驗證兩次 API request 均使用 `TAIPEI_CENTER`，且重試後 fallback 與距離語意不變；真實定位重試測試驗證座標與真實定位狀態維持。前端 hospital tests、build 與 backend tests 通過。

**Scope boundaries:** 僅修改 Hospital Store nearby retry context、對應前端測試與本 change artifacts；不修改 API、location store、HospitalView 或後端行為。

### Reconcile contextual sort when real location becomes available

Hospital Store 必須區分「依目前情境自動選出的排序」與「使用者明確選擇的排序」。`loadNearbyHospitals` 接受有效 GPS 並讓 `hasRealLocation` 從 false 轉為 true 時，若沒有 keyword 且目前排序仍由情境預設控制，store 將 `filters.sort` 更新為 `distance`；若使用者已透過排序控制項明確選擇 `name`、`relevance` 或 `distance`，則保留該選擇。相較於只判斷目前值是否為 `name`，明確追蹤排序來源可避免把使用者刻意選擇的名稱排序誤判成舊預設。

**Behavior:** 使用者在初始無定位狀態取得真實 GPS 後，無 keyword 的後續 city、district、animal type 或 `is_24h` 篩選查詢預設送出 `sort=distance` 與真實座標。若使用者曾明確選擇排序，取得或更新定位不覆寫該排序。keyword 提交仍依既有情境規則使用 relevance，清除 keyword 後再依排序來源與真實定位決定預設。

**Interface / state:** `filters.sort` 繼續作為 API query 的排序值；Hospital Store 另以內部狀態或等價機制記錄排序是否由使用者明確選擇。排序控制 action 設定明確選擇，情境預設更新不得將其重設。

**Failure modes:** 無效、拒絕或 fallback 定位不得啟用距離排序，也不得被當成真實定位。重複取得同一真實定位不得反覆覆寫排序。過時 nearby response 仍受 request ID 防護，不得改變定位或排序狀態。

**Acceptance criteria:** Pinia store 測試先建立無定位的 `name` 情境預設，再載入有效 GPS，並驗證後續 city、animal type 與 `is_24h` 查詢使用 `distance` 和真實座標；另驗證使用者明確選擇 `name` 後取得定位仍保留 `name`。執行 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalGpsView.test.js` 與 `npm run build` 均須通過。

**Scope boundaries:** 僅調整 `src/stores/hospital.js` 的情境排序狀態轉換及其前端測試；不修改後端 API contract、location store、地圖資料流或視覺元件。
