## 1. 首頁寵物區塊改款與搬移

- [x] 1.1 依「首頁寵物區塊直接改款，不新增共用元件」決策，將 `src/components/pet/PetCard.vue` 改為圓形頭像＋寵物名稱樣式（移除品種、年齡、主題色背景），並保留 `emit('click')` 觸發開啟寵物詳細資料的既有行為 — 驗證方式：於 Dashboard 點擊任一寵物圓形頭像，確認 `PetProfileModal` 開啟且資料正確
- [x] 1.2 將 `src/components/pet/AddPetButton.vue` 改為圓形虛線新增按鈕樣式，點擊仍觸發 `openAddPetModal` — 驗證方式：於 Dashboard 點擊新增寵物按鈕，確認 `AddPetModal` 正常開啟
- [x] 1.3 調整 `src/views/DashboardView.vue` 版面，將寵物列移到 `CalendarGrid` 上方，手機版維持水平捲動、桌機版維持橫列排列 — 驗證方式：於瀏覽器 devtools 切換手機／平板／桌機寬度，確認寵物列位置與捲動行為正確
- [x] 1.4 更新 `src/test/petCardThemeColors.test.js`、`src/test/petCardPawTheme.test.js`、`src/test/petCardMetaAlignment.test.js`，反映圓形樣式已不再顯示品種、年齡與主題色 — 驗證方式：`npm run test` 全數通過
- [x] 1.5 更新 `src/test/petCardWidth.test.js`，反映改版後的寬度與版面 — 驗證方式：`npm run test` 全數通過
- [x] 1.6 依「寵物圓形頭像列與 Google 行事曆同步按鈕同一列，靠攏時用水平捲動避開」決策，調整 `src/views/DashboardView.vue`：將寵物頭像列與 `GoogleCalendarSyncButton` 併入同一橫列（頭像列 `flex-1 min-w-0 overflow-x-auto` 在左，同步按鈕 `shrink-0` 固定在右），寵物數量增加時頭像列以水平捲動避免與按鈕重疊或把按鈕擠出畫面 — 驗證方式：於瀏覽器縮小視窗寬度並增加寵物數量，確認頭像列會捲動而非與同步按鈕重疊或換行，`npm run build` 成功
- [x] 1.7 依「手機版寵物列與同步按鈕改為上下堆疊，桌機／平板維持同一列」決策，調整 `src/views/DashboardView.vue` 外層容器 class 為 `flex flex-col gap-3 md:flex-row md:items-center`：手機版寵物頭像列在上、`GoogleCalendarSyncButton` 在下且不重疊，`md` 以上維持原本同一橫列排列不變 — 驗證方式：於瀏覽器 devtools 切換到手機寬度（< 768px），確認寵物頭像列與同步按鈕上下堆疊且無重疊或裁切；切回平板／桌機寬度，確認與 task 1.6 的同列排列一致，`npm run build` 成功
- [x] 1.8 依「手機版堆疊順序為同步按鈕在上、寵物頭像列在下」決策，用 Tailwind `order` 工具類調整 `src/views/DashboardView.vue`：寵物頭像列容器加上 `order-2 md:order-none`、`GoogleCalendarSyncButton` 加上 `order-1 md:order-none`，只改變視覺順序不更動 DOM 順序 — 驗證方式：於瀏覽器 devtools 切換到手機寬度（< 768px），確認 `GoogleCalendarSyncButton` 顯示在寵物頭像列上方；切回平板／桌機寬度，確認排列與 task 1.6、1.7 完成時一致（頭像列在左、同步按鈕在右）不受影響，`npm run build` 成功
- [x] 1.9 依「手機版堆疊順序改回 DOM 原本順序，同步按鈕靠右對齊」決策，調整 `src/views/DashboardView.vue`：移除寵物頭像列容器與 `GoogleCalendarSyncButton` 上的 `order-2`/`order-1`/`md:order-none`，`GoogleCalendarSyncButton` 改加 `self-end md:self-auto` 讓手機版靠右對齊、桌機／平板恢復跟隨 `items-center` 垂直置中 — 驗證方式：於瀏覽器 devtools 切換到手機寬度（< 768px），確認寵物頭像列在上、`GoogleCalendarSyncButton` 在下且靠右對齊；切回平板／桌機寬度，確認排列與 task 1.6 完成時一致（頭像列在左、同步按鈕在右、垂直置中）不受影響，`npm run build` 成功

## 2. 建立前置寵物檢查（pet-required-guard）

- [x] 2.1 依「建立前置寵物檢查集中在一個 composable」決策，新增 `src/composables/useRequirePet.js`，實作 `ensurePetOrPrompt()` 完成 Pet existence check before creating records：無寵物時顯示提示 toast，並依目前路由決定是否導頁至 `/dashboard`，回傳 `boolean` 供呼叫端判斷是否繼續開啟 Modal — 驗證方式：撰寫單元測試涵蓋「在 Dashboard 呼叫（不導頁）」與「不在 Dashboard 呼叫（導頁）」兩種分支
- [x] 2.2 `src/views/DashboardView.vue` 的 `openAddModal` 呼叫 `ensurePetOrPrompt()`，實現情境「Member with no pets tries to add a calendar event on the Dashboard page」：無寵物時不開啟 `AddEventModal` 且不導頁 — 驗證方式：以無寵物測試帳號分別點擊行事曆網格、行程列表、當日行程 Modal 的新增入口，確認皆不開啟 Modal 並顯示提示 toast
- [x] 2.3 `src/views/MedicalView.vue` 的 `handleAddFirstRecord` 呼叫 `ensurePetOrPrompt()`，實現情境「Member with no pets tries to add a medical record」：無寵物時不開啟 `MedicalRecordModal` 並導頁至 `/dashboard` — 驗證方式：以無寵物測試帳號點擊「新增紀錄」與空狀態「立即新增第一筆紀錄」按鈕，確認皆不開啟 Modal、顯示提示 toast 且導頁至首頁
- [x] 2.4 依「Growth 頁新增入口先整併」決策，重構 `src/views/GrowthView.vue`：將 `AddGrowthButton` 與 `GrowthChartCard` 的新增觸發整併為單一 `openAddModal` 函式並呼叫 `ensurePetOrPrompt()`，實現情境「Member with no pets tries to add a growth record」 — 驗證方式：以無寵物測試帳號分別點擊兩個新增觸發點，確認皆不開啟 `GrowthRecordModal`、顯示提示 toast 且導頁至首頁
- [x] 2.5 驗證情境「Member with at least one pet adds a record」：會員至少有一筆寵物時，三個入口的既有新增流程行為不變 — 驗證方式：以有寵物的測試帳號分別觸發行事曆、醫療紀錄、成長紀錄三個新增入口，確認 Modal 正常開啟、不顯示提示 toast、不強制導頁

## 3. 建置與測試驗證

- [x] 3.1 執行 `npm run build`，確認前端建置成功無錯誤
- [x] 3.2 執行前端測試套件，確認 1.4、1.5 更新後的 PetCard 測試與新增的 `useRequirePet` 測試皆通過
