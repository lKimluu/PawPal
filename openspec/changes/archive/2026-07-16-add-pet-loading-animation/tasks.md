## 1. PetLoadingRunner 元件

- [x] 1.1 建立 `src/components/common/PetLoadingRunner.vue`，內嵌黑貓 SVG 並將 fill 改為 `#ffa002`（brand-orange），驗證方式：`npm run build` 通過且元件可在 `HomeView.vue` 中掛載渲染無 console 錯誤
- [x] 1.2 為貓咪主體加入 CSS `@keyframes` 原地上下彈跳動畫（不含任何水平位移），驗證方式：於瀏覽器目視確認動畫持續無限循環播放，且貓咪水平位置全程不變
- [x] 1.3 在貓咪後腳/尾巴附近加入 3 個小圓點，並以交錯的 `animation-delay` 呈現依序跳動的 loading `...` 效果，驗證方式：於瀏覽器目視確認 3 個點依序（非同步）跳動而非同時跳動

## 2. 替換 HomeView.vue 的 pending 狀態呈現

- [x] 2.1 將 `HomeView.vue` 桌機版摘要區（`isSummaryLoading` 為 true 的分支）原本 3 個 `animate-pulse` skeleton 方塊替換為 3 個 `<PetLoadingRunner />` 實例，驗證方式：`npm run build` 通過，且瀏覽器中桌機寬度下 pending 狀態顯示 3 隻跑步貓咪而非灰色方塊
- [x] 2.2 將 `HomeView.vue` 手機版摘要區比照桌機版替換為 `PetLoadingRunner`，驗證方式：於窄螢幕（< md breakpoint）檢視確認 3 隻貓咪皆正常顯示且版面不跑版

## 3. 更新測試並驗證 spec 一致性

- [x] 3.1 更新 `src/test/hospitalGpsView.test.js` 現有的 `assert.match(homeView, /animate-pulse/)` 斷言：移除該斷言並新增 `assert.match(homeView, /PetLoadingRunner/)`，驗證方式：`npm test` 通過
- [x] 3.2 以 Chrome DevTools Network throttling 模擬慢速網路開啟首頁，人工確認「Home page represents hospital summary states without fake data」需求中 pending 狀態顯示 3 個貓咪 loading 動畫、不出現假資料、也不再出現灰色 skeleton，驗證方式：手動檢查並截圖記錄
