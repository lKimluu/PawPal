## Context

Vue Router 目前以靜態 import 載入多數 view。`HospitalView` 靜態依賴 `MapView`，而 `MapView` 依賴 Leaflet 與 Vue Leaflet。首次只將 Hospital route 改為動態 import 後，Vite 已輸出獨立的 Hospital（197.33 kB）與 Leaflet（148.54 kB）chunks，但初始 `index` chunk 仍為 803.10 kB；其餘靜態 route views 及 Chart.js 等功能依賴仍集中於入口依賴圖。

## Goals / Non-Goals

**Goals:**

- 將醫院頁面及 Leaflet，以及其他非首頁功能頁依賴移出初始 JavaScript chunk。
- 維持所有 route 的既有名稱、URL、metadata 與頁面行為。
- 讓 `npm run build` 不再出現單一 JavaScript chunk 超過 500 kB 的警告。

**Non-Goals:**

- 不重構地圖元件、醫院查詢或定位流程。
- 不調高 `chunkSizeWarningLimit` 來隱藏警告。
- 不延遲載入首頁，避免改變 landing page 的首次呈現路徑。
- 不搬移全域 plugin 註冊、不修改 view/component 內部依賴結構。

## Decisions

### 使用 Vue Router 路由層級動態匯入

保留 Home route 的靜態 component，將 Login、Register、ForgotPassword、Medical、Dashboard、Growth、BaseModalPreview、Hospital 與 NotFound routes 的 component 設為回傳各自 `import()` 的函式。Vue Router 原生支援此模式，能沿著依賴圖依頁面切分功能程式碼，且不需新增依賴或自訂載入狀態。

只動態載入 Hospital 的方案已證實不足：Hospital/Leaflet 成功拆分後 `index` 仍有 803.10 kB。替代方案是設定 Vite manual chunks，但這會將 bundler 細節固化在設定中，且未必避免首頁載入不需要的功能程式碼。另一方案是調高警告門檻，但不會降低初始下載量。

## Implementation Contract

- Behavior: 使用者首次進入首頁時，初始入口 chunk 不包含非首頁 route views；造訪任一非首頁 route 時，Vue Router 才載入對應頁面。造訪 `/hospital` 時仍呈現既有地圖功能。
- Interface: 所有 route name、URL 與 metadata 保持不變；Home route 維持 eager component，其餘 route components 使用 Vue Router 支援的動態 import 函式。
- Failure modes: 動態 chunk 載入失敗時沿用 Vue Router/Vite 的既有錯誤行為，本 change 不新增錯誤 UI 或 retry 機制。
- Acceptance criteria: `npm run build` 成功，輸出包含獨立 Hospital/Leaflet 與其他 route chunks，且沒有超過 500 kB 的 chunk size warning；既有測試維持通過。
- Scope boundaries: 僅修改 router 的 route view 載入策略與必要測試；不更動 views、components、全域 plugins、Vite warning 門檻、API 或後端。

## Risks / Trade-offs

- [首次進入非首頁頁面需要額外網路請求] → Vite 產生帶雜湊的快取 chunk，且只在需要該頁面時下載。
- [route 動態 import 的錯誤延後到執行階段] → 以正式 build 驗證模組路徑與 chunk 生成。
