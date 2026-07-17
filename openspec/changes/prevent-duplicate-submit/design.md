## Context

全站有多處新增、修改、刪除資料的操作（寵物、醫療紀錄、成長歷程、會員資料、行事曆等）。唯讀調查（Grep + 逐檔比對 `src/views`、`src/components`、`src/stores`）確認：

- 已有 `isLoading`/`isSubmitting` prop 與 `:disabled` 按鈕：`src/components/auth/LoginForm.vue`、`RegisterForm.vue`、`src/components/pet/AddPetModal.vue`、`PetProfileModal.vue`、`src/components/growth/GrowthRecordModal.vue`、`GrowthHistoryModal.vue`、`src/components/member/UserProfileModal.vue`、以及整個 `src/components/calendar/` 模組（`AddEventModal.vue`、`EditEventModal.vue`、`DeleteEventModal.vue`）。
- **初次唯讀調查誤判**：原本認為上述元件「已有防護、寫法成熟可當範本」而排除在修改範圍外。但真人以「網速節流 + 持續快速連點（非單純點兩下）」實測後發現，除了 `UserProfileModal.vue` 與整個 `calendar/` 模組（函式開頭確實有 `if (isSaving/isLoading) return`）之外，`LoginForm.vue`、`RegisterForm.vue`、`AddPetModal.vue`、`PetProfileModal.vue`、`GrowthRecordModal.vue`、`GrowthHistoryModal.vue` 的送出/儲存函式**只靠按鈕 `:disabled` 擋，函式內部沒有 guard**，在網速慢、DOM 尚未重新渲染成 disabled 的空檔內，仍可能被連續點擊觸發第二次呼叫（`GrowthRecordModal.vue` 已用截圖證據重現：同一筆成長紀錄被新增 2～3 次）。此發現已據此擴大本次修改範圍（詳見下方 Decisions 與 Scope boundaries）。
- 根因：`src/components/common/DeleteConfirmModal.vue` 是寵物刪除、醫療紀錄刪除、成長紀錄刪除共用的確認視窗，但沒有 `isLoading` prop，確認鈕永遠可點。
- 呼叫端缺口：`src/views/DashboardView.vue`（寵物刪除）已有 `isDeletingPet` 卻因元件不支援而沒接上；`src/views/MedicalView.vue`、`src/views/GrowthView.vue` 的刪除流程完全沒有本地 loading 狀態；`src/components/medical/MedicalRecordModal.vue` 的新增/編輯 submit 按鈕完全沒有防護（`medicalStore.isLoading` 已存在但未被使用）。
- 後端沒有 idempotency key 機制；僅寵物資源靠晶片號碼唯一鍵（DB error code `23505`）避免重複新增，其餘資源沒有唯一鍵保護。刪除端點本身是冪等的（重複 DELETE 只會多一次 404，不會產生錯誤資料）。
- 醫院評論與評分（hospital reviews）前端功能尚在另一個 PR 審核中，尚未合併進 `dev`，本次不涵蓋。

## Goals / Non-Goals

**Goals:**

- 讓 `DeleteConfirmModal.vue` 支援 `isLoading` prop，行為比照 `calendar/DeleteEventModal.vue`：`isLoading` 為 true 時確認鈕與關閉鈕 disabled，且 `handleConfirm`/`handleClose` 內部也擋一次重複觸發。
- 讓寵物刪除（`DashboardView.vue`）、醫療紀錄刪除（`MedicalView.vue`）、成長紀錄刪除（`GrowthView.vue`）都把各自的 loading 狀態接上 `DeleteConfirmModal` 的 `isLoading` prop。
- 讓 `MedicalRecordModal.vue` 的新增/編輯 submit 按鈕比照 `AddPetModal.vue`/`GrowthRecordModal.vue` 的模式，送出期間 disabled。
- 請求失敗時所有上述按鈕都要恢復可點擊狀態，讓使用者能重新嘗試。
- Modal 關閉後，loading 狀態需正確重置，不可殘留在下次開啟時仍顯示 loading。

**Non-Goals:**

- 不新建共用 composable（如 `useAsyncAction`）。全站已有兩套成熟範本（刪除模式、新增編輯模式）可直接複製沿用，符合 CLAUDE.md「延續現有架構、不隨意擴大修改範圍」原則。
- 不修改後端，不新增 idempotency key 機制。前端補齊 disabled/loading 防護即可涵蓋「使用者快速連點」情境；刪除端點本身冪等，不需要後端配合。
- 不處理醫院評論與評分（hospital reviews）。該功能前端尚未合併進 `dev`（另一個 PR 審核中），等合併後再另外套用本次確立的防護模式。
- 不處理會員資料修改（`UserProfileModal.vue`）、行事曆模組——這些元件的送出/確認函式**開頭就有** `if (isSaving/isLoading) return` 內部防護，實測確認安全，不在本次修改範圍內。
- 不處理平板/手機裝置的專項測試——本次僅在桌機瀏覽器（含 DevTools 網速節流模擬）驗證，未在實體平板/手機或對應的瀏覽器裝置模式下操作過。

## Decisions

### 沿用既有防護模式，不新建共用 composable

全站已存在兩套經過驗證、彼此獨立但風格一致的模式：
1. **刪除確認模式**（`calendar/DeleteEventModal.vue`）：`isLoading` prop + handler 內 `if (props.isLoading) return` + 按鈕 `:disabled`。
2. **新增/編輯送出模式**（`AddPetModal.vue`、`GrowthRecordModal.vue`、`UserProfileModal.vue`）：`isLoading`/`isSubmitting` prop 綁定 store 狀態或本地 ref，送出按鈕 disabled。

問題不是缺機制，而是共用元件（`DeleteConfirmModal.vue`）與 3 個呼叫端沒套用這兩套既有模式。直接複製既有寫法比新造抽象層改動範圍更小、風險更低，且符合專案既有分層慣例。

備選方案（已否決）：建立 `src/composables/useAsyncAction.js` 統一封裝 loading/disabled 邏輯。否決原因：目前只有 5 個檔案需要修改，抽象層帶來的維護成本大於重複這幾行 prop/guard 邏輯的成本；且會與現有兩套模式並存造成風格不一致。

### 補齊「函式內部 guard」缺口，不只靠按鈕 disabled

實測（DevTools 網速節流「快速 4G」+ 持續快速連點）發現：`GrowthRecordModal.vue`、`AddPetModal.vue`、`PetProfileModal.vue`、`GrowthHistoryModal.vue`、`LoginForm.vue`、`RegisterForm.vue` 的送出/儲存函式只靠按鈕 `:disabled` 屬性擋重複觸發，函式本身沒有 `if (isLoading/isSubmitting) return` 的內部防護。單靠 DOM `disabled` 屬性在網路延遲、畫面重繪較慢的情況下留有空檔，快速連點可能仍會闖關。

修法：比照本次已用於 `DeleteConfirmModal.vue`／`MedicalRecordModal.vue` 的寫法，在上述 6 個檔案的送出/儲存函式**開頭**加上 `if (isLoading/isSubmitting) return`（一行、無其他邏輯變動），與按鈕的 `disabled` 屬性形成雙重防護。`LoginForm.vue`/`RegisterForm.vue` 原本不在計畫範圍（判斷已安全），因與其餘 4 個檔案是同一種缺陷模式、且原始需求本就列出「註冊與登入表單」，故一併納入修正。

備選方案（已否決）：只修復已經用截圖證據重現問題的 `GrowthRecordModal.vue`，其餘留待後續。否決原因：其餘 5 個檔案是完全相同的程式碼寫法（只靠 `disabled`、無內部 guard），修法也完全一致（一行 guard），風險極低、順手一併修復比留著已知缺陷更務實。

### 前端防護已足夠，不新增後端 idempotency 機制

刪除端點在後端是冪等的（找不到資源回 404，不會產生錯誤資料或報錯）；新增端點中唯一有唯一鍵保護的是寵物（晶片號碼）。前端補齊 `isLoading` disabled 防護後，可以擋住「使用者快速連續點擊」這個本次 bug 報告描述的具體情境。後端 idempotency key 是更進一步的加固（防範網路重送、多分頁等更極端情況），與本次修正的 root cause 無關，列為 Non-Goals。

## Implementation Contract

**Behavior**：
- 使用者第一次點擊「新增/儲存」或「確認刪除」按鈕後，該按鈕立即變為 disabled 且顯示 loading 視覺狀態（沿用各元件既有的 loading 樣式，不新增新的視覺元件）。
- 在對應的 API 請求（`medicalApi.createRecord`/`updateRecord`/`deleteRecord`、`petStore.deletePet`、`growthStore.deleteRecord`）完成前，快速連續點擊同一按鈕不會觸發第二次呼叫。
- API 請求成功後才關閉 Modal／確認視窗並更新畫面資料（寵物列表、醫療紀錄列表、成長紀錄列表）。
- API 請求失敗後按鈕恢復為可點擊狀態，使用者可重新送出；已顯示的錯誤訊息維持既有錯誤處理邏輯不變。
- Modal 關閉後（無論成功、失敗或使用者取消），下次開啟該 Modal 時 loading 狀態必須是初始的「未 loading」狀態，不可殘留上次的 loading。

**Interface / data shape**：
- `DeleteConfirmModal.vue` 新增 prop：`isLoading: { type: Boolean, default: false }`。行為與 `DeleteEventModal.vue` 現有的 `isLoading` prop 一致（同名，方便呼叫端沿用相同慣例）。
- `MedicalRecordModal.vue` 新增 prop：`isLoading: { type: Boolean, default: false }`。
- 呼叫端（`DashboardView.vue`、`MedicalView.vue`、`GrowthView.vue`）：刪除與新增/編輯相關的 loading 狀態一律使用**本地 ref**（`isDeleting`／`isSubmitting`，或既有變數名稱如 `isDeletingPet`），在呼叫 store action 前設為 `true`，在 `finally` 區塊設回 `false`，並包住整個呼叫（含 store 內部可能的巢狀請求）。

  **修正記錄**：`MedicalRecordModal` 的 `isLoading` prop 原規劃直接綁定共用的 `medicalStore.isLoading`，但實測發現 `medicalStore.addRecord`/`updateRecord` 內部會呼叫 `fetchRecords` 重新整理列表，而 `fetchRecords` 有自己獨立的 `try/finally` 會提早把共用的 `isLoading` 設回 `false`——早於外層 `addRecord`/`updateRecord` 真正完成，造成快速連點時第二次點擊有機會闖過防護、觸發第二次 POST/PATCH。修正為 `MedicalView.vue` 自建本地 `isSubmitting` ref，包住整個 `onModalSubmit`（含內部所有 await），不依賴 store 共用旗標。

**Failure modes**：
- API 請求拋出例外時，loading 狀態必須在 `catch`/`finally` 中重置為 `false`，讓按鈕恢復可點擊；現有的錯誤提示（例如 toast 或表單內錯誤訊息）邏輯不變，只補上 loading 重置。
- 不新增新的錯誤訊息文案；沿用各功能現有的錯誤處理與顯示方式。

**Acceptance criteria**：
- 手動驗證：在 `MedicalView.vue`、`GrowthView.vue`、`DashboardView.vue` 分別快速連續點擊「確認刪除」，Network 面板只出現一次對應的 DELETE 請求。（已用截圖驗證：醫療紀錄新增/編輯/刪除、寵物刪除、成長紀錄刪除皆只出現一次對應請求）
- 手動驗證：在 `MedicalRecordModal.vue`、`GrowthRecordModal.vue`、`AddPetModal.vue` 快速連續點擊「新增」/「儲存」，Network 面板只出現一次對應的 POST/PATCH 請求；`GrowthHistoryModal.vue`、`PetProfileModal.vue` 的編輯儲存同樣只觸發一次 PATCH；`LoginForm.vue`/`RegisterForm.vue` 快速連點只送出一次登入/註冊請求。建議在 DevTools 網速節流（如「快速 4G」）下測試，比正常網速更容易重現競態問題。
- 手動驗證：API 請求失敗（可用瀏覽器 DevTools 模擬離線或後端回傳錯誤）後，按鈕恢復可點擊，可重新送出。
- 手動驗證：Modal 關閉後重新開啟，loading/disabled 狀態為初始狀態。
- 執行 `npm run build`（前端）確認無型別/建置錯誤（本專案為 JS，無 TypeScript 型別檢查，但需確認 Vite build 成功）。

**Scope boundaries**：
- In scope：`common/DeleteConfirmModal.vue`、`DashboardView.vue`（寵物刪除呼叫端）、`MedicalView.vue`（醫療紀錄刪除呼叫端）、`MedicalRecordModal.vue`（醫療紀錄新增/編輯）、`GrowthView.vue`（成長紀錄刪除呼叫端）、`GrowthRecordModal.vue`（成長紀錄新增）、`GrowthHistoryModal.vue`（成長紀錄編輯）、`AddPetModal.vue`（寵物新增）、`PetProfileModal.vue`（寵物編輯）、`LoginForm.vue`（登入）、`RegisterForm.vue`（註冊）。
- Out of scope：`UserProfileModal.vue`（會員資料修改，已確認安全）、行事曆模組全部（已確認安全）、醫院評論與評分（前端未合併）、任何後端程式碼、平板/手機裝置專項測試。

## Risks / Trade-offs

- [Risk] `DeleteConfirmModal.vue` 被多處共用，修改其 prop 介面可能影響未預期的呼叫端 → Mitigation：新增的 `isLoading` prop 預設值為 `false`，未傳入時行為與現況完全一致（不 disabled），屬於向後相容的新增，不會破壞既有呼叫端。
- [Risk] `MedicalRecordModal.vue` 新增 prop 命名若與元件內部既有變數衝突 → Mitigation：實作前先讀取該檔案確認目前的 prop/變數命名，若已有類似用途的 prop 則沿用既有名稱而非新增重複命名。
- [Risk] 手動驗證涵蓋不到所有裝置（電腦/平板/手機）→ Mitigation：本次修改是 Vue 邏輯層（prop/ref/事件處理），非裝置專屬的 CSS 或元件分支，理論上一次修改即涵蓋 responsive 版面；仍建議至少在瀏覽器縮放到手機寬度下手動測試一次刪除與新增流程。
