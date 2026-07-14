## Context

前端 `src/stores/aiAssistant.js` 目前用 `setTimeout` + 隨機字串模擬 AI 回覆，`src/components/ai/AiAssistantMessageList.vue` 完全不接收/顯示 `errorMessage`。後端 `POST /api/v1/ai-assistant` 已完整實作（`backend/src/controllers/ai_assistant.controller.js`、`backend/src/services/ai_assistant.service.js`、`backend/src/schemas/ai_assistant.schema.js`、`backend/src/routes/ai_assistant.route.js`），回傳格式為成功 `{ "reply": string }`（200）、失敗 `{ "message": string }`（400/429/503/500），且 message 已是可直接顯示的繁體中文文字。本次為前後端一起異動：前端串接真實 API，後端同步放寬訊息長度上限。

## Goals / Non-Goals

**Goals:**

- 前端聊天介面呼叫真實後端 API 取得 AI 回覆，取代假資料邏輯
- 401/429/503/500 各錯誤情境在畫面上都有對應的錯誤訊息顯示（沿用後端回傳文字，不由前端改寫）
- 輸入框長度上限前後端一致（150 字），超過時即時提示使用者
- 前端瀏覽器端不可看到任何 Gemini API 金鑰

**Non-Goals:**

- 不修改後端 Gemini 串接邏輯、緊急關鍵字清單、rate limit 門檻數值（僅調整訊息長度上限這一項驗證規則）
- 不新增快速提問按鈕、免責聲明、聊天泡泡樣式、loading 動畫（皆已存在）
- 不對 503/500 做靜默處理或訊息改寫

## Decisions

### API 封裝比照 `src/api/hospitals.js` 慣例

`src/api/ai.js` 提供 `sendAiAssistantMessage(message)`，內部使用 `axios.post(`${API_BASE_URL}${API_PREFIX}/ai-assistant`, { message })`，成功回傳 `{ success: true, reply }`，失敗在 `catch` 內回傳 `{ success: false, message: getErrorMessage(error, fallback) }`，`getErrorMessage` 複製 `hospitals.js` 現有實作（`error.response?.data?.message || error.message || fallbackMessage`）。理由：與既有 API 模組風格一致，且 controller 已回傳可直接顯示的繁中訊息，不需要前端依狀態碼另外寫死文案。

替代方案：讓 store 直接呼叫 axios——被否決，因為違反 CLAUDE.md 「API 請求必須集中於 `src/api/`」規則。

### `errorMessage` 獨立於 `messages`，不寫入聊天紀錄

`sendMessage()` 失敗時只設定 `errorMessage.value`，不呼叫 `addMessage()`。理由：避免錯誤訊息被使用者誤認為「AI 給的回覆」，這是 issue 明確要避免的情況；`errorMessage` 這個 ref 在 store 裡已存在，只是目前沒被用到。

替代方案：把錯誤訊息也塞進 `messages`（用一個 `role: 'error'`）——被否決，因為會混淆聊天紀錄語意，且畫面渲染邏輯要多一套判斷。

### 錯誤訊息顯示比照 `src/components/growth/GrowthRecordModal.vue`

`AiAssistantMessageList.vue` 新增 `errorMessage` prop（`type: String, default: ''`），渲染 `<p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>`，位置在訊息列表下方、loading 泡泡之後。理由：專案裡多處錯誤提示都採這個 class 組合（`text-sm text-red-500` / `text-red-600`），維持視覺一致性。

### 字數上限改為 150，前後端同步

`backend/src/schemas/ai_assistant.schema.js` 的 `MAX_MESSAGE_LENGTH` 由 `100` 改為 `150`；`AiAssistantInput.vue` 的 `<input>` 加上 `maxlength="150"`。理由：前後端上限不一致會導致「前端允許打更多字、送出卻被後端拒絕」的矛盾體驗；經與使用者確認，選擇前後端一致改為 150，而非維持後端 100。

替代方案：只改前端顯示上限、後端維持 100（前端上限僅是輸入框寬鬆度）——被否決，因為使用者明確要求前端上限就是實際可用上限。

### 超字提示採用新增的 inline tooltip，而非既有的全域 toast

`AiAssistantInput.vue` 在 `@input` handler 中偵測 `event.target.value.length >= 150`（原生 `maxlength` 會截斷打字與貼上的內容，故此條件可同時涵蓋兩種超字情境），觸發時顯示一個絕對定位在輸入框上方的提示元素（文字「最多僅能輸入 150 字」），約 2 秒後自動隱藏。理由：經與使用者確認，這個提示要貼近輸入框當下操作情境，而非用全域 `useToastStore()` 的角落彈出提示。

替代方案：複用 `src/stores/toast.js` 的 `showToast()` — 被否決，使用者選擇 inline tooltip 以貼近輸入情境。

## Implementation Contract

**行為（Behavior）**：
- 使用者在 `AiAssistantInput.vue` 輸入問題並送出後，`AiAssistantPanel.vue` 呼叫 `aiAssistantStore.sendMessage(text)`。
- 成功：`messages` 陣列新增一筆 `role: 'assistant'` 訊息，內容為後端回傳的 `reply`。
- 失敗（400/429/503/500）：`messages` 陣列不變，`errorMessage` 被設為後端回傳的 `message` 文字，並顯示於 `AiAssistantMessageList.vue` 底部。下一次 `sendMessage()` 呼叫開始時，`errorMessage` 會被清空。
- 使用者在輸入框打字或貼上文字，若最終內容長度達到 150（即嘗試輸入超過 150 字），在輸入框旁顯示 tooltip 提示「最多僅能輸入 150 字」，約 2 秒後自動消失；文字框本身因 `maxlength="150"` 無法輸入超過 150 字的內容。

**介面 / 資料形狀**：
- `src/api/ai.js` 匯出 `sendAiAssistantMessage(message: string)`，回傳 `Promise<{ success: true, reply: string } | { success: false, message: string }>`
- `POST /api/v1/ai-assistant` request body：`{ message: string }`；success response（200）：`{ reply: string }`；failure response（400/429/503/500）：`{ message: string }`
- `AiAssistantMessageList.vue` 新增 prop：`errorMessage: { type: String, default: '' }`
- `backend/src/schemas/ai_assistant.schema.js` 的 `MAX_MESSAGE_LENGTH` 值為 `150`

**失敗模式**：
- 400（輸入驗證錯誤）/429（rate limit）/503（Gemini quota 用盡）/500（未預期錯誤）：一律走 `sendMessage()` 的失敗分支，`errorMessage` 顯示後端回傳的 `message`，不寫入 `messages`
- 網路層級錯誤（無 `error.response`，例如斷線）：`getErrorMessage` 退回 `error.message` 或呼叫端提供的 fallback 文字（比照 `hospitals.js` 慣例）

**驗收標準**：
- 手動測試：分別觸發 400（送出空字串或超過 150 字，需繞過前端限制以驗證後端行為，例如直接呼叫 API）、429（連續送出超過 10 次請求）、503/500（可透過暫時修改環境變數或 mock 觸發），確認畫面都顯示對應的錯誤文字，且 `messages` 陣列沒有新增假回覆
- `cd backend && npm test` 通過，含更新後的 `ai_assistant.schema.test.js`（150 字邊界）
- `npm run build` 通過
- 瀏覽器 DevTools Network/Sources 檢查，確認前端程式碼與請求內容不含 `GEMINI_API_KEY` 或任何金鑰字串

**範圍邊界**：
- 範圍內：`src/api/ai.js`（新增）、`src/stores/aiAssistant.js`、`src/components/ai/AiAssistantMessageList.vue`、`src/components/ai/AiAssistantInput.vue`、`backend/src/schemas/ai_assistant.schema.js`、`backend/test/ai_assistant.schema.test.js`
- 範圍外：`backend/src/services/ai_assistant.service.js` 的 Gemini 呼叫邏輯、緊急關鍵字清單、rate limit 中介層設定、`AiAssistantPanel.vue` 的免責聲明與開關邏輯（維持現狀）

## Risks / Trade-offs

- [後端字數上限變更屬於 API 契約調整] → 前後端同一次 PR 一起改，避免部署時序不一致造成短暫的前後端限制不符
- [inline tooltip 是專案目前沒有的新 UI 元件樣式] → 盡量使用既有 class token（如 `rounded-xl`、`bg-brand-navy`、`text-white`）維持視覺語言一致，不引入新的顏色系統
- [`errorMessage` 顯示後端原文，若後端未來訊息文案改變不通知前端] → 已有既有慣例（`hospitals.js` 等）採同樣做法，風險可接受
