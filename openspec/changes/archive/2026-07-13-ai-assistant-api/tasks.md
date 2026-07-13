## 1. 環境設定與相依套件

- [x] 1.1 安裝 Gemini SDK（`@google/genai`），使 `backend/package.json` 的 dependencies 包含該套件，並以 `npm ls @google/genai`（於 `backend/` 目錄執行）驗證安裝成功
- [x] 1.2 在 `.env.example` 補上 `GEMINI_API_KEY` 說明，以內容審閱確認變數存在且有註解說明用途
- [x] 1.3 在 `backend/src/server.js` 的 `requiredEnvVars` 加入 `GEMINI_API_KEY`，交付 Startup Environment Validation 需求的行為：未設定 `GEMINI_API_KEY` 時伺服器啟動失敗並印出缺少的環境變數清單；以手動測試（暫時自 `.env` 移除 `GEMINI_API_KEY` 後執行 `npm run dev`）驗證伺服器拒絕啟動

## 2. Schema 與輸入驗證

- [x] 2.1 建立 `backend/src/schemas/ai_assistant.schema.js`，實作 Input Validation 需求（訊息長度上限 100 字）：`message` 必填、trim 後不可為空、長度不可超過 100 字；以 `backend/test/ai_assistant.schema.test.js` 涵蓋空字串、超過 100 字、正常長度三種情境驗證

## 3. 急症關鍵字防護網與 Gemini 服務層

- [x] 3.1 建立 `backend/src/services/ai_assistant.service.js`，在檔案內定義 `EMERGENCY_KEYWORDS` 常數陣列（急症關鍵字清單內建於 service 檔案，不獨立成檔），並實作 Emergency Keyword Safety Net 需求（急症關鍵字短路而非事後附加提醒）：呼叫 Gemini 前先以字串包含比對檢查 `message`，命中即短路，回傳固定模板且不呼叫 Gemini；以 `backend/test/ai_assistant.service.test.js` 驗證命中關鍵字時回傳固定模板、且未呼叫注入的 Gemini client
- [x] 3.2 在 `ai_assistant.service.js` 封裝 Gemini SDK 呼叫（Gemini client 以參數注入，service 對外只吐 `{ reply }`），使用 `gemini-2.0-flash` 模型（Gemini 模型選用 `gemini-2.0-flash`）；以 `backend/test/ai_assistant.service.test.js` 驗證未命中關鍵字時會呼叫注入的 Gemini client 並回傳其產生的內容作為 `reply`
- [x] 3.3 在 `ai_assistant.service.js` 攔截注入的 Gemini client 拋出的 quota 相關錯誤，實作 Gemini Quota Error Translation 需求：轉換為固定中文訊息、不透傳原始錯誤內容或英文堆疊；以 `backend/test/ai_assistant.service.test.js` 驗證注入的 Gemini client 拋出 quota 錯誤時，service 回傳固定中文訊息而非原始錯誤

## 4. Controller 與 Route

- [x] 4.1 建立 `backend/src/controllers/ai_assistant.controller.js`，比照 `createXController(service)` DI pattern 實作 AI Pet Care Q&A Endpoint 需求：呼叫 service 並將 `{ reply }` 包成 HTTP 200 回應，service 拋出例外時回傳中文 500 訊息；以 `backend/test/ai_assistant.controller.test.js` 驗證正常回應與例外情境
- [x] 4.2 建立 `backend/src/routes/ai_assistant.route.js`，掛載 `POST /` 並串接 `validate(schema, 'body')` 中介層與 AI 專屬 rate limiter；以 `backend/test/ai_assistant.route.test.js` 驗證路由、schema 驗證中介層與 rate limiter 皆有正確串接

## 5. 專屬 Rate Limit

- [x] 5.1 在 `backend/src/config/rate_limit.js` 新增 `aiAssistantRateLimiter`（比照既有 `readPositiveIntegerEnv` 讀取模式，讀取 `AI_RATE_LIMIT_WINDOW_MS` / `AI_RATE_LIMIT_MAX`，預設 60000 / 10），實作 Dedicated Rate Limiting 需求（專屬 rate limit 疊加於全域限流之上）：同一 IP 於 60 秒內第 11 次請求起回傳 429 中文訊息；以 `backend/test/ai_assistant.route.test.js` 驗證超過限制時回傳 429

## 6. 掛載與整合驗收

- [x] 6.1 在 `backend/src/app.js` 掛載新路由至 `${API_PREFIX}/ai-assistant`，交付 AI Pet Care Q&A Endpoint 對外可達的行為；以 `curl -X POST http://localhost:3000/api/v1/ai-assistant -H "Content-Type: application/json" -d "{\"message\":\"貓咪一天要吃幾餐？\"}"` 手動驗證回傳 `{ reply }` JSON
- [x] 6.2 執行 `cd backend && npm test`，確認 `ai_assistant.route.test.js`、`ai_assistant.controller.test.js`、`ai_assistant.service.test.js`、`ai_assistant.schema.test.js` 與既有測試全數通過，作為本次變更完成的驗收依據
