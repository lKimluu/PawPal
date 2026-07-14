## 1. 後端：Input Validation 上限同步為 150 字

- [x] 1.1 更新 `backend/test/ai_assistant.schema.test.js` 的邊界測試，斷言訊息超過 150 字時被拒絕、150 字以內可通過（TDD 先行，反映「字數上限改為 150，前後端同步」的決策）；驗證：執行 `cd backend && npm test`，此測試案例應先因舊有 100 字限制而失敗
- [x] 1.2 修改 `backend/src/schemas/ai_assistant.schema.js` 的 `MAX_MESSAGE_LENGTH` 為 150，使 Input Validation 需求符合 150 字上限；驗證：執行 `cd backend && npm test`，全數測試通過

## 2. 前端：新增 API 封裝

- [x] 2.1 建立 `src/api/ai.js`，實作 `sendAiAssistantMessage(message)`，呼叫 `POST /api/v1/ai-assistant`，成功回傳 `{ success: true, reply }`、失敗回傳 `{ success: false, message }`，其中「API 封裝比照 `src/api/hospitals.js` 慣例」，`getErrorMessage` 邏輯與 `hospitals.js` 一致；驗證：手動檢查 `src/api/ai.js` 全文不含 `GEMINI` 或任何金鑰字樣，且 `npm run build` 成功

## 3. 前端：store 串接真實 API，錯誤訊息獨立於聊天紀錄

- [x] 3.1 修改 `src/stores/aiAssistant.js` 的 `sendMessage()`，改呼叫 `src/api/ai.js` 的 `sendAiAssistantMessage`，成功時呼叫 `addMessage('assistant', reply)`，實現 Real AI Reply Rendering 行為；驗證：本機啟動前端後，於聊天視窗輸入問題並送出，可看到後端回傳的真實 AI 回覆出現在訊息列表中
- [x] 3.2 `sendMessage()` 失敗時只設定 `errorMessage.value`、不呼叫 `addMessage()`，即「`errorMessage` 獨立於 `messages`，不寫入聊天紀錄」，且每次呼叫開始時清空前一次的 `errorMessage`，實現 Error Message Display Without Fake Replies 行為；驗證：手動送出空字串觸發 400，確認 `messages` 陣列未新增任何項目、`errorMessage` 有值；再送出一則正常訊息，確認舊的 `errorMessage` 被清空

## 4. 前端：錯誤訊息顯示於畫面

- [x] 4.1 `AiAssistantMessageList.vue` 新增 `errorMessage` prop（`type: String, default: ''`），依「錯誤訊息顯示比照 `src/components/growth/GrowthRecordModal.vue`」渲染 `<p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>`，位置在訊息列表下方、loading 泡泡之後；驗證：手動分別觸發 400（空字串）、429（連續送出超過 10 次請求）、503/500（可暫時調整後端環境變數或 mock 觸發），確認四種情境畫面皆顯示對應的錯誤文字
- [x] 4.2 `AiAssistantPanel.vue` 將 `aiAssistantStore.errorMessage` 傳入 `AiAssistantMessageList.vue` 的 `error-message` prop；驗證：4.1 的四種手動測試情境中錯誤文字確實可見（而非僅 store state 有值）

## 5. 前端：150 字上限與 inline tooltip 提示

- [x] 5.1 `AiAssistantInput.vue` 的 `<input>` 加上 `maxlength="150"`，實現 Client-Side Message Length Limit 需求的長度限制；驗證：手動於瀏覽器輸入框輸入超過 150 字，確認輸入內容被截斷在 150 字以內
- [x] 5.2 `AiAssistantInput.vue` 新增 `@input` handler，偵測 `event.target.value.length >= 150` 時顯示一個絕對定位在輸入框附近的 inline tooltip（文字「最多僅能輸入 150 字」），約 2 秒後自動隱藏，即「超字提示採用新增的 inline tooltip，而非既有的全域 toast」的決策；驗證：手動測試打字達 150 字、以及貼上超過 150 字的文字兩種情境，皆可看到 tooltip 出現且約 2 秒後自動消失

## 6. 驗證與收尾

- [x] 6.1 執行前後端驗證指令確認無回歸；驗證：`npm run build` 成功、`cd backend && npm test` 全數通過
- [x] 6.2 確認瀏覽器端不會外洩 Gemini 金鑰；驗證：開啟瀏覽器 DevTools 的 Network 與 Sources 面板，實際送出一次問題並檢查請求內容與前端原始碼，確認皆不含 `GEMINI_API_KEY` 或任何金鑰字串
