<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `/spectra-*` skills when:

- A discussion needs structure before coding → `/spectra-discuss`
- User wants to plan, propose, or design a change → `/spectra-propose`
- Tasks are ready to implement → `/spectra-apply`
- There's an in-progress change to continue → `/spectra-ingest`
- User asks about specs or how something works → `/spectra-ask`
- Implementation is done → `/spectra-archive`
- Commit only files related to a specific change → `/spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode → `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `/spectra-apply` and `/spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# PawPal CLAUDE Guide

本文件提供 Claude 在 PawPal 專案中的協作規則，重點放在回覆方式、修改原則、實作邊界與驗證流程，避免在協作過程中偏離既有架構與團隊習慣。

## 1. 協作目標

Claude 在本專案中的角色應以「協助完成既有需求、延續現有架構、降低團隊溝通成本」為主，而不是任意重構或改寫已存在的模式。

處理任務時請優先做到：

- 先理解現有結構再修改
- 盡量沿用既有分層與命名
- 不隨意擴大修改範圍
- 若有前後端串接影響，需一起檢查
- 若有規格變更，需同步更新文件與測試

## 2. 專案背景

PawPal 為前後端分離專案：

- 前端：Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS + Axios
- 後端：Express + PostgreSQL + `pg` + Zod + JWT + bcryptjs

主要資料夾：

- `src/`
  - 前端
- `backend/`
  - 後端

## 3. 回覆與說明風格

- 優先使用繁體中文
- 解釋時以清楚、直接、可執行為主
- 若使用者問的是觀念題，先回答核心，再補例子
- 若使用者問的是實作題，優先直接完成，再簡要說明
- 不要過度抽象化
- 不要一次丟過多不必要選項

## 4. 實作原則

### 前端

- API 請求必須集中於 `src/api/`
- 共用狀態放在 `src/stores/`
- 不要在 component 內直接散落寫 Axios / fetch
- 頁面與元件優先延續既有 UI pattern

### 後端

- route 只負責路由與 middleware 組合
- middleware 放共用驗證 / JWT 驗證 / request 前置邏輯
- controller 只處理 request / response
- service 負責資料查詢與商業邏輯
- schema 使用 Zod 驗證 request body / params / query

避免以下情況：

- 在 controller 寫 SQL
- 在 route 寫大量業務邏輯
- 把驗證邏輯散落在 controller 與前端表單中但沒有統一來源

## 5. 命名與檔案規則

### 前端

- Vue 元件：`PascalCase.vue`
- 變數 / 函式：`camelCase`

### 後端

- 統一使用 `snake_case`
- 資源名稱用複數
- 用途後綴用單數

例如：

- `calendar_events.route.js`
- `calendar_events.controller.js`
- `calendar_events.service.js`
- `calendar_events.schema.js`

## 6. API 規格

- 後端 API 前綴統一為：

```txt
/api/v1
```

- 若調整 API path：
  - 要同步檢查前端 `src/api/`
  - 要同步檢查後端 route mount
  - 要同步檢查測試與文件

## 7. UI 協作原則

Claude 在調整 UI 時，應優先維持專案現有視覺語言：

- auth 表單卡片延續既有樣式
- 輸入框延續既有 `rounded-xl` / `focus:ring-brand-blue`
- 主按鈕延續藍 / 橘兩套系統
- sidebar / header 狀態切換以真實登入狀態為準
- 灰色次要文字 hover 優先轉 `brand-orange`

若要新增樣式，請先觀察：

- 是否已有相似元件
- 是否可沿用現有 class pattern
- 是否會破壞 mobile / tablet / desktop 一致性

## 8. 測試要求

### 前端修改後

至少檢查：

```bash
npm run build
```

### 後端修改後

至少檢查：

```bash
cd backend
npm test
```

若修改以下內容，應優先補測試：

- route
- middleware
- controller
- service
- schema

## 9. 文件同步

若本次修改涉及以下內容，請同步檢查文件：

- API 路徑
- 環境變數
- 命名規範
- UI 規範
- 啟動方式

需要時應同步更新：

- `CONTRIBUTING.md`
- `AGENTS.md`
- `CLAUDE.md`
- `backend/README.md`
- `.env.example`

## 10. 不應做的事

- 不要無故大規模重構與本次需求無關的區塊
- 不要隨意改動現有共用規則而不說明影響
- 不要只改前端或只改後端而忽略串接
- 不要讓使用者看到中英混雜的錯誤訊息
- 不要引入與目前專案風格不一致的命名方式

## 11. 建議的工作流程

1. 先讀相關檔案與既有實作
2. 確認這次需求影響前端、後端、測試或文件哪些層面
3. 以最小必要修改完成需求
4. 執行對應驗證
5. 若有需要，補上 commit message、branch name、PR 說明

## 12. 補充說明

若發現本文件與專案現況不一致，應優先以實際專案結構為準，並提出同步更新文件的建議。
