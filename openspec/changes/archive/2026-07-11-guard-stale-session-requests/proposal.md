## Problem

登出或切換帳號時，`resetSessionStores()` 目前只同步清空 Pinia store 的既有狀態。若 medical、growth、pet 或 calendar store 在 reset 前已送出 API 請求，該請求於 reset 後才完成時，仍可能把上一個帳號的資料寫回 store，造成新帳號看到舊帳號資料。

## Root Cause

各資料 store 的 async action 在 `await` 後會直接寫入狀態，沒有檢查該請求是否仍屬於目前 session。`resetSessionStores()` 缺少讓既有 pending request 失效的機制，因此 reset 無法阻止舊請求完成後執行後續狀態更新。

## Proposed Solution

- 在 medical、growth、pet、calendar store 加入 request generation 或等價的 session token 檢查。
- 每次 store reset 時遞增該 store 的 generation，讓 reset 前已開始的請求在完成後被判定為 stale。
- 所有會在 `await` 後寫入上述 store 狀態的 async action，都必須在寫入資料、錯誤狀態或 loading 狀態前確認 generation 仍有效。
- 補上競態測試：請求先開始、session reset 先發生、舊請求最後才完成時，不得回填舊帳號資料。

## Non-Goals

- 不導入全域請求取消框架或重寫 API client。
- 不改變後端 API、資料庫 schema 或認證 token 格式。
- 不處理同一個 session 內多個查詢互相覆蓋的排序問題；本 change 只處理 reset/account switch 邊界造成的 stale request 回填。

## Success Criteria

- `resetSessionStores()` 呼叫後，reset 前已開始的 medical、growth、pet、calendar 請求完成時不得寫回該 store 的資料、錯誤或 loading 狀態。
- reset 後新 session 發出的請求仍可正常更新 store。
- 新增測試覆蓋「reset 後舊請求才完成」的競態情境。
- `node --test src/test/sessionStoreReset.test.js` 通過。
- `npm run build` 通過。

## Capabilities

### New Capabilities

- `session-store-reset`: Defines frontend session reset behavior, including stale in-flight request isolation for user-scoped Pinia stores.

### Modified Capabilities

(none)

## Impact

- Affected code:
  - Modified: src/stores/medical.js
  - Modified: src/stores/growth.js
  - Modified: src/stores/petStore.js
  - Modified: src/stores/calendar.js
  - Modified: src/stores/session.js
  - Modified: src/test/sessionStoreReset.test.js
  - New: openspec/changes/guard-stale-session-requests/specs/session-store-reset/spec.md
  - New: openspec/changes/guard-stale-session-requests/tasks.md
  - Removed: (none)
