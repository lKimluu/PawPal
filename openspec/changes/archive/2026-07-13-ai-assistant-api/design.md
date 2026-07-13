## Context

目前 PawPal 後端沒有任何呼叫生成式 AI 服務的模組。本次要新增一支公開（免登入）API，讓前端未來能送出寵物相關問題並取得 AI 科普回覆，中介呼叫 Gemini API。

限制與背景：
- 此端點登入前即可使用，屬於公開端點，容易被濫用
- 前期可能使用 Gemini free tier，額度有限，超用會影響服務可用性甚至產生帳單風險
- 使用者問題可能涉及寵物急症（如中毒、抽搐），若完全依賴 AI 自行判斷是否提醒就醫，行為不穩定也難以測試
- 現有專案已有兩個呼叫外部第三方 API 的先例可參考：`hospitals` 模組（route/controller/service/schema 分層）與 `backend/database/scripts/geocode_hospitals.js`（呼叫 Google Geocoding API，client 以參數注入方便測試）

## Goals / Non-Goals

**Goals:**

- 提供穩定、可測試的後端 API，讓前端未來可取得 AI 寵物科普回覆
- 在呼叫 Gemini 前先過一層急症關鍵字防護網，確保急症提醒行為不完全依賴 AI 判斷
- 對此公開端點做獨立於全域限流之外的更嚴格額度控管，降低 quota 濫用與帳單風險
- Gemini 額度超限或其他錯誤時，統一轉換為使用者看得懂的中文訊息，不外洩原始錯誤

**Non-Goals:**

- 不包含前端 UI 串接（僅後端 API，前端串接為後續工作）
- 不包含對話歷史儲存或多輪對話 context（本次為單輪問答）
- 不包含使用者身份驗證或個人化回覆（端點免登入，不綁定使用者）
- 不包含急症關鍵字清單以外的內容審核（例如仇恨言論、與寵物無關的濫用輸入偵測），僅處理科普主題限制與急症提醒

## Decisions

### 急症關鍵字短路而非事後附加提醒

呼叫 Gemini 之前先比對使用者輸入是否包含急症關鍵字（純字串包含比對，不引入 NLP）。命中時直接回傳固定模板，**不呼叫 Gemini**，而非先取得 Gemini 回覆後再附加提醒文字。

理由：短路可確保急症提醒行為 100% 可測試、不受 AI 生成內容不穩定影響，同時節省 Gemini API 呼叫額度。取捨是使用者當次問題完全拿不到 AI 生成的個別化回覆，僅得到固定模板；此取捨已與需求方確認可接受，優先安全與可預測性。

### 急症關鍵字清單內建於 service 檔案，不獨立成檔

清單資料量小（8 大類、約 40 個關�址字），且僅供 `ai_assistant.service.js` 內部使用，比照既有 `hospitals.service.js`（`HOSPITAL_SELECT_COLUMNS`）與 `geocode_hospitals.js`（`GOOGLE_GEOCODING_URL`）的模式，以模組內常數陣列 `EMERGENCY_KEYWORDS` 定義，不另開檔案。若未來清單成長到需要跨模組共用，再評估抽成獨立設定檔。

### Gemini client 以參數注入，service 對外只吐 `{ reply }`

`ai_assistant.service.js` 是唯一知道 Gemini SDK 細節的地方；Gemini client 以參數注入（比照 `geocode_hospitals.js` 的 `axiosClient` 注入模式），方便測試時 mock 掉真正的外部呼叫。對外一律回傳 `{ reply: string }`，不外洩 Gemini 原始回應結構，降低未來更換 AI 服務供應商的改動範圍。

### 專屬 rate limit 疊加於全域限流之上

比照 `backend/src/config/rate_limit.js` 既有的 `readPositiveIntegerEnv` 讀取模式，新增獨立的 `aiAssistantRateLimiter`（`AI_RATE_LIMIT_WINDOW_MS=60000`、`AI_RATE_LIMIT_MAX=10`，即同 IP 每分鐘 10 次），掛在 `ai_assistant.route.js` 上。此限流器與現有全域 `apiRateLimiter`（15 分鐘 100 次）並存疊加，AI 端點請求會同時受兩層限制。

### Gemini 模型選用 `gemini-2.0-flash`

免費額度較高、延遲較低，適合科普問答這類輕量任務，且不需要多模態或長 context 能力。

### 訊息長度上限 100 字

於 `ai_assistant.schema.js` 以 Zod 驗證，trim 後不可為空字串，長度上限 100 字，避免過長輸入浪費 token 或被用於 prompt injection 類的濫用。

## Implementation Contract

**Behavior**

- `POST /api/v1/ai-assistant`，request body `{ message: string }`
- 正常情境：`message` 通過驗證、未命中急症關鍵字 → 呼叫 Gemini，回傳 `200 { reply: string }`，`reply` 內容以寵物科普為主（由 system prompt 限制主題）
- 急症關鍵字命中：不呼叫 Gemini，直接回傳 `200 { reply: string }`，`reply` 為固定模板，內容保證包含就醫提醒文字
- 驗證失敗（`message` 為空字串或超過 100 字）：回傳 `400`，中文錯誤訊息
- 超過專屬 rate limit（同 IP 每分鐘 10 次）：回傳 `429`，中文提示訊息
- Gemini 回傳 quota exceeded（429 或等同的額度錯誤）：回傳固定中文提示訊息（例如「AI 小助手目前使用量較大，請稍後再試」），不得包含 Gemini 原始錯誤內容或英文堆疊
- 其他未預期錯誤（例如 Gemini 服務中斷、SDK 呼叫拋例外）：回傳 `500`，統一中文錯誤訊息，並於伺服器端 `console.error` 記錄原始錯誤

**Interface / data shape**

- Request: `{ "message": string }`
- Success response: `{ "reply": string }`
- Error response（400 / 429 / 500 皆同一 shape）: `{ "message": string }`（繁體中文）

**Failure modes**

- 空字串或超長輸入 → 400，不會進入 service 層，也不會呼叫 Gemini
- 急症關鍵字命中 → 不視為失敗，仍是 200，但內容固定，不呼叫外部 API
- Gemini quota exceeded → 轉譯為固定中文訊息，不透傳原始錯誤
- 專屬 rate limit 超過 → 429，訊息與現有全域限流器格式一致（中文、無英文堆疊）

**Acceptance criteria**

- `ai_assistant.schema.test.js`：涵蓋空字串、超過 100 字、正常長度三種情境
- `ai_assistant.service.test.js`：涵蓋「命中急症關鍵字直接短路」「未命中則呼叫注入的 Gemini client 並回傳其結果」「Gemini client 拋出 quota 相關錯誤時轉換為固定中文訊息」三種情境，Gemini client 一律以測試替身注入，不得在測試中呼叫真正的 Gemini API
- `ai_assistant.controller.test.js`：驗證 controller 正確將 service 回傳結果包成 HTTP response，並驗證 service 拋錯時回傳對應中文錯誤訊息
- `ai_assistant.route.test.js`：驗證路由掛載、schema 驗證中介層與 rate limiter 皆有串接
- 手動驗證：在 `backend/.env` 缺少 `GEMINI_API_KEY` 時執行 `npm run dev`，確認伺服器拒絕啟動並印出缺少的環境變數清單

**Scope boundaries**

- In scope：`backend/src/routes/ai_assistant.route.js`、`controllers/ai_assistant.controller.js`、`services/ai_assistant.service.js`、`schemas/ai_assistant.schema.js`、對應測試、`app.js` 掛載、`server.js` 環境變數檢查、`config/rate_limit.js` 新增專屬限流器、`.env.example` 更新
- Out of scope：前端頁面或元件、對話歷史儲存機制、多輪對話、使用者驗證與個人化、急症關鍵字以外的內容審核機制

## Risks / Trade-offs

- [Risk] 急症關鍵字清單不夠完整，可能漏掉未列出的急症描述方式 → Mitigation: 清單集中於單一常數陣列，後續可依實際使用情況快速迭代增補，不影響其他邏輯
- [Risk] 短路模式可能誤判輕微症狀為急症，導致使用者拿不到個別化回覆 → Mitigation: 固定模板本身仍具科普與就醫建議價值，且優先考慮動物安全高於個人化體驗，此取捨已與需求方確認
- [Risk] Gemini free tier 實際額度或錯誤格式可能與預期不同 → Mitigation: service 層統一攔截並轉譯錯誤，若日後發現 Gemini SDK 對 quota 錯誤的回傳格式與預期不同，只需調整 service 內的錯誤判斷邏輯，不影響 controller/route
- [Risk] 依賴同 IP 做限流，NAT 環境下多使用者共用同一 IP 可能互相影響額度 → Mitigation: 屬於已知取捨，與現有全域 rate limit 策略一致，非本次變更範圍
