## Why

醫院資料已包含地址，但 `latitude` 與 `longitude` 仍為空，後續 Leaflet Marker、附近醫院搜尋與距離計算都需要可重複產生的座標資料。Geocoding 應與官方基本資料匯入分離，避免座標轉換失敗影響 MOA 醫院資料匯入。

## What Changes

- 新增獨立醫院地址 Geocoding 腳本，查詢缺少完整座標的 hospitals rows，使用 Google Geocoding API 將 address 轉換為 latitude 與 longitude。
- Geocoding 成功時更新對應 hospitals row 的 latitude、longitude、updated_at；查無結果、缺少地址或一般單筆查詢失敗時記錄 id、name、address 並繼續處理下一筆。
- Google Geocoding 回傳 REQUEST_DENIED 時視為整批設定或權限錯誤，記錄當前醫院與 Google error message 後立即停止批次，避免持續發出大量注定失敗的請求。
- 新增後端 npm 指令與 Google Geocoding API key 環境變數範例，讓座標補齊可明確手動執行且可重複執行。
- 調整既有醫院基本資料匯入行為，避免重新匯入 MOA 基本資料時把已由 Geocoding 寫入的座標覆蓋為 NULL。
- 新增 backend 共用 PostgreSQL Pool 建立 helper，讓 runtime、setup、seed cleanup、醫院匯入與 Geocoding 腳本使用同一組 Supabase 連線設定。

## Non-Goals

- 不新增前端 Leaflet 地圖、Marker 顯示、附近搜尋或距離計算 UI。
- 不將 Geocoding 併入 db:setup 或 MOA 醫院基本資料匯入流程。
- 不新增資料庫欄位；沿用既有 hospitals.latitude 與 hospitals.longitude。
- 不變更既有 DB env var 名稱或 Supabase SSL 行為。

## Capabilities

### New Capabilities

- `hospital-geocoding`: 醫院地址座標補齊流程，涵蓋缺座標查詢、Google Geocoding、座標更新、失敗不中斷與可重複執行。
- `backend-db-pool-config`: backend runtime 與資料庫 scripts 共用 PostgreSQL Pool 建立設定。

### Modified Capabilities

- `hospital-data-import`: 醫院基本資料匯入不得覆蓋既有 Geocoding 座標。

## Impact

- Affected specs: hospital-geocoding, hospital-data-import, backend-db-pool-config
- Affected code:
  - New: backend/src/config/create_pool.js
  - New: backend/database/scripts/geocode_hospitals.js
  - Modified: backend/src/config/db.js
  - Modified: backend/scripts/setup-db.js
  - Modified: backend/scripts/clear-seed.js
  - Modified: backend/database/scripts/import_hospitals.js
  - Modified: backend/package.json
  - Modified: backend/.env.example
  - Modified: backend/test/import_hospitals.test.js
  - New: backend/test/geocode_hospitals.test.js
  - Removed: none
