## 1. 資料庫契約測試

- [x] 1.1 為 `Animal types reference data is fixed` 新增後端測試，確認 `animal_types` schema 具備 required unique `name` / `slug`、`created_at`，且 `animal_types.seed.sql` 固定包含 8 種 canonical rows；以 `cd backend && npm test` 驗證測試會檢查 seed 可重跑不重複插入。
- [x] 1.2 為 `Hospitals are related to animal types through a many-to-many table` 新增後端測試，確認 `hospital_animal_types` 具備 `hospital_id` FK、`animal_type_id` FK、`created_at` 與 `(hospital_id, animal_type_id)` 複合唯一限制；以 `cd backend && npm test` 驗證可支援一間醫院多種動物與一種動物多間醫院的 join 查詢契約。
- [x] 1.3 為 `Treatment scope records preserve unknown status separately from unsupported service` 新增後端測試，確認關聯表包含 `verification_status` 與 `source`，且 schema 不建立任何把缺少關聯解讀為不支援診療的欄位或 seed；以 `cd backend && npm test` 驗證未知診療範圍語意。

## 2. Schema 與 Reference Seed

- [x] 2.1 依 `Use animal_types as fixed reference data` 建立 `backend/database/schema/animal_types.sql`，讓資料庫可保存固定動物種類 reference data 並以 `slug` 穩定識別；以新增測試與人工檢視 SQL 驗證 `CREATE TABLE IF NOT EXISTS`、required unique 欄位與 identity primary key。
- [x] 2.2 依 `Model hospital treatment scope with a many-to-many table` 建立 `backend/database/schema/hospital_animal_types.sql`，讓醫院與動物種類可形成多對多關聯且拒絕重複 pair；以新增測試驗證 FK、複合唯一限制與 join 查詢契約。
- [x] 2.3 依 `Keep unknown scope distinct from unsupported scope` 在 `hospital_animal_types` 加入每筆關聯的 `verification_status` 預設值與 nullable `source`，讓已知診療範圍可追蹤驗證狀態與資料來源；以新增測試驗證欄位存在且沒有不支援診療旗標。
- [x] 2.4 建立 `backend/database/seeds/animal_types.seed.sql`，讓 `db:setup:seed` 可 idempotently 建立狗/dog、貓/cat、兔/rabbit、鼠類/rodent、鳥類/bird、爬蟲類/reptile、兩棲類/amphibian、其他特殊寵物/other_exotic；以新增測試驗證 `ON CONFLICT (slug) DO NOTHING` 與固定 8 種資料。

## 3. Setup 整合與驗證

- [x] 3.1 依 `Preserve setup and seed safety` 更新 `backend/scripts/setup-db.js` 的 schema 與 seed 順序，讓 `db:setup` 先建立 `hospitals` 和 `animal_types` 再建立 `hospital_animal_types`，並讓 `db:setup:seed` 載入固定動物種類；以 `cd backend && npm test` 驗證順序與 seed 設定。
- [x] 3.2 確認固定動物種類是 reference data 而非 demo data，`clear-seed` 不刪除 `animal_types` 或 `hospital_animal_types`；以現有 clear-seed 測試和新增 assertions 驗證 seed cleanup 不會觸碰這兩張表。
- [x] 3.3 執行完整驗證，確認資料庫契約與前端建置未被破壞；以 `cd backend && npm test` 和 `npm run build` 作為完成證據。

## 4. 驗證狀態固定值

- [x] 4.1 依 `Constrain verification_status values` 更新 `Treatment scope records preserve unknown status separately from unsupported service` 的資料庫契約，讓 `hospital_animal_types.verification_status` 只接受 `unverified`、`verified`、`rejected` 並保留 `rejected` 為資料不採信而非確認不診療的語意；以 `cd backend && npm test` 驗證 schema 包含 check constraint 且拒絕任意狀態字串。
