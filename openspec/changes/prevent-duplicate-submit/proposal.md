## Why

使用者快速連續點擊「新增」「修改」「刪除確認」按鈕時，部分頁面會重複發送相同的 API 請求，導致資料庫產生重複紀錄，或刪除操作被重複呼叫。調查發現全站已有兩套成熟的防護範本（`calendar/DeleteEventModal.vue` 的刪除防護模式、`AddPetModal.vue`/`UserProfileModal.vue` 的新增編輯防護模式），但共用的刪除確認元件 `common/DeleteConfirmModal.vue` 缺少 `isLoading` prop，且醫療紀錄、成長紀錄部分呼叫端未套用既有模式，導致防護不完整、行為不一致。

## What Changes

- `src/components/common/DeleteConfirmModal.vue` 新增 `isLoading` prop：確認鈕與關閉鈕在 `isLoading` 為 true 時 disabled，`handleConfirm`/`handleClose` 內部同時擋一次重複觸發（比照 `src/components/calendar/DeleteEventModal.vue` 既有寫法）。
- `src/views/DashboardView.vue`（寵物刪除）：接上既有的 `isDeletingPet` 到 `DeleteConfirmModal` 的 `isLoading` prop。
- `src/views/MedicalView.vue`：刪除醫療紀錄新增本地 `isDeleting` ref，傳給 `DeleteConfirmModal` 的 `isLoading` prop。
- `src/components/medical/MedicalRecordModal.vue`：新增/編輯 submit 按鈕新增 `isLoading` prop（沿用既有 `medicalStore.isLoading`），送出期間 disabled 並顯示 loading 狀態。
- `src/views/GrowthView.vue`：刪除成長紀錄新增本地 `isDeleting` ref，傳給 `DeleteConfirmModal` 的 `isLoading` prop。
- **範圍擴大（實測發現）**：以下 6 個檔案的送出/儲存函式原本只靠按鈕 `:disabled` 擋重複觸發、函式內部沒有 guard，在網速較慢時實測仍會重複送出，補上 `if (isLoading/isSubmitting) return`：
  - `src/components/growth/GrowthRecordModal.vue`（成長紀錄新增，已用截圖證據重現問題）
  - `src/components/growth/GrowthHistoryModal.vue`（成長紀錄編輯）
  - `src/components/pet/AddPetModal.vue`（寵物新增）
  - `src/components/pet/PetProfileModal.vue`（寵物編輯）
  - `src/components/auth/LoginForm.vue`（登入）
  - `src/components/auth/RegisterForm.vue`（註冊）

## Non-Goals (optional)

（本次會建立 design.md，Non-Goals 記錄在 design.md 的 Goals/Non-Goals 章節，此處留空）

## Capabilities

### New Capabilities

- `duplicate-submit-guard`: 定義全站新增、修改、刪除資料操作在 API 請求進行中必須阻擋重複觸發（按鈕 disabled/loading、成功後才關閉視窗與更新畫面、失敗後恢復可再次操作）的行為規範，並涵蓋共用刪除確認元件與醫療紀錄、成長紀錄、寵物刪除等呼叫端。

### Modified Capabilities

(none)

## Impact

- Affected specs: `duplicate-submit-guard`（新建）
- Affected code:
  - Modified:
    - src/components/common/DeleteConfirmModal.vue
    - src/views/DashboardView.vue
    - src/views/MedicalView.vue
    - src/components/medical/MedicalRecordModal.vue
    - src/views/GrowthView.vue
    - src/components/growth/GrowthRecordModal.vue
    - src/components/growth/GrowthHistoryModal.vue
    - src/components/pet/AddPetModal.vue
    - src/components/pet/PetProfileModal.vue
    - src/components/auth/LoginForm.vue
    - src/components/auth/RegisterForm.vue
  - New: (none)
  - Removed: (none)
