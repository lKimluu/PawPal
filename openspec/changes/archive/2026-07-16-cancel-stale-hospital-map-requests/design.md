## Context

醫院地圖在 Leaflet 的 moveend 與 zoomend 經排程後，透過 hospital store 呼叫地圖醫院 API。Store 已以遞增 map request ID 阻止過期回應提交狀態，但 Axios 請求本身仍會執行至完成。快速移動地圖時，這些已失去用途的查詢會繼續消耗瀏覽器連線、API rate limit 與後端資料庫資源。

本次變更只影響前端地圖查詢串流。既有清單、附近醫院、地區查詢與後端 API 契約不變。

## Goals / Non-Goals

**Goals:**

- 新地圖範圍查詢送出前，主動取消上一筆尚未完成的地圖請求。
- Axios 取消結果不得顯示為地圖載入錯誤，也不得清空或覆寫目前 marker。
- 保留 map request ID，持續防止無法及時取消或已進入完成階段的過期結果提交狀態。
- Store scope 銷毀時取消尚未完成的地圖請求。
- 以自動化測試驗證 signal 傳遞、取消時序、錯誤隔離與一般失敗行為。

**Non-Goals:**

- 不取消醫院清單、附近醫院或地區查詢。
- 不修改 Leaflet 的 bounds 排程或 debounce 時間。
- 不修改後端 endpoint、資料庫查詢、rate limit 設定或回應格式。
- 不移除既有 request ID 防線。
- 不新增使用者可見的「請求已取消」訊息。

## Decisions

### AbortController 由 hospital store 擁有

hospital store 是地圖請求生命週期與最新查詢順序的擁有者，因此由它保存目前的 AbortController。每次 loadMapHospitals 開始時，先 abort 前一個 controller，再建立新 controller 並把 signal 傳給 API。完成處理只在 controller 仍屬於目前請求時清除引用，避免舊請求的 finally 清掉新 controller。

替代方案是讓 API 模組維護全域 controller，但這會把請求順序與呼叫端生命週期藏在共用函式中，也會讓未來其他呼叫者互相取消，因此不採用。

### API 回傳明確的取消結果

fetchMapHospitals(bounds, options) 接受選用的 options.signal，並把 signal 傳入 Axios config。Axios 判定為取消時，函式沿用現有結果物件模式，回傳 success: false、canceled: true、空 hospitals、total: 0 與 truncated: false；一般失敗則回傳 success: false、canceled: false 與繁體中文錯誤訊息。

以明確 canceled 欄位區分控制流程與真正錯誤，可避免依賴錯誤訊息或 Axios 內部錯誤碼。替代方案是重新拋出取消例外，但會破壞目前 API helper 將錯誤正規化為結果物件的呼叫慣例。

### 保留 request ID 並在 store dispose 時清理

map request ID 繼續決定哪一筆請求可寫入 mapHospitals、mapTruncated、mapError 與 mapLoading。取消舊請求只是釋放資源，不取代狀態一致性檢查。最新請求若因外部 signal 被取消，store 不設定 mapError；被新請求取代的舊請求也不得把 mapLoading 設為 false。

Store scope dispose 時 abort 目前 controller，並使目前 request ID 失效，確保取消完成後不再提交狀態。此清理只針對地圖查詢，不影響其他 hospital store 查詢串流。

## Implementation Contract

**Behavior**

- 地圖請求 A 尚未完成時開始地圖請求 B，A 的 AbortSignal 必須變為 aborted，B 使用不同且未取消的 signal。
- A 的取消結果不得改變既有 markers、mapTruncated、mapError 或 B 所控制的 mapLoading。
- B 成功時，只有 B 的 hospitals 與 truncated 值可提交，且 mapLoading 結束。
- 最新地圖請求發生非取消錯誤時，mapError 顯示既有失敗訊息且可透過 retryMapQuery 重新查詢最後範圍。
- Hospital store dispose 時，目前地圖 signal 必須變為 aborted，後續完成處理不得更新 store 狀態。

**Interface / data shape**

- fetchMapHospitals 的呼叫契約為 fetchMapHospitals(bounds, options = {})，其中 options.signal 是可選 AbortSignal。
- Axios GET /api/v1/hospitals/map 的 config 同時保留 params、client ID headers，並加入 signal。
- API 成功結果維持 success、hospitals、total、truncated。
- API 取消結果包含 success: false、canceled: true、hospitals: []、total: 0、truncated: false，且不需要 message。
- API 一般錯誤結果包含 success: false、canceled: false、hospitals: []、total: 0、truncated: false、message。

**Failure modes**

- AbortController 不支援或 abort 發生得太晚時，request ID 仍阻止過期結果提交。
- 只有 Axios 認定的取消錯誤可被靜默處理；HTTP、網路與資料錯誤仍走既有錯誤顯示及重試流程。
- 取消不會清除目前已顯示的 marker，也不會產生 toast 或 map error overlay。

**Acceptance criteria**

- src/test/hospitalApiIntegration.test.js 覆蓋 signal 傳入 Axios、第二筆請求取消第一筆、取消不寫入錯誤、一般錯誤仍寫入錯誤，以及 store dispose 取消目前請求。
- node --test src/test/*.test.js 通過全部前端 Node 測試。
- npm run build 成功。
- 手動快速拖曳與縮放地圖時，開發者工具 Network 面板可觀察到被新範圍取代的 map 請求呈現 canceled，最後一筆請求正常完成並更新 markers。

**Scope boundaries**

- In scope：src/api/hospitals.js 的 map API options 與取消結果、src/stores/hospital.js 的 map controller 生命週期、src/test/hospitalApiIntegration.test.js 的相關測試。
- Out of scope：清單與附近醫院取消、MapView 排程調整、後端與資料庫修改、UI 文案新增。

## Risks / Trade-offs

- [Risk] 舊請求的完成區塊誤清除新 controller 或 loading state → 以 request ID 與 controller 身分比對限制清理權限。
- [Risk] 將一般 Axios 錯誤誤判為取消而隱藏故障 → 僅使用 Axios 官方取消判定，測試同時驗證一般錯誤仍可見。
- [Risk] 測試 mock 未模擬 signal abort，產生只驗證設定未驗證行為的假信心 → mock 必須監聽 signal 的 abort 事件並拒絕對應 promise。
- [Trade-off] request ID 與 AbortController 同時存在會增加少量狀態管理複雜度，但兩者分別保障狀態正確性與資源釋放，不能互相取代。
