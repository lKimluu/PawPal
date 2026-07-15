## Problem

PawPal 後端部署於 Render 後，代理層會附帶 `X-Forwarded-For`，但 Express 仍使用預設的未信任代理設定。每次受 rate limiter 保護的 API 請求因此輸出 `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`，且 rate limiter 無法可靠地依用戶端 IP 區分請求來源。

同時，現有 `apiRateLimiter` 以每 IP、15 分鐘 100 次套用於整個 `/api/v1`。登入、寵物、病歷、日曆與醫院地圖共用同一額度；其中 `GET /api/v1/hospitals/map` 會隨地圖移動或縮放頻繁重查，且前端只忽略過期回應、未取消已送出的 HTTP request，正常操作仍可能誤觸 429。

即使拆分端點額度，單純以 IP 作為 key 仍會把公司、學校、家庭或公共 Wi-Fi 下經 NAT 共用公網 IP 的使用者視為同一來源。多人正常登入或操作地圖時會互相消耗額度；反之，若只改用前端可自行產生的 client ID，攻擊者又能輪替 ID 繞過限制。

此外，前端目前顯示尚未串接後端的忘記密碼頁面與「寄出重設連結」入口，容易讓使用者誤以為密碼復原功能可用；本階段決定先移除忘記密碼與重設密碼功能。

## Root Cause

`backend/src/app.js` 建立 Express application 後未設定受信任的代理層數；全域 API rate limiter 與 AI assistant rate limiter 讀取請求 IP 時，偵測到 `X-Forwarded-For` 與 `trust proxy: false` 的矛盾。現有測試只模擬無代理 header 的本機請求，因此未覆蓋部署環境。

## Proposed Solution

- 將 Express 設定為信任正前方一層反向代理，使 Render 傳入的 client IP 可供 Express 與 express-rate-limit 正確解析。
- 新增代理情境的自動化測試，驗證帶有 `X-Forwarded-For` 的請求不再觸發 rate limiter 驗證錯誤，並以轉送的 client IP 分隔限流計數。
- 將一般 API limiter 明確命名並提高為每 IP、15 分鐘 600 次。
- 為 `GET /api/v1/hospitals/map` 建立每 IP、每分鐘 60 次的獨立 limiter，為四個 auth endpoints 建立每 IP、15 分鐘 10 次的獨立 limiter；這些請求不消耗一般 API 額度。
- 讓前端為 auth 與 map requests 傳送持久化的 `X-PawPal-Client-ID`，以「解析後 IP + client ID」提供每瀏覽器額度，並另以較寬鬆的純 IP limiter 保留共享網路層級的防濫用上限；缺少或無效 client ID 時退回原本的純 IP 嚴格門檻。
- 讓一般 limiter 排除專屬路由時採用與 Express 預設 routing 一致的大小寫與尾斜線語意，避免合法的 case 或 trailing-slash 變體同時消耗專屬與一般額度。
- 讓各 limiter 可由環境變數調整，並讓一般 API limiter 的新變數向後相容既有 `RATE_LIMIT_*` 設定。
- 保留既有 AI limiter、繁體中文 429 response 與 API 路徑。
- 移除登入頁的忘記密碼入口、`/forgot-password` route 及其純展示 view/form；直接造訪舊路徑時由既有 NotFound route 處理。

## Non-Goals

- 不調整 Render 服務、CDN 或負載平衡器設定。
- 不改動前端 debounce/request cancellation、API response schema、驗證或授權流程。
- 不無條件信任任意長度的 proxy chain。
- 不調整 AI assistant limiter 或其與一般 limiter 疊加的既有行為。
- 不在本次建立寄信、reset token、密碼更新 API 或新的密碼復原替代流程。

## Success Criteria

- Render 代理請求不再輸出 `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`。
- Express 將正前方一層代理提供的 client IP 作為 rate limit 識別依據。
- 不同 `X-Forwarded-For` client IP 具有獨立的限流計數，相同 client IP 仍受既有限制。
- 一般、hospital map 與 auth limiter 使用各自的預設門檻及獨立計數額度，且都可透過環境變數調整。
- 專屬 map/auth 路由的大小寫或尾斜線變體只消耗對應專屬額度，不消耗一般 API 額度；非專屬路由仍受一般 limiter 保護。
- 同一公網 IP 下具有不同合法 client ID 的瀏覽器各自享有 auth 10 次／15 分鐘與 map 60 次／分鐘額度，同時共享 auth 100 次／15 分鐘與 map 600 次／分鐘的純 IP 安全上限。
- 缺少、格式錯誤或遭清除的 client ID 不會繞過限流；無效 ID 使用純 IP 嚴格額度，輪替合法 ID 仍受純 IP 安全上限約束。
- 前端不再顯示或路由至尚未實作的忘記／重設密碼功能。
- 所有限流器超限時維持既有繁體中文 429 payload。
- 後端完整測試套件通過。

## Capabilities

### New Capabilities

- `proxy-aware-api-rate-limiting`: 定義部署於單層反向代理後方時，API rate limiter 應安全且一致地辨識用戶端 IP。
- `tiered-api-rate-limiting`: 定義一般 API、醫院地圖與敏感 auth endpoints 的獨立限流政策、設定介面及共同錯誤格式。
- `password-recovery-removal`: 定義在密碼復原後端流程完成前，前端不得暴露忘記密碼或重設密碼入口。

### Modified Capabilities

(none)

## Impact

- Affected code:
  - Modified: `backend/src/app.js`
  - Modified: `backend/src/config/rate_limit.js`
  - Modified: `backend/src/routes/auth.route.js`
  - Modified: `backend/src/routes/hospitals.route.js`
  - Modified: `backend/.env.example`
  - Modified: `backend/test/rate_limit.test.js`
  - Modified: `src/api/auth.js`
  - Modified: `src/api/hospitals.js`
  - Modified: `src/router/index.js`
  - Modified: `src/components/auth/LoginForm.vue`
  - Removed: `src/views/ForgotPasswordView.vue`
  - Removed: `src/components/auth/ForgotPasswordForm.vue`
  - New: `openspec/changes/fix-render-trust-proxy/specs/proxy-aware-api-rate-limiting/spec.md`
  - New: `openspec/changes/fix-render-trust-proxy/specs/tiered-api-rate-limiting/spec.md`
  - New: `openspec/changes/fix-render-trust-proxy/specs/password-recovery-removal/spec.md`
