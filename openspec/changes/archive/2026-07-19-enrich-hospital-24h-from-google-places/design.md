## Context

PawPal 的 `hospitals` 以農業部 UnitId=078 的 `license_number` 作為官方主檔唯一身分，並已有 nullable `is_24h` 欄位供查詢 API 與前端篩選使用。現有農業部 importer 會在 upsert 時把 `is_24h` 與 `emergency_available` 更新成來源列的 NULL，因此任何外部補強都可能在下一次官方匯入時遺失。既有 geocoding script 已提供後端批次指令、共享 PostgreSQL pool、axios 注入測試與統計輸出的可沿用模式。

Google Places Text Search 會回傳搜尋範圍外的相關結果，因此搜尋字串中的縣市不能視為資料邊界。Google Places 的營業時間也可能缺少、暫時不可用或不再是全天營業；即使 period 的 `open` 合法，非 canonical period 仍可能省略 `close` 而形成不完整資料，資料庫只能在取得明確結構時更新狀態。Google protobuf JSON 會省略空的 repeated 欄位與未設定的 optional 欄位，因此 Text Search 的 `{}` 與缺少 `businessStatus` 的 Place Details 都可能是合法成功回應，不能與 malformed response 混為一談。

## Goals / Non-Goals

**Goals:**

- 以可測試、可重跑的批次流程，補強台北市、新北市與基隆市官方醫院主檔的整週 24 小時營業狀態。
- 以 Google Place ID 追蹤已配對地點，並保存補強來源與最後成功確認時間。
- 用保守且唯一的配對規則避免把 Google 地點寫到錯誤的官方醫院。
- 預設 dry-run，只有操作員明確選擇寫入時才修改資料庫。
- 確保農業部基本資料重跑不會清除外部補強欄位。

**Non-Goals:**

- 不擴大到台北市、新北市、基隆市以外的縣市。
- 不區分一般營業、急診、夜間駐診、住院照護或需預約服務。
- 不新增後端 HTTP endpoint、排程器、管理介面或前端元件。
- 不使用名稱模糊比對、地址模糊比對或自動合併無電話資料。
- 不保存 Google 顯示名稱、地址、電話、完整營業時段或搜尋結果快照。
- 不把搜尋結果缺席解讀為 `is_24h = false`。

## Decisions

### Extend hospitals with idempotent Google enrichment metadata

在 `hospitals` 新增 nullable `google_place_id VARCHAR(255)`、`is_24h_source VARCHAR(50)` 與 `is_24h_checked_at TIMESTAMPTZ`。使用 partial unique index 限制非 NULL `google_place_id` 唯一，避免同一 Google 地點連到兩筆官方醫院；`is_24h_source` 僅在本流程成功更新時寫入 `google_places`。

既有資料庫不會因 `CREATE TABLE IF NOT EXISTS` 自動取得新欄位，因此 schema 必須使用 `ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS`，並以 `CREATE UNIQUE INDEX IF NOT EXISTS` 建立可重跑的唯一索引。替代方案是建立獨立外部來源表，但目前只有單一 Google Place 對單一官方醫院且查詢只需要 `is_24h`，額外 join 與生命週期管理沒有帶來足夠價值。

### Preserve enrichment during MOA upsert

農業部 importer 對新醫院仍插入 NULL enrichment 欄位，但 conflict update 只更新官方基本欄位，不更新 latitude、longitude、is_24h、emergency_available、google_place_id、is_24h_source 或 is_24h_checked_at。替代方案是使用 `COALESCE`，但省略 enrichment 欄位的 update 更直接地表達來源所有權，並避免未來官方來源新增同名空值時誤覆蓋。

### Discover and refresh Google Places in two phases

批次流程先讀取目標三市的官方醫院與已連結 Google Place ID。Discovery 對每個城市呼叫 Places Text Search (New)，使用 `veterinary_care`、strict type filtering、繁體中文、台灣 region code、必要 field mask 與所有回傳的 page token。結果依 Place ID 去重後，只有 `businessStatus = OPERATIONAL` 且 `regularOpeningHours.periods` 為單一星期日 00:00 open、沒有 close 的 Google canonical always-open 結構才成為新候選。Text Search 成功回應若省略空的 `places` repeated 欄位，流程將其正規化為 `[]`，視為該頁沒有候選並繼續處理其餘城市；只有 `places` 存在但不是陣列等不合法型別才屬 response shape 錯誤。

Refresh 對已保存的 Google Place ID 呼叫 Place Details。Details 驗證要求回應 Place ID 與請求一致，但允許省略 optional `businessStatus`；只有回應為 `OPERATIONAL` 且含可判定的 `regularOpeningHours.periods` 時才把 `is_24h` 更新為推導出的 true 或 false。可判定 periods 必須是單一星期日 00:00 open 且沒有 close 的 canonical always-open 結構，或每個 period 都同時具有合法 open 與合法 close 的完整排程；其他 open 合法但缺少 close 的非 canonical 結構一律回傳 indeterminate。缺少 `businessStatus`、缺少時段、非正常營業狀態、不完整 period 或 API 失敗都不產生狀態更新。搜尋結果缺席永遠不會把既有 true 改成 false。

替代方案是只重跑 Text Search，但搜尋排名或結果缺席不能證明醫院已不再 24 小時，無法可靠更新既有連結。

### Restrict city and match by unique normalized phone

Google `formattedAddress` 先把 `臺` 正規化為 `台`，再要求地址城市恰為 `台北市`、`新北市` 或 `基隆市` 且等於當次搜尋城市。電話只保留數字；`+886` 前綴轉回本地 `0`，再與同城市官方醫院電話比對。只有恰好一筆官方醫院具有相同正規化電話時才能配對；零筆或多筆都只計入 unmatched 或 ambiguous 統計。

已有 `google_place_id` 的醫院以既有連結為準，不再重新配對。若 discovery 候選的 Place ID 已連到另一筆醫院，必須列為 conflict 且不得改寫。替代方案是名稱或地址模糊比對，但醫院分院、行銷名稱、里鄰與郵遞區號差異會提高錯配風險，不符合這次保守寫入目標。

### Make database mutation explicit and transactional

新增 backend npm script `db:enrich:hospitals:24h`。未帶參數時執行 dry-run：可讀取資料庫與呼叫 Google API並輸出統計，但不執行 UPDATE。只有傳入 `--write` 時，才在所有 Google 回應與配對計算完成後開啟 transaction，批次更新成功配對或成功 refresh 的醫院；任一資料庫錯誤必須 rollback，CLI 以非零狀態結束。

Google API key 使用獨立 `GOOGLE_PLACES_API_KEY`，缺少 key、HTTP 錯誤、授權拒絕或非預期回應會在資料庫 transaction 開始前使整次執行失敗。這避免持有長 transaction 等待網路，也避免只查到部分城市後寫入不完整 discovery 結果。替代方案是預設直接寫入，但對付費外部 API 與模糊搜尋結果而言，先 dry-run 更適合人工檢查。

### Store only the durable link and PawPal-derived state

資料庫只保存 Google Place ID、PawPal 推導的 `is_24h`、固定來源字串與最後成功檢查時間。Google 的顯示名稱、地址、電話、完整時段與搜尋 response 不落地；它們只在單次執行中用於城市邊界、配對與判定。這降低第三方內容長期保存與資料漂移風險，也讓官方 MOA 主檔繼續擁有名稱、地址與電話。

## Implementation Contract

完成後，操作員可在 backend 執行 `npm run db:enrich:hospitals:24h` 查看 dry-run 統計；資料庫內容在 dry-run 前後完全相同。執行 `npm run db:enrich:hospitals:24h -- --write` 才會提交更新。

指令固定處理 `台北市`、`新北市`、`基隆市`，輸出至少包含 queried、fetched、alwaysOpen、matched、unmatched、ambiguous、conflicts、refreshed、wouldUpdate、updated。dry-run 的 `updated` 必須為 0，`wouldUpdate` 表示若帶 `--write` 將更新的筆數。

新候選必須同時符合：Google type filter 為 veterinary care、`OPERATIONAL`、canonical always-open period、formatted address 城市等於查詢城市、正規化電話在同城市只對應一筆官方醫院、Place ID 未連到其他醫院。成功寫入時更新該醫院的 `is_24h = true`、`google_place_id`、`is_24h_source = 'google_places'` 與 `is_24h_checked_at`。

已連結 Place ID 的 refresh 只有在 Place Details 回傳 `OPERATIONAL` 與可判定 periods 時更新 `is_24h`、來源和檢查時間；可判定但非 always-open 時更新 `is_24h = false`。單一星期日 00:00 open 且沒有 close 是唯一可接受缺少 close 的 canonical 結構；任何其他 open 合法但缺少 close 的 period 必須回傳 indeterminate，保留既有 `is_24h`、來源與檢查時間。缺少 periods、非正常營業狀態、跨城市候選、無唯一電話配對、Place ID conflict 或搜尋結果缺席也不得修改該醫院。

API key 缺失、Google HTTP／授權／真正的 response shape 錯誤必須在寫入前失敗並回傳非零狀態；省略空的 Text Search `places` 或 optional Place Details `businessStatus` 不屬於錯誤。前者必須正規化為零筆候選並繼續其餘城市，後者必須讓該 linked hospital 流入無法判定分支、保留 `is_24h` 與 `is_24h_checked_at`，同時繼續整批處理。`--write` 的所有 SQL UPDATE 必須在單一 transaction 中完成；任一 SQL 失敗時不得留下部分更新。測試必須使用注入的 axios client、pool 與 logger，不呼叫真實 Google API 或正式資料庫。

農業部匯入重跑後，既有 latitude、longitude、is_24h、emergency_available、google_place_id、is_24h_source 與 is_24h_checked_at 必須維持原值。`db:setup` 對新資料庫與既有資料庫皆可安全重跑並建立缺少欄位與唯一索引。

驗收包含 `cd backend && npm test` 通過，以及 mock 情境覆蓋 canonical 24H 判定、完整排程的非 24H 判定、非 canonical 且缺少 close 時回傳 indeterminate 並保留既有狀態、城市過濾、電話唯一配對、無配對、歧義、Place ID conflict、dry-run 無寫入、write transaction commit、SQL failure rollback、Google failure 無寫入、空 Text Search 回應繼續其餘城市、Details 缺少 business status 時保留 linked hospital 狀態、refresh true→false 與 MOA upsert 保留 enrichment。

實作範圍僅包含 schema、批次 script、環境變數範例、npm 指令與後端測試；不包含實際執行正式資料寫入、排程、API、前端、急診語意或三市以外資料。

## Risks / Trade-offs

- [Risk] 官方電話缺漏或與 Google 電話不同會降低自動配對率 → 以 unmatched 統計顯示，不用風險較高的模糊比對補足。
- [Risk] Google Text Search 可能因排名漏掉地點 → 只把搜尋結果視為 discovery，不把缺席視為 false；已連結地點使用 Place Details refresh。
- [Risk] Google Places 欄位與呼叫會產生成本或受配額限制 → 使用必要 field mask、固定三市、顯式批次指令與 dry-run，測試不呼叫真實 API。
- [Risk] 同電話多分院或共用總機造成歧義 → 必須同城市唯一，否則完全不寫入。
- [Risk] Google 顯示 24 小時不等於任何特定醫療服務全天可用 → UI 維持「24 小時營業」語意，本 change 不推導急診能力。
- [Risk] Google Places 使用條款可能限制第三方內容保存 → 不保存顯示內容或 response，只保存 Place ID 與 PawPal 推導的狀態及稽核時間；上線前仍由專案維護者確認當時適用條款。

## Migration Plan

1. 部署 schema 與批次程式後執行 `db:setup`，以 idempotent ALTER 與 index 建立新欄位，不修改既有資料。
2. 先執行 dry-run，檢查三市統計與 unmatched、ambiguous、conflict 數量。
3. 確認 Google Places API key 限制與帳務設定後，以 `--write` 執行首次補強。
4. 重跑農業部醫院匯入與補強測試，確認 enrichment 欄位不被清除。
5. 回滾程式時停止使用補強指令即可；新增 nullable 欄位與索引可保留，避免破壞已寫入資料。若必須移除 schema，先移除 partial unique index，再於維護窗口移除三個新增欄位。

## Open Questions

無。
