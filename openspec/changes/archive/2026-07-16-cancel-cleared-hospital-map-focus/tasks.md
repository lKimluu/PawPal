## 1. 選取取消回歸測試

- [x] 1.1 依 `Map bounds refresh follows the settled viewport without recentering` 在 `src/test/hospitalMapSelection.test.js` 與 `src/test/hospitalApiIntegration.test.js` 覆蓋清空選取時取消舊 selection coordinator callback、保留 pending bounds callback，並以 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js` 驗證修正前測試可重現問題。

## 2. 地圖 cleanup 與規格追蹤

- [x] 2.1 調整 `src/components/hospital/MapView.vue`，讓無有效選取時仍透過 `selectionCoordinator.focus(null)` 取消舊 focus/reveal/popup work，且只在有效醫院即將聚焦時呼叫 `boundsScheduler.cancel()`；以第 1.1 項測試驗證清空選取不開啟舊 popup 且 bounds refresh 仍執行。
- [x] 2.2 清理 `openspec/specs/hospital-api-integration/spec.md` 中 `cancel-pending-map-bounds-on-focus` 的 `@trace`，只保留實際相關的 `src/components/hospital/MapView.vue`、`src/test/hospitalMapSelection.test.js` 與 `src/test/hospitalApiIntegration.test.js`，並以內容檢查及 `spectra analyze cancel-cleared-hospital-map-focus --json` 驗證追蹤範圍。

## 3. 整體驗證

- [x] 3.1 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js` 與 `npm run build`，確認 selection cleanup、bounds debounce 與前端建置全部通過。

## 4. 取消聚焦時保留 marker 同步

- [x] 4.1 依 `Map bounds refresh follows the settled viewport without recentering` 在 `src/test/hospitalMapSelection.test.js` 新增回歸測試：focus 期間呼叫 `requestClusterSync()` 後再 `focus(null)`，必須取消過期 reveal callback、只執行一次排隊中的 `syncClusters({ restoreOpenPopup: true })`，且不再開啟 popup；以該測試在修正前失敗、修正後通過驗證。
- [x] 4.2 調整 `src/utils/hospitalMapSelection.js` 的 selection coordinator，使無有效 hospital 且沒有 replacement focus 時，在取消 pending focus/reveal work 後 flush 既有 `syncQueued`；有效的新 focus 仍由聚焦前的 marker rebuild 使用最新資料，並以第 4.1 項測試驗證不重複同步、不恢復已取消 popup，且不改變現有 Leaflet 手勢優先行為。
- [x] 4.3 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js`、`npm run build`、`spectra analyze cancel-cleared-hospital-map-focus --json` 與 `spectra validate cancel-cleared-hospital-map-focus`，確認 marker 同步、既有 selection/bounds 行為、建置及 artifacts 一致性全部通過。

## 5. 清除選取時停止未完成的地圖移動

- [x] 5.1 依 `Map bounds refresh follows the settled viewport without recentering` 在 `src/test/hospitalMapSelection.test.js` 新增回歸測試：`focus(hospital)` 啟動 `flyTo` 且仍有 pending `moveend` 時呼叫 `focus(null)`，必須先移除 listener 並對該次 movement 再呼叫一次 `map.stop()`，過期 callback 不得開啟 popup；另覆蓋 movement 已完成、只剩 reveal work 時清除選取不新增 stop call，並以測試在修正前失敗、修正後通過驗證。
- [x] 5.2 調整 `src/utils/hospitalMapSelection.js` 的 selection coordinator，在取消前以 pending `moveend` 判斷是否仍擁有未完成 movement；無 replacement focus 時先 cleanup listener/reveal，再停止該 movement，之後才 flush `syncQueued`，而有效 replacement focus 及已完成 movement 維持既有行為；以第 5.1 項測試驗證 stop 範圍、callback cleanup 與 marker sync 順序。
- [x] 5.3 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js`、`npm run build`、`spectra analyze cancel-cleared-hospital-map-focus --json` 與 `spectra validate cancel-cleared-hospital-map-focus`，確認動畫取消、marker 同步、既有 selection/bounds 行為、建置及 artifacts 一致性全部通過。
