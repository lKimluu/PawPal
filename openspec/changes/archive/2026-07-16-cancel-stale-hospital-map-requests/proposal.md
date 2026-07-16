## Summary

使用 Axios AbortController 主動取消已被後續地圖範圍查詢取代的請求，降低無效網路與後端負載，並維持最新查詢才能更新地圖狀態的既有契約。

## Motivation

使用者快速拖曳或縮放地圖時，前端會連續送出多筆地圖醫院查詢。現有 request ID 能阻止較舊回應覆蓋狀態，但過期請求仍會持續佔用瀏覽器連線、API rate limit 與後端查詢資源，因此需要在新查詢開始時主動中止上一筆未完成的地圖請求。

## Proposed Solution

- 讓地圖醫院 API 函式接受 AbortSignal，並將 signal 傳入 Axios GET 設定。
- 由 hospital store 管理目前地圖請求的 AbortController；新地圖查詢開始前先取消上一筆未完成請求。
- 將 Axios 取消結果明確標示為取消狀態，避免取消被當成一般錯誤並寫入地圖錯誤訊息。
- 保留既有 map request ID 防線，確保即使底層請求無法及時中止，過期結果仍不能更新地圖資料、截斷提示、錯誤或載入狀態。
- 在 store dispose 時取消仍在進行中的地圖請求，避免離開頁面後保留無效工作。
- 補充 API 與 store 測試，驗證 signal 傳遞、替代請求取消、取消不顯示錯誤，以及一般錯誤仍可重試。

## Alternatives Considered

- 僅沿用 request ID 忽略過期回應：可以維持畫面正確，但不會釋放瀏覽器、rate limit 與後端資源。
- 只增加地圖事件 debounce：可降低請求數量，但無法處理已送出且被新範圍取代的請求，因此不取代 AbortController。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `hospital-api-integration`: 擴充地圖請求一致性規範，要求前端主動取消已被取代的 Axios 地圖請求，且不將取消視為可顯示錯誤。

## Impact

- Affected specs: hospital-api-integration
- Affected code:
  - Modified:
    - src/api/hospitals.js
    - src/stores/hospital.js
    - src/test/hospitalApiIntegration.test.js
  - New: none
  - Removed: none
