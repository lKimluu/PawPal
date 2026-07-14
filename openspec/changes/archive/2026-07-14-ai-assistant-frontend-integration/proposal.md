## Why

前端「PawPal 寵物小助手」聊天介面目前是假資料（`setTimeout` + 隨機回覆），後端 `/api/v1/ai-assistant` 端點已完整實作（含 Gemini 串接、rate limit、緊急關鍵字安全網、Gemini quota 錯誤轉譯）。需要把前端改接真實 API，讓使用者能實際使用這個功能，並讓 loading、驗證錯誤、rate limit、服務異常等狀態都有對應畫面。

## What Changes

- 新增 `src/api/ai.js`，封裝呼叫 `POST /api/v1/ai-assistant` 的邏輯，回傳格式比照 `src/api/hospitals.js` 的 `{ success, reply }` / `{ success: false, message }` 慣例，錯誤訊息透傳 `error.response?.data?.message`
- `src/stores/aiAssistant.js` 的 `sendMessage()` 改為呼叫 `src/api/ai.js`，成功時把 `reply` 加入 `messages`，失敗時只設定 `errorMessage`（不寫入聊天紀錄，避免變成假回覆）
- `src/components/ai/AiAssistantMessageList.vue` 新增 `errorMessage` prop 與顯示區塊，樣式比照 `src/components/growth/GrowthRecordModal.vue`：`<p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>`
- `src/components/ai/AiAssistantInput.vue`：
  - 輸入框加上 `maxlength="150"`
  - 超過 150 字時（打字或貼上皆會觸發），在輸入框旁顯示 inline tooltip「最多僅能輸入 150 字」，數秒後自動消失
- **BREAKING**（規格調整，非 API 破壞性變更）：後端 `backend/src/schemas/ai_assistant.schema.js` 的 `MAX_MESSAGE_LENGTH` 由 100 改為 150，並同步更新 `backend/test/ai_assistant.schema.test.js` 中對應的邊界測試
- 400 / 429 / 503 / 500 皆需在前端顯示對應的後端錯誤訊息（後端訊息本身已是可直接顯示的繁體中文，不需前端依狀態碼各自寫死文字）

## Non-Goals

- 不新增快速提問按鈕、免責聲明、聊天泡泡樣式、loading 動畫，這些已存在且維持現狀
- 不改變後端 Gemini 串接邏輯、緊急關鍵字清單、rate limit 門檻（僅調整訊息長度上限）
- 不做 503/500 的靜默處理或訊息改寫，維持顯示後端回傳的繁中錯誤訊息

## Capabilities

### New Capabilities

- `ai-assistant-chat-integration`: 前端聊天介面串接真實後端 AI 小助手 API，涵蓋成功回覆顯示、loading 狀態、以及 400/429/503/500 各情境的錯誤訊息顯示

### Modified Capabilities

- `ai-pet-assistant`: 「Input Validation」需求中的訊息長度上限由 100 字改為 150 字

## Impact

- Affected specs: `ai-assistant-chat-integration`（新增）、`ai-pet-assistant`（修改 Input Validation 需求）
- Affected code:
  - New: src/api/ai.js
  - Modified: src/stores/aiAssistant.js, src/components/ai/AiAssistantMessageList.vue, src/components/ai/AiAssistantInput.vue, backend/src/schemas/ai_assistant.schema.js, backend/test/ai_assistant.schema.test.js
