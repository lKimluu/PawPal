## Context

`useHospitalStore` 同時服務首頁的三筆附近醫院摘要與完整 Hospitals 頁面，且 store 的生命週期長於路由元件。目前 `HospitalView` mounted 時只發出新的附近醫院請求，沒有先清除舊 filters、results、pagination、map state 或 selection，因此重新進頁會先呈現舊狀態。清單已有 request ID 防止較舊請求覆寫較新請求；地圖另有 request ID 與 AbortController。`MapView` 的 markers 依可視 bounds 獨立查詢，這項獨立性必須保留。入口醫院在清單與地圖請求尚未完成或失敗時只存在於 `entrySelectedHospital`，因此評論摘要更新也必須涵蓋此 fallback，否則評論視窗與地圖 popup 會讀到過期評分與評論數。

## Goals / Non-Goals

**Goals:**

- 每次建立 `HospitalView` 時，在首次 render 前取得乾淨的搜尋與地圖狀態，再載入預設附近醫院。
- 失效化重置前的清單與地圖請求，避免非同步舊回應回填。
- 保留首頁點擊特定醫院進入頁面時的一次性地圖聚焦。
- 讓評論摘要更新同步套用到同 ID 的入口快照，即使清單與地圖中尚無該醫院。
- 讓地圖在每次進頁都重新依初始 bounds 載入 markers。

**Non-Goals:**

- 不恢復診療動物篩選。
- 不讓清單篩選控制地圖 markers，也不讓地圖操作改寫清單。
- 不修改後端 API、資料庫、定位權限流程或縣市參考資料快取。
- 不修改評論 API 契約或評論 CRUD 流程，只同步既有評論摘要更新至入口快照。
- 不在離開 Hospitals 時清空共享 store，避免干擾下一個頁面剛啟動的首頁摘要請求。

## Decisions

### 以單一 enterHospitalPage action 建立頁面進入邊界

store 新增同步 `enterHospitalPage()`，由 `HospitalView` 在 `onBeforeMount` 呼叫。它集中重置 filters、results、pagination、mode、loading/error、fallback、retry context、map state 與 selection，並遞增 list/map request ID；若地圖有進行中請求則 abort。選擇進頁重置而非離頁重置，因首頁與 Hospitals 共用 store，離頁 hook 可能與新頁面的載入生命週期互相干擾。

### 以一次性入口快照保留首頁選取

store 新增 `queueHospitalEntrySelection(hospital)`，首頁點擊卡片時傳入完整 normalized hospital 物件後再導頁。`enterHospitalPage()` 先消耗並清除 pending snapshot，再清理舊狀態，最後把 snapshot 保存為 entry selection；`selectedHospital` computed 在目前 list/map 找不到該 ID 時以 entry snapshot fallback。一般路由進入沒有 pending snapshot，因此舊 selection 不會保留。頁內改選其他醫院時清除 entry snapshot，避免 fallback 指向過期醫院。

相較只傳 ID，完整快照可在預設附近清單不包含該醫院時仍提供地圖座標與 popup 資料，且不需新增醫院詳情 API。

### 讓評論摘要同步入口快照

既有 `updateHospitalReviewSummary` 同步更新 `hospitals` 與 `mapHospitals` 中符合 ID 的醫院；同一 helper 也必須在 `entrySelectedHospital.id` 相符時，以不可變方式合併最新 `rating` 與 `reviewCount`。評論載入及成功建立、更新、刪除評論既已共用此 helper，因此集中補上第三個資料來源可維持所有使用者可見醫院表示一致，且不改動評論 API 或各 mutation 流程。

相較在評論 modal 或 map popup 額外覆寫顯示資料，於 store 的摘要更新邊界同步可確保 `getHospitalById` 的所有呼叫者取得同一份最新資料。

### 預設列表沿用附近醫院與情境排序

進頁重置將 filters 恢復為空關鍵字、空地區、24H false、favorites false、sort name，並清除真實定位衍生狀態與明確排序。mounted 後使用 location store 已有的 `userLocation` 呼叫現有 `loadNearbyHospitals`；有效定位會把系統預設排序改為 distance，否則維持 name 並使用台北市中心 fallback。此流程不重新要求定位權限。

### 地圖初始化在聚焦完成後排程 bounds query

`MapView.onMapReady` 先完成既有聚焦／cluster 初始化，再依 `focusSelectedHospital()` 是否啟動地圖移動決定刷新時機。若初始 `flyTo` 會移動地圖，bounds query 只由聚焦完成或最終 `moveend` 排程；若選取醫院已在目前視野、不具有效座標或沒有 selected hospital 而不會移動，則直接呼叫 debounced `scheduleBounds()`。這可確保 reset 後的 map results 由穩定後的目前 bounds 取得，並避免超過 300ms 的初始飛行在動畫途中先觸發一次請求、結束後再觸發第二次。

相較無條件排程並依賴 debounce 合併，明確以是否移動分流不受 `flyTo` 動畫長度影響，也不會讓已抵達 rate-limited map endpoint 的中間請求只能事後被 abort。

## Implementation Contract

- **Behavior:** 每次建立 Hospitals 路由頁面時，畫面首次呈現不得包含上一次的關鍵字、地區、24H、收藏、排序、分頁、結果、錯誤、重試或 map marker 狀態；隨後載入 limit 20 的預設附近醫院。有效 location 使用附近模式與 distance 情境排序；無有效 location 使用台北市中心 fallback 與 name 排序。
- **Store interface:** `enterHospitalPage()` 為同步無參數 action；`queueHospitalEntrySelection(hospital)` 接受包含穩定 `id` 的 normalized hospital 物件。無物件或缺少 id 的輸入不得建立 pending selection。pending selection 最多被下一次 `enterHospitalPage()` 消耗一次。
- **Selection:** 首頁將整個 hospital 傳給 queue action。進頁若有 pending selection，`selectedHospitalId` 與 selected hospital fallback 保留該醫院；沒有 pending selection時兩者皆為 null。頁內選擇其他醫院時 entry fallback 清除。
- **Review summary synchronization:** `updateHospitalReviewSummary(hospitalId, summary)` 更新清單與地圖資料時，若 `entrySelectedHospital.id` 與 `hospitalId` 相符，也必須保留快照其他欄位並合併最新評分與評論數。評論載入及成功建立、更新、刪除評論後，`getHospitalById(hospitalId)` 必須立即回傳更新後的入口 fallback，即使清單或地圖請求仍 pending 或已失敗。
- **Request isolation:** `enterHospitalPage()` 後，任何較早的 list/map success、failure 或 completion 都不得更新 results、pagination、errors 或 loading。地圖請求若可中止必須 abort；清單以 request ID 失效化即可。
- **Map:** map results 在進頁先為空。Map ready 後必須為穩定的目前 bounds 排程一次初始 query：初始聚焦有移動時等待聚焦完成或最終 `moveend`，沒有移動時直接排程。聚焦動畫途中不得送出冗餘的中間 bounds query；清單與地圖仍維持獨立結果流。
- **Scope:** regions cache 與 location store 不重置；入口快照的本地評論摘要同步在範圍內，review API 契約、favorite mutation、後端 API、診療動物篩選與其他頁面狀態不在此變更範圍。
- **Acceptance:** store 行為測試涵蓋完整重置、stale request 隔離、一次性入口選取，以及入口醫院僅存在於 fallback 時的評論載入與成功 CRUD 摘要同步；MapView 測試驗證初始聚焦移動超過 debounce 時只在移動完成後查詢，而無移動時仍直接排程；source integration 測試鎖定 HospitalView before-mount reset、Home 傳遞完整 hospital；`npm test` 與 `npm run build` 必須通過。

## Risks / Trade-offs

- [共享 store 讓首頁請求與 Hospitals 請求競爭] → 進頁同步遞增 request ID，且 Hospitals 隨即發出較新的 limit 20 查詢。
- [保留入口快照可能在清單或地圖回應前短暫過期] → 所有既有評論摘要更新同步套用到同 ID 的入口快照；最新 list/map 回應中同 ID 的完整資料仍優先。
- [初始聚焦動畫未正常觸發完成事件] → 由既有 Leaflet `moveend` 作為完成邊界，且無實際移動的分支直接排程，避免漏掉初始查詢。
