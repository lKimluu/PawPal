## 1. Request generation guard implementation

- [x] 1.1 在 `src/stores/medical.js` 實作 Use per-store request generation guards，讓 `reset()` 遞增 generation 並清空 medical 狀態；`fetchRecords`、新增、更新、刪除 record 等所有 await 後狀態寫入都符合 Session reset invalidates stale store requests，完成後以 code review 確認每個 await 後的資料、錯誤與 loading 寫入都有 stale 檢查。
- [x] 1.2 在 `src/stores/growth.js` 實作 Use per-store request generation guards，讓 `reset()` 遞增 generation 並清空 growth 狀態；`fetchRecords`、create、update、delete 等所有 await 後狀態寫入都符合 Guard every state write after await，完成後以 code review 確認 stale request 不會寫入 records、errorMessage、isLoading 或 isSubmitting。
- [x] 1.3 在 `src/stores/petStore.js` 實作 Use per-store request generation guards，讓 `reset()` 遞增 generation 並清空 pet 狀態；`fetchUserPets`、`fetchPets`、create、update 等所有 await 後狀態寫入都符合 Session reset invalidates stale store requests，完成後以 code review 確認 stale request 不會寫入 pets、selectedPetId 或 isLoading。
- [x] 1.4 在 `src/stores/calendar.js` 實作 Use per-store request generation guards，讓 `reset()` 遞增 generation 並清空 calendar 狀態；`fetchEvents`、新增、更新、刪除 event 等所有 await 後狀態寫入都符合 Guard every state write after await，完成後以 code review 確認 stale request 不會寫入 events、error、selectedPetId 或 isLoading。

## 2. Session reset orchestration

- [x] 2.1 確認 `src/stores/session.js` 的 `resetSessionStores()` 仍呼叫 medical、growth、pet、calendar 的 `reset()`，並讓每個 reset 同時觸發 request invalidation；完成後以手動檢查確認登出與登入成功路徑都會經由 `useSessionStore()` 執行 reset。
- [x] 2.2 確認 current-session request 錯誤仍沿用既有處理，讓 Session reset preserves current-session error handling 成立；完成後以 code review 確認只有 stale generation 的錯誤被安靜忽略，reset 後新 request 的錯誤仍會進入原本 error state。

## 3. Race tests and validation

- [x] 3.1 在 `src/test/sessionStoreReset.test.js` 建立 Add a deterministic stale request race test，使用可手動 resolve/reject 的 deferred promise 模擬 medical、growth、pet、calendar request；完成後以 `node --test src/test/sessionStoreReset.test.js` 驗證「request 先開始、reset 先完成、舊 request 最後 resolve」時 stores 不會回填 account A 資料。
- [x] 3.2 擴充競態測試覆蓋「reset 後新 request 仍有效」與 Session reset preserves current-session error handling：舊 request resolve/reject 不更新 store，新 request resolve/reject 才套用現有成功或錯誤狀態；完成後以 `node --test src/test/sessionStoreReset.test.js` 驗證。
- [x] 3.3 執行前端驗證，確認 `node --test src/test/sessionStoreReset.test.js` 與 `npm run build` 均通過；完成後將兩個命令結果記錄在交付訊息。
