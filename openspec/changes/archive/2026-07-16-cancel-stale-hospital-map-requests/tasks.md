## 1. API 取消契約

- [x] 1.1 依「API 回傳明確的取消結果」調整 src/api/hospitals.js 的 fetchMapHospitals(bounds, options = {})：將 options.signal 與既有 params、client ID headers 一起傳給 Axios，成功結果維持原資料形狀、Axios 取消回傳 canceled: true、一般失敗回傳 canceled: false 與既有錯誤訊息；以 src/test/hospitalApiIntegration.test.js 的 API 測試驗證 config.signal、取消結果及非取消錯誤結果。
- [x] 1.2 在 src/test/hospitalApiIntegration.test.js 建立可監聽 AbortSignal 的 Axios deferred mock，讓測試能以 abort 事件拒絕對應 promise，並以該測試確認取消判定使用 Axios 支援的取消語意而非比對錯誤文字。

## 2. 地圖請求生命週期

- [x] 2.1 依「AbortController 由 hospital store 擁有」與規格 Obsolete hospital map requests are canceled，調整 src/stores/hospital.js 的 loadMapHospitals：新查詢開始前 abort 前一個 controller、為新查詢傳入不同 signal，且只有最新 request ID 與目前 controller 可提交 mapHospitals、mapTruncated、mapError、mapLoading 或清除 controller 引用；以 store 競態測試驗證 A 被 B 取消、A 不改寫狀態、B 成功提交結果。
- [x] 2.2 依「保留 request ID 並在 store dispose 時清理」加入 hospital store scope 清理：dispose 時 abort 目前地圖 controller 並使其 request ID 失效，取消完成不得顯示 mapError 或修改 marker、截斷與載入狀態；以 src/test/hospitalApiIntegration.test.js 的 store disposal 測試驗證 signal.aborted 與狀態快照不變。
- [x] 2.3 保持一般地圖失敗與 retryMapQuery 行為：最新的非取消失敗仍顯示既有繁體中文 mapError，retryMapQuery 仍使用 lastMapQuery 的最後可見範圍；以 API 拒絕後重試的 store 測試驗證兩次 params 相同且取消不會觸發該錯誤路徑。

## 3. 整體驗證

- [x] 3.1 執行 node --test src/test/*.test.js，確認包含新增取消情境在內的前端 Node 測試全部通過，且既有清單、附近醫院及 request ID 競態測試沒有回歸。
- [x] 3.2 執行 npm run build，確認 AbortController 與 Axios signal 整合可完成 Vite production build，且未新增依賴或改變路由分塊。
- [x] 3.3 在瀏覽器快速拖曳並縮放 /hospital 地圖，於 Network 面板確認被新範圍取代的 /api/v1/hospitals/map 請求顯示 canceled、最後一筆正常完成並更新 markers，頁面不顯示取消錯誤 overlay。
