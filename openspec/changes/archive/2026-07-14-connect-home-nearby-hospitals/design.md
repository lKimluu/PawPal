## Context

首頁已透過 `useLocationStore` 自動取得共享 GPS 位置，但三張醫院卡片仍是寫死資料。完整搜尋頁已透過 `useHospitalStore.loadNearbyHospitals` 使用相同位置、台北市中心 fallback、request-id 防競態與選取醫院地圖聚焦，因此首頁應延續這套狀態與 API，而不建立第二套查詢邏輯。

## Goals / Non-Goals

**Goals:**

- 首頁顯示最多 3 筆真實附近醫院摘要，桌機與手機共用同一資料來源。
- 定位失敗時仍提供台北市中心附近結果，並清楚揭露 fallback。
- 卡片點擊把選取醫院交接給完整搜尋頁，快速導頁時不讓舊首頁請求覆蓋新頁結果。
- 完整搜尋清單每次點擊醫院都驅動地圖聚焦與 popup，即使重複點擊同一醫院或 marker cluster 被 bounds 結果重建。
- 對 loading、empty 與 API error 提供可辨識的繁體中文狀態。

**Non-Goals:**

- 不修改後端 API、資料庫、搜尋半徑上限或完整搜尋頁篩選器。
- 不實作真實營業中判斷或依營業狀態排序。
- 不新增醫院詳細頁、首頁分頁、重試按鈕或其他首頁服務連結。
- 不修改既有 popup 內容、樣式、地圖 API 或 marker clustering 套件。

## Decisions

### 共用 hospital store 載入首頁摘要

首頁在定位請求完成後呼叫 `loadNearbyHospitals({ location, locationError, radius: 5, limit: 3 })`。共用 store 可直接沿用 normalization、fallback 訊息、錯誤狀態與 request-id；相較於 HomeView 直接呼叫 API 並建立區域狀態，這也能讓被點選的醫院物件在導頁期間維持可用。

### 以 request-id 保護首頁到搜尋頁的導頁競態

完整搜尋頁 mounted 時仍會以 limit 20 重新查詢。若使用者在首頁請求完成前導頁，較新的搜尋頁請求會取得較大 request-id，首頁舊回應不得提交清單、錯誤或 loading 狀態。

### 卡片先選取再導頁

首頁卡片使用明確 click handler：先呼叫 `selectHospital(hospital.id)`，再由 router 前往 `/hospital`。完整搜尋頁既有 `selectedHospital` 與 MapView watcher 會聚焦並開啟 popup；CTA 不呼叫選取方法。

### 保留版面並以真實狀態取代假卡片

桌機與手機維持既有卡片外觀，但迴圈資料改為相同的最多 3 筆 normalized hospitals。距離為有限數值時格式化至一位小數；載入顯示 3 個骨架卡片，成功零筆與錯誤各顯示一個狀態區塊，假醫院名稱不得保留。

### 限定首頁靜態營業文案

依產品決策，首頁摘要暫時顯示「營業中」視覺文字，但不得根據 `is_24h` 或其他缺乏營業時間依據的欄位推論，不得影響附近 API 的距離排序。完整搜尋頁與 API 仍禁止推論 current-open 狀態。

### 以 selectionRequestId 驅動每次清單選取

HospitalView 維持遞增的 `selectionRequestId`，每次收到清單或地圖的 `selectHospital` event 都先更新 store 選取 id，再遞增 request id 並傳給 MapView。MapView 監聽 selected id 與 request id 的組合，避免只監聽 selected hospital object 而漏掉重複點擊同一醫院。相較於把 store id 暫時清空或直接操作 child ref，遞增 prop 保持單向資料流且不製造假的未選取狀態。

### 先同步 marker 再聚焦並開啟 popup

MapView 將聚焦集中在單一 helper：驗證醫院座標與 map readiness、同步 cluster markers、以至少 zoom 15 執行 `flyTo`，再從 `markerById` 取得當前 marker，透過 `zoomToShowLayer` callback 開啟 popup。Map 尚未 ready 時保留目前選取，並在 `onMapReady` 後執行相同流程。

### marker 重建後恢復選取 popup

Bounds API 更新 `mapHospitals` 時，`syncClusters` 會清除並重建 markers。重建前僅記錄選取 marker 的 popup 是否確實開啟；重建後若原 popup 為開啟狀態，使用新的 marker instance 直接恢復 popup，並暫時停用 popup auto-pan。資料刷新不得呼叫 `flyTo` 或 `zoomToShowLayer`，避免再次觸發 bounds 查詢循環；使用者已手動關閉 popup 時也不得擅自重開。

### 以 Leaflet 移動完成事件協調 popup 與 marker 重建

每次明確選取建立新的 focus generation，並在啟動 `flyTo` 前註冊一次性 `moveend` listener；只有目前 generation 能在移動完成後呼叫 `zoomToShowLayer`。地圖已位於目標且 zoom 至少為 15 時直接進入顯示 marker 流程。從選取開始到 marker 發出 `popupopen` 期間，`validHospitals` 更新只能記錄一次待同步狀態，不得清除 cluster 中的 marker；popup 開啟後再同步最新資料，並沿用停用 auto-pan 的 popup 恢復方式。新的選取、無效座標與元件卸載必須移除舊 listener 並清除 pending 狀態。

### 等待 marker cluster 動畫完成後再展開選取 marker

`moveend` 只代表 Leaflet 地圖移動完成，不保證 marker-cluster 的拆分動畫已結束。顯示選取 marker 前須檢查目前 cluster animation counter；若仍有動畫，使用公開的 `animationend` event 持續等待，直到 counter 歸零才呼叫 `zoomToShowLayer`。一般未分組 marker 仍直接開啟；群組 marker 則由套件繼續縮放或 spiderfy，callback 確認 marker 仍屬於最新選取後才開啟 popup。取消函式必須同時移除 `animationend` 與 `popupopen` listener。此修正不改變 popup 開啟後執行 deferred marker rebuild 的既有流程，因此不處理使用者已暫緩的短暫閃爍。

### Spiderfy popup 關閉後才套用 deferred marker rebuild

完全相同座標的 marker 到最大縮放後仍在同一 cluster，`zoomToShowLayer` 會以 spiderfy 顯示。若 popup 開啟後立即執行 deferred `clearLayers`，spiderfied marker 會被移除；新 marker 仍在折疊 cluster 中，直接 `openPopup` 無法恢復。因此 `syncClusters({ restoreOpenPopup: true })` 遇到 popup 開啟且 marker 具有 spiderfy 暫存座標時，只登記一個 `popupclose` listener 並保留最新待同步狀態。popup 關閉後以 `restoreOpenPopup: false` 同步一次；新選取或 forced sync 必須先移除舊 listener，避免過期關閉事件干擾最新選取。一般非 spiderfy popup 仍沿用既有重建與恢復流程，先前暫緩的一般閃爍不在本次處理範圍。

### 固定初始中心，後續移動使用明確命令

`LMap` 會監聽 reactive `center` prop 並在座標改變時呼叫 `panTo`。若 `center` 由每次 bounds API 回傳的 marker 平均座標計算，資料刷新會改變中心、觸發下一輪 bounds 查詢並造成使用者未操作的位移。MapView 因此只在建立時依「選取醫院、共享使用者位置、初始有效 markers 平均、`TAIPEI_CENTER`」優先順序解析一次 `initialCenter`；後續 marker rebuild 不得修改它。選取醫院仍只由 selection coordinator 執行 `flyTo`，避免 reactive center 與 coordinator 同時移動地圖。

### 穩定視野後只查詢一次 bounds

沒有選取醫院時，map ready 直接排定一次初始 bounds 查詢。有有效選取醫院時，不在 ready 階段另排查詢，而由 `flyTo` 完成所發出的 `moveend`／`zoomend` 經既有 300ms debounce 合併成一次查詢。一般手動縮放也使用同一 debounce；bounds 回應只重建 markers，因此不會再產生程式化移動或後續查詢。

### 重新定位成功後清除選取並移動一次

醫院頁的重新定位 action 只有在 `requestCurrentLocation()` 成功時清除 `selectedHospitalId`。MapView 監聽共享位置座標的實際更新，在 Vue 完成同批 selection prop 更新後，若已無選取醫院，使用目前 zoom `panTo` 新位置一次；其 `moveend` 再觸發一次 bounds 查詢。定位失敗時不得清除選取、關閉 popup 或移動地圖。

## Implementation Contract

- **Behavior:** 首頁載入時先完成共享定位請求，再查詢半徑 5 公里、limit 3 的附近醫院；有效定位使用使用者座標，失敗或不可用時使用 `TAIPEI_CENTER` 並顯示「未取得目前位置，顯示台北市中心附近醫院。」。完整搜尋清單每次點擊有座標的醫院時，地圖移動至該醫院、縮放至至少 zoom 15，並在 Leaflet 與 marker-cluster 動畫完成後開啟 popup；群組 marker 必須縮放或 spiderfy 至可見，移動期間抵達的 bounds 資料不得使 popup 指向已移除的 marker。地圖建立後的 bounds 資料只能更新 markers，不能改變中心；map ready、手動縮放與成功重新定位均在最終視野穩定後各查詢一次。
- **Interface / data shape:** 首頁只消費 hospital store 已正規化的 `visibleHospitals`、`isLoading`、`errorMessage` 與 `locationFallbackMessage`。卡片所需欄位為 `id`、`name`、`district`、`distanceKm`；導頁介面為 `selectHospital(id)` 後 `router.push('/hospital')`。HospitalView 傳給 MapView 的介面包含 Number prop `selectionRequestId`；MapView 的 `initialCenter` 是建立時的一次性座標，重新定位成功沿用 `selectHospital(null)` 清除選取，不新增後端或 store API。
- **Failure modes:** loading 顯示 3 個不含假資料的骨架；成功零筆顯示「附近 5 公里內暫無醫院」；API 失敗顯示既有 error message。所有狀態仍保留「立即搜尋醫院」入口。選取醫院缺少有效座標時只保留清單選取，不呼叫地圖移動或 marker popup；map 尚未 ready 時於 ready 後執行待處理聚焦；新選取會取消舊 focus listener；一般 bounds 更新延後到 popup 開啟後重建 marker，spiderfy popup 則延後到 `popupclose` 後重建。定位失敗保留原選取與視野，成功才清除選取並移動一次。
- **Acceptance criteria:** `src/test/hospitalGpsView.test.js` 驗證首頁資料、初始中心、重新定位成功與失敗合約；`src/test/hospitalApiIntegration.test.js` 驗證 limit 3、fallback、競態、selection request、zoom 15、popup、marker rebuild 與 bounds 回應不重新置中；`src/test/hospitalMapSelection.test.js` 驗證 cluster animation settle、群組展開、spiderfy popup 延後同步、過期 listener、popup 開啟順序與 bounds debounce；相關 Node tests、`npm run build` 與 `git diff --check` 通過。
- **In scope:** 首頁附近醫院摘要、共享 store 導頁狀態、完整搜尋清單選取後的地圖聚焦與 popup、相應規格與前端測試。
- **Out of scope:** 後端修改、真實營業狀態、醫院詳細頁、收藏、首頁重試互動、popup 內容重設計，以及非 spiderfy popup 開啟後 deferred marker rebuild 造成的短暫閃爍。

## Risks / Trade-offs

- [首頁與搜尋頁共用清單可能互相覆蓋] → 既有單調遞增 request-id 保證只有最新請求可提交，搜尋頁 mounted 會重新載入 limit 20。
- [靜態「營業中」可能被理解為真實狀態] → 規格將它限制在首頁展示且禁止參與資料邏輯；真實營業時間功能需另案處理。
- [定位失敗的距離不是使用者距離] → fallback 訊息必須與結果同時可見，避免錯誤宣稱。
- [MapView watchers 與 cluster rebuild 形成地圖移動及 bounds API 循環] → 只有 selection request 可呼叫 `flyTo` 或 `zoomToShowLayer`；cluster rebuild 僅在 popup 原本開啟時，以停用 auto-pan 的直接 open 恢復最新 marker popup。
- [移動期間 bounds 回應移除 `zoomToShowLayer` 所持有的 marker] → 選取中的 cluster sync 延後至 `popupopen`，並以 focus generation 使過期 callback 無法開啟 popup。
- [`moveend` 先於 marker-cluster animation settle，使群組展開請求失效] → 在呼叫 `zoomToShowLayer` 前等待 `animationend`，並確認 animation counter 已歸零。
- [Spiderfy popup 開啟後全量重建，使新 marker 折疊於 cluster 而無法恢復 popup] → popup 開啟期間保留 spiderfied marker，於 `popupclose` 後不恢復 popup 地同步一次最新資料。
- [bounds 回應改變 reactive center 而造成自動位移與重複查詢] → 地圖只接收一次性 `initialCenter`，資料回應只能更新 markers。
- [選取醫院導頁同時執行 ready 查詢與 `flyTo` 完成查詢] → 有選取醫院時省略 ready 查詢，只由最終地圖事件排定 bounds。
