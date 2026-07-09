## Problem

桌面版 DashboardSidebar 對所有選單項目一律渲染 RouterLink，但「通知中心」與「設定」未提供 to，導致 undefined 被傳入 RouterLink.to 並觸發 Vue Router 警告。

## Root Cause

navItems 同時包含已配置路由與尚未配置路由的展示項目，而模板沒有依 to 是否存在選擇連結或非連結元素。

## Proposed Solution

- 有有效 to 的項目維持 RouterLink、既有導向、圖示與 active-state。
- 沒有 to 的項目以相同視覺樣式的非連結元素呈現，不可點擊、不導航，也不套用 active-state。
- 刪除全專案確認無引用的 calendarEvents、growthRecords、medicalRecords、pets 與 user mock data 模組。
- 保留仍被使用的 hospitals mock data。

## Requirement Update

- 經確認「通知中心」與「設定」並非需要保留的預告功能，因此從桌面 sidebar 選單資料中移除，並清除 DashboardSidebar 對應的未使用 icon imports。
- 前述非連結元素分支保留為資料防護，避免未來誤加入缺少 `to` 的項目時再次將 undefined 傳入 Vue Router。

## Non-Goals

- 不新增或重新命名路由。
- 不擴充 sidebar 資料介面、不修改公開 API 或後端。
- 不重新設計 sidebar 視覺或手機版導覽內容。

## Success Criteria

- 每個實際渲染的 RouterLink 都取得有效字串或路由物件形式的 to。
- 桌面 sidebar 不再顯示「通知中心」與「設定」。
- 四個既有桌面 sidebar 連結保留原導向與 active-state。
- 五個被刪除的 mock data 模組沒有殘留引用，且 npm run build 成功。

## Capabilities

### New Capabilities

- `dashboard-sidebar-navigation`: Dashboard sidebar 僅將具有效路由目標的項目渲染為連結，並安全呈現尚無路由的項目。

### Modified Capabilities

(none)

## Impact

- Affected code:
  - Modified: src/components/layout/DashboardSidebar.vue
  - New: (none)
  - Removed: src/data/calendarEvents.js, src/data/growthRecords.js, src/data/medicalRecords.js, src/data/pets.js, src/data/user.js
