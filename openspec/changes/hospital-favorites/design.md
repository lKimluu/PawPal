## Context

醫院搜尋頁（`src/views/HospitalView.vue` + `src/components/hospital/SearchBar.vue`）目前只有「24 小時營業」一個 Toggle 篩選，篩選狀態集中在 `src/stores/hospital.js` 的 `filters`，經由 `listQuery()` 彙整後打 `GET /api/v1/hospitals`（`backend/src/routes/hospitals.route.js` → `hospitals.controller.js` → `hospitals.service.js`），該端點目前完全公開、不需登入。

收藏功能目前只有前端半成品：`src/stores/favoriteHospital.js` 是純本機 Pinia store，資料來源是靜態 mock `src/data/hospitals.js`，與登入使用者無關、重新整理即遺失；`src/components/hospital/HospitalCard.vue` 的愛心圖示已經接上這個 mock store。後端完全沒有收藏相關的資料表、route、controller、service、schema。

專案已有結構相同的前例可以直接比照：`hospital_reviews`（`backend/database/schema/hospital_reviews.sql`、`backend/src/schemas/hospital_reviews.schema.js`、`backend/src/services/hospital_reviews.service.js`、`backend/src/controllers/hospital_reviews.controller.js`）是同樣的「per-user + per-hospital」關聯表，用 `UNIQUE (user_id, hospital_id)` 防重複、`23505`/`23503` 錯誤碼轉譯成自訂 Error class 再對應 HTTP 狀態碼。

站內也已有 `duplicate-submit-guard` 規格（`openspec/specs/duplicate-submit-guard/spec.md`），定義了「本地 isLoading/isSubmitting ref 加上 handler 開頭 guard clause，搭配 disabled 綁定」的全站防重複送出模式，目前套用在刪除確認、表單送出等 11 個元件上，但尚未涵蓋任何 toggle 型態的收藏/取消收藏操作。

## Goals / Non-Goals

**Goals:**

- 讓使用者在醫院搜尋頁用「收藏清單」Toggle 篩出自己收藏的醫院，且可與既有篩選條件（關鍵字、城市、區域、動物類型、排序、24 小時營業）共同使用
- 讓 `HospitalCard.vue` 的愛心圖示改為呼叫真實後端 API，收藏狀態跨裝置、重新整理後仍保留
- 收藏／取消收藏失敗時（重複收藏、收藏不存在）回傳明確中文訊息，前端以既有 `useToastStore()` 顯示
- 收藏 Toggle 套用 `duplicate-submit-guard` 既定模式，避免快速連點造成重複請求

**Non-Goals:**

- 不做收藏數量統計、熱門收藏排行等分析功能
- 不處理未登入使用者的「訪客收藏暫存」，未登入直接引導登入（比照現有評論功能的處理方式）
- 不新增 idempotency key 機制，沿用現有 REST 慣例（明確的 409/404 錯誤語意，而非冪等靜默成功）
- 不修改醫院地圖檢視（`MapView.vue` / `GET /hospitals/map`）的收藏顯示，僅涵蓋列表搜尋頁

## Decisions

### 用 favorites_only 參數擴充既有 GET /api/v1/hospitals，不另開收藏清單端點

因為 Issue 明確要求「收藏清單可與其他保留中的篩選條件共同使用」，若另開一條 `/favorites` 端點，前端得維護兩套查詢邏輯與分頁狀態，與 `hospital.js` 現有 `listQuery()` 彙整所有篩選條件的單一入口設計衝突。改為在 `hospitalsQuerySchema`（`backend/src/schemas/hospitals.schema.js`）新增可選的 `favorites_only` 布林參數（沿用既有 `optional_boolean_schema`），`hospitals.service.js` 的 `findHospitals` 在 `favorites_only=true` 時對 `hospital_favorites` 做 `WHERE EXISTS` 過濾，與其他篩選條件屬於同一組 SQL WHERE 子句。

### GET /api/v1/hospitals 改為選擇性登入，新增 attachUserIfPresent middleware

現有 `authenticateToken`（`backend/src/middlewares/auth.middleware.js`）沒有 token 就直接回 401，不能直接套用在目前公開、支援匿名瀏覽的清單端點。新增 `attachUserIfPresent` middleware：有合法 token 就設定 `req.userId`，沒有 token 或 token 無效則放行、不設定 `req.userId`、也不回錯。掛在 `router.get('/', attachUserIfPresent, validate(hospitalsQuerySchema, 'query'), listHospitals)`。`listHospitals` controller 把 `req.userId` 一併傳入 `findHospitals(query, { userId })`：

- 有 `userId` 時，每筆醫院資料的回應多一個 `is_favorite` 欄位（LEFT JOIN `hospital_favorites`）
- `favorites_only=true` 但沒有 `userId`（未登入）時，controller 直接回 401 `{ message: '請先登入後查看收藏清單' }`，不呼叫 service

### 收藏／取消收藏採明確錯誤語意 409 / 404，不做冪等靜默成功

比照 `hospital_reviews.controller.js` 對重複評論回 409 的既有慣例。`POST /:hospital_id/favorite` 重複收藏時回 409 `{ message: '此醫院已收藏' }`；`DELETE /:hospital_id/favorite` 收藏不存在時回 404 `{ message: '此收藏不存在，請重新確認' }`。前端收到這兩種錯誤時用 `toastStore.showToast(message, 'error')` 顯示，並將畫面上的收藏狀態復原為呼叫前的狀態，避免顯示跟後端不一致的愛心圖示。

### hospital_favorites 資料表結構比照 hospital_reviews.sql

新增 `backend/database/schema/hospital_favorites.sql`：

```
CREATE TABLE IF NOT EXISTS hospital_favorites (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hospital_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hospital_favorites_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  CONSTRAINT fk_hospital_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_hospital_favorites_user_hospital UNIQUE (user_id, hospital_id)
);
CREATE INDEX idx_hospital_favorites_hospital_id ON hospital_favorites (hospital_id);
CREATE INDEX idx_hospital_favorites_user_id ON hospital_favorites (user_id);
```

沒有 updated_at 或更新觸發器，因為收藏只有新增/刪除兩種操作，沒有可更新欄位。註冊進 `backend/scripts/setup-db.js` 的 `TABLES_IN_ORDER` 陣列尾端（在 `hospitals` 與 `users` 之後）。

### 前端收藏狀態併入 hospital.js store，廢棄 favoriteHospital.js 本機 mock

比照 `hospital.js` 既有 `loadHospitalReviews`／`submitHospitalReview` 系列 action 的模式，新增：

- `filters.value.favoritesOnly`（預設 `false`）與 `setFavoritesOnly(value)` action，寫法比照 `set24H`：設值、重置分頁、呼叫 `loadHospitals({ page: 1 })`（沿用既有 `requestId` 競態保護，不需額外處理）
- `toggleFavoriteHospital(hospitalId, currentIsFavorite)` action：依 `currentIsFavorite` 呼叫 `addFavoriteHospital` 或 `removeFavoriteHospital`（`src/api/hospitals.js` 新增函式），成功後就地更新 `hospitals.value` 中對應醫院物件的 `isFavorite` 欄位

刪除 `src/stores/favoriteHospital.js`。`src/api/hospitals.js` 的 `normalizeHospital()` 新增 `isFavorite: Boolean(hospital.is_favorite ?? hospital.isFavorite)` 欄位映射；`buildHospitalListQuery()` 新增 `favorites_only: filters.favorites_only ?? filters.favoritesOnly`；`fetchHospitals` 的請求改帶 `getAuthHeaders()`（沿用寫入端點已有的函式），讓後端 `attachUserIfPresent` 在有登入時能辨識使用者。

### SearchBar.vue 新增收藏清單 Toggle，樣式完全比照 24 小時營業

在既有 24 小時營業 Toggle 區塊（`src/components/hospital/SearchBar.vue`）下方新增同樣結構的 pill-switch，文字「收藏清單」，`:class` 綁定 `filters.favoritesOnly`，`@click` 呼叫 `hospitalStore.setFavoritesOnly(!filters.favoritesOnly)`，維持與 24 小時營業一致的間距與版面，電腦版/平板/手機皆沿用既有 RWD class，不新增額外 breakpoint。

### HospitalCard.vue 收藏 Toggle 套用 duplicate-submit-guard 模式並補上登入檢查與 Toast

`HospitalCard.vue` 移除對 `useFavoriteHospitalStore` 的依賴，改為直接注入 `useAuthStore`、`useToastStore`、`useHospitalStore`（三者皆為既有全站 store，比照 `HospitalView.vue` 已用的方式）。新增元件本地 `isFavoriteToggling` ref（`false` 起始）——因為 `HospitalCard` 在列表中以 `v-for` 渲染，每張卡片各自是獨立元件實例，本地 ref 天然就是「per-hospital」的鎖，不會互相卡住。

`toggleFavorite` 函式邏輯：

1. Guard clause：`isFavoriteToggling.value` 為 `true` 時直接 return
2. 未登入檢查：`authStore.isLoggedIn` 為 `false` 時，呼叫 `toastStore.showToast('請先登入後再收藏醫院', 'error')` 後 return（訊息與登入導流方式比照 `HospitalView.vue` 現有的評論登入檢查）
3. 設定 `isFavoriteToggling.value = true`，呼叫 `hospitalStore.toggleFavoriteHospital(hospital.id, hospital.isFavorite)`
4. 失敗（`result.success === false`）：`toastStore.showToast(result.message, 'error')`，畫面愛心狀態維持 store 回傳的最新值（store 失敗時不會更動 `isFavorite`，因此畫面自然不會變動，不需要額外復原邏輯）
5. `finally` 區塊將 `isFavoriteToggling.value = false`

按鈕在 `isFavoriteToggling.value` 為 `true` 時加上 `disabled` 綁定與對應的視覺樣式（比照既有 disabled 按鈕的透明度處理）。

## Implementation Contract

**後端 API 行為：**

- `GET /api/v1/hospitals`：
  - 未登入（無 Authorization 或 token 無效）：行為與現況相同，回應不含 `is_favorite` 欄位；若帶 `favorites_only=true` 回 401 `{ message: '請先登入後查看收藏清單' }`
  - 已登入：每筆醫院物件多一個 `is_favorite: boolean` 欄位；帶 `favorites_only=true` 時，`hospitals` 陣列僅包含該使用者已收藏的醫院，分頁欄位（`total`/`total_pages`）依篩選後結果計算
- `POST /api/v1/hospitals/:hospital_id/favorite`（需登入）：
  - 成功：201 `{ message: '已加入收藏' }`
  - 已收藏過：409 `{ message: '此醫院已收藏' }`
  - `hospital_id` 不存在：404 `{ message: '找不到這間醫院' }`
- `DELETE /api/v1/hospitals/:hospital_id/favorite`（需登入）：
  - 成功：200 `{ message: '已取消收藏' }`
  - 收藏不存在：404 `{ message: '此收藏不存在，請重新確認' }`
- 未登入呼叫上述兩個寫入端點：401 `{ message: '未授權，請重新登入' }`（沿用 `authenticateToken` 既有行為）

**前端資料形狀：**

- `normalizeHospital()` 回傳的醫院物件新增 `isFavorite: boolean` 欄位
- `hospitalStore.filters` 新增 `favoritesOnly: boolean`（預設 `false`）
- `hospitalStore.toggleFavoriteHospital(hospitalId, currentIsFavorite)` 回傳 `{ success: boolean, message: string }`，成功時已同步更新 `hospitals.value` 對應項目的 `isFavorite`

**驗收標準：**

- 後端：`backend/test/hospital_favorites.schema.test.js`、`hospital_favorites.service.test.js`、`hospital_favorites.controller.test.js`、`hospital_favorites.route.test.js` 涵蓋上述所有狀態碼與訊息；`backend/test/hospitals.service.test.js` 新增 `favorites_only` 與 `is_favorite` 相關案例
- 前端：新增測試涵蓋 `setFavoritesOnly`／`toggleFavoriteHospital` action 行為，以及 `HospitalCard.vue` 收藏 Toggle 的 guard clause（連續觸發只送一次請求）與登入檢查
- 手動驗證：登入狀態下切換「收藏清單」Toggle 只顯示已收藏醫院、可與其他篩選共同使用；未登入時點擊愛心圖示跳出登入提示；快速連點同一張卡片的愛心圖示只送出一次 API 請求；對已收藏的醫院重複收藏顯示「此醫院已收藏」提示

**範圍邊界：**

- 範圍內：`GET /api/v1/hospitals` 擴充、新的收藏/取消收藏端點、`hospital_favorites` 資料表、`SearchBar.vue` 新 Toggle、`HospitalCard.vue` 收藏互動改接真實 API、`favoriteHospital.js` 移除
- 範圍外：`GET /hospitals/nearby`、`GET /hospitals/map` 兩個端點不新增 `is_favorite` 欄位；醫院詳情/評論相關功能不變動

## Risks / Trade-offs

- [Risk] `attachUserIfPresent` 讓 `GET /hospitals` 多一條驗證分支，可能與既有匿名瀏覽行為打架 → Mitigation：token 缺失或驗證失敗一律視同匿名放行、不中斷請求，僅在 `favorites_only=true` 時才由 controller 顯式擋 401，經既有 `hospitals.service.test.js` 補案例驗證匿名／登入兩種情境皆正確
- [Risk] `is_favorite` 需要對清單查詢多做一次 JOIN，可能拖慢清單查詢效能 → Mitigation：僅在 `req.userId` 存在時才加上 LEFT JOIN `hospital_favorites`，且該表已建立 `idx_hospital_favorites_user_id` 索引
- [Risk] 移除 `favoriteHospital.js` 可能有其他未預期的引用點 → Mitigation：實作前先搜尋 `useFavoriteHospitalStore` 確認所有引用點都已知（目前僅 `HospitalCard.vue`），逐一改寫後再刪除檔案

## Migration Plan

1. 新增 `backend/database/schema/hospital_favorites.sql`，並加入 `backend/scripts/setup-db.js` 的 `TABLES_IN_ORDER`
2. 本機／測試環境執行資料庫建表腳本套用新表
3. 後端部署新 route/controller/service/schema 與 `GET /hospitals` 的擴充——皆為新增或向下相容的變更，不影響現有呼叫端（未帶 `favorites_only` 且未登入時回應形狀不變）
4. 前端部署 `SearchBar.vue`／`HospitalCard.vue`／`hospital.js`／`hospitals.js` 的變更，同時移除 `favoriteHospital.js`
5. 無需 feature flag；若上線後發現問題，回滾前端與後端部署即可，資料表可保留不需回滾（不影響其他既有功能）
