## 1. Sidebar 導覽安全性

- [x] 1.1 實作「Sidebar items render according to route availability」：讓有 `to` 的桌面選單維持 RouterLink 與 active-state，無 `to` 的「通知中心」及「設定」呈現為同樣排版的非互動元素；以檢查渲染分支及 `npm run build` 驗證不再將 undefined 傳給 Vue Router。

## 2. Mock data 清理

- [x] 2.1 實作「Unreferenced mock modules are absent」：刪除五個零引用 mock data 模組並保留 `src/data/hospitals.js`；以全專案 `rg` 搜尋匯入與 export 名稱，確認沒有殘留引用。

## 3. 整體驗證

- [x] 3.1 驗證四個既有 sidebar 路由與 active-state 契約未變，且執行 `npm run build` 成功完成 production build。

## 4. 移除未配置導覽項目

- [x] 4.1 從桌面 sidebar 移除「通知中心」與「設定」選單資料及 DashboardSidebar 未使用的 icon imports，同時保留缺少 `to` 時的防護渲染分支；以全專案 `rg` 檢查元件無殘留項目或 imports，並執行 `npm run build` 驗證。
