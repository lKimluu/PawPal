## 1. 移除元件層多餘初始化

- [x] 1.1 完成需求「Google Identity Services initializes exactly once per app session」：`LoginForm.vue` 移除 `<GoogleLogin>` 元件，改用套件匯出的 `googleTokenLogin()` 直接觸發登入按鈕點擊，不再於元件 mount 時額外呼叫 `accounts.id.initialize()`。驗證：`npm run build` 通過，且在瀏覽器開 `/login` 頁面時 console 不再出現 `[GSI_LOGGER]` 重複初始化警告。
- [x] 1.2 完成需求「Google Identity Services initializes exactly once per app session」：`RegisterForm.vue` 比照同樣方式移除 `<GoogleLogin>` 元件、改用 `googleTokenLogin()`。驗證：`npm run build` 通過，且在瀏覽器開 `/register` 頁面時 console 不再出現 `[GSI_LOGGER]` 重複初始化警告。

## 2. 驗證登入行為不變

- [x] 2.1 完成需求「Google OAuth login flow remains functional after removing per-component initialization」：確認點擊「使用 Google 帳戶登入」／「使用 Google 帳戶註冊」按鈕後，`googleTokenLogin()` 成功回傳 access token 並呼叫既有的 `handleGoogleLoginCallback`，登入成功導向 `/dashboard`。驗證：手動於瀏覽器完整走一次 Google OAuth popup 流程並確認導向結果。
- [x] 2.2 完成需求「Google OAuth login flow remains functional after removing per-component initialization」中使用者取消授權的情境：新增 `.catch(() => {})` 保留原本靜默吞錯行為。驗證：手動中途關閉 Google 授權彈窗，確認瀏覽器 console 沒有新增 `Uncaught (in promise)` 警告。
