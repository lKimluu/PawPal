## Why

PawPal 目前的醫院地圖資料仍以靜態前端資料為主，缺少可由後端資料庫維護的官方獸醫診療機構來源。建立 hospitals 資料表並匯入農業部獸醫師（佐）開業執照資料，可以先完成可信賴的全台獸醫診療機構基本資料基礎。

## What Changes

- 新增 hospitals 資料表，用 license_number 作為農業部來源唯一識別，保存醫院名稱、縣市、行政區、地址、電話、執照狀態與未來補充用欄位。
- 新增後端匯入腳本，從農業部開放資料 UnitId=078 單次抓取完整 JSON array；此資料集 API 不使用 `$top` / `$skip` 分頁參數。
- 匯入來源以農業部資料集說明頁 `https://data.moa.gov.tw/open_detail.aspx?id=078` 為依據，實際 JSON API 維持使用該頁提供的 `DataFileService.aspx?UnitId=078`。
- 官方來源目前包含 `執照類別`、`負責獸醫`、`發照日期` 等欄位，但本次只匯入 hospitals 既有官方基本欄位，不新增資料表欄位。
- 匯入腳本的 HTTP 請求統一使用後端 axios dependency，透過 axios GET params 僅傳入 UnitId。
- 新增 backend npm script `db:import:hospitals`，讓官方醫院資料匯入成為明確手動批次任務，而不是 `db:setup` 的隱含副作用。
- 調整 `db:setup` 為可安全重複執行的 schema 初始化流程：只建立尚未存在的資料表與 ENUM 型別，不刪除、不清空、不覆蓋既有資料。
- 新增 backend npm script `db:seed:clear` 與清除腳本，使用明確的 seed 識別條件與 transaction 清除 seed 測試資料，不影響 hospitals 正式匯入資料或非 seed 資料。
- 匯入時只保留狀態為開業的資料，將農業部中文欄位轉換為資料庫英文欄位，並清理名稱、地址與電話字串。
- 匯入使用 license_number upsert，重複執行不會產生重複資料，且可更新既有官方基本資料。
- latitude、longitude、is_24h、emergency_available 先允許 NULL，代表尚未由可靠來源補充。

## Non-Goals (optional)

- 不新增前端醫院地圖串接或查詢頁面。
- 不新增 hospitals API endpoint。
- 不實作 geocoding，不串接第三方地理編碼服務，也不新增 API key 或相關環境變數。
- 不自行推測 24 小時營業或急診資訊。
- 不匯入狀態不是開業的農業部資料。
- 不保留 `$top` / `$skip` 分頁 fallback。
- 不新增 `license_type`、`responsible_vet`、`issued_date` 或其他來源補充欄位到 hospitals。
- 不導入 migration framework，不新增 db:reset，不在 `db:setup` 中自動執行 hospitals 匯入。
- 不使用 DROP TABLE 或 TRUNCATE 清除 seed，也不清除 hospitals 正式資料。

## Capabilities

### New Capabilities

- hospital-data-import: 建立官方獸醫診療機構資料表，並可從農業部開放資料分頁匯入、清理與去重資料。

### Modified Capabilities

- hospital-data-import: 後端資料庫初始化與 seed 清除流程需支援對既有 Supabase PostgreSQL 資料庫安全重複執行。

## Impact

- Affected specs: hospital-data-import
- Affected code:
  - New: backend/database/schema/hospitals.sql, backend/database/scripts/import_hospitals.js, backend/scripts/clear-seed.js, backend/test/import_hospitals.test.js
  - Modified: backend/scripts/setup-db.js, backend/package.json, backend/package-lock.json, backend/database/schema/calendar_events.sql, backend/database/schema/growth_records.sql, backend/database/seeds/calendar_events.sql, backend/database/seeds/medical_records.sql, backend/database/seeds/growth_records.sql, backend/database/scripts/import_hospitals.js, backend/test/import_hospitals.test.js
  - Removed: (none)
