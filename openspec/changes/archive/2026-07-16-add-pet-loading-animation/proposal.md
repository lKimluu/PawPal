## Why

首頁最近醫院卡片在資料載入中時，目前僅顯示靜態灰色 skeleton 方塊，遇到使用者網路較慢時等待感明顯，也缺乏品牌識別與趣味感。希望改用可愛的貓咪跑步動畫取代 skeleton，讓等待過程更討喜、更符合 PawPal 品牌調性。

## What Changes

- 新增共用元件 `PetLoadingRunner.vue`：內嵌使用者提供的黑貓 SVG，將填色從原本的 `#feb832` 改為品牌色 `--color-brand-orange`（`#ffa002`），並用 CSS `@keyframes` 讓貓咪原地上下彈跳模擬走路節奏（不做左右位移）
- 在貓咪後腳/尾巴附近加入 3 個小圓點，以 CSS `@keyframes` 依序錯開跳動／淡入淡出，呈現經典 loading `...` 效果
- `HomeView.vue` 最近醫院 3 張卡片在 `isSummaryLoading` 為 true 時，桌機版與手機版皆將目前的灰色 `animate-pulse` skeleton 方塊，改為顯示 `PetLoadingRunner`（每個框各自獨立顯示同一個動畫）
- 不引入任何新的第三方動畫套件，純 CSS + SVG 實作

## Non-Goals

- 不做真實的四肢交替走路動畫：使用者提供的 SVG 是單一 path 剪影，沒有可拆分的身體/腳圖層，因此不追求擬真跑步姿勢，改以「原地彈跳 + 點點」呈現跑步／載入感
- 不做左右來回移動或跑出框外的動畫（曾在討論中考慮過，但確認採用「原地向前走」）
- 不評估 Lottie 或 sprite sheet 等其他動畫技術方案，本次僅實作純 CSS + SVG 版本
- 不新增暗色模式（dark mode）專屬配色，沿用專案目前沒有 dark mode 邏輯的現況
- 不擴大套用到其他頁面的 loading 狀態（例如 `LoadingOverlay.vue` 或 `/hospital` 頁面），僅限首頁最近醫院卡片

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `home-hospital-summary`: pending 狀態的呈現方式從「3 張灰色 skeleton 卡片」改為「3 個貓咪跑步 loading 動畫」

## Impact

- Affected specs: home-hospital-summary
- Affected code:
  - New: src/components/common/PetLoadingRunner.vue
  - Modified: src/views/HomeView.vue
