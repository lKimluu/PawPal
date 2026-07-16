## 1. 錯誤分類 helper

- [x] 1.1 在 backend/src/services/calendar_events_sync.service.js 新增 `isEventGoneError(error)`，行為：當 `error.status`（或 `error.response?.status`）為 404 或 410 時回傳 true，其餘回傳 false；驗證：新增 unit test 分別餵入 status 404、410、500、undefined 四種情況，確認回傳值正確。

## 2. pushEventToGoogle 補上 Fallback to creating a new Google event when the linked event is gone

- [x] 2.1 修改 `pushEventToGoogle`：呼叫 `patchGoogleCalendarEvent` 失敗且 `isEventGoneError(error)` 為 true 時，改呼叫 `insertGoogleCalendarEvent(connection, event)` 並回傳新產生的 google event id，達成 spec 中「Fallback to creating a new Google event when the linked event is gone」的要求；驗證：`backend/test/calendar_events_sync.test.js` 新增測試，mock `patchGoogleCalendarEvent` 拋出 `{ status: 404 }` 的 error，斷言接著呼叫了 `insertGoogleCalendarEvent` 且回傳值為新 id。
- [x] 2.2 同上情境補一組 status 410 的測試，確認 `pushEventToGoogle` 對 410 與 404 有相同的 fallback 行為；驗證：`backend/test/calendar_events_sync.test.js` 新增對應測試案例。
- [x] 2.3 確認 `pushEventToGoogle` 對非 404/410 的錯誤（例如 status 500）仍維持「Push local event changes to Google Calendar」的既有行為，直接將錯誤往外拋、不呼叫 insert；驗證：新增測試 mock `patchGoogleCalendarEvent` 拋出 `{ status: 500 }`，斷言 `insertGoogleCalendarEvent` 未被呼叫且錯誤有往外拋出。

## 3. 呼叫端行為與 Non-recoverable sync errors are surfaced as failed

- [x] 3.1 補測試驗證 `syncUpdatedEvent` 在 `pushEventToGoogle` 因 404 fallback 成功時，`setSyncState` 收到新的 `googleEventId` 且 `syncFailed: false`；驗證：`backend/test/calendar_events_sync.test.js` 新增 `syncUpdatedEvent` 測試案例。
- [x] 3.2 補測試驗證 `syncUpdatedEvent` 在遇到非 404/410 錯誤（如 500）時，符合「Non-recoverable sync errors are surfaced as failed」：`setSyncState` 被呼叫且 `syncFailed: true`，且傳入的 `googleEventId` 為 `undefined`（沿用 COALESCE 保留舊值）；驗證：既有 `backend/test/calendar_events_sync.test.js` 相關測試需維持通過，並新增針對此案例的斷言。

## 4. resync 路徑：Manual resync reuses the same push behavior

- [x] 4.1 補測試驗證 `resyncEvent` 在 `google_event_id` 已失效（patch 回 404）時，能透過 `pushEventToGoogle` 的 fallback 建立新事件、回傳 `{ status: 'synced', event }` 且 `event.google_event_id` 為新 id，達成 spec 中「Manual resync reuses the same push behavior」的要求；驗證：`backend/test/calendar_events_sync.test.js` 新增 `resyncEvent` 測試案例。

## 5. 驗證

- [x] 5.1 執行 `cd backend && npm test`，確認全部測試（含新增案例）通過。
