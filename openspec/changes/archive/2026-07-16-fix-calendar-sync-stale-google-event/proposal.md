## Why

使用者手動在 Google Calendar 端刪除已同步的事件，或改連了另一個 Google 帳號後，`pushEventToGoogle`（backend/src/services/calendar_events_sync.service.js）仍會用同一顆已失效的 google_event_id 呼叫 patchGoogleCalendarEvent。Google 對已刪除或不存在的事件會回傳 404 或 410，目前程式碼沒有針對這兩種狀態碼做特殊處理，導致每次「重新同步」（resyncEvent）都必定失敗，使用者無法自行恢復同步。

## What Changes

- pushEventToGoogle 在呼叫 patchGoogleCalendarEvent 遇到 404/410 時，改為呼叫 insertGoogleCalendarEvent 建立新事件，並回傳新的 google_event_id
- 新增分類 helper（例如 isEventGoneError），依錯誤物件的 status（或 response.status）判斷是否為 404/410，沿用既有 isInvalidGrantError 的分類風格
- 非 404/410 的錯誤（如 500、逾時）維持原有行為：直接往外拋，由呼叫端標記 google_sync_failed = true
- setSyncState 既有的 COALESCE($2, google_event_id) 邏輯不需修改，fallback 成功後新 ID 會自然覆蓋舊 ID
- 補上對應測試：syncUpdatedEvent 與 resyncEvent 兩條路徑在收到 404/410 時應該 fallback 成功並寫回新 ID

## Non-Goals

- 不處理使用者換綁不同 Google 帳號時的所有權驗證，假設同步一律以目前連接的帳號為準
- 不重試非 404/410 的暫時性錯誤（如 500、逾時），這類錯誤維持現有的標記失敗、等使用者手動 resync 的行為
- 不改變 syncCreatedEvent、syncDeletedEvent、syncDeletedEvents 既有邏輯

## Capabilities

### New Capabilities

- `google-calendar-event-sync`: 定義本地行事曆事件與 Google Calendar 之間的同步行為，包含新增、更新（含失效事件 ID 的 fallback）、刪除、以及重新同步的規則

### Modified Capabilities

(none)

## Impact

- Affected specs: google-calendar-event-sync（新增）
- Affected code:
  - Modified: backend/src/services/calendar_events_sync.service.js
  - Modified: backend/test/calendar_events_sync.test.js
