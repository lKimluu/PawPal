## 1. 代理情境回歸測試

- [x] 1.1 依「使用實際 Express IP 解析路徑驗證代理行為」決策，在 `backend/test/rate_limit.test.js` 建立使用 Node 內建 HTTP 能力的測試 application，先重現 `API rate limiting identifies clients behind one trusted proxy`：帶 `X-Forwarded-For: 203.0.113.10` 的請求須由 Express 解析為該 client IP，且不得輸出 `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`；以在 `backend` 執行 `node --test test/rate_limit.test.js` 時新增測試在 production 修正前失敗來驗證重現成立。
- [x] 1.2 在同一測試 application 覆蓋 `Rate limit counters remain isolated by resolved client IP`：限制為每個 window 一次時，兩個不同轉送 client IP 的首次請求均放行，同一 client IP 的第二次請求回傳既有 429 JSON；以在 `backend` 執行 `node --test test/rate_limit.test.js` 並檢查上述 status 與 payload assertions 驗證。
- [x] 1.3 新增不含 `X-Forwarded-For` 的直接連線案例，確認本機開發請求仍以 socket remote address 通過既有限流流程；以在 `backend` 執行 `node --test test/rate_limit.test.js` 並通過 direct-request assertion 驗證。

## 2. 分級 limiter 設定

- [x] 2.1 在 `backend/test/rate_limit.test.js` 覆蓋 `General API requests use a configurable shared policy` 與 `All API rate limiters retain one Traditional Chinese error contract`：驗證一般 limiter 預設為 900000/600、新環境變數優先於舊變數、無效新值回退有效舊值或預設值，且各 limiter 超限都回傳相同 429 JSON；以單檔測試通過驗證。
- [x] 2.2 依「集中共用 429 handler 並保留環境設定相容性」決策，在 `backend/src/config/rate_limit.js` 匯出 `generalApiRateLimiter`、`hospitalMapRateLimiter`、`authRateLimiter` 及各自 options，共用既有繁體中文 handler，落實一般 15 分鐘 600 次、map 每分鐘 60 次、auth 15 分鐘 10 次與所有正整數環境變數 fallback；以 2.1 測試通過驗證。

## 3. 獨立路由額度

- [x] 3.1 在 `backend/test/rate_limit.test.js` 覆蓋 `Hospital map requests use an independent high-frequency policy`：驗證只有 `GET /api/v1/hospitals/map` 跳過一般 limiter 並在 schema/controller 前使用 map limiter，其他 hospital path 或 method 仍使用一般額度；以 route stack 與 quota 隔離 assertions 通過驗證。
- [x] 3.2 依「以專屬 limiter 取代 map 與 auth 的一般額度」決策，在一般 limiter 以 method/path skip 排除 map request，並於 `backend/src/routes/hospitals.route.js` 將 `hospitalMapRateLimiter` 放在 map validation 前；以 3.1 測試通過驗證。
- [x] 3.3 在 `backend/test/rate_limit.test.js` 覆蓋 `Sensitive auth requests use an independent strict policy`：驗證 register、login、google-login、line-login 均跳過一般 limiter並在 validation/controller 前使用 auth limiter，驗證失敗仍消耗 auth 額度；以 route stack 與 quota 隔離 assertions 通過驗證。
- [x] 3.4 依「以專屬 limiter 取代 map 與 auth 的一般額度」決策，在一般 limiter 精確排除四個 auth POST paths，並於 `backend/src/routes/auth.route.js` 將 `authRateLimiter` 放在各 route validation 前；以 3.3 測試通過驗證。

## 4. 單層代理信任與一般 limiter 掛載

- [x] 4.1 依「將 Express trust proxy 固定為一層」決策，在 `backend/src/app.js` 建立 application 後、註冊 middleware 前設定數值 `1`，並改為掛載 `generalApiRateLimiter`，使所有一般與專屬 limiter 使用 Express 解析的 client IP，同時避免 `trust proxy: true` 的寬鬆安全風險；以第 1、3 組測試全部通過驗證。

## 5. 設定文件與完整驗證

- [x] 5.1 更新 `backend/.env.example`，記錄 `GENERAL_API_RATE_LIMIT_*`、`HOSPITAL_MAP_RATE_LIMIT_*`、`AUTH_RATE_LIMIT_*` 的預設值與一般 limiter 對 `RATE_LIMIT_*` 的 fallback，讓部署者可獨立調整每一層政策；以檔案內容審查及 config 測試驗證。
- [x] 5.2 在 `backend` 執行 `npm test`，確認完整後端測試套件全數通過，且輸出不含 `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` 或 `ERR_ERL_PERMISSIVE_TRUST_PROXY`，驗證既有 API、AI limiter 與新分級政策未回歸。

## 6. 專屬路由匹配語意修正

- [x] 6.1 在 `backend/test/rate_limit.test.js` 擴充 `Hospital map requests use an independent high-frequency policy` 與 `Sensitive auth requests use an independent strict policy`，驗證 `GET /api/v1/hospitals/map/`、`GET /api/v1/HOSPITALS/MAP` 及四個 auth POST endpoints 的大小寫或單一尾斜線變體均由 Express 接受，且只消耗對應專屬額度；同時斷言其他 method/path 仍消耗一般額度，以執行 `node --test test/rate_limit.test.js` 通過驗證。
- [x] 6.2 依「以專屬 limiter 取代 map 與 auth 的一般額度」決策，在 `backend/src/config/rate_limit.js` 將 general limiter 的 dedicated-route skip path 轉為小寫並移除尾端斜線（根路徑除外）後再比對 method/path，使 `Hospital map requests use an independent high-frequency policy` 與 `Sensitive auth requests use an independent strict policy` 的 route-equivalent 請求不消耗一般額度，且不改寫 request URL；以 6.1 的 quota isolation 與非專屬路由 assertions 通過驗證。
- [x] 6.3 在 `backend` 執行 `npm test`，確認完整後端測試套件全數通過，且 map/auth 的標準路徑、大小寫變體、尾斜線變體維持專屬額度獨立性，其他 API 仍受一般 limiter 保護。

## 7. 共享 IP 下的 client-aware 限流

- [x] 7.1 在 `backend/test/rate_limit.test.js` 擴充 `Hospital map requests use an independent high-frequency policy` 與 `Sensitive auth requests use an independent strict policy`，驗證同一 IPv4/IPv6 下不同合法 UUID v4 client IDs 擁有獨立 60/10 額度、同一 ID 共用額度，且缺少、多值或格式錯誤 ID 退回純 IP 嚴格 key；以 `node --test test/rate_limit.test.js` 的 composite-key、`ipKeyGenerator` 與 fallback assertions 通過驗證。
- [x] 7.2 依「使用匿名 client ID 隔離共享 IP 下的瀏覽器額度」決策，在 `backend/src/config/rate_limit.js` 建立只接受 canonical UUID v4 的 header parser 與 client-aware key generator，使用 `ipKeyGenerator(req.ip)` 組合帶類型 prefix 的 IP/client ID key，並讓 auth/map client-aware limiter 使用該 generator；以 7.1 測試證明不以 client ID 作為 authentication 且無效 ID 無法取得獨立額度。
- [x] 7.3 在 `backend/test/rate_limit.test.js` 新增輪替合法 client IDs 的純 IP ceiling 測試，驗證 auth 第 101 次／15 分鐘與 map 第 601 次／分鐘回傳 `All API rate limiters retain one Traditional Chinese error contract`，並覆蓋 `AUTH_IP_RATE_LIMIT_*`、`HOSPITAL_MAP_IP_RATE_LIMIT_*` 的預設與正整數 override；以單檔測試通過驗證。
- [x] 7.4 依「以純 IP ceiling 防止輪替 client ID 繞過限制」決策，新增 auth 100 次／15 分鐘與 map 600 次／分鐘的純 IP limiters，使用 `ipKeyGenerator` 並在 client-aware limiter 前執行，所有層共用既有 429 handler；以 7.3 的輪替 ID、環境設定與 middleware-order assertions 通過驗證。
- [x] 7.5 為 `Frontend supplies a stable anonymous client identifier` 新增前端測試，覆蓋首次產生並寫入 `pawpal_client_id`、重用合法值、替換無效值，以及 crypto/localStorage 例外時不加 header但仍送出 request；以 Node frontend tests 通過驗證。
- [x] 7.6 依「使用匿名 client ID 隔離共享 IP 下的瀏覽器額度」決策，新增共用 frontend client-ID helper，並讓 `src/api/auth.js` 的四個 auth requests 與 `src/api/hospitals.js` 的 map request 傳送 `X-PawPal-Client-ID`；helper 不可將 ID 用於 auth state、user payload 或硬體 fingerprint，且 storage/crypto failure 不得阻擋 API，以 7.5 測試通過驗證。
- [x] 7.7 更新 `backend/.env.example` 記錄 `AUTH_IP_RATE_LIMIT_WINDOW_MS=900000`、`AUTH_IP_RATE_LIMIT_MAX=100`、`HOSPITAL_MAP_IP_RATE_LIMIT_WINDOW_MS=60000` 與 `HOSPITAL_MAP_IP_RATE_LIMIT_MAX=600`，明確區分 client-aware 嚴格額度與 pure-IP ceiling；以 config 測試及內容審查驗證所有 limiter 仍可由環境變數調整。

## 8. 暫時移除密碼復原功能

- [x] 8.1 為 `Frontend omits unavailable password recovery` 更新前端測試，斷言 router、登入表單與 lazy-view 清單不再引用 forgot/reset password，`/forgot-password` 由既有 catch-all NotFound 處理，且註冊入口保留；以對應 Node tests 通過驗證。
- [x] 8.2 依「暫時移除未實作的密碼復原入口」決策，移除登入頁忘記密碼連結與分隔符、`/forgot-password` route、`ForgotPasswordView.vue` 及 `ForgotPasswordForm.vue`，不新增 backend API 或 placeholder；以 8.1 測試與 production build 不產生 forgot-password chunk 驗證。

## 9. 完整驗證

- [x] 9.1 在 `backend` 執行 `npm test`，確認 proxy、一般 limiter、client-aware auth/map 額度、純 IP ceiling、fallback 與既有 API 共同行為全數通過，且輸出不含 proxy validation errors。
- [x] 9.2 在專案根目錄執行相關 frontend Node tests 與 `npm run build`，確認 client ID header plumbing、密碼復原移除、router lazy loading 與正式 bundle 全數通過，且 build output 不含 forgot-password page chunk。
