## 1. 共用刪除確認元件補上防護（Shared delete confirmation modal blocks duplicate confirmation）

- [x] 1.1 實作規格需求「Shared delete confirmation modal blocks duplicate confirmation」：在 `src/components/common/DeleteConfirmModal.vue` 新增 `isLoading`（Boolean，預設 `false`）prop；`isLoading` 為 `true` 時確認鈕與關閉鈕渲染為 disabled，`handleConfirm`/`handleClose` 內部開頭也 `if (props.isLoading) return`（比照 `src/components/calendar/DeleteEventModal.vue` 既有寫法），依設計決策「沿用既有防護模式，不新建共用 composable」處理。驗證：以瀏覽器 DevTools 手動將 `isLoading` 設為 `true`，確認確認鈕與關閉鈕呈現 disabled 樣式且點擊無反應；執行 `npm run build` 確認無建置錯誤。
- [x] 1.2 確認 `DeleteConfirmModal.vue` 在 Modal 被關閉後（成功、失敗或使用者取消）不殘留上次的 `isLoading` 狀態，下次開啟時預設為 `false`。驗證：手動開啟→取消→再開啟，確認第二次開啟時確認鈕為可點擊（非 disabled）狀態。

## 2. 寵物刪除接上防護（Pet deletion applies the duplicate-submit guard）

- [x] 2.1 實作規格需求「Pet deletion applies the duplicate-submit guard」：在 `src/views/DashboardView.vue` 把既有的 `isDeletingPet` 接到 `DeleteConfirmModal` 的 `isLoading` prop 上，並確認請求失敗時（`catch`/`finally`）`isDeletingPet` 會重置為 `false`。驗證：手動開啟寵物刪除確認視窗、快速連點確認鈕兩次，瀏覽器 Network 面板只出現一次對應寵物的 `DELETE` 請求；模擬請求失敗（可暫時中斷網路或後端回傳錯誤）後確認鈕恢復可點擊。

## 3. 醫療紀錄新增／編輯補上送出防護（Medical record creation and update apply a submit guard）

- [x] 3.1 實作規格需求「Medical record creation and update apply a submit guard」：在 `src/components/medical/MedicalRecordModal.vue` 新增/沿用 `isLoading` prop 並綁定既有的 `medicalStore.isLoading`，送出按鈕在請求進行中 disabled，且送出處理函式開頭擋二次觸發（比照 `src/components/pet/AddPetModal.vue` 或 `src/components/growth/GrowthRecordModal.vue` 既有模式）。驗證：新增一筆醫療紀錄時快速連點送出鈕兩次，Network 面板只出現一次對應的 POST 請求；編輯既有紀錄時快速連點儲存鈕兩次，只出現一次 PATCH 請求。
- [x] 3.2 確認醫療紀錄新增/編輯請求成功後才關閉 `MedicalRecordModal` 並更新列表資料；請求失敗後 Modal 保持開啟、按鈕恢復可點擊。驗證：模擬請求失敗（暫時修改 API base URL 或攔截請求回傳錯誤）確認 Modal 未關閉且送出鈕可再次點擊；請求成功後確認 Modal 關閉且列表出現新/更新後的紀錄。

## 4. 醫療紀錄刪除接上防護（Medical record deletion applies the duplicate-submit guard）

- [x] 4.1 實作規格需求「Medical record deletion applies the duplicate-submit guard」：在 `src/views/MedicalView.vue` 新增本地 `isDeleting`（或等效命名）ref，於呼叫 `medicalStore.deleteRecord` 前設為 `true`、於 `finally` 設回 `false`，並傳給 `DeleteConfirmModal` 的 `isLoading` prop。驗證：手動開啟醫療紀錄刪除確認視窗、快速連點確認鈕兩次，Network 面板只出現一次對應的 `DELETE` 請求；模擬請求失敗後確認鈕恢復可點擊。

## 5. 成長紀錄刪除接上防護（Growth record deletion applies the duplicate-submit guard）

- [x] 5.1 實作規格需求「Growth record deletion applies the duplicate-submit guard」：在 `src/views/GrowthView.vue` 新增本地 `isDeleting`（或等效命名）ref，於呼叫 `growthStore.deleteRecord` 前設為 `true`、於 `finally` 設回 `false`，並傳給 `DeleteConfirmModal` 的 `isLoading` prop。驗證：手動開啟成長紀錄刪除確認視窗、快速連點確認鈕兩次，Network 面板只出現一次對應的 `DELETE` 請求；模擬請求失敗後確認鈕恢復可點擊。

## 6. 整體驗證

- [x] 6.1 依 design.md 的 Implementation Contract 逐項手動驗證：寵物刪除、醫療紀錄新增/編輯/刪除、成長紀錄刪除在快速連點下皆只送出一次對應請求，且失敗後按鈕皆能恢復、成功後才關閉視窗與更新畫面；確認本次修改未觸及後端程式碼（前端防護已足夠，不新增後端 idempotency 機制）。驗證：完成上述手動測試後於 PR 描述記錄測試結果；執行 `npm run build` 確認整體建置成功。

## 7. 補齊函式內部 guard（實測擴大範圍，依設計決策「補齊「函式內部 guard」缺口，不只靠按鈕 disabled」處理）

- [x] 7.1 實作規格需求「Growth record creation applies an internal submit guard」：在 `src/components/growth/GrowthRecordModal.vue` 的 `handleSubmit`（及 `handleClose`）開頭加上 `if (props.isSubmitting) return`，並讓關閉/取消鈕也 `:disabled="isSubmitting"`。驗證：DevTools 網速節流「快速 4G」下，快速連續點擊「新增紀錄」數次，Network 面板只出現一次對應的成長紀錄 POST 請求（已用截圖證據確認修復前會重複、修復後只有一次）。
- [x] 7.2 實作規格需求「Growth record inline edit applies an internal submit guard」：在 `src/components/growth/GrowthHistoryModal.vue` 的 `saveEdit` 函式開頭加上 `if (isSaving.value) return`。驗證：在歷史紀錄清單快速連續點擊同一筆紀錄的「儲存」鈕數次，Network 面板只出現一次對應的 PATCH 請求。
- [x] 7.3 實作規格需求「Pet creation applies an internal submit guard」：在 `src/components/pet/AddPetModal.vue` 的 `handleSubmit`（及 `handleClose`）開頭加上 `if (props.isLoading) return`。驗證：網速節流下快速連續點擊「新增寵物」數次，Network 面板只出現一次對應的 POST 請求。
- [x] 7.4 實作規格需求「Pet profile update applies an internal submit guard」：在 `src/components/pet/PetProfileModal.vue` 的 `handleSaveEdit` 開頭加上 `if (props.isSaving) return`。驗證：編輯寵物資料時快速連續點擊「儲存修改」數次，Network 面板只出現一次對應的 PATCH 請求。
- [x] 7.5 實作規格需求「Login form applies an internal submit guard」：在 `src/components/auth/LoginForm.vue` 的 `handleSubmit` 開頭加上 `if (isSubmitting.value) return`。驗證：快速連續點擊「登入」鈕數次，Network 面板只出現一次對應的登入請求。
- [x] 7.6 實作規格需求「Register form applies an internal submit guard」：在 `src/components/auth/RegisterForm.vue` 的 `handleSubmit` 開頭加上 `if (isSubmitting.value) return`。驗證：快速連續點擊「註冊」鈕數次，Network 面板只出現一次對應的註冊請求；執行 `npm run build` 確認整體建置成功。
