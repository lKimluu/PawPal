## Context

目前 HomeView 已有桌機與手機版各三張「最近醫院」假資料卡片，未來會根據使用者位置抓取最近三筆醫院。HospitalView 與 /hospital 路由是公開的，未登入訪客也能使用醫院地圖。MapView 目前在沒有 hospitals prop 時使用 src/data/hospitals.js 假資料，並以可定位醫院座標平均值作為 Leaflet 地圖中心。專案目前沒有 hospitalStore 或醫院 API service。

本 change 只建立全站共享 GPS 定位能力，讓 HomeView 自動取得座標，HospitalView 和 MapView 也能重用同一份座標。它不改後端、不串醫院清單 API、不串附近醫院 API，也不重構現有假資料地圖流程。

## Goals / Non-Goals

**Goals:**

- HomeView 載入時自動呼叫 navigator.geolocation.getCurrentPosition。
- 使用共享 Pinia store 管理使用者座標、定位中與定位錯誤狀態。
- 未登入訪客與已登入會員都使用同一份前端座標狀態。
- HomeView 顯示定位中、定位成功與定位失敗資訊，但不阻斷首頁瀏覽。
- HospitalView 提供重新取得目前位置入口。
- 使用者將瀏覽器定位權限設為封鎖時，顯示需到瀏覽器網站設定允許定位的提示。
- MapView 在使用者定位成功後將中心移到使用者位置。
- MapView 顯示使用者位置 Marker，並保留現有醫院 Marker。
- 使用繁體中文顯示定位狀態與錯誤訊息。

**Non-Goals:**

- 不呼叫 GET /api/v1/hospitals。
- 不呼叫 GET /api/v1/hospitals/nearby。
- 不修改後端、資料庫或 geocoding 腳本。
- 不實作附近醫院搜尋、半徑篩選或距離顯示。
- 不把首頁最近醫院卡片改成動態 API 資料。
- 不移除 src/data/hospitals.js，不改醫院假資料來源。
- 不將使用者位置儲存在 localStorage 或送到後端。
- 不安裝新套件。

## Decisions

### Store GPS state in a shared location Pinia store

新增 src/stores/location.js 管理 userLocation、isLocating、locationError、hasRequestedLocation 與 requestCurrentLocation。這讓 HomeView 自動定位、HospitalView 重新定位、MapView 顯示使用者位置都能共用同一份狀態，也讓後續 nearby API change 可直接重用 userLocation。

替代方案是建立 hospitalLocation store，但 GPS 需求已擴展到首頁最近醫院卡片，不再是醫院頁專用狀態。另一個替代方案是把 GPS 狀態放在 HomeView local refs，但 HospitalView 和後續 nearby API 仍需要跨頁讀取座標，會造成重複定位與狀態不同步。

### HomeView automatically requests GPS on page load

HomeView 在 mounted 時呼叫 location store 的 requestCurrentLocation，符合首頁最近醫院區塊未來要依位置抓最近三筆醫院的需求。定位失敗只顯示狀態訊息，不阻斷首頁內容、導覽或醫院地圖入口。

替代方案是首頁提供手動定位按鈕，但使用者已決定首頁載入自動觸發 GPS。為避免重複權限請求，store 需防止同時重複呼叫。

### Keep MapView hospital rendering intact and add a separate user marker

MapView 保留目前 sourceHospitals、validHospitals、HospitalMarker 與統計資訊流程，只新增 userLocation prop 與使用者位置 Marker。使用者 Marker 不使用 HospitalMarker，因為它不是醫院資料，不應顯示醫院 popup、營業狀態、評分或分類。

替代方案是把 userLocation 混進 hospitals 陣列，但這會污染醫院資料模型，也會讓 HospitalMarker 依賴不存在的醫院欄位。

### Center precedence favors user location after successful GPS lookup

MapView 的中心計算順序改成 userLocation 優先，其次是目前可定位醫院平均中心，最後才是 TAIPEI_CENTER。這符合首頁或醫院頁取得位置後，使用者到醫院地圖可立即看到自己的位置的預期。

替代方案是只顯示 user marker 但不移動地圖；在使用者座標和醫院座標相距較遠時，使用者會看不到 marker，定位功能的可見回饋不足。

### Do not call hospital APIs from GPS actions

requestCurrentLocation 只呼叫 browser geolocation API，不發送 GET /api/v1/hospitals 或 GET /api/v1/hospitals/nearby。首頁最近三筆醫院與附近醫院查詢會在後續 change 使用已取得的 userLocation 實作。

替代方案是在定位成功後立刻呼叫 nearby API，但這會把 GPS 權限、使用者座標、附近醫院資料流和距離顯示混進同一 change，超出本次範圍。

## Implementation Contract

- location store 提供 userLocation、isLocating、locationError、hasRequestedLocation、requestCurrentLocation、clearLocationError。userLocation 成功狀態格式為 { lat: number, lng: number }。
- requestCurrentLocation 在瀏覽器不支援 navigator.geolocation.getCurrentPosition 時，不丟出例外，必須設定 locationError 為「此瀏覽器不支援定位功能」並維持 userLocation 不變。
- requestCurrentLocation 開始時設定 isLocating 為 true、hasRequestedLocation 為 true 並清空 locationError；成功或失敗後必須將 isLocating 設回 false。
- requestCurrentLocation 在 isLocating 已為 true 時不得啟動第二個同時定位請求。
- getCurrentPosition options 使用 enableHighAccuracy true、timeout 10000、maximumAge 60000。
- location store 使用 navigator.permissions.query({ name: 'geolocation' }) 偵測 geolocation 權限狀態。若 Permissions API 不可用或查詢失敗，仍使用 navigator.geolocation.getCurrentPosition fallback。
- 當 geolocation 權限狀態為 denied，requestCurrentLocation 不呼叫 getCurrentPosition，必須設定 locationError 為「定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試」並結束 loading。
- Geolocation 錯誤訊息對應：PERMISSION_DENIED 為「定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試」；POSITION_UNAVAILABLE 為「目前無法取得位置，請稍後再試」；TIMEOUT 為「定位逾時，請重新取得目前位置」；其他錯誤為「定位失敗，請稍後再試」。
- HomeView 在 mounted 時呼叫 requestCurrentLocation。HomeView 顯示定位中、定位成功或 locationError 狀態，但首頁既有三張最近醫院假資料卡片和 CTA 仍可正常顯示。
- HospitalView 讀取同一個 location store，提供重新取得目前位置按鈕；按鈕在 isLocating 時顯示定位中狀態並避免重複觸發；定位失敗時顯示 locationError；定位成功時顯示已取得目前位置的狀態文字；權限狀態為 denied 時顯示需從瀏覽器網址列或網站設定允許 PawPal 使用定位的提示。
- HospitalView 將 userLocation 傳給 MapView。MapView 在 userLocation 存在時以 [lat, lng] 作為 Leaflet center 並顯示使用者位置 Marker；userLocation 不存在時維持目前醫院中心計算邏輯。
- MapView 的使用者位置 Marker 使用獨立 divIcon 或等效 Leaflet icon，popup 文案為「你目前的位置」。
- 本 change 不新增任何 axios 呼叫，不新增後端檔案修改，不新增套件依賴。
- 驗收以 node --test src/test/*.test.js、npm run build、source-level 測試與手動檢查為準。

## Risks / Trade-offs

- [Risk] 首頁載入立即觸發瀏覽器權限 prompt 可能打斷第一次進站體驗 → Mitigation: 定位結果只作為首頁最近醫院前置狀態，拒絕或失敗時首頁仍可正常瀏覽。
- [Risk] 瀏覽器定位只能在安全來源或 localhost 正常運作 → Mitigation: UI 必須處理定位失敗與不支援狀態，功能驗收可在 localhost 測試。
- [Risk] 使用者將權限設為一律拒絕後無法再次顯示瀏覽器權限 prompt → Mitigation: 偵測 denied 權限狀態並顯示需到瀏覽器網站設定允許定位的提示。
- [Risk] 地圖 center 只改 reactive center prop 可能不足以觸發 Leaflet 重新定位 → Mitigation: 優先用 @vue-leaflet 的 center prop；若 apply 驗證發現不會移動，再在 MapView 內以既有 LMap ref 或 vue-leaflet API 執行 setView，但不改醫院資料流。

## Migration Plan

- 新增共享 location store 與對應測試。
- 在 HomeView mounted 時自動請求定位，並顯示非阻斷定位狀態。
- 在 HospitalView 加重新定位控制 UI 並傳 userLocation 給 MapView。
- 在 MapView 新增 userLocation prop、center precedence 與 user marker。
- 執行前端測試與 npm run build。
- 若需回滾，移除本 change 新增的 store、測試與 HomeView/HospitalView/MapView GPS props 即可，既有醫院假資料與首頁假資料流程不受資料遷移影響。

## Open Questions

無。
