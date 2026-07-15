## Why

瀏覽器 console 出現 `[GSI_LOGGER]: google.accounts.id.initialize() is called multiple times` 警告。根因是 `LoginForm.vue`、`RegisterForm.vue` 使用的 `<GoogleLogin popup-type="TOKEN" v-slot="{ activate }">` 元件，即使是自訂按鈕（slot）模式，套件（`vue3-google-login`）在元件 `onMounted` 時仍會無條件呼叫一次 `google.accounts.id.initialize()`，疊加上 `src/main.js` 全域 plugin install 時已呼叫過的一次，造成重複初始化警告。功能本身正常運作，此變更純粹是清除 console 雜訊、降低維運排查時的噪音。

## What Changes

- `LoginForm.vue`、`RegisterForm.vue` 移除 `<GoogleLogin>` 元件包裹，改為直接呼叫套件匯出的 `googleTokenLogin()` composable function 觸發 Google OAuth token 登入流程，不再觸發元件內部多餘的 `accounts.id.initialize()` 呼叫。
- 按鈕外觀、文字、既有的登入/註冊回呼邏輯（`handleGoogleLoginCallback`）完全不變。
- 新增 `.catch(() => {})` 保留原本「使用者取消授權時靜默不處理」的行為，避免改用 Promise 寫法後產生新的 `Uncaught (in promise)` console 警告。

## Non-Goals

- 不處理另一則 COOP `window.closed` 相關警告：該警告成因在 Google 官方 `accounts.google.com/gsi/client` 遠端 script 內部管理其自行開啟的 OAuth popup 時觸發，非本專案程式碼可控範圍，不在本次修改內。
- 不變更 `src/main.js` 的全域 `vue3-google-login` plugin 安裝方式（該處呼叫是唯一必要且預期內的初始化）。
- 不變更 `GoogleCalendarSyncButton.vue`（本來就沒有使用 `<GoogleLogin>` 元件，不受影響）。
- 不新增錯誤提示 UI：授權失敗/取消時維持現有的靜默行為，不在本次擴大範圍新增 toast 或錯誤訊息。

## Capabilities

### New Capabilities

- `google-login-single-init`: Defines that Google Identity Services (`accounts.id.initialize`) is initialized exactly once per app session, at app bootstrap, and is never re-triggered by mounting auth UI components.

### Modified Capabilities

(none)

## Impact

- Affected specs: google-login-single-init
- Affected code:
  - Modified:
    - `src/components/auth/LoginForm.vue`
    - `src/components/auth/RegisterForm.vue`
