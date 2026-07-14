## Why

首頁目前顯示寫死的醫院卡片，即使已取得使用者位置也無法提供真實的附近醫院資訊。既有附近醫院 API 與共享定位狀態已可支援此需求，現在可讓首頁摘要與完整搜尋頁使用一致資料；同時需確保完整搜尋清單的選取能可靠驅動地圖聚焦與資訊 popup。

## What Changes

- 首頁完成定位後呼叫附近醫院 API，以使用者位置顯示 5 公里內、最多 3 間且按距離排序的醫院摘要。
- 定位失敗或不可用時改用台北市中心座標，並在首頁清楚標示 fallback 依據。
- 桌機與手機卡片改用真實醫院名稱、行政區與一位小數距離，並提供載入、空結果與 API 錯誤狀態。
- 點擊摘要卡片時保留選取醫院並前往完整搜尋頁；「立即搜尋醫院」直接前往完整搜尋頁。
- 點擊完整搜尋清單中的醫院時，地圖移動至該醫院、縮放至至少 zoom 15 並開啟 marker popup；重複點擊同一醫院與 bounds 更新後仍須可靠執行。
- 修正地圖移動、cluster 顯示與 bounds 資料刷新之間的非同步競態，避免 popup callback 指向已被重建移除的 marker。
- 修正選取醫院仍位於 marker cluster 時，前一段 cluster 動畫未結束而使群組無法展開、popup callback 永遠不執行的問題。
- 對完全相同座標而需 spiderfy 的醫院，在 popup 開啟期間延後 bounds marker rebuild，避免 popup 被 `clearLayers` 移除後無法在折疊群組內恢復。
- 固定地圖建立時的初始中心，bounds API 回應只能更新 markers，不得因醫院平均座標改變而自動 `panTo`、重複查詢或造成視野位移。
- 選取醫院導頁只在最終程式化移動完成後查詢一次 bounds；重新定位成功則清除既有醫院選取並移至新位置一次，失敗時保留原視野與選取。
- 依產品決策暫時保留首頁卡片的「營業中」展示文案，但不得用於查詢、排序、篩選或推論真實即時營業狀態。

## Capabilities

### New Capabilities

- `home-hospital-summary`: 定義首頁附近醫院摘要的資料載入、顯示狀態與導頁行為。

### Modified Capabilities

- `hospital-gps-location`: 首頁完成定位後可使用共享位置呼叫附近醫院 API，不再維持 API-free 限制。
- `hospital-api-integration`: 完整搜尋頁須承接首頁選取醫院、可靠聚焦並開啟 marker popup，且即時營業狀態禁用規則需記錄首頁暫時展示文案的限定例外。

## Impact

- Affected specs: home-hospital-summary, hospital-gps-location, hospital-api-integration
- Affected code:
  - New: openspec/changes/connect-home-nearby-hospitals/specs/home-hospital-summary/spec.md
  - Modified: src/views/HomeView.vue, src/views/HospitalView.vue, src/components/hospital/MapView.vue, src/stores/hospital.js, src/utils/hospitalMapSelection.js, src/test/hospitalGpsView.test.js, src/test/hospitalApiIntegration.test.js, src/test/hospitalMapSelection.test.js
  - Removed: none
- API: 沿用 GET /api/v1/hospitals/nearby，不修改後端 endpoint 或資料庫 schema。
- Dependencies: 無新增套件或環境變數。
