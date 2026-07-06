## 1. Geocoding 腳本與查詢流程

- [x] 1.1 依照 Use a separate database script for hospital geocoding 建立 backend/database/scripts/geocode_hospitals.js，匯出 fetchHospitalsMissingCoordinates、geocodeAddress、updateHospitalCoordinates、geocodeHospitals、createPoolFromEnv，並以 backend/test/geocode_hospitals.test.js import 檢查可測試介面。
- [x] 1.2 完成 Process only hospitals missing complete coordinates 與 Geocoding script processes hospitals missing coordinates：fetchHospitalsMissingCoordinates 只查詢 latitude IS NULL OR longitude IS NULL 的 hospitals id、name、address 並依 id 排序；用 node --test 驗證 SQL 與已有完整座標的 rows 不會進入 Google API 呼叫。
- [x] 1.3 完成 Geocoding uses Google API with configured key：缺少 GOOGLE_GEOCODING_API_KEY 時命令在查詢資料庫前失敗，geocodeAddress 使用 axios 呼叫 Google Geocoding API 並解析 results[0].geometry.location.lat/lng；用 node --test 覆蓋缺 key 與 OK 回應解析。

## 2. 座標更新與失敗不中斷

- [x] 2.1 完成 Geocoding updates only rows with usable coordinates：有可用座標時 updateHospitalCoordinates 只更新該 hospital id 的 latitude、longitude、updated_at；ZERO_RESULTS 或缺少 usable location 時不更新且座標維持 NULL；用 node --test 驗證成功更新與無結果不更新。
- [x] 2.2 完成 Treat per-row geocoding failures as recoverable 與 Geocoding continues after per-row failures：單筆 API error、非 OK 狀態、缺少地址或空白地址都記錄 id、name、address 並繼續下一筆；用 node --test 驗證第一筆失敗時第二筆仍會處理。
- [x] 2.3 geocodeHospitals 回傳並記錄 total、processed、updated、skipped、failed 統計，main 在整體流程錯誤時設定非零 exit code；用 node --test 驗證 summary counts，並以程式碼檢查 main 只在直接執行腳本時啟動。

## 3. 指令、環境與基本匯入保護

- [x] 3.1 完成 Geocoding command is explicit and documented：backend/package.json 新增 db:geocode:hospitals 執行 node database/scripts/geocode_hospitals.js，backend/.env.example 新增 GOOGLE_GEOCODING_API_KEY；用 node --test 驗證 script 與 env example 內容。
- [x] 3.2 完成 Preserve geocoded coordinates during MOA import upsert 與 Import is idempotent：import_hospitals.js 的 ON CONFLICT 更新保留既有 latitude 與 longitude，不把 normalized NULL 座標覆蓋已存在座標；用 backend/test/import_hospitals.test.js 驗證 Repeated import preserves geocoded coordinates。

## 4. 驗證與交付

- [x] 4.1 執行 cd backend && npm test，確認 geocode_hospitals 與 import_hospitals 相關測試全部通過。
- [x] 4.2 執行 npm run build，確認前端建置未受後端腳本與 env example 變更影響。
- [x] 4.3 在實作分支 feat/geocode-hospital-addresses 上完成變更，人工確認 db:geocode:hospitals 不會被 db:setup、db:setup:seed 或 db:import:hospitals 隱含執行。

## 5. PostgreSQL Pool 共用設定

- [x] 5.1 完成 Share PostgreSQL pool construction across backend runtime and scripts 與 Backend uses shared PostgreSQL pool configuration：新增 backend/src/config/create_pool.js 並匯出 createPoolFromEnv(env = process.env)，產生包含 DB_USER、DB_PASSWORD、DB_HOST、DB_PORT、DB_NAME 與 ssl.rejectUnauthorized false 的 pg Pool；用 backend node test 驗證 helper 依傳入 env 建立相同 Pool options。
- [x] 5.2 完成 Runtime database config uses shared pool helper：backend/src/config/db.js 的 exported pool 由 createPoolFromEnv() 建立且保持既有 import 介面；用 backend node test 或靜態 import 檢查確認 runtime db config 不再直接 new Pool。
- [x] 5.3 完成 Database scripts use shared pool helper：backend/scripts/setup-db.js、backend/scripts/clear-seed.js、backend/database/scripts/import_hospitals.js、backend/database/scripts/geocode_hospitals.js 都改用共用 createPoolFromEnv，且既有 script-level createPoolFromEnv export 仍可被 tests import；用 backend node test 驗證各腳本不再保有重複 Pool options。

## 6. 重構驗證

- [x] 6.1 執行 cd backend && npm test，確認 shared Pool helper、setup-db、clear-seed、hospital import 與 hospital geocoding 測試全部通過。
- [x] 6.2 執行 npm run build，確認 backend Pool helper refactor 未影響前端建置。

## 7. REQUEST_DENIED 批次中止

- [x] 7.1 完成 Treat per-row geocoding failures as recoverable except REQUEST_DENIED 與 Geocoding stops on REQUEST_DENIED：讓 geocodeAddress 在 Google status REQUEST_DENIED 時丟出可辨識的 batch-level error，錯誤訊息包含 REQUEST_DENIED 與 Google error_message；用 backend node test 驗證該狀態不會被當成一般單筆失敗。
- [x] 7.2 完成 REQUEST_DENIED aborts remaining requests：geocodeHospitals 收到 REQUEST_DENIED error 時記錄當前 hospital id、name、address 與 Google error message 後向上拋錯，停止後續 selected hospitals 的 Google API request；用 backend node test 驗證兩筆資料時只呼叫一次 Google API、沒有後續 update query，並以 assert.rejects 驗證批次失敗。
- [x] 7.3 完成 Prior successful updates remain before REQUEST_DENIED abort：若前一筆已成功更新，下一筆 REQUEST_DENIED 時保留已完成更新並停止第三筆；用 backend node test 驗證第一筆 update 已發生、第三筆未呼叫 Google API。
- [x] 7.4 執行 cd backend && npm test 與 npm run build，確認 REQUEST_DENIED fail-fast 行為與既有 ZERO_RESULTS、一般單筆 error continuation、shared Pool helper 測試全部通過。
