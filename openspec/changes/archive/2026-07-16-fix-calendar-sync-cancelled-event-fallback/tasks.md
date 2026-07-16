## 1. patchGoogleCalendarEvent 回傳回應狀態

- [x] 1.1 修改 backend/src/services/google_calendar.service.js 的 `patchGoogleCalendarEvent`：呼叫 Google Calendar patch API 後回傳 `response.data.status`（原本沒有回傳值），讓呼叫端能判斷這次 patch 命中的事件目前是什麼狀態；驗證：對照現有測試 `backend/test/calendar_events_sync.test.js` 中透過 mock 回傳字串（如 `'cancelled'`、`undefined`）的 `patchGoogleCalendarEvent` 案例，確認呼叫端能正確接收該回傳值。

## 2. pushEventToGoogle 補上 Fallback to creating a new Google event when the linked event is gone 的 cancelled 判斷

- [x] 2.1 修改 backend/src/services/calendar_events_sync.service.js 的 `pushEventToGoogle`：patch 呼叫成功但回傳的 status 為 `'cancelled'` 時，視同事件已失效，改呼叫 `insertGoogleCalendarEvent` 建立新事件並回傳新 id，達成 spec 中「Fallback to creating a new Google event when the linked event is gone」新增的 cancelled 情境；驗證：`backend/test/calendar_events_sync.test.js` 新增測試，mock `patchGoogleCalendarEvent` 回傳 `'cancelled'`，斷言接著呼叫了 `insertGoogleCalendarEvent` 且回傳值為新 id。
- [x] 2.2 確認原本針對拋出 404/410 錯誤的 fallback 邏輯不受影響，patch 成功且非 cancelled（例如回傳 `undefined` 或 `'confirmed'`）時仍直接回傳原本的 `google_event_id`；驗證：既有測試「syncUpdated：已有 google_event_id 應走 patch」需維持通過。

## 3. 呼叫端行為驗證

- [x] 3.1 補測試驗證 `syncUpdatedEvent` 在 `pushEventToGoogle` 因 patch 回傳 cancelled 而 fallback 成功時，`setSyncState` 收到新的 `googleEventId` 且 `syncFailed: false`；驗證：`backend/test/calendar_events_sync.test.js` 新增 `syncUpdatedEvent` 測試案例（mock `patchGoogleCalendarEvent` 回傳 `'cancelled'`）。

## 4. 驗證

- [x] 4.1 執行 `cd backend && npm test`，確認全部測試（含新增案例）通過。
- [x] 4.2 手動驗證：對一筆已同步的行程，在 Google Calendar 網頁手動刪除該事件，回 PawPal 編輯該行程存檔，確認 Google Calendar 出現一筆新事件，且該行程的 `google_sync_failed` 維持 `false`。
