## Why

醫院頁目前仍依賴前端靜態資料，無法呈現後端 `GET /api/v1/hospitals` 與 `GET /api/v1/hospitals/nearby` 的查詢結果。需要將醫院清單、地圖 Marker、搜尋、篩選、分頁與附近醫院查詢整合到同一個前端資料流程，讓使用者看到的是後端最新醫院資料。

## What Changes

- 新增前端醫院 API service，串接 `GET /api/v1/hospitals` 與 `GET /api/v1/hospitals/nearby`。
- 新增 Hospital Store 作為醫院頁的單一資料來源，管理醫院資料、目前查詢模式、分頁、搜尋、縣市/行政區篩選、診療動物種類篩選、只顯示營業中、24 小時急診、Loading、Error 與 Empty State。
- 醫院頁初次載入時使用 `GET /api/v1/hospitals/nearby` 取得附近醫院資料；若沒有使用者定位則使用 `TAIPEI_CENTER = [25.033, 121.5654]`。
- 使用者已有 GPS 位置或在醫院頁允許定位後，可用目前位置呼叫 `GET /api/v1/hospitals/nearby` 取得附近醫院；若沒有使用者定位或定位失敗，使用 `TAIPEI_CENTER = [25.033, 121.5654]` 作為 nearby 查詢中心。
- HospitalList 與 Leaflet Marker 使用 Hospital Store 的同一批目前查詢結果資料。
- 沒有經緯度的醫院保留在清單中，但不產生地圖 Marker。
- 清單項目點擊可定位並選取對應 Marker；Marker 點擊可同步選取對應醫院。
- 搜尋與篩選重新查詢 API 並重設頁碼為第 1 頁；分頁切換保留目前搜尋與篩選條件。
- 保留 SearchBar 既有「只顯示營業中」與「24 小時急診」選項，並套用到目前查詢結果的清單與 Marker。
- 移除醫院頁對 `src/data/hospitals.js` 的依賴。

## Non-Goals

- 不修改後端 `GET /api/v1/hospitals` 或 `GET /api/v1/hospitals/nearby` 的 response contract。
- 不改動 GPS shared location store 的既有責任；Home 頁取得定位時仍不得呼叫醫院 API。
- 不新增後端 `is_open` 或 `is_24h` query param；營業中與 24 小時急診先以前端 Hospital Store 對目前查詢結果套用篩選。
- 不重做 Leaflet 地圖視覺樣式或 Marker icon 設計。
- 不處理收藏醫院 store 是否改由 API 資料來源管理；收藏功能若仍依賴靜態資料，另開 issue 處理。

## Capabilities

### New Capabilities

- `hospital-api-integration`: Defines frontend integration for hospital list and nearby APIs, including shared Hospital Store state, list/map synchronization, filters, pagination, loading, error, and empty states.

### Modified Capabilities

(none)

## Impact

- Affected specs: hospital-api-integration
- Affected code:
  - New: src/api/hospitals.js
  - New: src/stores/hospital.js
  - Modified: src/views/HospitalView.vue
  - Modified: src/components/hospital/HospitalList.vue
  - Modified: src/components/hospital/HospitalCard.vue
  - Modified: src/components/hospital/MapView.vue
  - Modified: src/components/hospital/HospitalMarker.vue
  - Modified: src/components/hospital/SearchBar.vue
  - Modified: src/test/hospitalGpsView.test.js
  - New: src/test/hospitalApiIntegration.test.js
  - Removed: src/data/hospitals.js dependency from hospital page components

## Ingest Revision: 清單與地圖分流

既有 13 項任務已完成第一階段 API 整合，但清單與地圖共用同一批結果會讓搜尋、篩選、附近查詢與地圖操作互相覆寫；重疊請求亦可能以過時回應覆蓋最新查詢。此修訂延續既有整合成果，將兩種使用情境拆成獨立資料流並補齊可可靠支援的搜尋契約。

### What Changes

- **BREAKING**：HospitalList 與 MapView 不再共用目前查詢結果；兩者各自管理結果、loading、error、retry 與最新 request ID。
- 地圖依 Leaflet 可視邊界查詢，停止拖曳或縮放約 300ms 後自動更新，使用標記群聚；單次最多回傳 1,000 筆並揭露是否截斷。
- 搜尋清單初次顯示定位附近醫院；無真實定位時明確改用台北市中心。開始搜尋後使用關鍵字、連動地區、診療動物、24 小時營業、排序與頁碼分頁。
- 關鍵字以搜尋鍵或 Enter 送出；地區、診療動物與 24H 條件變更後立即搜尋並回到第一頁。
- 移除缺乏營業時段資料支撐的「營業中」篩選；「24 小時營業」改由後端 `is_24h` 查詢與回傳。
- 擴充醫院 API 支援地區選項、地圖 bounds、24H、相關度／距離／名稱排序與距離欄位。
- 清單點擊仍會讓地圖移到該院並開啟 Marker，但地圖操作與條件不會反向改變清單。
- 所有清單、附近與地圖請求忽略 superseded response，只有最新請求可提交結果或清除 loading。

### Revised Capabilities

- `hospital-api-integration`：修訂既有 capability，使其涵蓋清單／地圖獨立查詢、搜尋體驗、地圖視野資料、排序、分頁與競態防護。

### Additional Impact

- Backend API：`GET /api/v1/hospitals`、`GET /api/v1/hospitals/regions`、`GET /api/v1/hospitals/map`。
- Frontend：hospital API service、Hospital Store、HospitalView、SearchBar、HospitalList、MapView、HospitalMarker 與相關測試。
- Dependency：加入與 Vue Leaflet 相容的 Marker clustering 支援。

## Ingest Revision: 恢復地圖醫院資訊卡

群聚整合將原本由 Vue template 呈現的完整 popup 降級成三行純文字，導致資訊層級、品牌樣式與操作性明顯退步。本修訂恢復原版視覺語言，但只呈現目前 API 可可靠提供的名稱、地址與 24H 資訊，並加入電話及 Google Maps 導航。

- Popup 恢復圓角、陰影、標題與地址色塊，保留 24H 標籤。
- 不顯示缺乏可靠資料的營業中／休息中、評分及診療動物標籤。
- 有電話時提供 `tel:` 撥號；所有醫院提供以座標建立的 Google Maps directions 連結。
- 所有插入 Leaflet imperative HTML 的資料先 escape／encode，且外部導航使用安全新分頁屬性。
- 不改變 clustering、bounds 查詢、清單選取導覽或 list/map 分流。

## Ingest Revision: 保留 fallback 重試語意

附近醫院使用台北中心 fallback 的請求若失敗，現行 retry context 會保存已轉換的台北座標；重試時該座標被誤認為真實使用者定位，導致 fallback 提示消失並錯誤開放使用者距離語意。

- Hospital Store 的 nearby retry context 保存呼叫端原始 `location`、`locationError`、`radius` 與 `limit`。
- 台北中心座標只在建立當次 nearby API request 時套用，不寫回原始 retry context。
- fallback 重試後仍維持無真實定位、顯示台北中心提示並停用一般搜尋的距離排序。
- 不修改 hospitals API contract、location store 或定位 UI 流程。

## Ingest Revision: 定位取得後同步情境預設排序

初次以無定位狀態建立的清單篩選會把 `filters.sort` 設為 `name`；後續取得真實 GPS 時，現行流程只開放距離選項，沒有把仍屬情境預設的排序切換為 `distance`。因此使用者接著變更地區、診療動物或 24H 條件時，會送出名稱排序，與「有真實定位且無關鍵字時預設距離排序」的既有契約不一致。

- Hospital Store 在真實定位狀態由 false 轉為 true 時，若目前排序仍是系統情境預設且沒有 keyword，將排序同步切換為 `distance`。
- 使用者已明確選擇排序時，定位狀態變更不得覆寫該選擇。
- 後續 city、district、animal type 或 `is_24h` 查詢沿用更新後的排序；keyword 的 relevance 情境規則維持不變。
- 不修改後端排序 API、GPS location store、地圖查詢或 UI 樣式。
