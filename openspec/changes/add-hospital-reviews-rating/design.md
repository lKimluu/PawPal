## Context

PawPal 後端目前以 Express routes、Zod schemas、controllers、services 與 PostgreSQL schema 分層。醫院查詢已存在於 `/api/v1/hospitals`、`/nearby`、`/map` 與 `/regions`，且 `hospitals` 表只存官方醫院資料。會員身分由 `authenticateToken` 驗證 JWT 後寫入 `req.userId`。

這次變更要在不破壞公開醫院地圖瀏覽的前提下，加入會員評論與 1 到 5 顆心評分。未登入使用者仍可看醫院地圖、醫院列表、平均心數、評論數與評論列表；只有新增、更新、刪除評論需要登入。

## Goals / Non-Goals

**Goals:**

- 建立 `hospital_reviews` 資料表，將評論與評分綁定 `hospitals.id` 與 `users.id`。
- 一位會員對同一間醫院只能保留一則評論，並可更新或刪除自己的評論。
- 公開醫院查詢 API 回傳 `rating_average` 與 `review_count`，來源為 `hospital_reviews` 聚合。
- 公開評論列表 API 允許未登入讀取評論。
- 評論寫入 API 使用既有 JWT middleware，未登入時回傳 HTTP 401。

**Non-Goals:**

- 不實作收藏愛心功能；若未來需要收藏，另建 `hospital_favorites`。
- 不新增管理員審核、檢舉、隱藏評論或黑名單功能。
- 不把 `rating_average` 或 `review_count` 寫入 `hospitals` 表。
- 不在本變更實作前端評論 UI。

## Decisions

### Decision: Store member reviews in a dedicated hospital_reviews table

新增 `hospital_reviews` 表而不是把評論欄位放進 `hospitals`。`hospital_reviews` 儲存 `hospital_id`、`user_id`、`rating`、`comment`、`created_at`、`updated_at`，並用外鍵連到 `hospitals` 與 `users`。`rating` 使用 1 到 5 的整數約束，`comment` 使用 1 到 1000 字元約束，`user_id` 與 `hospital_id` 建立唯一約束。

替代方案是把平均分數、評論數或評論 JSON 存在 `hospitals`，但這會混合官方醫院資料與會員互動資料，且容易出現聚合資料不同步。

### Decision: Keep read APIs public and protect only review writes

`GET /api/v1/hospitals`、`GET /api/v1/hospitals/nearby`、`GET /api/v1/hospitals/map` 與 `GET /api/v1/hospitals/:hospital_id/reviews` 保持公開。`POST /api/v1/hospitals/:hospital_id/reviews`、`PATCH /api/v1/hospitals/:hospital_id/reviews/me` 與 `DELETE /api/v1/hospitals/:hospital_id/reviews/me` 使用 `authenticateToken`。

替代方案是要求登入才能讀評論或看評分，但這會違反醫院地圖公開瀏覽需求。

### Decision: Compute rating aggregates from hospital_reviews queries

醫院列表、附近醫院與地圖查詢透過 SQL 聚合取得 `rating_average` 與 `review_count`。沒有評論的醫院回傳 `rating_average` 為 `null`，`review_count` 為 `0`。`rating_average` 在 service mapping 中轉為最多一位小數或資料庫回傳的數值精度，保持所有醫院查詢一致。

替代方案是新增 `hospitals.rating_average` 與 `hospitals.review_count` 快取欄位，但第一版沒有高流量需求，快取會增加更新一致性風險。

### Decision: Keep review services separate from hospital query services

新增 `hospital_reviews` service、controller、schema，並把 routes 掛在 hospitals route 下。醫院查詢 service 只負責在既有查詢結果中加入 rating aggregates，不處理評論 CRUD。

替代方案是把評論 CRUD 全部放入 `hospitals.service.js`，但這會讓官方醫院查詢與會員互動寫入混在同一個 service，後續維護較難。

## Implementation Contract

- 資料表行為：database setup SHALL create `hospital_reviews` after `users` and `hospitals` exist. `hospital_reviews` SHALL reject rating outside 1 to 5, blank comments, comments longer than 1000 characters, duplicate `user_id` and `hospital_id` pairs, missing users, and missing hospitals.
- 公開查詢行為：hospital list, nearby, and map responses SHALL include `rating_average` and `review_count` for every hospital object. When a hospital has no reviews, `rating_average` SHALL be `null` and `review_count` SHALL be `0`. These endpoints SHALL NOT require an Authorization header.
- 公開評論列表：`GET /api/v1/hospitals/:hospital_id/reviews` SHALL return HTTP 200 with reviews ordered newest first. Each review SHALL include `id`, `hospital_id`, `user_id`, `user_name`, `user_avatar_url`, `rating`, `comment`, `created_at`, and `updated_at`. The endpoint SHALL NOT require an Authorization header.
- 寫入評論：`POST /api/v1/hospitals/:hospital_id/reviews` SHALL require `authenticateToken`, validate `hospital_id` as a positive integer, validate `rating` and `comment`, create one review for `req.userId`, and return HTTP 201 with the review. Duplicate review attempts SHALL return HTTP 409 with a Traditional Chinese message.
- 更新評論：`PATCH /api/v1/hospitals/:hospital_id/reviews/me` SHALL require `authenticateToken`, validate `rating` and `comment`, update only the current member's review for that hospital, and return HTTP 200 with the updated review. Missing own review SHALL return HTTP 404 with a Traditional Chinese message.
- 刪除評論：`DELETE /api/v1/hospitals/:hospital_id/reviews/me` SHALL require `authenticateToken`, delete only the current member's review for that hospital, and return HTTP 204. Missing own review SHALL return HTTP 404 with a Traditional Chinese message.
- 分層邊界：routes define paths and middleware only; schemas validate params and body; controllers handle request/response and status codes; services contain SQL and business logic.
- 驗收方式：backend tests SHALL cover table constraints, public read access, auth-protected writes, validation failures, duplicate review conflict, missing own review, rating aggregation on list/nearby/map, and route mounting under `/api/v1/hospitals`. Final verification SHALL run `cd backend && npm test`.

## Risks / Trade-offs

- [Risk] 每次醫院查詢都聚合評論可能增加 SQL 成本。→ Mitigation: `hospital_reviews` 建立 `hospital_id` 與 `hospital_id + created_at` indexes；若未來有高流量再引入快取欄位或 materialized view。
- [Risk] 未登入讀取公開評論可能暴露會員顯示名稱與頭像。→ Mitigation: API 只回傳 `user_name` 與 `user_avatar_url`，不回傳 `email` 或其他帳號敏感資料。
- [Risk] 重複評論可能造成評分灌水。→ Mitigation: `user_id` 與 `hospital_id` 唯一約束讓每位會員每間醫院只有一則有效評論。
