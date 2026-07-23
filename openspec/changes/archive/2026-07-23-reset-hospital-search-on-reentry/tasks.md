## 1. Store 進頁狀態契約

- [x] 1.1 實作「以單一 enterHospitalPage action 建立頁面進入邊界」與「預設列表沿用附近醫院與情境排序」，完成 `Hospital page entry resets transient search state` 與 `Hospital page reset invalidates stale requests`：先在 `src/test/hospitalApiIntegration.test.js` 新增 store 行為測試，覆蓋完整 filters/results/pagination/map/retry 重置、regions/location 保留、舊 list/map resolve/reject 不回填與 map abort，再於 `src/stores/hospital.js` 實作同步 `enterHospitalPage()`；以該測試檔通過驗證。
- [x] 1.2 實作「以一次性入口快照保留首頁選取」的 `Hospital entry selection is explicit and single-use`：在 `src/test/hospitalApiIntegration.test.js` 新增有效/無效 pending hospital、只消耗一次、selected hospital snapshot fallback 與頁內改選清除 fallback 的案例，再於 `src/stores/hospital.js` 實作 `queueHospitalEntrySelection(hospital)` 及 selection computed/action 串接；以該測試檔通過驗證。

## 2. 頁面與地圖生命週期

- [x] 2.1 將 Hospitals 進頁與首頁入口接上 store 契約：`HospitalView` 在首次 render 前重置並於 mounted 載入 limit 20 預設附近列表，`HomeView` 傳入完整 hospital snapshot；更新 `src/test/hospitalApiIntegration.test.js` 與 `src/test/hospitalGpsView.test.js` 的 source integration assertions，驗證普通返回清除舊選取、首頁入口保留聚焦且正常搜尋 actions 未改變。
- [x] 2.2 實作「地圖初始化一律排程 bounds query」的 `Hospital map refreshes on every page entry`：調整 `MapView.onMapReady`，不論是否有 entry selection 都排程目前 bounds，並擴充 `src/test/hospitalApiIntegration.test.js` 驗證選取聚焦與 bounds refresh 同時發生且清單/地圖仍為獨立結果流。

## 3. 整體驗證

- [x] 3.1 執行 `npm test` 與 `npm run build`，確認全部前端測試與 production build 通過，並人工檢視 diff 確認未恢復診療動物篩選、未修改後端 API，且需求中的重新進頁重置、預設列表、地圖刷新與正常搜尋功能均有對應測試。

## 4. 入口快照評論摘要一致性

- [x] 4.1 實作「讓評論摘要同步入口快照」以完成 `Hospital entry selection is explicit and single-use`：先在 `src/test/hospitalApiIntegration.test.js` 新增 entry hospital 僅存在於 `entrySelectedHospital`、清單與地圖請求 pending 或失敗時，評論載入及成功 create/update/delete 後評分與評論數仍同步，且 `getHospitalById` 回傳最新 fallback 的案例；再於 `src/stores/hospital.js` 讓 `updateHospitalReviewSummary` 對相同 ID 的入口快照合併摘要並保留其他欄位，以該測試檔通過驗證。
- [x] 4.2 執行 `npm test` 與 `npm run build`，確認入口快照摘要同步未破壞既有評論 CRUD、重新進頁重置、清單／地圖資料優先順序與 production build，並以兩項命令皆成功作為驗證。

## 5. 初始地圖聚焦查詢協調

- [x] 5.1 實作「地圖初始化在聚焦完成後排程 bounds query」以完成 `Hospital map refreshes on every page entry`：先為 `MapView` 新增可重現初始 `flyTo` 超過 300ms debounce 的測試，驗證動畫途中不送出 bounds request、最終 `moveend` 後只查詢穩定 bounds，並驗證沒有實際移動時仍直接排程；再調整 `focusSelectedHospital()` 與 `onMapReady` 的協調結果，使查詢時機由是否啟動移動決定，以新增測試通過驗證。
- [x] 5.2 執行 `npm test` 與 `npm run build`，確認初始聚焦只產生一次有效 map bounds request、無移動初始化不漏查詢，且既有重新進頁重置、marker clustering、頁內選取與 production build 均維持通過。
