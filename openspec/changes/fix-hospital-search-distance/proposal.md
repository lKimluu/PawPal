## Problem

使用者已取得真實定位後，關鍵字搜尋醫院仍顯示「距離未知」。搜尋結果雖正確依相關性排序，但前端未傳送座標，後端也未計算 `distance_km`。

## Root Cause

前端將關鍵字搜尋的排序切換為 `relevance`，而目前只有 `sort=distance` 才附帶 `lat`、`lng`。後端同樣把距離計算綁定於距離排序，因此相關性搜尋無法取得距離資訊。

## Proposed Solution

- 將「計算距離」與「使用距離排序」解耦。
- 前端持有真實定位時，所有醫院清單查詢皆附帶成對的 `lat`、`lng`，包含關鍵字相關性搜尋。
- 後端收到有效座標對時回傳 `distance_km`，但只有 `sort=distance` 才依距離排序；`sort=relevance` 維持既有相關性順序。
- 未取得真實定位時不傳 fallback 座標，卡片維持「距離未知」。

## Success Criteria

- 已取得真實定位的關鍵字搜尋結果顯示距離，並維持相關性排序。
- 未取得真實定位的搜尋不顯示偽裝成使用者距離的 fallback 距離。
- 距離排序、分頁、地區、24H 與診療動物篩選維持既有行為。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `hospital-api-integration`: 有真實定位時，相關性搜尋請求也攜帶座標並顯示距離，但不改變相關性排序。
- `hospital-query-api`: 醫院清單 API 在收到有效座標對時獨立計算 `distance_km`，排序仍由 `sort` 決定。

## Impact

- Affected specs: hospital-api-integration, hospital-query-api
- Affected code:
  - Modified: `src/stores/hospital.js`, `backend/src/services/hospitals.service.js`, `src/test/hospitalApiIntegration.test.js`, `backend/test/hospitals.service.test.js`
  - New: (none)
  - Removed: (none)
