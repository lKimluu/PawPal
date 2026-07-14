## Summary

將醫院地圖及其他非首頁頁面改為路由層級的延遲載入，讓 Leaflet、Chart.js 與各功能頁程式碼不再全部進入初始 bundle。

## Motivation

目前 router 靜態匯入多數 view。實作驗證顯示，僅拆分 `HospitalView` 雖能產生獨立 Hospital/Leaflet chunks，初始 `index` chunk 仍為 803.10 kB 並觸發 Vite 500 kB 警告；其他功能頁及其依賴仍需按路由拆分。

## Proposed Solution

- 將 Hospital 與其他非首頁頁面路由改為 `import()` 延遲載入，首頁維持 eager loading。
- 讓 Vite 將 Leaflet 與醫院地圖頁面拆分到按需載入的 chunk。
- 使用正式建置結果確認各路由 chunk 均不超過既有 500 kB 警告門檻。

## Capabilities

### New Capabilities

- `hospital-map-lazy-loading`: 定義醫院地圖與其他非首頁頁面的按需載入，以及 production chunks 的體積要求。

### Modified Capabilities

(none)

## Impact

- Affected specs: hospital-map-lazy-loading
- Affected code:
  - Modified: `src/router/index.js`
  - New: `openspec/changes/lazy-load-hospital-map-leaflet/specs/hospital-map-lazy-loading/spec.md`, `openspec/changes/lazy-load-hospital-map-leaflet/design.md`, `openspec/changes/lazy-load-hospital-map-leaflet/tasks.md`
  - Removed: none
