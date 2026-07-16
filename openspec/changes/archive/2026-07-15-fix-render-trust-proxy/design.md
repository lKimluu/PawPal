## Context

PawPal 後端使用 Express 5，並在 `/api/v1` 套用 express-rate-limit。Render 對公開請求終止連線後，將用戶端位址放入 `X-Forwarded-For` 再轉送至應用程式；Express application 目前維持 `trust proxy: false`。express-rate-limit 因而無法確認 `req.ip` 的可信來源，輸出驗證錯誤並以代理端位址進行計數。

目前一般 limiter 為每 IP、15 分鐘 100 次，所有 `/api/v1` 請求共享額度。醫院地圖的 bounds query 會隨移動與縮放觸發，已送出但在前端被視為過期的 request 仍會抵達後端；因此正常地圖操作的流量型態與一般 CRUD API 不同。Auth endpoints 則需要比一般 API 更嚴格的防暴力嘗試門檻。

分級 limiter 仍以 IP 作為唯一 key。同一 Wi-Fi 下的瀏覽器通常經 NAT 共用公網 IP，會互相消耗 auth 與 map 額度。前端目前沒有匿名 session/device identifier；auth payload 也不具備跨四個 endpoints 都能在驗證前安全取得的帳號識別，因此需要新增明確且不含個資的 client ID contract，並以純 IP 第二層限制防止任意輪替 client ID。

前端另有 `/forgot-password` 純展示 route、view/form 與登入頁入口，但後端沒有 forgot/reset password API。頁面宣稱會寄出重設連結卻沒有實際 submit flow，本階段先移除以避免誤導。

此修正屬於安全敏感設定：信任範圍不足會使所有用戶共用代理 IP，信任範圍過大則允許外部請求偽造 client IP 以繞過限流。

## Goals / Non-Goals

**Goals:**

- 讓單層反向代理部署下的 Express `req.ip` 解析為代理所轉送的 client IP。
- 讓全域與 AI assistant rate limiter 使用正確的 client IP 並停止輸出代理設定驗證錯誤。
- 以自動化測試固定代理信任值與不同 client IP 的獨立計數行為。
- 讓一般 API、醫院地圖與敏感 auth endpoints 使用符合風險與頻率的獨立額度。
- 讓共享公網 IP 下的正常瀏覽器擁有獨立 auth/map 額度，同時保留純 IP 防濫用上限。
- 保留既有部署設定相容性及所有 limiter 的繁體中文 429 response。
- 在真正的密碼復原流程完成前移除無效的前端入口與頁面。

**Non-Goals:**

- 不支援任意或動態長度的 proxy chain。
- 不變更 API endpoint、前端 debounce/request cancellation 或認證流程。
- 不新增 dependency，也不修改 Render、CDN、資料庫或認證設定。
- 不調整 AI assistant limiter 或其疊加於一般 limiter 的既有行為。
- 不把 client ID 視為身分驗證、授權或可信裝置憑證，也不採集硬體 fingerprint。
- 不新增寄信服務、reset token、forgot/reset password backend API 或資料庫 schema。

## Decisions

### 將 Express trust proxy 固定為一層

在 Express application 建立後、註冊 middleware 前設定 `app.set('trust proxy', 1)`。數字 `1` 僅信任距離應用程式最近的一個 hop，符合目前 Render → Express 的拓撲，也使 `req.ip` 取用該代理傳入的 client address。

替代方案 `true` 會信任完整 `X-Forwarded-For` chain；express-rate-limit 將其視為過度寬鬆，外部呼叫者可能偽造 header 左側位址以繞過 IP 限流，因此不採用。以自訂函式或 subnet allowlist 限制代理雖更細緻，但需要穩定的 Render proxy 網段與額外營運維護，超出本次單層部署修正範圍。

### 使用實際 Express IP 解析路徑驗證代理行為

測試必須透過設定了 `trust proxy: 1` 的 Express application 處理帶 `X-Forwarded-For` 的請求，驗證不同 client IP 的 rate limit store key 相互隔離，且相同 client IP 超限時仍回傳 429。測試使用 Node 內建 HTTP 能力與既有 dependency，不為此修正新增測試套件。

僅 mock `req.ip` 的替代方案無法證明 Express 已依代理設定正確解析 header；僅斷言 `app.get('trust proxy')` 也無法證明 limiter 的可觀察行為，因此均不足以單獨作為回歸測試。

### 以專屬 limiter 取代 map 與 auth 的一般額度

將現有 limiter 改名為 `generalApiRateLimiter`，預設調整為每 IP、15 分鐘 600 次。一般 limiter 的 `skip` 先將 request path 轉為小寫並移除尾端斜線（根路徑除外），再排除四個 auth POST endpoints 與 `GET /hospitals/map`；排除條件仍同時檢查 HTTP method 與正規化後的 path，讓大小寫及 trailing-slash 變體符合 Express 預設的 case-insensitive、non-strict routing 語意，同時避免其他 hospital API 意外繞過一般限制。

`hospitalMapRateLimiter` 在 map route 的 schema validation 與 controller 前執行，預設每 IP、60 秒 60 次。`authRateLimiter` 套用於 `register`、`login`、`google-login`、`line-login`，同樣在 validation 與 controller 前執行，預設每 IP、15 分鐘 10 次。如此無效輸入也會消耗專屬額度，避免攻擊者利用驗證失敗繞過防濫用機制。

替代方案是讓專屬 limiter 與一般 limiter 疊加，但 map/auth 仍會消耗共用額度，無法完整解決不同流量型態互相影響，因此不採用。AI assistant 已有明確的疊加契約，本次不改變。

替代方案是逐一列舉每個大小寫或尾斜線變體，但大小寫組合無法合理窮舉，也容易在新增專屬路由時遺漏，因此不採用。正規化只用於判斷是否跳過一般 limiter，不改寫請求 URL 或 Express 的實際路由解析結果。

### 集中共用 429 handler 並保留環境設定相容性

所有 limiter 共用同一個 handler，超限時回傳 HTTP 429 與 `{ "message": "請求過於頻繁，請稍後再試" }`，避免新增 limiter 後錯誤格式漂移。

一般 limiter 優先讀取 `GENERAL_API_RATE_LIMIT_WINDOW_MS` / `GENERAL_API_RATE_LIMIT_MAX`，未設定或不是正整數時回退既有 `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX`，再回退預設 900000 / 600。Map 使用 `HOSPITAL_MAP_RATE_LIMIT_WINDOW_MS` / `HOSPITAL_MAP_RATE_LIMIT_MAX`，auth 使用 `AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX`。所有值只接受正整數；無效值使用下一層 fallback 或安全預設。

### 使用匿名 client ID 隔離共享 IP 下的瀏覽器額度

新增前端 helper，以 `crypto.randomUUID()` 產生 RFC 4122 UUID v4 並儲存在 `localStorage` 的 `pawpal_client_id`。Auth 四個 POST requests 與 hospital map GET request 以 `X-PawPal-Client-ID` header 傳送；helper 在 browser storage 或 crypto 不可用時安靜地不加 header，由後端 fallback 處理，不阻擋原 API 呼叫。

後端只接受單一、canonical UUID v4 header。client-aware limiter 的 key 使用 express-rate-limit `ipKeyGenerator(req.ip)` 正規化後的 IP 與小寫 client ID 組合，並加上 key 類型 prefix；缺少、多值或格式錯誤時只使用正規化 IP。Client ID 不寫入 response、不記錄為帳號資料，也不參與 authentication/authorization。

替代方案是依 auth email 計數，但 Google/LINE 登入在驗證外部 token 前沒有可信 email，且把 email 放入 limiter key 會增加個資處理。只用 client ID 則可被任意輪替，因此仍需下一節的純 IP ceiling。

### 以純 IP ceiling 防止輪替 client ID 繞過限制

每個 auth/map request 依序通過純 IP ceiling 與 client-aware limiter。Client-aware 門檻維持 auth 10 次／15 分鐘、map 60 次／分鐘；純 IP ceiling 預設 auth 100 次／15 分鐘、map 600 次／分鐘，分別由 `AUTH_IP_RATE_LIMIT_WINDOW_MS` / `AUTH_IP_RATE_LIMIT_MAX` 與 `HOSPITAL_MAP_IP_RATE_LIMIT_WINDOW_MS` / `HOSPITAL_MAP_IP_RATE_LIMIT_MAX` 調整。

缺少或無效 client ID 時，client-aware limiter 退回純 IP key 並維持 10/60 的嚴格門檻；合法但持續輪替的 ID 最終仍受 100/600 ceiling 限制。兩層 limiter 共用相同 429 contract。不同 client ID 只有在同一 IP 內隔離額度，網路切換會形成新的 composite key，這是以共享 NAT 公平性換取的可接受行為。

### 暫時移除未實作的密碼復原入口

刪除 `/forgot-password` route、`ForgotPasswordView.vue`、`ForgotPasswordForm.vue` 與登入表單的忘記密碼連結及分隔符；更新 lazy-loading 測試，不再期待該 view。既有 catch-all NotFound route 保留，因此 bookmark 或外部舊連結會顯示 404 頁面。

目前不存在獨立 reset-password route、backend route/controller/service/schema 或 API client，不建立 placeholder，也不改動登入、註冊、Google/LINE authentication flow。未來若要恢復，須另案設計 enumeration-safe response、一次性 token、到期時間與寄信流程。

## Implementation Contract

- **Behavior:** 公開 API 經一層可信 proxy 時以正確 client IP 計數且不輸出 validation error。一般 API 維持每 IP 600 次／15 分鐘。Auth/map 使用 `IP + client ID` 的 10 次／15 分鐘與 60 次／分鐘額度，並各自共享純 IP 100 次／15 分鐘與 600 次／分鐘 ceiling；缺少有效 client ID 時退回純 IP 嚴格門檻。前端不再顯示忘記或重設密碼入口，舊 `/forgot-password` 由 NotFound 處理。
- **Interface / data shape:** Auth/map requests 可帶 `X-PawPal-Client-ID: <UUID v4>`；前端使用 `pawpal_client_id` localStorage key。後端匯出 client-aware 與 IP ceiling limiters/options；新增 `AUTH_IP_RATE_LIMIT_*`、`HOSPITAL_MAP_IP_RATE_LIMIT_*` 並保留既有 limiter env。現有成功 payload、HTTP 429 與 `{ "message": "請求過於頻繁，請稍後再試" }` 維持不變。
- **Failure modes:** storage/crypto 不可用時前端省略 header；缺少、多值或非 UUID v4 header 時後端使用純 IP 嚴格 key。合法 client ID 可被清除或輪替但不能繞過純 IP ceiling。環境值無效時使用安全預設。直接造訪已移除的密碼復原路徑顯示 NotFound，不送出 API request。
- **Acceptance criteria:** 後端測試覆蓋相同 IP 不同 ID 隔離、相同 ID 超限、無效/缺少 ID fallback、輪替 ID 的 IP ceiling、IPv4/IPv6 key 正規化、共同 429 與環境預設；前端測試覆蓋 UUID 持久化、header 注入與 storage/crypto fallback、密碼復原入口/route 移除。在 `backend` 執行 `npm test` 並在專案根目錄執行 `npm run build` 均通過。
- **Scope boundaries:** in scope 為單層 proxy、一般/map/auth 分級與 client-aware rate limiting、匿名 client ID frontend plumbing、移除未實作密碼復原 UI 及測試；out of scope 為硬體 fingerprint、可信裝置、全域 URL canonicalization、前端 request cancellation、AI limiter、寄信/reset token/backend password recovery、資料庫及多層 proxy chain。

## Risks / Trade-offs

- [Risk] 未來在 Render 前方加入 CDN 後，固定一層可能再次取得錯誤的 hop → [Mitigation] 拓撲變更時另案改為明確 hop 數或代理網段 allowlist，並擴充對應測試。
- [Risk] 開發環境直接連線時不存在可信代理 → [Mitigation] `trust proxy: 1` 不會要求請求必須含轉送 header；無 header 時 Express 仍使用 socket remote address。
- [Trade-off] 數字 hop 設定依賴所有公開路徑具有一致拓撲 → 目前服務只有 Render 單層入口，接受此限制並在設計契約中記錄。
- [Risk] 一般 limiter 的 skip 條件與 route path 漂移 → [Mitigation] 以 route-level assertions 固定 method/path，並驗證其他 hospital endpoints 仍受一般 limiter。
- [Risk] skip 比對語意與 Express routing 設定漂移 → [Mitigation] 以大小寫、尾斜線及非專屬路徑的 quota assertions 固定目前 Express 預設語意；若日後啟用 case-sensitive 或 strict routing，須同步調整正規化契約與測試。
- [Trade-off] 新舊一般 limiter 環境變數並存增加短期設定複雜度 → [Mitigation] 明確定義新變數優先並在 `.env.example` 記錄 fallback，讓部署可逐步遷移。
- [Risk] Client ID 可由呼叫者自行產生或輪替 → [Mitigation] Client ID 只改善公平性、不作為安全身分；純 IP ceiling 提供不可由更換 ID 繞過的第二層限制。
- [Risk] localStorage 被清除、禁止或無法使用 → [Mitigation] helper 不讓 storage error 中斷 API，後端缺少有效 ID 時退回純 IP 嚴格門檻。
- [Risk] 自訂 header 觸發跨來源 preflight → [Mitigation] 以現有 CORS middleware 的 requested-header reflection 支援，並以 frontend API 測試與 build 驗證；不放寬 origin policy。
- [Trade-off] 移除忘記密碼後使用者暫時沒有自行復原入口 → [Mitigation] 不展示無效承諾；待安全的 backend/token/email flow 完成後以獨立 change 恢復。

## Migration Plan

1. 部署包含 Express 設定、分級 limiter 與回歸測試的版本，不需資料遷移；既有 `RATE_LIMIT_*` 可繼續使用。
2. 以一筆正常 API 請求確認 Render log 不再出現 `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`。
3. 觀察一般、map 與 auth endpoints 的 429 比例；需要調整時修改對應環境變數，不需重新建置。
4. 部署 client-aware 版本後觀察 shared-IP ceiling 的 429 比例；若誤傷，以 `AUTH_IP_RATE_LIMIT_*` 或 `HOSPITAL_MAP_IP_RATE_LIMIT_*` 調整，client-aware 嚴格門檻維持不變。
5. 密碼復原頁面移除不需資料遷移；回滾 application bundle 即可恢復原展示頁，但不會新增後端能力。
6. 若部署後發現實際代理拓撲不同，回滾該版本恢復原設定，再以實際 hop 數另行提案；不改用 `true` 作為臨時處理。

## Open Questions

無；目前已知部署拓撲為 Render 單層反向代理。
