## 1. 共享定位狀態層

- [x] 1.1 建立 src/stores/location.js，完成 Store GPS state in a shared location Pinia store：提供 userLocation、isLocating、locationError、hasRequestedLocation、clearLocationError 初始與清除行為；以 src/test/locationStore.test.js 驗證初始狀態與清除錯誤。
- [x] 1.2 在 location store 實作 Home page automatically requests the user's current location 所需的 requestCurrentLocation：使用 navigator.geolocation.getCurrentPosition，成功時保存 { lat, lng }、清空錯誤、結束 loading；以 src/test/locationStore.test.js 模擬 latitude 25.033964 與 longitude 121.564468 驗證狀態。
- [x] 1.3 在 location store 實作 Frontend exposes location request states：定位請求期間 isLocating 為 true，成功或失敗後回到 false，重複觸發期間不得啟動第二個同時定位請求；以 src/test/locationStore.test.js 驗證 pending 與重複呼叫行為。
- [x] 1.4 在 location store 實作 Geolocation errors are handled without breaking public pages：瀏覽器不支援、PERMISSION_DENIED、POSITION_UNAVAILABLE、TIMEOUT、未知錯誤都轉成指定繁中訊息且不丟例外；以 src/test/locationStore.test.js 驗證每個錯誤分支。
- [x] 1.6 在 location store 實作已封鎖定位權限處理：使用 Permissions API 偵測 geolocation denied，顯示「定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試」，且不呼叫 getCurrentPosition；以 src/test/locationStore.test.js 驗證。
- [x] 1.5 確認 Do not call hospital APIs from GPS actions：location store 不新增 axios、GET /api/v1/hospitals 或 GET /api/v1/hospitals/nearby 呼叫；以 src/test/locationStore.test.js 或 source-level assertion 驗證沒有相關字串。

## 2. 首頁自動定位

- [x] 2.1 更新 src/views/HomeView.vue，完成 Home page automatically requests the user's current location 與 HomeView automatically requests GPS on page load：頁面 mounted 時自動呼叫 location.requestCurrentLocation，未登入訪客也會觸發；以 src/test/hospitalGpsView.test.js 驗證 HomeView 使用 location store 與 onMounted 自動定位。
- [x] 2.2 更新 HomeView 定位狀態 UI，讓定位中顯示「正在取得目前位置」、成功顯示已取得目前位置、錯誤顯示 locationError，且不移除既有最近醫院假資料卡片；以 src/test/hospitalGpsView.test.js 驗證文案與既有卡片區塊仍存在。

## 3. 醫院頁與地圖整合

- [x] 3.1 更新 src/views/HospitalView.vue，完成 Shared location state is available to public hospital map flows：醫院頁使用同一個 location store，提供重新取得目前位置按鈕，並將 userLocation 傳給 MapView；以 src/test/hospitalGpsView.test.js 驗證 HospitalView 使用 location store、定位 action 與 MapView prop。
- [x] 3.2 更新 HospitalView 定位狀態 UI，讓定位中顯示「定位中...」、成功顯示已取得目前位置、錯誤顯示 locationError，且按鈕可重新取得目前位置；以 src/test/hospitalGpsView.test.js 驗證這些文案與重試入口存在。
- [x] 3.6 更新 HospitalView 已封鎖定位權限 UI：權限為 denied 時顯示需從瀏覽器網址列或網站設定允許 PawPal 使用定位，按鈕顯示重新檢查定位權限；以 src/test/hospitalGpsView.test.js 驗證。
- [x] 3.3 更新 src/components/hospital/MapView.vue，完成 Hospital map centers on the user's current location 與 Center precedence favors user location after successful GPS lookup：新增 userLocation prop，center 優先使用 [userLocation.lat, userLocation.lng]，沒有 userLocation 時維持現有醫院中心與 Taipei fallback；以 src/test/hospitalGpsView.test.js 驗證 center precedence source。
- [x] 3.4 在 MapView 實作 Hospital map displays a user location marker 與 Keep MapView hospital rendering intact and add a separate user marker：使用獨立 Leaflet marker/icon 顯示 userLocation，popup 文案為「你目前的位置」，且不改用 HospitalMarker；以 src/test/hospitalGpsView.test.js 驗證 marker、popup 與 HospitalMarker 分離。
- [x] 3.5 確認 MapView 不改現有醫院假資料與醫院 marker 流程：沒有 userLocation 時仍使用 sourceHospitals、validHospitals、HospitalMarker 與目前統計資料；以 npm run build 和 src/test/hospitalGpsView.test.js 驗證既有資料流仍存在。

## 4. 驗證

- [x] 4.1 執行 node --test src/test/*.test.js，確認 location store、HomeView/HospitalView source-level 測試與既有前端測試全部通過；以命令輸出驗證。
- [x] 4.2 執行 npm run build，確認 Vue template、Leaflet marker 與 Pinia store 整合可成功建置；以命令輸出驗證。
- [x] 4.3 執行手動驗收：首頁載入會觸發瀏覽器定位，允許後 HospitalView 地圖中心移到使用者位置並顯示「你目前的位置」Marker，拒絕或失敗時首頁與醫院頁仍可使用且醫院頁可重新定位；以手動驗收紀錄驗證。
