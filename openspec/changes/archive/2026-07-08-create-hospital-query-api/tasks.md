## 1. Schema 與路由骨架

- [x] 1.1 建立 hospitals query Zod schema，交付 Hospitals list API supports search filters and pagination 的 page 預設 1、limit 預設 20、limit 最大 100、keyword/city/district/animal_type trim/coerce contract；以 backend/test/hospitals.schema.test.js 驗證合法與非法 query。
- [x] 1.2 建立 nearby query Zod schema，交付 Nearby hospitals API supports radius search and distance ordering 的 lat/lng required、lat 範圍 -90 到 90、lng 範圍 -180 到 180、radius 預設 5 且最大 50、limit 最大 100 contract；以 backend/test/hospitals.schema.test.js 驗證缺少與越界 query 回傳 validation error。
- [x] 1.3 使用既有後端分層建立 hospitals API：新增 hospitals route 並掛載 GET / 與 GET /nearby 到 backend/src/app.js 的 /api/v1/hospitals，route 只負責 validation 與 controller wiring；以 backend/test/hospitals.route.test.js 驗證 route 結構與 app 掛載點。

## 2. 清單查詢 API

- [x] 2.1 使用 animal_types.slug 作為 API 篩選值：在 hospitals service 實作 GET /api/v1/hospitals 清單查詢，交付 keyword、city、district、animal_type 條件會正確限制 hospitals 結果且每筆 hospital 回傳 animal_types collection；以 backend/test/hospitals.service.test.js 驗證篩選條件與 animal_types shape。
- [x] 2.2 實作清單分頁 contract，GET /api/v1/hospitals 回傳 hospitals array 與 pagination.page、pagination.limit、pagination.total、pagination.total_pages，且空結果回傳 HTTP 200 與空 hospitals array；以 service 測試與 controller 測試驗證 response shape。

## 3. 附近醫院 API

- [x] 3.1 使用 SQL 計算 nearby 距離與排序：在 hospitals service 實作 GET /api/v1/hospitals/nearby 的 Haversine distance_km 計算、排除無座標醫院、套用 radius 半徑、依 distance_km ASC 排序；以 backend/test/hospitals.service.test.js 驗證半徑過濾、排序與 distance_km。
- [x] 3.2 實作 nearby 的 animal_type 篩選，交付 Nearby hospitals API supports radius search and distance ordering 與 animal_type slug 條件可同時作用，且只回傳指定診療動物種類的附近醫院；以 backend/test/hospitals.service.test.js 驗證 slug 篩選不會回傳未關聯醫院。

## 4. Controller Response 與錯誤處理

- [x] 4.1 沿用現有 JSON response 與錯誤格式：controller 成功時清單查詢回傳 { hospitals, pagination }、nearby 查詢回傳 { hospitals }，不加入 data envelope；以 backend controller 或 route 測試驗證 HTTP 200 response body。
- [x] 4.2 交付 Hospital query APIs validate query parameters consistently：validation 錯誤回傳 HTTP 400 與繁體中文 message，且不呼叫 service；service 非預期錯誤回傳 HTTP 500 與繁體中文 message；以 controller 或 route 測試驗證 400/500 response。

## 5. 驗證與範圍檢查

- [x] 5.1 執行 cd backend && npm test，驗證新增與既有後端測試全部通過，並在結果中確認 hospitals schema、route、service/controller 測試皆被執行。
- [x] 5.2 依 design scope boundary 做內容檢查，確認此 change 未新增前端 helper、前端 UI、資料匯入流程、資料表 migration 或 geocoding 腳本；以 git diff --stat 與人工檢查驗證只包含後端 API、後端測試與 Spectra artifacts。

## 6. Express 5 Query Validation 修正

- [x] 6.1 依「將驗證後 query 存在可寫 request 欄位」決策修正 query validation 寫回策略，target 為 query 時將 Zod parse 結果寫入 req.validated_query 且不得重新指定 req.query；以 backend/test/hospitals.route.test.js 的 getter-only req.query 成功 validation 測試驗證不會拋 TypeError。
- [x] 6.2 調整 hospitals controller 使用 req.validated_query 優先呼叫 service，沒有 req.validated_query 時 fallback req.query；以 backend/test/hospitals.controller.test.js 驗證 service 收到 parsed query。
- [x] 6.3 執行 cd backend && node --test test/hospitals*.test.js、cd backend && npm test、spectra validate create-hospital-query-api、spectra analyze create-hospital-query-api --json，驗證 bugfix 與 artifacts 一致。

## 7. Keyword 泛搜尋調整

- [x] 7.1 依「keyword 作為前端單一搜尋欄的泛搜尋條件」決策調整 hospitals service，keyword 應以同一參數 OR 模糊搜尋 h.name、h.city、h.district、h.address，並與 city/district 精準篩選器以 AND 組合；以 backend/test/hospitals.service.test.js 驗證 SQL 條件包含四個欄位。
- [x] 7.2 補強 keyword 搜尋測試，驗證 keyword "大安" 可命中 district "大安區"，keyword "仁愛路" 可命中 address，且前端不需將 keyword 推論成 district；以 backend/test/hospitals.service.test.js 驗證結果 mapping 與分頁仍正確。
- [x] 7.3 執行 cd backend && node --test test/hospitals*.test.js、cd backend && npm test、spectra validate create-hospital-query-api、spectra analyze create-hospital-query-api --json，驗證 keyword contract 與 artifacts 一致。
