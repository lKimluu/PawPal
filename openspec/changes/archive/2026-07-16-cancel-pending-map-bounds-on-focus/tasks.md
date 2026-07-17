## 1. 聚焦排程修正

- [x] 1.1 為 `Map bounds refresh follows the settled viewport without recentering` 補上回歸測試：驗證 scheduler 已有 pending callback 時，開始醫院聚焦會先取消它，取消後即使舊 timer callback 被模擬觸發也不會送出 bounds，且最終 `moveend` 仍能重新排程查詢；以 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js` 驗證。
- [x] 1.2 在 `src/components/hospital/MapView.vue` 的 `focusSelectedHospital` 進入 `selectionCoordinator.focus` 前呼叫 `boundsScheduler.cancel()`，使初始化、拖曳或縮放遺留的 debounce 不會在 `flyTo` 途中查詢；以 1.1 的回歸測試及原有重複選取／地圖初始化測試驗證最終 viewport 仍只查詢一次。

## 2. 整體驗證

- [x] 2.1 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js` 與 `npm run build`，確認手動 move/zoom debounce、程式化聚焦、popup／cluster 同步及前端 production build 均通過，且不修改 debounce 延遲、Axios 請求或後端 rate limit 行為。

## 3. 空選取排程保留修正

- [x] 3.1 為 `Map bounds refresh follows the settled viewport without recentering` 補上回歸測試：先建立手動移動或目前位置平移留下的 pending bounds callback，再讓 `selectedHospital` 變成 `null`，驗證 callback 未被取消、沒有啟動醫院聚焦，且 callback 執行時會查詢 settled viewport；以 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js` 驗證。
- [x] 3.2 在 `src/components/hospital/MapView.vue` 的 `focusSelectedHospital` 中，僅於存在有效 `selectedHospital` 且即將呼叫 `selectionCoordinator.focus` 時執行 `boundsScheduler.cancel()`；空選取時保留既有 pending bounds refresh，並以 3.1 的回歸測試驗證，同時確認有效醫院聚焦仍會取消舊 callback。

## 4. 修正後整體驗證

- [x] 4.1 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js` 與 `npm run build`，確認空選取保留 pending bounds refresh、有效醫院聚焦取消舊 callback、最終 `moveend` 查詢 settled viewport，且手動 move/zoom debounce 與 production build 均通過。
