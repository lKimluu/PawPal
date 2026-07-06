## Context

目前 hospitals 表已包含 address、latitude、longitude 與 updated_at，MOA 醫院基本資料匯入會寫入地址但座標欄位仍可能為 NULL。後續地圖 Marker、附近搜尋與距離計算需要座標，但 Geocoding 依賴外部 Google API，失敗或額度問題不應阻斷官方基本資料匯入。

## Goals / Non-Goals

**Goals:**

- 提供可手動執行、可重複執行的醫院地址 Geocoding 流程。
- 僅處理 latitude 或 longitude 缺少的 hospitals rows，避免重複消耗 Google Geocoding API 額度。
- 單筆地址一般失敗、查無結果或缺少地址時記錄該筆 id、name、address，並繼續處理後續醫院。
- Google Geocoding 回傳 REQUEST_DENIED 時立即停止整批，避免 API key、API 啟用狀態或來源限制錯誤造成大量無效請求。
- 保留既有 Geocoding 座標，避免 MOA 基本資料重匯入時清空 latitude 與 longitude。
- 將 backend 內重複的 PostgreSQL Pool 建立設定集中到單一 helper，避免 runtime 與 scripts 連線設定分歧。

**Non-Goals:**

- 不在 db:setup、db:setup:seed 或 db:import:hospitals 中自動執行 Geocoding。
- 不新增前端地圖、距離排序或附近搜尋功能。
- 不新增資料庫欄位或座標來源歷史紀錄。
- 不調整既有 DB env var 名稱、連線參數或 Supabase SSL 設定。

## Decisions

### Use a separate database script for hospital geocoding

新增 backend/database/scripts/geocode_hospitals.js，與 backend/database/scripts/import_hospitals.js 同層，維持資料庫資料處理腳本的位置與 snake_case 命名。替代方案是放在 backend/scripts/geocode-hospitals.js，但該位置目前偏向資料庫 setup/seed 管理，且 hyphen 命名不符合後端檔名規範。

### Process only hospitals missing complete coordinates

查詢條件固定為 latitude IS NULL OR longitude IS NULL，讓腳本重複執行時自然跳過已有完整座標的醫院。這比加入額外 processed flag 更簡單，也符合現有 schema 不新增欄位的限制。

### Treat per-row geocoding failures as recoverable except REQUEST_DENIED

Google Geocoding API 的 ZERO_RESULTS、缺少 geometry location、缺少 address 與一般單筆網路/API 錯誤不丟出中斷整批流程的錯誤。REQUEST_DENIED 代表 API key、API 啟用狀態、計費或來源限制等整批設定問題，腳本必須記錄當前醫院後停止整批並讓 main 回傳非零退出碼。替代方案是把 REQUEST_DENIED 視為一般單筆失敗繼續處理，但這會對後續數千筆地址重複發出注定失敗的請求。

### Preserve geocoded coordinates during MOA import upsert

調整 import_hospitals.js 的 upsert 更新語意：MOA 基本資料可更新 name、city、district、address、phone、license_status、is_24h、emergency_available，但不應把既有 latitude 與 longitude 覆蓋成 NULL。替代方案是不修改 importer，但這會讓下一次官方資料匯入清掉 Geocoding 成果，違反流程分離的實際目的。

### Share PostgreSQL pool construction across backend runtime and scripts

新增 backend/src/config/create_pool.js，集中 createPoolFromEnv(env = process.env) 與 Supabase Pool options。backend/src/config/db.js、backend/scripts/setup-db.js、backend/scripts/clear-seed.js、backend/database/scripts/import_hospitals.js、backend/database/scripts/geocode_hospitals.js 都改用這個 helper。替代方案是只在新 Geocoding 腳本內複製現有設定，但目前同一段 new Pool 設定已散落多處，繼續複製會讓 SSL 與 env mapping 更容易分歧。

## Implementation Contract

- Operator interface: backend/package.json SHALL expose db:geocode:hospitals, which runs node database/scripts/geocode_hospitals.js from the backend package context.
- Environment interface: backend/.env.example SHALL document GOOGLE_GEOCODING_API_KEY alongside existing database settings. The script SHALL fail the whole command before processing rows when the key is absent.
- Database read contract: the script SHALL query id, name, address from hospitals where latitude IS NULL OR longitude IS NULL and order by id for deterministic processing.
- Google API contract: geocodeAddress(address) SHALL call Google Geocoding API with address and key params using axios. It SHALL return numeric latitude and longitude from the first result when status is OK and geometry.location exists; it SHALL return null for ZERO_RESULTS or an OK response without a usable result; it SHALL throw a distinguishable REQUEST_DENIED error when Google returns REQUEST_DENIED.
- Database write contract: updateHospitalCoordinates(pool, hospitalId, coordinates) SHALL update latitude, longitude, and updated_at for that id only after a usable coordinate pair is available.
- Logging contract: every skipped or failed row SHALL log id, name, and address. REQUEST_DENIED SHALL log the current hospital id, name, address, and Google error message before the batch aborts. Completed batches SHALL log processed, updated, skipped, failed, and total counts.
- Import preservation contract: import_hospitals.js SHALL preserve existing latitude and longitude during ON CONFLICT updates instead of writing the normalized NULL enrichment values over previously geocoded coordinates.
- Pool config contract: createPoolFromEnv(env = process.env) SHALL construct a pg Pool with DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, and ssl.rejectUnauthorized false. Existing script-level createPoolFromEnv exports SHALL remain available by re-exporting or wrapping the shared helper.
- Acceptance criteria: backend node tests SHALL cover successful coordinate update, ZERO_RESULTS without update, per-row API failure continuation, REQUEST_DENIED fail-fast behavior, missing address skip, missing API key failure, package script wiring, env example documentation, import upsert coordinate preservation, shared Pool config options, and runtime/script usage of the shared helper.

## Risks / Trade-offs

- [Risk] Google API quota or network errors can leave part of the dataset without coordinates → Mitigation: failures are logged per hospital and the script remains idempotent, so operators can rerun after fixing quota or network issues.
- [Risk] REQUEST_DENIED can otherwise generate thousands of doomed requests → Mitigation: classify REQUEST_DENIED as a batch-level failure and abort immediately after logging the current hospital.
- [Risk] Address ambiguity can return an imprecise first result → Mitigation: this change records Google’s first result only and leaves manual correction or validation out of scope for a later enhancement.
- [Risk] Updating updated_at manually duplicates the existing trigger behavior → Mitigation: the SQL explicitly sets updated_at to satisfy the requirement, and the trigger remains compatible.
- [Risk] Refactoring setup-db pool creation can affect database setup command behavior → Mitigation: preserve the same Pool options and verify backend node tests plus manual script wiring checks.
