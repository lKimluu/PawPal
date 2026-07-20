## Why

醫院搜尋頁目前只能篩選「24 小時營業」，使用者無法快速回頭查看自己已收藏的醫院，也沒有任何收藏機制串接到後端——現有的 `src/stores/favoriteHospital.js` 只是純本機 mock，重新整理就會遺失，且與登入使用者無關。需要一套完整的收藏醫院機制（資料庫、API、前端），並提供「收藏清單」篩選 Toggle，讓使用者能快速篩出已收藏的醫院。

## What Changes

- 新增 `hospital_favorites` 資料表，記錄 `user_id` / `hospital_id` / `created_at`，並以 `UNIQUE (user_id, hospital_id)` 防止重複收藏
- 新增收藏／取消收藏 API：`POST /api/v1/hospitals/:hospital_id/favorite`、`DELETE /api/v1/hospitals/:hospital_id/favorite`，皆需登入；重複收藏回 409、取消不存在的收藏回 404，並附上明確中文訊息
- 擴充既有 `GET /api/v1/hospitals` 清單 API：新增可選的 `favorites_only` 查詢參數（僅登入可用），並在登入狀態下於每筆醫院資料附上 `is_favorite` 欄位，使收藏篩選能與既有的關鍵字／城市／區域／動物類型／排序／24 小時營業等篩選條件共同使用
- `SearchBar.vue` 在「24 小時營業」下方新增「收藏清單」篩選 Toggle，樣式沿用既有 pill-switch
- `HospitalCard.vue` 的收藏愛心圖示改接真實 API，並補上防重複送出保護（本地 loading ref + guard clause），取代目前的本機 mock 行為
- 廢棄 `src/stores/favoriteHospital.js`，收藏相關狀態與 action 併入 `src/stores/hospital.js`
- `duplicate-submit-guard` 規格新增一個 Requirement，涵蓋醫院收藏 Toggle 的防重複送出行為

## Capabilities

### New Capabilities

- `hospital-favorites`: 使用者收藏／取消收藏醫院、查詢自己的收藏清單（可與其他搜尋篩選條件共用）、查詢單一醫院是否已被目前使用者收藏

### Modified Capabilities

- `hospital-query-api`: `GET /api/v1/hospitals` 新增 `favorites_only` 查詢參數與登入時的 `is_favorite` 欄位
- `duplicate-submit-guard`: 新增醫院收藏 Toggle 的防重複送出 Requirement

## Impact

- Affected code:
  - New: backend/database/schema/hospital_favorites.sql
  - New: backend/src/schemas/hospital_favorites.schema.js
  - New: backend/src/services/hospital_favorites.service.js
  - New: backend/src/controllers/hospital_favorites.controller.js
  - New: backend/test/hospital_favorites.schema.test.js
  - New: backend/test/hospital_favorites.service.test.js
  - New: backend/test/hospital_favorites.controller.test.js
  - New: backend/test/hospital_favorites.route.test.js
  - Modified: backend/src/routes/hospitals.route.js
  - Modified: backend/src/controllers/hospitals.controller.js
  - Modified: backend/src/services/hospitals.service.js
  - Modified: backend/src/schemas/hospitals.schema.js
  - Modified: backend/src/middlewares/auth.middleware.js
  - Modified: backend/scripts/setup-db.js
  - Modified: src/api/hospitals.js
  - Modified: src/stores/hospital.js
  - Modified: src/components/hospital/SearchBar.vue
  - Modified: src/components/hospital/HospitalCard.vue
  - Removed: src/stores/favoriteHospital.js
