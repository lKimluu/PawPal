## Context

目前後端已有 `hospitals` 資料表與 `db:setup` / `db:setup:seed` 流程，但沒有可表達「醫院可診療哪些動物種類」的資料結構。使用者後續需要依寵物種類篩選醫院，因此資料庫需要先提供固定動物種類與醫院診療範圍關聯。

固定動物種類是系統 reference data，不是展示用 demo data。未建立醫院與動物種類關聯時，代表診療範圍尚未確認，不代表該醫院不提供該動物診療。

## Goals / Non-Goals

**Goals:**

- 建立固定動物種類資料表與 idempotent reference seed。
- 建立 `hospitals` 與 `animal_types` 的多對多關聯資料表。
- 讓每筆關聯可記錄驗證狀態與資料來源。
- 固定驗證狀態為 `unverified`、`verified`、`rejected`，避免任意狀態字串進入資料庫。
- 讓 `db:setup` 建立必要 schema，並讓 `db:setup:seed` 載入固定動物種類。

**Non-Goals:**

- 不新增 Express API、controller、service 或前端篩選 UI。
- 不匯入或推測既有醫院的可診療動物種類。
- 不把缺少關聯的醫院標記為不支援任何動物種類。
- 不讓 seed clear 移除固定動物種類 reference data。

## Decisions

### Use animal_types as fixed reference data

`animal_types` 使用 `id` 作為 FK 目標，並以 `slug` 作為穩定查詢識別。`name` 與 `slug` 都設為 required unique，避免同一分類被重複建立。固定 seed 使用 `ON CONFLICT (slug) DO NOTHING`，確保重跑不重複插入。

替代方案是直接在關聯表儲存 slug 字串，但會讓分類名稱、顯示文字與唯一性分散，後續擴充也較難維護。

### Model hospital treatment scope with a many-to-many table

`hospital_animal_types` 使用 `hospital_id` 與 `animal_type_id` 連到兩張主表，並以兩欄複合唯一限制表示同一醫院與同一動物種類只能有一筆已知診療範圍。這支援一間醫院多種動物，以及一種動物多間醫院。

替代方案是在 `hospitals` 加陣列欄位或 JSON 欄位，但 FK、唯一性與 join 查詢會較弱，不符合現有 relational schema 風格。

### Keep unknown scope distinct from unsupported scope

資料庫只儲存已知關聯。沒有 `hospital_animal_types` row 代表未知，不建立任何「不支援」語意欄位。`verification_status` 與 `source` 放在關聯表，讓每個醫院與動物種類的診療範圍可獨立追蹤驗證狀態與來源。

替代方案是在醫院層加整體驗證欄位，但無法表達每個動物種類的來源與可信度。

### Constrain verification_status values

`verification_status` 使用 `VARCHAR(30)` 搭配 `CHECK (verification_status IN ('unverified', 'verified', 'rejected'))` 固定允許值，預設仍為 `unverified`。`rejected` 表示該筆診療範圍資料經查證後不採信，不表示醫院已確認不提供該動物診療；缺少關聯 row 仍代表未知。

替代方案是使用 PostgreSQL ENUM type，但既有 schema 已有重跑安全性要求，這裡使用 check constraint 可以降低 enum migration 與 rollback 複雜度，同時滿足固定狀態值需求。

### Preserve setup and seed safety

`setup-db.js` 要把 `animal_types` 放在 `hospital_animal_types` 前面，且 `hospitals` 必須先於關聯表建立。`animal_types.seed.sql` 屬於 reference data seed，應納入 `db:setup:seed`，但不納入 `clear-seed` 的刪除範圍。

替代方案是把固定分類寫在應用程式常數中，但資料庫 FK 仍需要實體 rows，因此無法滿足關聯完整性。

## Implementation Contract

完成後，資料庫層提供以下可觀察行為：

- `db:setup` 在既有資料庫上安全建立 `animal_types` 與 `hospital_animal_types`，不刪除既有資料。
- `db:setup:seed` 建立固定 8 種動物種類：狗/dog、貓/cat、兔/rabbit、鼠類/rodent、鳥類/bird、爬蟲類/reptile、兩棲類/amphibian、其他特殊寵物/other_exotic。
- 重複執行固定動物種類 seed 不會建立重複 slug。
- `hospital_animal_types` 可透過 join 查詢指定醫院的所有已知可診療動物種類，也可透過指定 animal type 查詢已知對應醫院。
- `hospital_animal_types.verification_status` 只允許 `unverified`、`verified`、`rejected`，任意其他值會被資料庫拒絕。
- 缺少關聯資料不會在資料庫中形成不支援診療的紀錄或旗標。

實作範圍包含新增 schema SQL、固定動物種類 seed、setup 載入順序，以及後端測試。實作範圍不包含 API route、前端元件、醫院資料匯入推論或生產資料 backfill。

驗收以 `cd backend && npm test` 與 `npm run build` 為主，並以測試檢查 SQL 結構、seed 內容、setup 順序、FK、複合唯一限制與未知資料語意。

## Risks / Trade-offs

- [Risk] 固定分類未來可能需要新增更多種類 → Mitigation: 以 reference table 與 slug 設計保留新增分類能力，但本 change 僅固定建立目前 8 種 canonical rows。
- [Risk] 使用 nullable `source` 可能讓未驗證資料缺少來源 → Mitigation: 預設 `verification_status` 保留未驗證狀態，未來匯入或人工維護流程可要求 verified 資料必填來源。
- [Risk] `rejected` 可能被誤解為確認不診療 → Mitigation: spec 與測試需鎖定 `rejected` 的語意為資料不採信，缺少關聯 row 才是未知。
- [Risk] 沒有 API 時前端暫時無法直接使用篩選 → Mitigation: 本 change 明確只建立資料庫能力，API 與 UI 由後續 change 實作。

## Migration Plan

部署時先執行 `db:setup` 建立新 schema，再執行 `db:setup:seed` 載入固定分類。回滾時可移除 `hospital_animal_types` 後再移除 `animal_types`，但正式環境回滾前需確認沒有後續功能已依賴這兩張表。

## Open Questions

無。
