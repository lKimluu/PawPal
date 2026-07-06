## Why

使用者需要依寵物種類篩選可診療的動物醫院，但目前資料庫只有醫院基本資料，沒有可表達醫院與可診療動物種類的結構。建立固定動物種類與多對多關聯，可以支援後續篩選，同時避免把未確認資料誤判為不提供診療。

## What Changes

- 新增固定動物種類 reference data，包含狗、貓、兔、鼠類、鳥類、爬蟲類、兩棲類、其他特殊寵物及其 slug。
- 新增醫院與動物種類的多對多關聯結構，一間醫院可關聯多種動物，一種動物也可對應多間醫院。
- 關聯資料可逐筆記錄驗證狀態與來源，表示診療範圍的可信度與資料出處。
- 驗證狀態固定為 `unverified`、`verified`、`rejected`，避免資料寫入任意狀態字串。
- setup 流程會建立新資料表並載入固定動物種類 seed；固定分類不屬於可被 seed clear 移除的 demo data。
- 不新增後端 API 或前端篩選 UI，本 change 僅建立資料庫層能力。

## Capabilities

### New Capabilities

- `hospital-animal-types`: 定義固定動物種類、醫院可診療動物種類的多對多關聯，以及診療範圍驗證狀態與來源的資料庫能力。

### Modified Capabilities

(none)

## Impact

- Affected specs: hospital-animal-types
- Affected code:
  - New: backend/database/schema/animal_types.sql, backend/database/schema/hospital_animal_types.sql, backend/database/seeds/animal_types.seed.sql
  - Modified: backend/scripts/setup-db.js, backend/test/import_hospitals.test.js
  - Removed: none
