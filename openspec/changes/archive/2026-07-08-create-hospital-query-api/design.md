## Context

PawPal 後端採 Express 分層架構：routes 定義路徑與 middleware，controllers 處理 request/response，services 處理資料查詢與商業邏輯，schemas 使用 Zod 驗證請求資料。既有資料庫已提供 hospitals 表，以及 animal_types 與 hospital_animal_types 關聯表；hospitals 表包含 latitude 與 longitude，可支援附近醫院距離查詢。

## Goals / Non-Goals

**Goals:**

- 提供 GET /api/v1/hospitals，支援 keyword、city、district、animal_type、page、limit。
- 提供 GET /api/v1/hospitals/nearby，支援 lat、lng、radius、limit、animal_type。
- nearby 查詢回傳 distance_km，並依距離由近至遠排序。
- 查詢參數驗證失敗回傳 HTTP 400 與 JSON message；資料查詢失敗回傳 HTTP 500 與 JSON message。
- 維持既有後端分層與繁體中文錯誤訊息風格。

**Non-Goals:**

- 不新增前端 API helper、清單 UI、地圖 UI 或 GPS 權限流程。
- 不變更醫院資料匯入、座標補齊或 geocoding 流程。
- 不變更 hospitals、animal_types 或 hospital_animal_types schema。
- 不新增醫院收藏、評分、營業時間或管理後台功能。

## Decisions

### 使用既有後端分層建立 hospitals API

新增 hospitals route、controller、service、schema。route 只掛 GET / 與 GET /nearby 並套用 query validation；controller 呼叫 service 並統一 response；service 使用 PostgreSQL 查詢資料；schema 使用 Zod coercion 驗證 query string。這延續現有後端模組責任，避免在 controller 撰寫 SQL 或在 route 放入查詢邏輯。

替代方案是直接在 controller 組 SQL。此方案較快，但會破壞專案分層規則，因此不採用。

### 使用 animal_types.slug 作為 API 篩選值

animal_type query 使用 animal_types.slug，例如 dog、cat、rabbit。service 在 animal_type 存在時 join hospital_animal_types 與 animal_types 篩選醫院，並在 response 中回傳每間醫院已知的 animal_types collection，讓呼叫端能顯示診療動物種類。

替代方案是讓 API 接 animal_types.id。此方案會暴露資料庫內部 id，前端也較難讀，因此不採用。

### keyword 作為前端單一搜尋欄的泛搜尋條件

keyword query 代表前端單一搜尋欄輸入，service 應以同一個 keyword 對 h.name、h.city、h.district、h.address 做 OR 模糊搜尋。city 與 district query 只代表明確篩選器，仍使用精準比對並與 keyword 條件以 AND 組合。前端不負責判斷 keyword 是醫院名稱、縣市、行政區或地址，也不把 keyword 自行轉成 district。

替代方案是在前端解析使用者輸入並轉成 city 或 district。此方案會讓欄位推論分散到前端，且需要前端維護地名規則，因此不採用。

### 使用 SQL 計算 nearby 距離與排序

nearby service 使用 Haversine 公式在 SQL 中以公里計算 distance_km，只查詢 latitude 與 longitude 皆非 NULL 的醫院，並以 distance_km ASC 排序。radius 預設 5 km、最大 50 km；limit 預設 20、最大 100。資料庫端計算可減少 Node.js 層載入不必要資料，也讓排序與半徑過濾在同一查詢完成。

替代方案是在 Node.js 讀出全部座標後計算距離。此方案會增加資料傳輸與記憶體成本，因此不採用。

### 沿用現有 JSON response 與錯誤格式

成功 response 不新增 data envelope。清單查詢回傳 hospitals 與 pagination；nearby 查詢回傳 hospitals。查詢參數錯誤回傳 HTTP 400 與 JSON message；未知查詢錯誤回傳 HTTP 500 與 JSON message。錯誤訊息使用繁體中文，符合既有 controller 風格。

替代方案是導入全域 response wrapper。此變更會影響既有 API contract，超出本 change 範圍，因此不採用。

### 將驗證後 query 存在可寫 request 欄位

Express 5 的 req.query 不是可靠可重新指定的欄位。query validation 成功後不得執行 req.query = result.data，改將 Zod parse 後的資料寫入 req.validated_query，hospitals controller 優先讀取 req.validated_query，沒有該欄位時才 fallback 到 req.query。body validation 維持現有 req.body 寫回行為，避免影響既有 POST/PATCH route。

替代方案是在 middleware 對 req.query 使用 Object.assign。此方案仍依賴 Express 5 query getter 回傳物件可被安全 mutate，且無法完整反映 Zod strip/coerce 後的 replacement semantics，因此不採用。

## Implementation Contract

GET /api/v1/hospitals 的 observable behavior 是呼叫端能取得分頁後的醫院清單。Query contract 為 keyword、city、district、animal_type、page、limit 皆 optional；keyword 以 OR 模糊搜尋 name、city、district、address；city 與 district 以精準篩選器作用；page 預設 1；limit 預設 20，最大 100。Response contract 為 HTTP 200 JSON，包含 hospitals array 與 pagination object；pagination 具備 page、limit、total、total_pages。

GET /api/v1/hospitals/nearby 的 observable behavior 是呼叫端能用 lat、lng 與 radius 查詢附近醫院。Query contract 為 lat 與 lng required；radius optional，預設 5、最大 50，單位 km；limit optional，預設 20、最大 100；animal_type optional。Response contract 為 HTTP 200 JSON，包含 hospitals array；每筆 nearby hospital 包含 distance_km，且 response 順序必須依 distance_km 由小到大。

Hospital object 至少回傳 id、name、city、district、address、phone、latitude、longitude、animal_types。nearby hospital 另回傳 distance_km。animal_types 使用 collection 表示已知診療動物種類，元素需包含 slug 與 name，並可包含 verification_status 與 source 以保留既有關聯表 metadata。

Failure contract 為 query validation 在 controller service 前執行；非法 page、limit、lat、lng、radius 或 animal_type 會回傳 HTTP 400 與 JSON message。service 發生非預期資料查詢錯誤時，controller 回傳 HTTP 500 與 JSON message。404 不用於空查詢結果；沒有符合條件時回傳 HTTP 200 與空 hospitals array。

Express 5 compatibility contract 為 validate middleware 在 target 為 query 時不得重新指定 req.query。成功驗證的 query 資料必須存在 req.validated_query，且 controller 必須將 req.validated_query 傳給 service。非法 query 仍回傳 HTTP 400 且不呼叫 controller/service。

Acceptance criteria 為 backend tests 覆蓋 schema validation、route mount、keyword 對 name/city/district/address 的 OR 搜尋、city/district 精準篩選、service filtering/pagination、nearby radius filtering、distance sorting、distance_km response，以及 controller 錯誤 response。完成後執行 cd backend && npm test。

Scope boundary 為只改後端 API 與後端測試；不得新增前端 helper、前端 UI、資料匯入流程、資料表 migration 或 geocoding 腳本。

## Risks / Trade-offs

- [Risk] Haversine SQL 在資料量增加時可能需要索引或 PostGIS 優化 → Mitigation: 本 change 先使用無新 dependency 的 SQL 計算；後續若有效能瓶頸再另開 change 評估 PostGIS 或 bounding box index。
- [Risk] animal_type 關聯資料可能不完整，篩選結果會只代表已知 treatment scope → Mitigation: response 回傳 animal_types metadata，且不把缺少關聯解讀為不支援該動物。
- [Risk] 不導入全域 response wrapper 會保留各 controller response 差異 → Mitigation: 本 change 沿用既有 API 風格，避免擴大 breaking change。
- [Risk] query validation 若直接寫回 Express 5 req.query 會在 middleware 階段拋出 TypeError → Mitigation: query validation 寫入 req.validated_query，controller 讀取該欄位。
- [Risk] keyword 泛搜尋可能回傳比名稱搜尋更多的結果 → Mitigation: city 與 district 保留精準篩選器，前端明確篩選時可縮小結果。

## Migration Plan

不需要資料庫 migration。部署時只需合併後端路由與測試。若需要回滾，移除 hospitals route 掛載與新增 backend hospitals 模組即可，不影響既有資料表或匯入資料。

## Open Questions

無。
