## 1. 資料表結構

- [x] 1.1 建立 Hospital table stores official clinic records 所需的 hospitals schema：backend/database/schema/hospitals.sql 必須建立 license_number 唯一約束、官方基本欄位、nullable 的 latitude/longitude/is_24h/emergency_available、updated_at trigger 與查詢 index；以 psql 套用 schema 或 backend db setup 流程確認可建立資料表。
- [x] 1.2 讓本機資料庫重建流程包含 hospitals：backend/scripts/setup-db.js 必須在無外鍵依賴衝突下建立 hospitals，並以 npm run db:setup 或檢視 TABLES_IN_ORDER 的自動化測試確認 schema setup 會載入 hospitals.sql。

## 2. 匯入腳本

- [x] 2.1 實作 Import fetches all MOA pages 的分頁擷取：backend/database/scripts/import_hospitals.js 必須以 top=1000 和 skip 遞增呼叫農業部 UnitId=078，直到最後一頁筆數小於 top；以 backend/test/import_hospitals.test.js mock fetch 回傳 1000、1000、237 筆確認 skip 為 0、1000、2000 後停止。
- [x] 2.2 實作 Import transforms and cleans official fields 的正規化函式：匯入腳本必須把 字號、機構名稱、縣市、機構地址、機構電話、狀態 轉成英文欄位，trim、合併多餘空白、空字串轉 null，並從地址解析 district；以 backend/test/import_hospitals.test.js 驗證宜蘭市範例與無法解析 district 的範例。
- [x] 2.3 實作 Import includes only open licenses 的資料篩選：匯入流程必須只寫入 狀態 等於 開業 的資料，補發 或其他狀態不得 insert/update；以 backend/test/import_hospitals.test.js 驗證混合狀態來源只產生開業資料庫寫入。
- [x] 2.4 實作未知補充欄位不推測：正規化後的 latitude、longitude、is_24h、emergency_available 必須固定為 null，且匯入腳本不得呼叫 geocoding 或自行判斷 24H/急診；以 backend/test/import_hospitals.test.js 驗證輸出欄位為 null，並以內容檢視確認沒有新增 geocoding API key/env。

## 3. 寫入與驗證

- [x] 3.1 實作 Import is idempotent 的 upsert 寫入：匯入腳本必須使用 license_number 作為 ON CONFLICT 目標，重跑時更新官方基本欄位且不新增重複列；以 backend/test/import_hospitals.test.js mock pool.query 確認 SQL 含 ON CONFLICT (license_number) DO UPDATE 並傳入正規化欄位值。
- [x] 3.2 提供可執行的 CLI 匯入入口：node backend/database/scripts/import_hospitals.js 必須讀取既有 DB_* env、連線 PostgreSQL、輸出抓取/略過/寫入統計，並在失敗時以非 0 exit code 結束；以 mock 測試驗證核心流程，人工驗證命令可在 Supabase env 完整時執行。
- [x] 3.3 完成後端測試驗證：執行 cd backend && npm test 必須通過，並覆蓋 Hospital table stores official clinic records、Import fetches all MOA pages、Import transforms and cleans official fields、Import includes only open licenses、Import is idempotent 五個 requirement 對應情境。

## 4. Axios 請求一致化

- [x] 4.1 新增後端 axios dependency：backend/package.json 與 backend/package-lock.json 必須宣告 axios，讓 import_hospitals.js 可直接 import axios；以 npm install axios --save 與 npm test 驗證 dependency 可解析。
- [x] 4.2 將 Import fetches all MOA pages 的 HTTP client 改為 axios：backend/database/scripts/import_hospitals.js 必須以 axios.get(MOA_HOSPITALS_URL, { params }) 抓取農業部資料，params 必須包含 UnitId、$top、$skip，並保留分頁停止條件；以 backend/test/import_hospitals.test.js mock axiosClient.get 驗證 top=1000 時 skip 依序為 0、1000、2000。
- [x] 4.3 更新匯入測試為 axios-style mock：backend/test/import_hospitals.test.js 不得再使用 fetch response 的 ok/json 介面，必須使用 get(url, options) 回傳 { data }，並驗證非 array data 會丟出 MOA response must be an array。
- [x] 4.4 完成 axios 調整後驗證：執行 cd backend && npm test 必須通過，並確認既有欄位清理、只匯入開業、未知欄位 null、upsert 去重與 CLI 統計測試仍通過。

## 5. 匯入指令

- [x] 5.1 實作 Import exposes backend npm script：backend/package.json 必須新增 scripts.db:import:hospitals 為 node database/scripts/import_hospitals.js，且 db:setup 必須維持 node scripts/setup-db.js 不隱含呼叫 importHospitals；以 backend/test/import_hospitals.test.js 檢查 package scripts，並執行 cd backend && npm test 驗證。

## 6. 安全資料庫初始化與 seed 清除

- [x] 6.1 實作 Database setup preserves existing data：backend/scripts/setup-db.js 必須移除 DROP TABLE IF EXISTS ... CASCADE 與其他刪除既有資料的流程，保留 schema SQL 執行順序，只負責執行 schema 建立目前不存在的結構，且不得在 setup 中呼叫 importHospitals；以測試檢查 setup-db.js 不包含 DROP TABLE，db:setup script 仍為 node scripts/setup-db.js，並保留 SEED_DB=true 執行 seed SQL 的既有入口。
- [x] 6.2 實作 Enum creation is idempotent：backend/database/schema/calendar_events.sql 與 backend/database/schema/growth_records.sql 必須移除 DROP TYPE IF EXISTS ... CASCADE，改用可重複執行的 DO $$ BEGIN CREATE TYPE ...; EXCEPTION WHEN duplicate_object THEN NULL; END $$; 建立 ENUM；以測試檢查 schema 不包含 DROP TYPE ... CASCADE，且仍能在 enum 缺少時建立相依 table。
- [x] 6.3 確認所有 schema table 建立語句可重複執行：檢查 backend/database/schema/ 內 CREATE TABLE 皆使用 CREATE TABLE IF NOT EXISTS；若發現不符合者只調整 table 建立語句，不導入 migration framework、不修改既有欄位結構；以靜態測試覆蓋 schema SQL。
- [x] 6.4 最小化調整 seed SQL 以支援安全重複執行：先分析 backend/database/seeds/ 的 seed 識別條件，移除 medical_records.sql 的 TRUNCATE TABLE，並讓 calendar_events.sql、medical_records.sql、growth_records.sql 使用 seed user email、seed pet microchip_number 與既有欄位組合避免重複插入；不得改變 seed 測試資料意圖或影響 hospitals。
- [x] 6.5 實作 Seed data can be cleared explicitly：新增 backend/scripts/clear-seed.js，使用 transaction 依 child-before-parent 順序刪除 seed calendar_events、medical_records、growth_records、pets、users；刪除條件必須明確限定 seed emails 與 seed microchip_numbers，不得使用 DROP TABLE、TRUNCATE、無條件 DELETE FROM table，不得觸碰 hospitals，錯誤時 rollback、關閉 connection、輸出明確錯誤並以非 0 exit code 結束。
- [x] 6.6 新增 db:seed:clear 指令與測試：backend/package.json 必須新增 scripts.db:seed:clear 為 node scripts/clear-seed.js；backend 測試必須檢查 package script、setup-db.js 無 DROP TABLE、ENUM schema 無 DROP TYPE ... CASCADE、clear-seed.js 無 DROP TABLE/TRUNCATE/無條件 DELETE，並確認既有 hospitals import 測試與 package scripts 測試仍通過。
- [x] 6.7 完成安全初始化驗證：執行 cd backend && npm test 必須通過，並在回報中說明 db:setup 修改前後行為差異、每張 seed table 的識別條件、seed 刪除順序、是否依賴 ON DELETE CASCADE，以及是否仍存在可能造成資料遺失或重複執行失敗的 SQL。

## 7. 來源說明頁與官方 sample shape

- [x] 7.1 補強 Import fetches the full MOA dataset 的來源契約：backend/database/scripts/import_hospitals.js 必須能從常數或可測內容辨識資料集說明頁 `https://data.moa.gov.tw/open_detail.aspx?id=078` 與實際 JSON API `https://data.moa.gov.tw/Service/OpenData/DataFileService.aspx` 的差異；以 backend/test/import_hospitals.test.js 驗證資料集說明頁 URL 與 DataFileService API URL 都存在。
- [x] 7.2 補強 Import transforms and cleans official fields 的官方 sample shape 測試：backend/test/import_hospitals.test.js 必須使用含 `縣市`、`字號`、`執照類別`、`狀態`、`機構名稱`、`負責獸醫`、`機構電話`、`發照日期`、`機構地址` 的來源 row，驗證 normalizeHospitalRow 只輸出 hospitals 既有欄位，忽略 `執照類別`、`負責獸醫`、`發照日期`，且地址 `宜蘭縣羅東鎮中山路2段415號` 解析 district 為 `羅東鎮`。
- [x] 7.3 完成來源調整驗證：不得修改 backend/database/schema/hospitals.sql 新增 `license_type`、`responsible_vet`、`issued_date` 或其他來源補充欄位；執行 cd backend && npm test 必須通過，並確認 Import includes only open licenses、Import is idempotent、Import exposes backend npm script 與 seed/setup safety 測試仍通過。

## 8. 單次抓取 UnitId=078 資料

- [x] 8.1 實作 Import fetches the full MOA dataset 的單次擷取：backend/database/scripts/import_hospitals.js 必須移除 `$top` / `$skip` 分頁參數與分頁 loop，改為單次 axios GET DataFileService endpoint 且 params 只包含 UnitId "078"；以 backend/test/import_hospitals.test.js mock axiosClient.get 驗證只呼叫一次、params 不包含 `$top` 或 `$skip`，且 response data 不是 array 時仍丟出 MOA response must be an array。
- [x] 8.2 更新 importer 測試與公開 helper 使用：backend/test/import_hospitals.test.js 必須不再測試 fetchAllMoaHospitalRows 的分頁 skip 序列，改測單次 fetchMoaHospitalRows 或等效 helper；importHospitals 必須使用單次抓回的 source rows 繼續執行只匯入開業、欄位清理、upsert 統計；以 npm test 驗證既有匯入行為仍通過。
- [x] 8.3 完成單次來源驗證：執行 cd backend && npm test 必須通過，並以內容檢查確認 import_hospitals.js 不再包含 `$top`、`$skip`、DEFAULT_PAGE_SIZE、fetchMoaHospitalPage、fetchAllMoaHospitalRows 或 pagination fallback。
