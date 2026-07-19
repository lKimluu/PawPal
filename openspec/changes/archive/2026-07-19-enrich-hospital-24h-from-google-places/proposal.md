## Why

PawPal 已有農業部合法動物醫院主檔與 `is_24h` 查詢欄位，但目前沒有可重跑、可追蹤來源的 Google Places 補強流程，無法安全地把台北市、新北市與基隆市整週 24 小時營業資訊寫回資料庫。這項補強需要保留官方醫院身分、避免錯誤配對，並讓未確認或 API 失敗的資料維持原狀。

## What Changes

- 新增 Google Places 24 小時營業補強批次指令，搜尋範圍固定為台北市、新北市與基隆市。
- 只接受營業狀態為正常，且 Google `regularOpeningHours` 明確表示每週七天皆為 24 小時營業的動物醫院候選資料。
- 以同縣市的正規化電話做唯一安全配對；無電話、找不到唯一醫院或跨縣市的候選資料只列入統計，不寫入資料庫。
- 將成功配對的 Google Place ID、24 小時狀態來源與最後確認時間保存到既有 `hospitals` 資料表，並把 `is_24h` 更新為 `true`。
- 對已保存 Google Place ID 的醫院使用 Place Details 重新確認營業時間；只有取得明確完整時段時才更新 `is_24h`，API 錯誤或缺少時段不得覆蓋既有值。
- 將非 canonical 且缺少 `close` 的 period 視為不完整資料並保留既有 `is_24h`；只有單一星期日 00:00 open 且沒有 close 的 Google canonical 結構可由缺少 `close` 判定為 24 小時營業。
- 接受 Google protobuf JSON 合法省略空值或 optional 欄位：Text Search 未提供 `places` 時視為零筆候選，Place Details 未提供 `businessStatus` 時視為無法判定並保留既有補強值，不得中止整批處理。
- 調整農業部醫院匯入的 upsert，重跑官方基本資料時不得把既有 Google Place ID、`is_24h`、來源或最後確認時間覆蓋為 NULL。
- 批次指令預設 dry-run；只有明確傳入 `--write` 才能在 transaction 中寫入，重複執行不得建立重複醫院或重複 Place ID。
- 新增環境變數範例、後端 npm 指令、資料庫 schema 調整及自動化測試；不在測試中呼叫真實 Google API。

## Capabilities

### New Capabilities

- `hospital-24h-enrichment`: 定義 Google Places 候選搜尋、整週 24 小時判定、安全配對、重新驗證、dry-run 與資料庫寫入行為。

### Modified Capabilities

- `hospital-data-import`: 擴充 hospitals 資料表，使官方醫院主檔可保存 nullable 且具唯一性的 Google Place ID，以及 24 小時資料來源與最後確認時間。

## Impact

- Affected specs: hospital-24h-enrichment, hospital-data-import
- Affected code:
  - New: backend/database/scripts/enrich_hospital_24h.js, backend/test/enrich_hospital_24h.test.js
  - Modified: backend/database/schema/hospitals.sql, backend/database/scripts/import_hospitals.js, backend/scripts/setup-db.js, backend/package.json, backend/.env.example, backend/test/import_hospitals.test.js
  - Removed: (none)
- External system: Google Places API (New), PostgreSQL
- API and UI: existing hospital query API and frontend 24H filter remain backward compatible
