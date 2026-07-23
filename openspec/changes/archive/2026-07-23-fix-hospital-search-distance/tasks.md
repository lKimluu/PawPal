## 1. 前端真實定位查詢內容

- [x] 1.1 實作 `Hospital list supports contextual sorting and pagination` 與 `Send coordinates whenever real location is available`：先在 `src/test/hospitalApiIntegration.test.js` 加入真實定位下 keyword + `sort=relevance` 仍傳送成對 `lat`/`lng`、page/retry 保留座標，以及 fallback/no-location 搜尋不傳座標的案例；再調整 `src/stores/hospital.js` 的清單 query，使座標是否傳送只由 `hasRealLocation` 與有效 `userCoordinates` 決定，並以該測試檔通過驗證。

## 2. 後端距離投影與排序解耦

- [x] 2.1 實作 `Hospital list distance projection is independent from ordering`、`Separate distance projection from distance ordering` 與 `Preserve query parameter ordering and pagination`：先在 `backend/test/hospitals.service.test.js` 建立 relevance + coordinates、name + coordinates、no coordinates、null hospital coordinates 的 SQL/row mapping 測試，鎖定座標為前兩個 values、keyword relevance placeholder 接續 filters、limit/offset 位於最後，且 ORDER BY 不因距離投影改變；再調整 `findHospitals` 以完整座標對控制 Haversine `distance_km` SELECT、只以 `sort=distance` 控制距離排序，並確保 NULL distance 不會被轉為 `0`，以該測試檔通過驗證。

## 3. API 契約與完整回歸驗收

- [x] 3.1 驗證 `Hospital APIs expose reliable 24-hour and map data`：確認既有 query schema 仍接受 relevance/name 搭配完整座標、拒絕 partial coordinate pair 與 distance sort 缺座標，並執行 `node --test src/test/hospitalApiIntegration.test.js src/test/hospitalCardDistance.test.js`、`cd backend && node --test test/hospitals.schema.test.js test/hospitals.service.test.js`、`cd backend && npm test` 及根目錄 `npm run build`；驗收真實定位搜尋顯示距離且維持相關性排序、fallback 顯示距離未知、既有篩選與分頁無回歸。
