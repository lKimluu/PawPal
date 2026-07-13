## 1. 資料模型與 setup

- [x] 1.1 依 Decision: Store member reviews in a dedicated hospital_reviews table 建立 `hospital_reviews` 資料表契約，讓 Hospital reviews store one member rating per hospital 的外鍵、rating 1 到 5、comment 1 到 1000 字元、`user_id + hospital_id` 唯一約束與 indexes 全部成立；以 `cd backend && node --test test/import_hospitals.test.js test/hospital_reviews.schema.test.js` 驗證 schema、setup-db 建表順序與約束文字。

## 2. 評論 CRUD API

- [x] 2.1 依 Decision: Keep review services separate from hospital query services 建立 `hospital_reviews` schema、service 與 controller，讓 Hospital review list is public and excludes private user data 可公開回傳 newest-first reviews，且只包含 `id`、`hospital_id`、`user_id`、`user_name`、`user_avatar_url`、`rating`、`comment`、`created_at`、`updated_at`；以 `cd backend && node --test test/hospital_reviews.service.test.js test/hospital_reviews.controller.test.js` 驗證查詢排序與不回傳 email/password。
- [x] 2.2 依 Decision: Keep read APIs public and protect only review writes 掛載 `GET /api/v1/hospitals/:hospital_id/reviews`、`POST /api/v1/hospitals/:hospital_id/reviews`、`PATCH /api/v1/hospitals/:hospital_id/reviews/me` 與 `DELETE /api/v1/hospitals/:hospital_id/reviews/me`，讓 Hospital review writes require member authentication 的寫入路由使用 `authenticateToken`、讀取路由不需要登入；以 `cd backend && node --test test/hospital_reviews.route.test.js` 驗證 public read 與 auth-protected writes。
- [x] 2.3 實作建立、更新、刪除自己的評論，讓登入會員可新增一則評論、更新自己的 rating/comment、刪除自己的評論，且同會員同醫院第二次 POST 回傳 409；以 `cd backend && node --test test/hospital_reviews.service.test.js test/hospital_reviews.controller.test.js` 驗證 201、200、204 與 duplicate conflict。
- [x] 2.4 實作 Hospital review write failures return explicit status codes，讓無效 `hospital_id`、`rating`、`comment` 回傳 400，更新或刪除不存在的 own review 回傳 404，未登入寫入回傳 401，錯誤 body 皆含繁中 message；以 `cd backend && node --test test/hospital_reviews.schema.test.js test/hospital_reviews.controller.test.js test/hospital_reviews.route.test.js` 驗證。

## 3. 醫院查詢評分聚合

- [x] 3.1 依 Decision: Compute rating aggregates from hospital_reviews queries 擴充 hospital list 與 nearby 查詢，讓 Hospital list and nearby APIs expose review aggregates 在每個 hospital object 回傳 `rating_average` 與 `review_count`，無評論時為 `null` 與 `0`，且不改變既有 filters、pagination、sort；以 `cd backend && node --test test/hospitals.service.test.js test/hospitals.controller.test.js` 驗證 list、nearby 與既有排序查詢。
- [x] 3.2 依 Decision: Compute rating aggregates from hospital_reviews queries 擴充 map bounds 查詢，讓 Hospital map API exposes review aggregates while remaining public 在每個 map hospital object 回傳 `rating_average` 與 `review_count`，並保留 `total`、`truncated`、1000 筆上限與公開讀取；以 `cd backend && node --test test/hospitals.service.test.js test/hospitals.controller.test.js test/hospitals.route.test.js` 驗證。

## 4. 完整驗證

- [x] 4.1 執行後端完整驗證，確認醫院評論、公開地圖瀏覽、auth-protected writes、rating aggregates 與既有醫院查詢契約全部通過；以 `cd backend && npm test` 驗證並在交付訊息記錄結果。
