## Why

前端後續需要整合 AI 寵物科普問答功能，因此需先建立後端 API 作為前端與 Gemini API 之間的中介層。此端點在登入前即可公開使用，即使前期採用 Gemini free tier，若沒有額度控管與內容安全邊界，容易被濫用造成 quota 快速耗盡或衍生帳單風險，因此需要在功能上線前就設計好限流、急症防護與錯誤處理機制。

## What Changes

- 新增 `POST /api/v1/ai-assistant` API，接收使用者問題並回傳 AI 寵物科普回覆
- 新增 `ai_assistant.service.js`，封裝 Gemini SDK（`gemini-2.0-flash`）呼叫邏輯，對外統一回傳 `{ reply }` 格式，不外洩 Gemini 原始回應結構
- 新增急症關鍵字防護網：呼叫 Gemini 前先比對使用者輸入是否包含急症關鍵字，命中則直接短路（不呼叫 Gemini），改回傳固定的科普提醒與就醫提醒模板
- 新增此端點專屬的嚴格 rate limit（同 IP 每分鐘 10 次），獨立疊加於現有全域 rate limit（15 分鐘 100 次）之上
- Gemini 額度超過限制（quota exceeded / 429）時，統一轉換為固定中文提示訊息，不將原始英文錯誤或堆疊回傳給前端
- `server.js` 啟動時新增 `GEMINI_API_KEY` 必要環境變數檢查，未設定則拒絕啟動
- `.env.example` 補上 `GEMINI_API_KEY` 說明

## Capabilities

### New Capabilities

- `ai-pet-assistant`: 提供 AI 寵物科普問答 API，內含急症關鍵字防護網、專屬 rate limit 與 Gemini 額度錯誤轉換機制

### Modified Capabilities

(none)

## Impact

- Affected specs: `ai-pet-assistant`（新增）
- Affected code:
  - New:
    - backend/src/routes/ai_assistant.route.js
    - backend/src/controllers/ai_assistant.controller.js
    - backend/src/services/ai_assistant.service.js
    - backend/src/schemas/ai_assistant.schema.js
    - backend/test/ai_assistant.route.test.js
    - backend/test/ai_assistant.controller.test.js
    - backend/test/ai_assistant.service.test.js
    - backend/test/ai_assistant.schema.test.js
  - Modified:
    - backend/src/app.js
    - backend/src/server.js
    - backend/src/config/rate_limit.js
    - backend/package.json
    - backend/package-lock.json
    - .env.example
  - Removed:
    (none)
