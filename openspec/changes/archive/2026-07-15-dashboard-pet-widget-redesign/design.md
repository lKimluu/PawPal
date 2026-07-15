## Context

首頁（`src/views/DashboardView.vue`）目前的「新增寵物」區塊是方形卡片（`PetCard.vue` + `AddPetButton.vue`），放在行事曆網格下方；醫療紀錄頁、成長歷程頁則各自用 `PetSwitcher.vue` 呈現圓形頭像＋名稱的寵物切換列，兩種樣式並存造成不一致。

三個新增紀錄的入口（`DashboardView.vue` 的 `openAddModal`、`MedicalView.vue` 的 `handleAddFirstRecord`、`GrowthView.vue` 目前分散在 `AddGrowthButton` 與 `GrowthChartCard` 的兩個點擊事件）目前都沒有檢查會員是否已有寵物資料，缺寵物時仍可開啟新增 Modal，送出後才因缺少 `petId` 失敗。

## Goals / Non-Goals

**Goals:**
- 首頁寵物區塊改為圓形頭像＋名稱樣式，並移到行事曆上方，維持「點擊頭像開啟寵物詳細資料」的既有行為
- 三個新增紀錄入口（行事曆行程、醫療紀錄、成長紀錄）在開啟新增 Modal 前，統一檢查會員是否至少有一筆寵物資料
- 無寵物時的提示行為依頁面情境不同：Dashboard 頁僅提示不導頁，Medical／Growth 頁提示後導頁至 Dashboard

**Non-Goals:**
- 不新增後端 API 或後端驗證邏輯（petId 缺失時後端已會回傳錯誤，本次僅處理前端提早攔截與提示）
- 不變更 `PetSwitcher.vue` 既有的「切換目前選取寵物」行為與其在 Medical／Growth 頁的用法
- 不修改寵物新增/編輯/刪除的既有 API 串接（`petStore.createPet` / `updatePet` / `deletePet`）

## Decisions

### 首頁寵物區塊直接改款，不新增共用元件

`PetCard.vue` 與 `AddPetButton.vue` 僅在 `DashboardView.vue` 使用（已確認無其他呼叫端），因此直接修改這兩支元件的樣式為圓形頭像＋名稱，不新增元件、不替 `PetSwitcher.vue` 增加額外的顯示模式。`PetCard.vue` 保留 `emit('click')`，`DashboardView.vue` 既有的 `@click="openPetProfile(pet)"` 邏輯不需更動。

拿掉 `PetCard.vue` 目前顯示的品種、年齡、主題色背景（圓形樣式僅顯示頭像圖與名稱），對應的 `petCardThemeColors.test.js`、`petCardPawTheme.test.js`、`petCardMetaAlignment.test.js`、`petCardWidth.test.js` 需同步改寫斷言內容。

### 建立前置寵物檢查集中在一個 composable

新增 `src/composables/useRequirePet.js`，提供 `ensurePetOrPrompt()` 函式：讀取 `petStore.pets`，若長度為 0，呼叫 `toastStore.showToast(...)` 提示，並依目前路由名稱決定是否 `router.push('/dashboard')`；回傳 `boolean` 表示是否可以繼續開啟新增 Modal。三個入口各自在觸發新增 Modal 前呼叫這個函式並依回傳值決定是否繼續，避免三處各寫一份判斷邏輯。

備選方案（不採用）：在 `petStore` 內加 getter + 各頁各自處理提示/導頁文案。不採用的原因是提示文案與導頁邏輯會分散在三個 view 檔案，重複程度高於抽成 composable。

### 寵物圓形頭像列與 Google 行事曆同步按鈕同一列，靠攏時用水平捲動避開

寵物圓形頭像列改為和 `GoogleCalendarSyncButton` 放在同一橫列：頭像列在左側（`flex-1 min-w-0 overflow-x-auto`），同步按鈕固定在右側（`shrink-0`，不被擠壓）。當寵物數量多到頭像列快要碰到同步按鈕時，頭像列本身以水平捲動（既有的 `overflow-x-auto` 行為）容納超出的頭像，不會與按鈕重疊、不會把按鈕擠出畫面、也不會讓整列換行。

### 手機版寵物列與同步按鈕改為上下堆疊，桌機／平板維持同一列

手機版寬度不足以讓寵物頭像列與 `GoogleCalendarSyncButton` 並排，並排會導致按鈕與頭像重疊、頭像被裁切。手機版改為垂直堆疊，桌機／平板（`md` 以上）維持原本同一橫列的排列，改用 `flex flex-col gap-3 md:flex-row md:items-center` 控制。

手機版堆疊順序改回 DOM 原本順序（寵物頭像列在上、同步按鈕在下，移除先前加上的 `order` 工具類），並讓同步按鈕在手機版靠右對齊（`self-end`，只作用在手機版；桌機／平板用 `md:self-auto` 還原成跟隨 `items-center` 垂直置中、跟隨同一橫列排列，不受影響）。

### Growth 頁新增入口先整併

`GrowthView.vue` 目前 `AddGrowthButton` 與 `GrowthChartCard` 的 `@add-record` 都各自直接 `isModalOpen = true`，沒有共用函式可插入檢查。本次會新增一個 `openAddModal` 函式取代這兩處直接賦值，兩個觸發點改為呼叫該函式。

## Implementation Contract

**行為（Behavior）：**
- 使用者在 Dashboard、Medical、Growth 三個頁面點擊「新增」相關按鈕（行事曆新增行程、醫療紀錄新增、成長紀錄新增）時，若目前登入會員的寵物清單為空，新增 Modal 不會開啟
- 此時會顯示一則錯誤樣式的 toast 提示訊息（提示需先新增寵物）
- 若觸發位置不是 Dashboard 頁，額外導頁至 `/dashboard`
- 若寵物清單至少有一筆，行為與現行相同（正常開啟新增 Modal）

**介面（Interface）：**
- `src/composables/useRequirePet.js` 匯出 `useRequirePet()`，回傳 `{ ensurePetOrPrompt }`
- `ensurePetOrPrompt(): boolean`：內部讀取 `usePetStore().pets`、呼叫 `useToastStore().showToast()`、視需要呼叫 `useRouter().push('/dashboard')`；回傳 `true` 表示寵物清單非空（呼叫端可繼續開啟 Modal），回傳 `false` 表示已攔截（呼叫端須 `return` 不開啟 Modal）

**失敗模式（Failure modes）：**
- 這是純前端攔截，不涉及 API 呼叫，沒有網路錯誤或例外狀況需要處理
- 若 `petStore.pets` 尚未載入完成（例如頁面剛掛載、`fetchPets`/`fetchUserPets` 還在進行中）就點擊新增，會被視為「無寵物」而攔截；三個頁面現有的 `onMounted` 都已在掛載時觸發抓取，此為既有時序，本次不額外處理 loading 狀態

**驗收標準（Acceptance criteria）：**
- 會員無任何寵物資料時，在 Dashboard 點擊行事曆「新增」相關按鈕，不開啟 `AddEventModal`，出現提示 toast，網址列仍停留在 `/dashboard`
- 會員無任何寵物資料時，在 Medical 頁點擊「新增紀錄」或空狀態的「立即新增第一筆紀錄」，不開啟 `MedicalRecordModal`，出現提示 toast，並導頁至 `/dashboard`
- 會員無任何寵物資料時，在 Growth 頁點擊「新增紀錄」（`AddGrowthButton` 或圖表卡片內的新增），不開啟 `GrowthRecordModal`，出現提示 toast，並導頁至 `/dashboard`
- 會員至少有一筆寵物資料時，三個入口的既有新增流程行為不變
- Dashboard 頁的寵物圓形頭像列顯示在行事曆網格上方，手機版維持水平捲動、桌機版維持橫列排列，點擊寵物頭像仍會開啟 `PetProfileModal`
- 寵物圓形頭像列與 `GoogleCalendarSyncButton` 在桌機／平板（`md` 以上）同一橫列，頭像列在左、同步按鈕固定在右；頭像數量增加導致快要碰到同步按鈕時，頭像列以水平捲動呈現，同步按鈕位置與寬度不受擠壓
- 手機版（`md` 以下）寵物頭像列與同步按鈕改為垂直堆疊，頭像列在上、同步按鈕在下且靠右對齊，兩者不重疊、頭像不被裁切

**範圍界線（Scope boundaries）：**
- 範圍內：`DashboardView.vue`、`MedicalView.vue`、`GrowthView.vue` 三處新增入口的前置檢查；`PetCard.vue`、`AddPetButton.vue` 的樣式改款與版面搬移；新增 `useRequirePet.js`
- 範圍外：`PetSwitcher.vue` 的行為與樣式、後端 API、寵物新增/編輯/刪除流程本身、Google 日曆同步邏輯

## Risks / Trade-offs

- [Risk] `petStore.pets` 在頁面掛載瞬間尚未載入完成時，使用者若立刻點擊新增按鈕會被誤判為「無寵物」而攔截 → Mitigation：三頁的資料抓取都在 `onMounted` 立即觸發，實務上點擊發生在資料載入之後的機率極高；本次不引入 loading 狀態鎖定新增按鈕，先以現行時序驗收，如驗收時發現誤判再另行處理
- [Risk] Medical／Growth 頁面導頁至 `/dashboard` 後，使用者需要重新導覽回原頁面才能繼續操作，多一步流程 → Mitigation：這是使用者已確認的預期行為（先在首頁完成寵物建檔）
