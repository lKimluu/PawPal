## Why

目前登出流程只重置 medical store，其他使用者範圍的 Pinia 狀態仍留在瀏覽器記憶體中。使用者登出後切換帳號時，成長紀錄、寵物選擇或儀表板資料可能短暫或持續顯示前一個帳號的內容，造成跨帳號資料洩漏風險。

## What Changes

- 各使用者資料 store 保留並實作自己的 `reset()`，只清除該 store 擁有的狀態。
- 新增集中式 session store cleanup 流程，統一重置 medical、growth、pet 與其他使用者範圍狀態。
- 登出與帳號切換流程統一執行 session cleanup，不再由 UI 元件單獨重置 medical store。
- 補上測試，驗證 A 帳號登出後登入 B 帳號時不會保留 A 帳號的 Pinia 狀態。

## Capabilities

### New Capabilities

- `session-store-reset`: 定義身分 session 結束或帳號切換時，前端必須集中清除所有使用者範圍 Pinia 狀態。

### Modified Capabilities

（無）

## Impact

- Affected specs: `session-store-reset`
- Affected code:
  - Modified: `src/stores/medical.js`, `src/stores/growth.js`, `src/stores/petStore.js`, `src/stores/calendar.js`, `src/components/layout/DashboardSidebar.vue`, `src/components/auth/LoginForm.vue`, `src/views/LoginView.vue`
  - New: `src/stores/session.js`, `src/test/sessionStoreReset.test.js`
  - Removed: 無
- APIs and backend: 不變更後端 API、資料庫或認證 token 格式
