## 1. PublicSidebar.vue 重構

- [x] 1.1 拆分 PublicSidebar.vue 根結構：遮罩改為獨立的 `v-if="sidebarStore.isOpen"` div（無動畫，點擊觸發 `sidebarStore.closeSidebar()`），選單本體 `<aside>` 改為 `fixed right-0 top-0 w-80`。驗證：`npm run build` 通過且元件無 template 編譯錯誤。
- [x] 1.2 在 PublicSidebar.vue 中用 `<transition name="slide">` 包住 `<aside>`，並將 `.slide-enter-active/.slide-leave-active/.slide-enter-from/.slide-leave-to` CSS 規則移入該元件自己的 `<style scoped>`。驗證：Sidebar panels slide in and out on open/close — 手動在瀏覽器（手機/平板尺寸）開啟 PublicSidebar，觀察 `<aside>` 從右側以 0.3s ease 滑入，關閉時滑出。
- [x] 1.3 將 PublicSidebar.vue 遮罩 class 由 `bg-white/10 backdrop-opacity-60` 改為 `bg-black/50`，使開啟選單時的遮罩視覺效果與 DashboardSidebar 一致。驗證：Overlay visual weight is consistent between sidebars — 手動在瀏覽器（手機/平板尺寸）以未登入狀態開啟 PublicSidebar，確認遮罩明顯可見、深淺與 DashboardSidebar 遮罩一致；並執行 `npm run build` 確認通過。

## 2. DashboardSidebar.vue 行動版重構

- [x] 2.1 拆分 DashboardSidebar.vue 行動版區塊的根結構：遮罩改為獨立的 `v-if="sidebarStore.isOpen"` div，選單本體 `<aside>` 改為 `fixed right-0 top-0 w-80`；桌面版 `<aside v-if="props.showDesktop">` 區塊不動。驗證：`npm run build` 通過，桌面版（`lg:` 以上）畫面與改動前一致。
- [x] 2.2 在 DashboardSidebar.vue 行動版 `<aside>` 外包 `<transition name="slide">`，並在該元件自己的 `<style scoped>` 加入與 PublicSidebar 相同的 slide 動畫 CSS 規則。驗證：Sidebar panels slide in and out on open/close — 手動以已登入帳號在手機/平板尺寸開啟 DashboardSidebar，觀察滑入滑出效果與 PublicSidebar 一致。

## 3. AppHeader.vue 清理

- [x] 3.1 移除 AppHeader.vue 中針對 PublicSidebar 的外層遮罩 div 與 `<transition name="slide">` 包裹 div，改為與 DashboardSidebar 相同的直接掛載：`<PublicSidebar v-if="!isMemberVariant && !shouldUseMemberSidebarOnMobile" />`。驗證：`npm run build` 通過，AppHeader.vue 中不再有針對 PublicSidebar 的獨立 transition 包裹結構。
- [x] 3.2 移除 AppHeader.vue `<style scoped>` 中不再被引用的 `.slide-enter-active`／`.slide-leave-active`／`.slide-enter-from`／`.slide-leave-to` class。驗證：`grep -n "slide-" src/components/layout/AppHeader.vue` 無結果。

## 4. 整合驗證

- [x] 4.1 確認未登入與已登入兩種狀態下，手機/平板點擊選單按鈕都能看到滑入滑出動畫、點遮罩與點關閉按鈕都能正常關閉選單。驗證：Overlay has no slide animation — 手動確認遮罩本身無 transform 動畫、即時顯示與消失。
- [x] 4.2 確認桌面版（`lg:` 以上）sidebar 顯示與互動行為未受影響。驗證：Desktop sidebar is unaffected — 手動在桌面尺寸瀏覽器檢查 DashboardSidebar 桌面版選單項目、active 狀態高亮皆與改動前一致。
- [x] 4.3 執行完整建置驗證整體改動無編譯錯誤。驗證：於專案根目錄執行 `npm run build` 並確認結束代碼為 0。
