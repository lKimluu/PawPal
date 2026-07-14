## 1. 首頁附近醫院摘要

- [x] 1.1 依「共用 hospital store 載入首頁摘要」與「保留版面並以真實狀態取代假卡片」決策，在 HomeView 完成 `Home page automatically requests the user's current location`、`Home page loads nearby hospital summaries` 與 `Home page represents hospital summary states without fake data`：定位完成後以 radius 5、limit 3 載入真實資料，桌機與手機呈現相同卡片、fallback、骨架、空結果及錯誤狀態；以 `node --test src/test/hospitalGpsView.test.js` 驗證。
- [x] 1.2 依「限定首頁靜態營業文案」決策，使真實摘要保留展示用「營業中」但不傳入任何營業查詢或篩選參數，滿足 `Hospital APIs expose reliable 24-hour and map data`；以 `src/test/hospitalGpsView.test.js` 的靜態文案與查詢參數斷言驗證。

## 2. 搜尋頁交接與競態

- [x] 2.1 依「卡片先選取再導頁」決策，讓卡片在導向 `/hospital` 前呼叫 `selectHospital(id)`、CTA 僅導頁，完成 `Home hospital cards transfer selection to full search` 與 `List selection navigates the independent map`；以 `node --test src/test/hospitalGpsView.test.js` 驗證選取與導頁合約。
- [x] 2.2 依「以 request-id 保護首頁到搜尋頁的導頁競態」決策，確認 limit 3 的首頁請求無法在較新的 limit 20 搜尋頁請求後提交，完成 `Newer full-search requests supersede home requests`；於 `src/test/hospitalApiIntegration.test.js` 加入延遲回應測試並執行該測試檔。

## 3. 整體驗證

- [x] 3.1 執行 `node --test src/test/hospitalGpsView.test.js src/test/hospitalApiIntegration.test.js` 與 `npm run build`，確認所有摘要狀態、fallback、導頁選取及競態驗證通過，且不修改後端 API、資料庫或新增套件。

## 4. 搜尋清單地圖聚焦

- [x] 4.1 依「以 selectionRequestId 驅動每次清單選取」決策，在 HospitalView 每次 `selectHospital` event 更新選取並遞增 `selectionRequestId`、傳入 MapView，使 `List selection navigates the independent map` 在重複點擊相同 id 時仍產生新聚焦請求；以 `src/test/hospitalApiIntegration.test.js` 的 selection request 斷言驗證。
- [x] 4.2 依「先同步 marker 再聚焦並開啟 popup」與「marker 重建後恢復選取 popup」決策，讓 MapView 對有效座標執行至少 zoom 15 的 `flyTo` 並由最新 marker 的 `zoomToShowLayer` callback 開啟 popup，map ready 與 bounds rebuild 後亦維持行為，無效座標則不操作地圖；以 `src/test/hospitalApiIntegration.test.js` 的 focus、popup、rebuild 與 invalid-coordinate 斷言驗證。
- [x] 4.3 執行 `node --test src/test/hospitalGpsView.test.js src/test/hospitalApiIntegration.test.js`、`npm run build` 與 `git diff --check`，確認新增地圖互動與既有首頁、搜尋、fallback、競態行為全部通過，且未修改後端 API、資料庫或套件依賴。

## 5. 地圖聚焦循環回歸修正

- [x] 5.1 修正「marker 重建後恢復選取 popup」：bounds 資料刷新只能在 popup 原本開啟時以停用 auto-pan 的直接 open 恢復最新 marker，不得呼叫 `flyTo` 或 `zoomToShowLayer`，使地圖可自由移動且不再循環查詢；以 `Map bounds refresh restores an open popup without refocusing or auto-pan` 測試驗證。
- [x] 5.2 執行 `node --test src/test/hospitalGpsView.test.js src/test/hospitalApiIntegration.test.js`、`npm run build` 與 `git diff --check`，確認 popup、重複選取、手動地圖移動與 bounds 查詢不形成回歸，且未修改後端 API、資料庫或套件依賴。

## 6. Popup 非同步競態修正

- [x] 6.1 依「以 Leaflet 移動完成事件協調 popup 與 marker 重建」決策，讓 `List selection navigates the independent map` 在 `flyTo` 完成後才顯示目前 generation 的 marker popup；選取流程中的 bounds 資料更新必須延後 cluster rebuild，`popupopen` 後再以停用 auto-pan 的方式套用最新 markers，快速新選取則取消舊 listener；以 `src/test/hospitalMapSelection.test.js` 的事件順序、過期選取與延後同步測試驗證。
- [x] 6.2 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalGpsView.test.js src/test/hospitalApiIntegration.test.js`、`npm run build` 與 `git diff --check`，確認 popup 必定在移動完成後開啟、重複選取可重開、手動移動不被鎖回且 bounds 查詢不形成循環，並確認未修改後端 API、資料庫或套件依賴。

## 7. 群組 Marker Popup 回歸修正

- [x] 7.1 依「等待 marker cluster 動畫完成後再展開選取 marker」決策，讓 `List selection navigates the independent map` 在 cluster animation counter 歸零後才呼叫 `zoomToShowLayer`，使群組內醫院可縮放或 spiderfy 至可見並開啟最新選取 popup；新選取與卸載須取消等待中的 `animationend`、`popupopen` listener，且不得改動已暫緩的 popup 閃爍流程；以 `src/test/hospitalMapSelection.test.js` 的動畫等待、一般 marker、群組 callback 與取消測試驗證。
- [x] 7.2 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalGpsView.test.js src/test/hospitalApiIntegration.test.js`、`npm run build` 與 `git diff --check`，確認群組 marker 能展開並開啟 popup、非群組與快速重選行為不回歸，且未修改後端 API、資料庫、cluster 設定或既有 popup 閃爍流程。

## 8. 重複座標 Spiderfy Popup 修正

- [x] 8.1 依「Spiderfy popup 關閉後才套用 deferred marker rebuild」決策，讓 `List selection navigates the independent map` 對完全相同座標的 spiderfied marker 在 popup 開啟期間保留既有 marker，bounds 更新只登記一個待同步狀態，`popupclose` 後以 `restoreOpenPopup: false` 套用最新 markers；新選取或 forced sync 須取消舊 listener，且非 spiderfy popup 的既有重建與閃爍行為維持不變；以 `src/test/hospitalMapSelection.test.js` 的兩筆與三筆重複座標、關閉後單次同步及過期 listener 測試驗證。
- [x] 8.2 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalGpsView.test.js src/test/hospitalApiIntegration.test.js`、`npm run build` 與 `git diff --check`，確認 spiderfy popup 在 bounds 更新後持續顯示、關閉後只同步一次、快速重選不回歸，且未修改後端 API、資料庫、cluster 設定或非 spiderfy popup 閃爍流程。

## 9. 地圖穩定視野與單次 Bounds 更新

- [x] 9.1 依「固定初始中心，後續移動使用明確命令」、「穩定視野後只查詢一次 bounds」與「重新定位成功後清除選取並移動一次」決策，完成 `Map bounds refresh follows the settled viewport without recentering` 與 `Hospital map centers on the user's current location`：MapView 建立時解析一次 `initialCenter`，bounds markers 更新不得觸發 `panTo`；選取醫院導頁省略額外 ready 查詢，單次手動縮放只排一個 debounced bounds request；重新定位成功才 `selectHospital(null)` 並以目前 zoom 移至新位置一次，失敗則保留選取與視野。先在 `src/test/hospitalMapSelection.test.js`、`src/test/hospitalGpsView.test.js` 與 `src/test/hospitalApiIntegration.test.js` 加入可重現回歸的失敗測試，再完成最小修正。
- [x] 9.2 執行 `node --test src/test/hospitalMapSelection.test.js src/test/hospitalGpsView.test.js src/test/hospitalApiIntegration.test.js src/test/locationStore.test.js`、`npm run build`、`git diff --check` 與 `spectra validate connect-home-nearby-hospitals`，確認進頁與縮放各只顯示一輪地圖更新、bounds 回應不造成位移、重新定位成功／失敗行為符合合約，且不修改後端 API、資料庫、cluster 設定、popup 內容或既有 spiderfy 行為。
