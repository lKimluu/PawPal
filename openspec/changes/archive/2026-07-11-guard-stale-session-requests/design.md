## Context

PawPal 前端使用 Pinia 管理使用者私有資料。上一個 reset change 已把登入、登出與帳號切換的 session cleanup 集中到 `useSessionStore()`，並要求 medical、growth、pet、calendar store 提供 reset 行為。不過 reset 目前只清掉當下狀態，無法阻止 reset 前已開始的 async action 在 await 完成後繼續寫回資料。

這個 change 要補上 session 邊界的 request isolation，避免 A 帳號的 pending request 在 B 帳號 session 中回填狀態。相關 store 都是前端使用者私有資料，因此需要以安全資料隔離為主要目標。

## Goals / Non-Goals

**Goals:**

- `resetSessionStores()` 呼叫後，reset 前已開始的 medical、growth、pet、calendar 請求完成時不得再寫回舊 session 狀態。
- reset 後新 session 發出的請求仍可正常更新 store。
- 所有會在 await 後更新這四個 store 狀態的 async action 都遵守同一種 generation guard 模式。
- 新增可重現的競態測試，模擬「舊請求開始、reset 發生、舊請求最後完成」的順序。

**Non-Goals:**

- 不重寫 API client，也不導入 AbortController 或外部請求取消套件作為必要條件。
- 不變更後端 API、auth token、資料庫 schema 或 server-side authorization。
- 不處理同一 session 內多個有效請求互相覆蓋的排序競態。
- 不改變畫面樣式或 component 顯示文案。

## Decisions

### Use per-store request generation guards

每個 user-scoped store 維護自己的 request generation 數值。async action 開始時記錄當下 generation；reset 時遞增 generation 並清空狀態；await 完成後，action 只有在記錄的 generation 仍等於目前 generation 時，才能寫入資料、錯誤與 loading 狀態。

這比只在 `resetSessionStores()` 放全域 flag 更接近資料 owner：各 store 知道哪些 async action 會寫入自己的狀態，也能確保未來新增同 store action 時遵守相同模式。這也避免 session store 需要理解各資料 store 的內部請求生命週期。

替代方案是取消所有 pending request。取消請求可以節省網路與後端成本，但不同 API helper 目前沒有統一 cancellation 介面；只做取消也仍需要 guard，以處理無法取消或已完成的 promise。因此本 change 以 generation guard 作為必備保護，取消請求不列入範圍。

### Guard every state write after await

保護範圍包含成功回填資料、catch 中的錯誤狀態、finally 中的 loading 狀態，以及 create/update/delete 類 action 在 await 後觸發的後續 fetch。舊請求若 stale，必須安靜返回，不得清空新 session 狀態，也不得把 loading 改成 false 影響 reset 後的新請求。

這個決策避免出現只擋住資料寫入、但舊請求 finally 把 B 帳號的新 loading 關掉的半套競態。

### Add a deterministic stale request race test

測試需能控制 API promise 完成順序。測試情境固定為：先啟動 A session 的 fetch，保持 promise pending；呼叫 `resetSessionStores()`；再讓 A promise resolve；最後斷言 medical、growth、pet、calendar stores 沒有出現 A 資料。若測試也啟動 B session 請求，需額外斷言 A promise 先完成時不會覆蓋 B request 的 loading 或資料，B promise 完成後才可寫入 B 資料。

## Implementation Contract

**Behavior:** 登出或切換帳號觸發 `resetSessionStores()` 後，medical、growth、pet、calendar store 會清空目前狀態並讓 reset 前已開始的 async action 失效。舊 action 完成時不得修改資料陣列、selected pet、error message 或 loading/submitting flag。reset 後新 action 使用新的 generation，因此仍可正常顯示新帳號資料。

**Interface / data shape:** 不新增公開 API response 格式，也不改動 component props。各 store 的 `reset()` 繼續維持原有公開呼叫方式；generation guard 是 store 內部實作細節。若 async mutation action 原本回傳 `{ success, message }` 類結果，stale 情境不得回傳會讓 UI 顯示舊 session 成功或失敗訊息的結果。

**Failure modes:** Stale request 以安靜忽略為主，不向使用者顯示錯誤。真正屬於目前 generation 的 API 錯誤仍沿用既有錯誤處理與 loading 收尾。

**Acceptance criteria:** `node --test src/test/sessionStoreReset.test.js` 必須包含並通過 reset 後舊請求才完成的競態測試。`npm run build` 必須通過。手動 code review 可確認 medical、growth、pet、calendar 中所有 await 後狀態寫入都有 generation 檢查。

**Scope boundaries:** 本 change 僅限前端 Pinia store、session reset orchestration 與相關測試。不修改後端、不改 route、不改 component UI 樣式。

## Risks / Trade-offs

- [Risk] 只保護 fetch action，漏掉 create/update/delete action 在 await 後更新狀態 → Mitigation: tasks 明列四個 store 內所有 await 後會寫入 store 的 action，實作時逐一加 guard。
- [Risk] 舊請求的 finally 把新 session loading 關掉 → Mitigation: finally 也必須檢查 generation 仍有效才可寫入 loading/submitting flag。
- [Risk] 測試只檢查 reset 清空，不檢查舊 promise 晚完成 → Mitigation: 新測試必須使用可手動 resolve 的 deferred promise，明確控制 reset 與 promise resolve 的順序。
