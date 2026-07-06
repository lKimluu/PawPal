<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- A discussion needs structure before coding → `$spectra-discuss`
- User wants to plan, propose, or design a change → `$spectra-propose`
- Tasks are ready to implement → `$spectra-apply`
- There's an in-progress change to continue → `$spectra-ingest`
- User asks about specs or how something works → `$spectra-ask`
- Implementation is done → `$spectra-archive`
- Commit only files related to a specific change → `$spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# PawPal AGENTS Guide

本文件提供 AI coding agent 與協作者在 PawPal 專案中的工作規則，重點在於如何理解專案結構、遵守分層原則，以及在不破壞既有流程下完成修改。

## 1. 專案概況

PawPal 為前後端分離專案：

- `src/`
  - Vue 3 + Vite 前端
- `backend/`
  - Express + PostgreSQL 後端

前端使用：

- Vue 3
- Vite
- Vue Router
- Pinia
- Tailwind CSS
- Axios

後端使用：

- Express
- PostgreSQL
- `pg`
- Zod
- JWT
- bcryptjs

## 2. 目錄與責任

### 前端

- `src/views/`
  - 頁面層
- `src/components/`
  - 可重用 UI 元件
- `src/stores/`
  - Pinia store，管理登入狀態與前端共享資料
- `src/api/`
  - 前端 API 請求集中管理

### 後端

- `backend/src/routes/`
  - 定義 API endpoint 與 middleware 組合
- `backend/src/middlewares/`
  - JWT 驗證、Zod 驗證等可重用請求前置邏輯
- `backend/src/controllers/`
  - 處理 request / response
- `backend/src/services/`
  - 商業邏輯與資料存取
- `backend/src/schemas/`
  - Zod schema
- `backend/test/`
  - Node test 測試

## 3. API 規則

- 所有後端 API 前綴統一為：

```txt
/api/v1
```

- 前端請求必須集中在 `src/api/`
- 不要在 Vue component 內直接散落撰寫 Axios / fetch

## 4. 後端分層原則

- `routes`
  - 只定義路徑、HTTP method、middleware 與 controller
- `middlewares`
  - 放 JWT 驗證、Zod 驗證與其他共用攔截邏輯
- `controllers`
  - 只處理 request / response、status code、錯誤回應
- `services`
  - 放資料查詢與商業邏輯
- `schemas`
  - 驗證 request body / params / query

實作時請避免：

- 在 controller 寫 SQL
- 在 component 直接呼叫後端
- 把大量驗證邏輯散落在 route 或 component

## 5. 命名規範

### 前端

- Vue 元件：`PascalCase.vue`
- 變數 / 函式：`camelCase`

### 後端

- 檔名統一使用 `snake_case`
- 資源名稱使用複數
- 用途後綴使用單數

格式範例：

- `calendar_events.route.js`
- `calendar_events.controller.js`
- `calendar_events.service.js`
- `calendar_events.schema.js`

## 6. UI 與互動原則

- 保持既有視覺語言一致，不要無故換掉成熟樣式系統
- 顯示給使用者的文字優先使用繁體中文
- 次要灰字 hover 優先使用 `hover:text-brand-orange`
- 主內容容器優先延續：
  - `max-w-[1024px] mx-auto px-4`
  - 或 `max-w-5xl mx-auto px-4`

### Auth 表單既有樣式

- auth 卡片優先沿用：
  - `w-full max-w-[360px]`
  - `rounded-[18px]`
  - `bg-white`
  - `px-8 py-7`
  - `shadow-[0_10px_35px_rgba(31,41,55,0.16)]`

- auth 輸入框優先沿用：
  - `h-11 w-full rounded-xl`
  - `bg-[#F3F4F8]`
  - `px-4`
  - `text-[14px] font-medium text-brand-navy`
  - `focus:ring-2 focus:ring-brand-blue`

### Sidebar / Header

- 手機 / 平板 sidebar 以右側抽屜模式為主
- 已登入 / 未登入切換必須依真實 auth state 判斷
- 不可只靠頁面 variant 推斷登入狀態

## 7. 修改原則

- 優先延續既有模式，不要無故重寫整塊結構
- 若已有共用 helper / store / schema，優先沿用
- 若是結構性修改，請同步更新測試與文件
- 若是 breaking change，需一併調整前後端串接

## 8. 測試與驗證

### 前端

至少執行：

```bash
npm run build
```

### 後端

至少執行：

```bash
cd backend
npm test
```

若有調整：

- route
- middleware
- controller
- service
- schema

請盡量補對應測試。

## 9. 環境變數

### 前端

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 後端

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
DB_HOST=...
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=...
JWT_SECRET=...
```

新增環境變數時，請同步更新 `.env.example`。

## 10. Git 與 PR

### Branch

- `feat/...`
- `fix/...`
- `refactor/...`
- `docs/...`
- `chore/...`

### Commit

遵循 Conventional Commits，例如：

- `feat: 建立會員登出功能`
- `fix: 修正登入後手機與平板仍顯示 public sidebar`
- `refactor: 將 API 路由前綴統一調整為 /api/v1`

### PR

建議包含：

- 功能說明
- 異動內容
- 測試方式

如發現本文件與專案現況不一致，請同步更新。
