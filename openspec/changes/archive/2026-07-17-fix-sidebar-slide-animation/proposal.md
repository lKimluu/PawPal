## Problem

行動裝置與平板上，未登入使用者點擊選單按鈕時，PublicSidebar 選單完全沒有滑動動畫，直接瞬間出現/消失；DashboardSidebar 的行動版選單同樣沒有動畫效果，開關都是瞬間切換，缺乏一致的滑入滑出過場體驗。

此外，實測滑動動畫修復後發現：PublicSidebar 開啟時的背景遮罩幾乎看不見，與 DashboardSidebar 的遮罩視覺效果不一致。

## Root Cause

1. PublicSidebar.vue 的根元素是一個 `fixed inset-0 z-50` 的容器，把遮罩與有寬度的 `<aside class="w-80">` 選單本體都包在裡面。src/components/layout/AppHeader.vue 在外層另外用 `<transition name="slide">` 包了一層沒有寬度的 `fixed inset-y-0 right-0` div，但真正有寬度、應該滑動的 `<aside>` 是巢狀在 PublicSidebar 自己的 `fixed inset-0` 容器內，這個內層容器忽略外層 transition 套用的 transform，導致滑動動畫看不到效果。
2. DashboardSidebar.vue 的行動版區塊完全沒有包 `<transition>`，`v-if="sidebarStore.isOpen"` 直接控制整個 `fixed inset-0`（遮罩＋aside）區塊的顯示與消失，開關皆為瞬間切換。
3. src/components/layout/AppHeader.vue 對兩個 sidebar 元件的整合方式不一致：PublicSidebar 由 AppHeader 在外層用 v-if + transition 包一層來控制顯示；DashboardSidebar 則是直接掛載 `<DashboardSidebar :show-desktop="false" />`，由元件自己內部管理 `sidebarStore.isOpen`。這種不一致是動畫套用失敗的根本原因之一。
4. PublicSidebar.vue 遮罩目前使用 `bg-white/10 backdrop-opacity-60`（10% 白色背景），視覺上幾乎透明；DashboardSidebar.vue 的遮罩則使用 `bg-black/50`（50% 黑色背景），明顯可見。這個 class 差異在本次滑動動畫修復之前就已存在，不是本次結構調整造成的，但因為修好動畫後才明顯看出遮罩「幾乎不可見」的問題，一併於本次 change 修正。

## Proposed Solution

讓 PublicSidebar.vue 與 DashboardSidebar.vue 都改為「自己管理開關與動畫」，統一比照 DashboardSidebar 目前被引用的模式，不再依賴 AppHeader.vue 在外層包一層 transition：

- PublicSidebar.vue：將根容器拆開，遮罩用獨立的 `v-if="sidebarStore.isOpen"` 控制（不需要動畫，維持點擊遮罩關閉的功能），`<transition name="slide">` 直接包在真正有寬度的 `<aside>` 元素上（改為 `fixed right-0 top-0 w-80`），動畫 CSS 移入該元件自己的 `<style scoped>`。
- DashboardSidebar.vue（行動版區塊）：套用相同結構——遮罩獨立 `v-if` 控制，`<transition name="slide">` 包住 `<aside class="w-80">`，動畫 CSS 移入該元件自己的 `<style scoped>`。桌面版 `<aside v-if="props.showDesktop">`（`hidden lg:flex`）維持不動。
- 動畫設定沿用現有規則：

```
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
```

- src/components/layout/AppHeader.vue：移除針對 PublicSidebar 的外層遮罩 div、`<transition name="slide">` 包裹 div（目前對應第 255～270 行），改為與 DashboardSidebar 相同的直接掛載方式：`<PublicSidebar v-if="!isMemberVariant && !shouldUseMemberSidebarOnMobile" />`。同時移除該檔案 `<style scoped>` 內不再使用的 `.slide-*` class。
- PublicSidebar.vue：將遮罩 class 由 `bg-white/10 backdrop-opacity-60` 改為 `bg-black/50`，與 DashboardSidebar.vue 遮罩的視覺效果一致。

## Non-Goals

- 不調整桌面版 sidebar（`props.showDesktop` 為 true 的 `hidden lg:flex` 區塊）的版面或行為。
- 不變更 sidebar 選單項目、路由連結或登入/登出邏輯本身。
- 不引入新的動畫函式庫或改變動畫時間曲線，沿用現有 0.3s ease 的 transform 設定。
- 不處理 useSidebarStore 以外的狀態管理重構。

## Success Criteria

- 行動裝置／平板上，點擊選單按鈕開啟 PublicSidebar（未登入狀態）時，選單本體從右側滑入，關閉時滑出，動畫時長 0.3s。
- 行動裝置／平板上，點擊選單按鈕開啟 DashboardSidebar（已登入狀態）時，選單本體同樣有滑入滑出動畫，行為與 PublicSidebar 一致。
- 點擊遮罩或選單內的關閉按鈕都能正常關閉選單，遮罩本身維持無動畫的即時顯示/消失。
- PublicSidebar 開啟時，遮罩以 `bg-black/50` 呈現，視覺上與 DashboardSidebar 遮罩一致、清楚可見。
- 桌面版 sidebar（`lg:` 以上）顯示與行為不受影響。
- `npm run build` 通過。

## Capabilities

### New Capabilities

- `sidebar-slide-animation`: 定義行動裝置／平板上 PublicSidebar 與 DashboardSidebar 開關時應有的滑入滑出動畫行為，以及遮罩與桌面版不受影響的邊界條件。

### Modified Capabilities

(none)

## Impact

- Affected specs: sidebar-slide-animation (new)
- Affected code:
  - Modified: src/components/layout/PublicSidebar.vue
  - Modified: src/components/layout/DashboardSidebar.vue
  - Modified: src/components/layout/AppHeader.vue
