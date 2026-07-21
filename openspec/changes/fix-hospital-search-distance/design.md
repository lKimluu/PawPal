## Context

醫院頁在取得真實定位後會把座標保存於 hospital store。關鍵字提交時，store 將排序改為 `relevance`，但清單 query 只有 `sort=distance` 才附帶座標；後端 `findHospitals` 也只有距離排序才建立距離欄位。因此卡片收到的 distance 為未知。

現有 query schema 已允許 `relevance` 搭配成對的 `lat`、`lng`，且已拒絕只提供其中一個座標。修正不需要新增 API 參數或資料庫欄位。

## Goals / Non-Goals

**Goals:**

- 真實定位存在時，關鍵字相關性搜尋也回傳並顯示醫院距離。
- 距離計算不改變 `relevance`、`name` 或 `distance` 的既有排序語意。
- 保留真實定位與台北市中心 fallback 的產品語意界線。

**Non-Goals:**

- 不改變關鍵字相關性權重或搜尋欄位。
- 不讓 fallback 座標啟用一般搜尋的距離顯示。
- 不修改 nearby endpoint、卡片文案、地圖行為或資料庫 schema。

## Decisions

### Separate distance projection from distance ordering

後端以是否收到完整 `lat`、`lng` 判斷是否在 SELECT 中計算 `distance_km`，以 `sort=distance` 判斷是否使用距離 ORDER BY。替代方案是把關鍵字搜尋改成距離排序，但會破壞既有相關性搜尋契約，因此不採用。

計算距離時沿用既有 Haversine SQL expression，避免清單搜尋與 nearby endpoint 出現不同距離公式。沒有完整座標時不選取 `distance_km`，維持既有 response shape 與「距離未知」呈現。

### Send coordinates whenever real location is available

前端清單 query 只要 `hasRealLocation` 為 true 且 `userCoordinates` 有效，就附帶成對座標，不再以 `sort` 決定是否附帶。`loadNearbyHospitals` 使用台北市中心 fallback 時仍保持 `hasRealLocation=false`，所以 fallback 不會流入後續一般搜尋。

### Preserve query parameter ordering and pagination

後端 count query 與 list query 必須共用正確的 filter parameter indices。距離 expression 使用前兩個座標參數；相關性排序的原始 keyword 參數接在 filter values 後，limit 與 offset 維持最後兩個參數。測試必須直接斷言 SQL placeholder 與 values 順序，避免新增座標後造成搜尋或分頁錯位。

## Implementation Contract

完成後，醫院清單 GET request 可在任何 sort 值下攜帶有效的 `lat`、`lng`。只要座標成對存在，成功 response 中具有座標的醫院就包含數值型 `distance_km`；沒有座標對時不回傳該欄位。

前端已取得真實定位後，關鍵字搜尋送出 `keyword`、`sort=relevance` 與真實 `lat`、`lng`。搜尋結果仍依既有名稱、城市、行政區相關性規則排序，醫院卡片則顯示正規化後的公里距離。使用者未取得真實定位，或只走台北市中心 fallback 時，一般搜尋不得附帶 fallback 座標，卡片維持「距離未知」。

實作必須維持 `sort=distance` 缺少座標時的 validation failure，以及任一 query 只提供 lat 或 lng 時的 validation failure。既有地區、動物種類、24H、分頁與 retry query 必須保留同一組真實座標。

驗收以 `src/test/hospitalApiIntegration.test.js` 驗證 store query context，以 `backend/test/hospitals.service.test.js` 驗證 relevance SQL 同時投影距離且不改變 ORDER BY，並執行前端相關 node tests、backend npm test 與根目錄 npm run build。

範圍只包含清單搜尋的距離投影與測試；不包含 nearby endpoint、地圖 marker、定位權限流程、fallback 文案或相關性演算法調整。

## Risks / Trade-offs

- [Risk] 相關性搜尋多執行距離運算，增加少量資料庫計算成本 → 僅在真實座標存在時投影目前分頁結果所需的距離，維持既有每頁上限。
- [Risk] SQL 參數加入座標後造成 keyword、limit、offset placeholder 錯位 → 以 relevance + coordinates + filters 的 mock SQL 測試鎖定完整 values 順序。
- [Risk] fallback 座標被誤當成真實位置 → 前端繼續以 `hasRealLocation` 作為唯一座標傳送條件，並加入 fallback 搜尋不帶座標的測試。
