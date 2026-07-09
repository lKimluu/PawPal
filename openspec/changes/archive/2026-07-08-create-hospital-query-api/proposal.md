## Why

目前資料庫已具備醫院基本資料、座標欄位與診療動物種類關聯資料，但後端尚未提供可供前端清單與地圖使用的醫院查詢 API。需要建立後端查詢能力，讓使用者可以搜尋、篩選醫院，並依自身 GPS 座標取得附近醫院與距離資訊。

## What Changes

- 新增 GET /api/v1/hospitals，提供醫院清單查詢、名稱/縣市/行政區/地址關鍵字搜尋、縣市篩選、行政區篩選、診療動物種類篩選與分頁。
- 新增 GET /api/v1/hospitals/nearby，依前端傳入的 lat、lng、radius 查詢附近醫院，計算使用者座標與醫院座標距離，並依距離由近至遠排序。
- 新增 hospitals route、controller、service 與 Zod query schema，維持既有後端分層。
- 查詢成功時回傳統一的 hospitals payload；清單查詢另回傳 pagination；附近醫院查詢回傳 distance_km。
- 查詢參數錯誤時回傳 400 與繁體中文 message；資料查詢失敗時回傳 500 與繁體中文 message。
- 修正 Express 5 下 query validation 不可重新指定 req.query 的問題，避免合法查詢在 middleware 階段變成 500。
- 調整 keyword 為前端單一搜尋欄的泛搜尋條件；前端不需要判斷使用者輸入是醫院名稱、縣市、行政區或地址。

## Non-Goals

- 不實作前端 API helper、醫院清單 UI、地圖 UI 或前端 GPS 權限流程。
- 不新增或修改醫院資料匯入、座標補齊、geocoding 流程。
- 不實作醫院收藏、評分、營業時間或後台管理功能。
- 不改變既有 hospital-data-import 或 hospital-animal-types 的資料表需求。

## Capabilities

### New Capabilities

- hospital-query-api: 提供醫院清單搜尋、條件篩選、分頁與附近醫院距離查詢 API。

### Modified Capabilities

(none)

## Impact

- Affected specs: hospital-query-api
- Affected APIs:
  - GET /api/v1/hospitals
  - GET /api/v1/hospitals/nearby
- Affected code:
  - New: backend/src/routes/hospitals.route.js
  - New: backend/src/controllers/hospitals.controller.js
  - New: backend/src/services/hospitals.service.js
  - New: backend/src/schemas/hospitals.schema.js
  - New: backend/test/hospitals.route.test.js
  - New: backend/test/hospitals.schema.test.js
  - New: backend/test/hospitals.service.test.js
  - Modified: backend/src/app.js
  - Removed: none
