## Why

會員在尚未建立任何寵物資料時，仍可進入行事曆、醫療紀錄、成長歷程的新增流程，送出時才因缺少寵物資料而失敗，使用者不清楚原因。另外首頁「新增寵物」區塊目前是方形卡片、置於行事曆下方，與醫療紀錄頁圓形寵物切換列的視覺語言不一致，位置也不夠顯眼，不利於使用者在建立紀錄前先完成寵物建檔。

## What Changes

- 首頁（Dashboard）「新增寵物」區塊改為圓形頭像＋寵物名稱樣式，比照醫療紀錄頁寵物切換列的視覺語言，並移到行事曆區塊上方，手機版維持水平捲動、桌機版維持橫列排列
- 保留原本點擊寵物頭像開啟「寵物詳細資料」Modal 的既有行為
- 新增「建立前置寵物檢查」：在開啟新增行事曆行程、新增醫療紀錄、新增成長紀錄的 Modal 前，檢查目前登入會員是否至少已有一筆寵物資料
  - 在首頁（Dashboard）觸發時：顯示提示訊息，不導頁（頁面上已有新增寵物入口）
  - 在醫療紀錄頁、成長歷程頁觸發時：顯示提示訊息，並導頁至首頁讓使用者新增寵物
- 新增共用邏輯，集中處理「無寵物」判斷與提示/導頁行為，供三個新增入口共用

## Capabilities

### New Capabilities

- `pet-required-guard`: 在建立醫療紀錄、成長紀錄、行事曆行程前，確認會員至少已有一筆寵物資料，否則顯示提示並視頁面情境導頁至首頁新增寵物

### Modified Capabilities

(none)

## Impact

- Affected specs: pet-required-guard (new)
- Affected code:
  - New: src/composables/useRequirePet.js
  - Modified: src/views/DashboardView.vue, src/views/MedicalView.vue, src/views/GrowthView.vue, src/components/pet/PetCard.vue, src/components/pet/AddPetButton.vue, src/test/petCardThemeColors.test.js, src/test/petCardPawTheme.test.js, src/test/petCardMetaAlignment.test.js, src/test/petCardWidth.test.js
