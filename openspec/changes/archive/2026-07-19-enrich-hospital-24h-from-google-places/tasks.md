## 1. 資料庫契約與官方匯入保護

- [x] 1.1 實作 `Extend hospitals with idempotent Google enrichment metadata`、`Hospital table stores official clinic records` 與 `Database setup preserves existing data`：在 `backend/database/schema/hospitals.sql` 以 idempotent ALTER 建立 nullable `google_place_id`、`is_24h_source`、`is_24h_checked_at`，並建立 non-NULL Place ID partial unique index，確保 `db:setup` 對既有資料庫重跑不刪改資料；以 `backend/test/import_hospitals.test.js` 的 schema 靜態契約測試及 `cd backend && npm test` 驗證。
- [x] 1.2 實作 `Preserve enrichment during MOA upsert` 與 `Import is idempotent`：調整 `backend/database/scripts/import_hospitals.js`，讓 conflict update 只更新官方基本欄位並保留 latitude、longitude、is_24h、emergency_available 與三個 Google enrichment 欄位；以既有 license_number 重跑案例的 SQL/values mock 測試確認補強資料不會被 NULL 覆蓋。

## 2. Google Places 判定、搜尋與安全配對

- [x] 2.1 先在 `backend/test/enrich_hospital_24h.test.js` 建立 `Canonical Google periods determine 24-hour operation`、`City boundary and unique phone control matching` 的資料轉換測試，再於 `backend/database/scripts/enrich_hospital_24h.js` 實作 canonical periods 三態判定、`臺`／`台` 城市正規化、+886 電話本地化及同城市唯一電話匹配；以 spec example table、跨城市、無配對及歧義案例通過驗證。
- [x] 2.2 實作 `Discover and refresh Google Places in two phases` 的 discovery 與 `Enrichment targets the three northern cities`：使用注入 axios client 逐一查詢固定三市、strict `veterinary_care`、必要 field mask 與 next page token，依 Place ID 去重並排除跨城市或非 canonical 24H 結果；以 mock 斷言查詢 body/header、三市集合、分頁次數與 dedupe 統計。
- [x] 2.3 實作 `Google Place links remain one-to-one` 與 `Restrict city and match by unique normalized phone`：既有 Place ID 不重新配對，已連到其他醫院的 discovery 候選記為 conflict，無唯一同城市電話者記為 unmatched 或 ambiguous 且不產生 update plan；以 matched、unmatched、ambiguous、conflict 四類 mock 結果與 distinct hospital update plan 驗證。
- [x] 2.4 實作 `Linked places are refreshed from Place Details`：對目標三市已連結 Place ID 取得 Details，僅在 `OPERATIONAL` 且 periods 可判定時產生 true／false update plan，缺少 periods、非正常營業狀態或 Text Search 缺席維持原值與 timestamp；以 true→false、indeterminate 與 absent search 三個測試驗證。

## 3. Dry-run、交易寫入與失敗行為

- [x] 3.1 實作 `Make database mutation explicit and transactional` 的 dry-run 部分、`Dry-run is the default and write is explicit` 及 `Enrichment output is auditable`：預設只讀資料庫、完成 Google 評估並回傳 queried、fetched、alwaysOpen、matched、unmatched、ambiguous、conflicts、refreshed、wouldUpdate、updated，且不執行 UPDATE；以 mock pool 查詢紀錄確認 `updated=0`、`wouldUpdate` 正確且無 BEGIN/UPDATE/COMMIT。
- [x] 3.2 完成 `--write` transaction：所有 Google 呼叫與 update plan 在 BEGIN 前完成，eligible updates 在單一 transaction 寫入 `is_24h`、Place ID、`google_places` 與 clock timestamp，成功 COMMIT、任一 UPDATE 失敗 ROLLBACK；以 query sequence mock 測試 commit 與 rollback 後非零錯誤傳遞。
- [x] 3.3 實作 `External failures cannot produce partial enrichment`：缺少 `GOOGLE_PLACES_API_KEY`、Text Search／Place Details HTTP 或 response shape 錯誤必須在 transaction 前終止，且 injected axios、pool、env、clock、logger 測試不可連線真實服務；以 missing key、authorization failure、invalid shape 測試確認沒有 BEGIN 或 UPDATE。

## 4. CLI 入口、暫存資料邊界與完整驗證

- [x] 4.1 實作 `Store only the durable link and PawPal-derived state` 與操作入口：在 `backend/package.json` 新增 `db:enrich:hospitals:24h`，在 `backend/.env.example` 新增 `GOOGLE_PLACES_API_KEY`，CLI 正確解析 `--write`、關閉 pool 並於失敗設定非零 exit code；以 package script/env 靜態測試及 CLI helper 測試確認不產生 Google response 檔案或顯示內容欄位 SQL。
- [x] 4.2 執行完整驗收：`cd backend && npm test` 必須通過，並逐項核對 Implementation Contract 的 canonical 24H、固定三市、城市過濾、電話唯一配對、Place ID conflict、refresh true→false、dry-run、write commit、rollback、Google failure 與 MOA enrichment preservation 測試皆存在且通過；再執行 `npm run build` 確認既有前端 24H filter 契約未受影響。

## 5. Google protobuf JSON 省略欄位相容性

- [x] 5.1 補強 `Enrichment targets the three northern cities` 與 `External failures cannot produce partial enrichment`：在 `backend/database/scripts/enrich_hospital_24h.js` 將成功 Text Search 回應中省略的 `places` 正規化為 `[]`，使零結果城市不會中止其他城市處理，同時保留 `places` 存在但型別錯誤時的失敗契約；在 `backend/test/enrich_hospital_24h.test.js` 以 `{}` Text Search mock 驗證零候選、其餘三市請求繼續且無非預期 transaction。
- [x] 5.2 補強 `Linked places are refreshed from Place Details` 與 `Discover and refresh Google Places in two phases`：在 `backend/database/scripts/enrich_hospital_24h.js` 的 Details response 驗證只要求回應 Place ID 與請求一致，允許省略 optional `businessStatus` 並交由 `classifyAlwaysOpen` 產生 indeterminate 結果；在 `backend/test/enrich_hospital_24h.test.js` 驗證 linked hospital 的 `is_24h` 與 `is_24h_checked_at` 保持原值、後續 linked hospitals 仍被處理，並執行 `cd backend && npm test` 確認完整後端測試通過。

## 6. 不完整 no-close period 回歸修正

- [x] 6.1 補強 `Canonical Google periods determine 24-hour operation`、`Linked places are refreshed from Place Details` 與 `Discover and refresh Google Places in two phases`：先在 `backend/test/enrich_hospital_24h.test.js` 加入非 canonical 且 open 合法但缺少 close 時 `classifyAlwaysOpen` 回傳 `null`、refresh 保留既有 `is_24h` 與 `is_24h_checked_at` 的回歸案例，再調整 `backend/database/scripts/enrich_hospital_24h.js`，使缺少 close 只在單一星期日 00:00 canonical period 判定為 true，其餘 no-close 結構均為 indeterminate；執行 `cd backend && node --test test/enrich_hospital_24h.test.js` 與 `cd backend && npm test` 驗證。
