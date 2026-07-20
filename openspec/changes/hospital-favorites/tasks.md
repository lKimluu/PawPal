## 1. 前端 UI（收藏清單 Toggle 與收藏愛心圖示的靜態版面）

- [x] 1.1 在 `src/components/hospital/SearchBar.vue` 的 24 小時營業 Toggle 下方新增「收藏清單」Toggle 按鈕，比照 design.md 決策「SearchBar.vue 新增收藏清單 Toggle，樣式完全比照 24 小時營業」，先綁定元件本地 ref（尚未接 store），驗證：手動於瀏覽器切換 Toggle 可看到開/關兩種明確視覺狀態，電腦版/平板/手機三種寬度版面正常，`npm run build` 通過
- [x] 1.2 `src/components/hospital/HospitalCard.vue` 的愛心圖示改用元件本地假狀態渲染 filled/empty 兩種圖示與 hover 效果，尚未呼叫任何 API（此本地假狀態將於第 4 段被真實 store 狀態取代），驗證：手動點擊愛心圖示可看到圖示在 filled/empty 間切換，`npm run build` 通過

## 2. 建置資料庫

- [x] 2.1 新增 `backend/database/schema/hospital_favorites.sql`，比照 design.md 決策「hospital_favorites 資料表結構比照 hospital_reviews.sql」，欄位含 id/hospital_id/user_id/created_at、雙邊 FOREIGN KEY ON DELETE CASCADE、UNIQUE (user_id, hospital_id) 唯一限制與 hospital_id/user_id 兩個索引，驗證：執行建表流程後以資料庫工具確認資料表與限制條件存在，插入重複 (user_id, hospital_id) 會被拒絕
- [x] 2.2 將 `hospital_favorites` 註冊進 `backend/scripts/setup-db.js` 的 `TABLES_IN_ORDER` 陣列尾端，驗證：執行專案既有建表指令成功建立 `hospital_favorites` 資料表且無錯誤

## 3. 製作後端 API

- [x] 3.1 新增 `backend/src/schemas/hospital_favorites.schema.js` 定義 `hospital_id` 路徑參數驗證，驗證：新增 `backend/test/hospital_favorites.schema.test.js` 涵蓋合法/不合法 `hospital_id` 案例並通過 `npm test`
- [x] 3.2 新增 `backend/src/services/hospital_favorites.service.js` 實作新增/移除收藏的資料存取邏輯，比照 design.md 決策「收藏／取消收藏採明確錯誤語意 409 / 404，不做冪等靜默成功」，重複收藏與收藏不存在時拋出對應自訂 Error class，實作規格需求「Authenticated users can add a hospital to their favorites」與「Authenticated users can remove a hospital from their favorites」的資料層行為，驗證：新增 `backend/test/hospital_favorites.service.test.js` 涵蓋新增成功、重複新增、移除成功、移除不存在四種案例並通過 `npm test`
- [x] 3.3 新增 `backend/src/controllers/hospital_favorites.controller.js` 將 service 拋出的錯誤轉換為 HTTP 狀態碼與中文訊息（201/409/404/500），驗證：新增 `backend/test/hospital_favorites.controller.test.js` 涵蓋成功、409、404、500 四種回應並通過 `npm test`
- [x] 3.4 在 `backend/src/routes/hospitals.route.js` 掛載 `POST /:hospital_id/favorite` 與 `DELETE /:hospital_id/favorite`（皆需 `authenticateToken`），落實規格需求「Authenticated users can add a hospital to their favorites」與「Authenticated users can remove a hospital from their favorites」中未登入回 401 的行為，驗證：新增 `backend/test/hospital_favorites.route.test.js` 涵蓋未帶 token 回 401 的案例並通過 `npm test`
- [x] 3.5 在 `backend/src/middlewares/auth.middleware.js` 新增 `attachUserIfPresent` middleware，比照 design.md 決策「GET /api/v1/hospitals 改為選擇性登入，新增 attachUserIfPresent middleware」，有效 token 設定 `req.userId`、無 token 或無效 token 一律放行且不回錯，驗證：新增單元測試涵蓋有效 token／無 token／無效 token 三種情境並通過 `npm test`
- [x] 3.6 `backend/src/schemas/hospitals.schema.js` 的 `hospitalsQuerySchema` 新增 `favorites_only` 可選布林參數；`backend/src/routes/hospitals.route.js` 的 `GET /` 掛上 `attachUserIfPresent`；`backend/src/controllers/hospitals.controller.js` 的 `listHospitals` 把 `req.userId` 傳入 service，且 `favorites_only=true` 但無 `req.userId` 時回 401，實作規格需求「Hospitals list API supports search filters and pagination」中新增的登入相關行為，驗證：`backend/test/hospitals.controller.test.js` 新增未登入帶 `favorites_only` 回 401 的案例並通過 `npm test`
- [x] 3.7 `backend/src/services/hospitals.service.js` 的 `findHospitals` 依 design.md 決策「用 favorites_only 參數擴充既有 GET /api/v1/hospitals，不另開收藏清單端點」，在有 `userId` 時 LEFT JOIN `hospital_favorites` 於每筆醫院附上 `is_favorite` 欄位，`favorites_only=true` 時以 `WHERE EXISTS` 僅回傳已收藏醫院，且可與 keyword/city/district/animal_type/is_24h/sort 等既有篩選條件共同套用，驗證：`backend/test/hospitals.service.test.js` 新增涵蓋 `is_favorite` 附加、`favorites_only` 過濾、`favorites_only` 與 `is_24h` 共同篩選三種案例並通過 `npm test`

## 4. 前後端串接（取代第 1 段的本地假狀態）

- [ ] 4.1 `src/api/hospitals.js` 新增 `addFavoriteHospital(hospitalId)` 與 `removeFavoriteHospital(hospitalId)` 函式呼叫 `POST`/`DELETE /:hospital_id/favorite` 並回傳 `{ success, message }`；`normalizeHospital()` 新增 `isFavorite` 欄位映射；`buildHospitalListQuery()` 新增 `favorites_only` 參數；`fetchHospitals` 請求加上既有 `getAuthHeaders()`，驗證：新增或更新前端 API 測試涵蓋新增/移除收藏成功與 409/404 錯誤訊息透傳，並通過前端測試指令
- [ ] 4.2 `src/stores/hospital.js` 新增 `filters.favoritesOnly` 與 `setFavoritesOnly(value)` action（比照既有 `set24H` 寫法），新增 `toggleFavoriteHospital(hospitalId, currentIsFavorite)` action 並在成功時就地更新 `hospitals.value` 對應項目的 `isFavorite`，落實 design.md 決策「前端收藏狀態併入 hospital.js store，廢棄 favoriteHospital.js 本機 mock」，驗證：新增測試涵蓋 `setFavoritesOnly` 觸發重新查詢與 `toggleFavoriteHospital` 成功/失敗後 store 狀態的變化，並通過前端測試指令
- [ ] 4.3 `SearchBar.vue` 的收藏清單 Toggle 改綁定 `hospitalStore.filters.favoritesOnly` 並呼叫 `hospitalStore.setFavoritesOnly`，取代第 1 段的本地假狀態，驗證：手動於瀏覽器登入狀態下切換 Toggle，畫面只顯示已收藏醫院，且可與 24 小時營業等既有篩選共同使用
- [ ] 4.4 `HospitalCard.vue` 改為注入 `useAuthStore`、`useToastStore`、`useHospitalStore`，新增元件本地 `isFavoriteToggling` ref，`toggleFavorite` 函式依序執行 guard clause、未登入時以 `toastStore` 顯示登入提示、呼叫 `hospitalStore.toggleFavoriteHospital`、失敗時以 `toastStore` 顯示錯誤訊息、`finally` 重置 loading 狀態，落實 design.md 決策「HospitalCard.vue 收藏 Toggle 套用 duplicate-submit-guard 模式並補上登入檢查與 Toast」與規格需求「Hospital favorite toggle applies the duplicate-submit guard」，驗證：新增前端測試模擬同一張卡片快速連續點擊只送出一次請求、失敗時按鈕恢復可點擊，並通過前端測試指令
- [ ] 4.5 刪除 `src/stores/favoriteHospital.js`，驗證：搜尋整個 `src` 目錄確認已無 `useFavoriteHospitalStore` 或 `favoriteHospital` 的引用，且 `npm run build` 通過
- [ ] 4.6 手動驗證完整流程：登入狀態下收藏/取消收藏醫院、重複收藏顯示「此醫院已收藏」提示、切換收藏清單 Toggle 且可與其他篩選共同使用、未登入點擊愛心圖示顯示登入提示、快速連點同一張卡片只送出一次請求，並在電腦版/平板/手機三種寬度下確認版面正常
