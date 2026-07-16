## Why

醫院地圖目前可以公開瀏覽醫院資訊，但缺少使用者回饋資料，使用者無法透過其他會員的經驗判斷醫院是否適合。新增評論與 1 到 5 顆心評分，可以讓未登入使用者也看見平均心數與評論數，並讓登入會員留下自己的評價。

## What Changes

- 新增會員限定的醫院評論與心數評分能力：登入會員可對同一間醫院建立、更新、刪除自己的單一評論。
- 新增公開評論列表 API：未登入使用者可讀取醫院評論列表，但不能新增、修改或刪除評論。
- 醫院列表、附近醫院與地圖查詢回傳 `rating_average` 與 `review_count` 聚合欄位。
- 新增 `hospital_reviews` 資料表與對應後端 route、schema、controller、service、測試。
- 評分聚合以 SQL 查詢從 `hospital_reviews` 計算，不寫入 `hospitals` 表，避免資料不同步。

## Capabilities

### New Capabilities

- `hospital-reviews-rating`: 管理醫院評論、會員心數評分、評論權限與評論資料表約束。

### Modified Capabilities

- `hospital-query-api`: 醫院列表與附近醫院 API 回傳醫院評分聚合欄位。
- `hospital-api-integration`: 醫院地圖 API 回傳醫院評分聚合欄位，並維持未登入公開瀏覽地圖。

## Impact

- Affected specs: `hospital-reviews-rating`, `hospital-query-api`, `hospital-api-integration`
- Affected code:
  - New: `backend/database/schema/hospital_reviews.sql`
  - New: `backend/src/schemas/hospital_reviews.schema.js`
  - New: `backend/src/controllers/hospital_reviews.controller.js`
  - New: `backend/src/services/hospital_reviews.service.js`
  - New: `backend/test/hospital_reviews.schema.test.js`
  - New: `backend/test/hospital_reviews.route.test.js`
  - New: `backend/test/hospital_reviews.controller.test.js`
  - New: `backend/test/hospital_reviews.service.test.js`
  - Modified: `backend/scripts/setup-db.js`
  - Modified: `backend/src/routes/hospitals.route.js`
  - Modified: `backend/src/services/hospitals.service.js`
  - Modified: `backend/test/import_hospitals.test.js`
  - Modified: `backend/test/hospitals.route.test.js`
  - Modified: `backend/test/hospitals.controller.test.js`
  - Modified: `backend/test/hospitals.service.test.js`
