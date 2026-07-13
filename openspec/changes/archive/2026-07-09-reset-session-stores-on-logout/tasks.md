## 1. Store reset contracts

- [x] 1.1 實作「Each user-scoped store owns its reset behavior」：在 `src/stores/growth.js`、`src/stores/petStore.js`、`src/stores/calendar.js` 新增同步 `reset()`，並確認 `src/stores/medical.js` 保留既有 reset contract，使各 store 將 data、loading、error 與 selection 還原為 design 的初始值；以 `node --test src/test/sessionStoreReset.test.js` 驗證每個公開 action 與預設值。

## 2. Session lifecycle coordination

- [x] 2.1 依「使用 session lifecycle store 作為登入與登出的協調入口」及「僅在認證狀態確定轉換時重置」，新增 `src/stores/session.js` 的 `login(email, password)`、`logout()`、`resetSessionStores()`：登入成功與登出清除 medical、growth、pet、calendar，登入失敗不清除，且不形成 auth/calendar 循環 import；以 `node --test src/test/sessionStoreReset.test.js` 驗證「Session transitions clear user-scoped stores」的成功、失敗與登出路徑。
- [x] 2.2 依「登入與登出 UI 改用 session lifecycle store」及「Session lifecycle is the single mutation entry point」，將 `src/components/layout/DashboardSidebar.vue`、`src/components/auth/LoginForm.vue`、`src/views/LoginView.vue` 改由 session store 執行 login/logout，使 UI 不再直接組合 auth mutation 與特定資料 store reset；以 `node --test src/test/sessionStoreReset.test.js` 驗證三個入口沒有繞過 session lifecycle。

## 3. Verification

- [x] 3.1 依「每個使用者資料 store 自行實作 reset contract」補齊 `src/test/sessionStoreReset.test.js`，具體覆蓋 A 帳號已有 medical、growth、pet、calendar 狀態後登出、成功切換 B 帳號，以及登入失敗保留目前狀態；執行 `node --test src/test/sessionStoreReset.test.js` 並確認全部通過。
- [x] 3.2 驗證 Implementation Contract 與完整前端整合：執行 `npm run build`，並人工確認 logout 後 auth storage 已移除、所有使用者 store 為初始值，登入成功回傳前 cleanup 已完成，且 toast、sidebar、favoriteHospital 未被 session cleanup 重置。
