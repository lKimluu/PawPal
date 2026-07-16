## Problem

前一次修復（change fix-calendar-sync-stale-google-event）假設「使用者手動在 Google Calendar 刪除事件」會讓後續 patch 呼叫收到 HTTP 404 或 410 錯誤，因此只針對這兩種拋出的錯誤做 fallback（改呼叫 insertGoogleCalendarEvent 建立新事件）。

實際在本機手動測試時發現：對已被使用者刪除的事件呼叫 patch，Google Calendar API 並不會拋出錯誤，而是回傳 HTTP 200，且回應內容的 status 欄位為 cancelled。這代表刪除事件在 Google 端只是把它標記為 cancelled 的墓碑記錄，不是回應錯誤。目前的 pushEventToGoogle（backend/src/services/calendar_events_sync.service.js）沒有檢查 patch 成功後的回應狀態，所以完全不會走到 fallback，行程永遠停留在同一顆已失效（cancelled）的 google_event_id 上，使用者手動刪除事件後再也無法透過編輯或 resync 恢復同步。

## Root Cause

Google Calendar API 對「已刪除」事件的 patch 行為與原本假設不同：不是回傳 404/410 錯誤，而是回傳 200 成功、response.data.status = 'cancelled'。原本的判斷邏輯 isEventGoneError 只檢查被拋出的錯誤物件的 status，沒有檢查 patch 成功後的回應內容，因此漏掉了這個最常見的情境（使用者透過 Google Calendar 網頁手動刪除事件）。

## Proposed Solution

- patchGoogleCalendarEvent（backend/src/services/google_calendar.service.js）改為回傳 Google API 回應的 status 欄位，而不是回傳 undefined
- pushEventToGoogle（backend/src/services/calendar_events_sync.service.js）在 patch 成功後，額外檢查回傳的 status 是否為 cancelled；若是，視同事件已失效，改呼叫 insertGoogleCalendarEvent 建立新事件並回傳新 id
- 原本針對拋出的 404/410 錯誤的 fallback 邏輯維持不變，兩種情境（拋出錯誤 / 成功但 cancelled）都要能觸發 fallback
- 補上對應測試：syncUpdatedEvent 在 patch 回傳 cancelled 時應 fallback 建立新事件並寫回新 id

## Non-Goals

- 不處理 Google Calendar 其他非 cancelled 的事件狀態（例如 tentative、confirmed 以外的狀態變化）
- 不改變原本針對 404/410 拋出錯誤的 fallback 判斷邏輯，僅新增 cancelled 回應的判斷
- 不改變 syncCreatedEvent、syncDeletedEvent、syncDeletedEvents 既有邏輯

## Success Criteria

- 對已被使用者在 Google Calendar 手動刪除（status 變成 cancelled）的行程，透過編輯或 resync 觸發同步時，系統應建立一筆新的 Google Calendar 事件並將新 id 寫回 google_event_id
- 原本 404/410 錯誤觸發 fallback 的行為維持不變
- 非 cancelled、非 404/410 的錯誤（例如 500）維持原有行為：往外拋、標記 google_sync_failed

## Impact

- Affected specs: google-calendar-event-sync（修改「Fallback to creating a new Google event when the linked event is gone」這條 requirement）
- Affected code:
  - Modified: backend/src/services/google_calendar.service.js
  - Modified: backend/src/services/calendar_events_sync.service.js
  - Modified: backend/test/calendar_events_sync.test.js
