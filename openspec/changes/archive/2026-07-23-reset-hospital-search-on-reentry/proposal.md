## Why

醫院搜尋狀態由全域 Pinia store 持有，使用者離開 Hospitals 頁面後再返回時，舊篩選、結果、分頁與地圖狀態仍會繼續顯示，容易讓人誤認為是新的預設查詢結果。頁面每次進入都需要從可預期的乾淨狀態載入預設醫院列表，同時不能破壞首頁點擊特定醫院後的聚焦體驗。

## What Changes

- 每次進入 Hospitals 頁面時同步清除上一次的搜尋條件、清單結果、分頁、錯誤、重試內容與地圖暫存，再載入預設附近醫院。
- 使進頁重置失效化離頁前仍在進行的清單與地圖請求，避免舊回應在重置後回填。
- 首頁可佇列一次性的醫院入口選取；Hospitals 進頁時只保留並消耗這次明確帶入的選取，其他舊選取一律清除。
- 評論載入及成功新增、更新或刪除評論後，若入口選取醫院尚未出現在清單或地圖結果中，同步更新入口快照的評分與評論數，避免評論視窗與地圖 popup 顯示過期摘要。
- 地圖在重新進頁後依初始可視範圍重新查詢；若同時聚焦首頁帶入的醫院，等待地圖移動完成後再查詢，避免動畫途中與 `moveend` 各送出一次請求，也不沿用舊 markers。
- 維持診療動物篩選已移除的現況，並維持清單與地圖各自獨立查詢的既有契約。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `hospital-api-integration`: 規範 Hospitals 頁面重新進入時的狀態重置、預設清單載入、過期請求隔離、首頁入口選取與入口快照評論摘要同步行為。

## Impact

- Affected specs: hospital-api-integration
- Affected code:
  - Modified: src/stores/hospital.js
  - Modified: src/views/HospitalView.vue
  - Modified: src/views/HomeView.vue
  - Modified: src/components/hospital/MapView.vue
  - Modified: src/test/hospitalApiIntegration.test.js
  - Modified: src/test/hospitalGpsView.test.js
- Backend APIs, database schema, dependencies, and environment variables are unchanged.
