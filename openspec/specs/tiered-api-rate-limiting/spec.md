# tiered-api-rate-limiting Specification

## Purpose

TBD - created by archiving change 'fix-render-trust-proxy'. Update Purpose after archive.

## Requirements

### Requirement: General API requests use a configurable shared policy

The backend SHALL apply a general per-IP rate limit of 600 requests per 15 minutes to `/api/v1` requests that do not have a dedicated policy. The backend MUST allow the window and limit to be configured through `GENERAL_API_RATE_LIMIT_WINDOW_MS` and `GENERAL_API_RATE_LIMIT_MAX`, MUST fall back to the legacy `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` when the corresponding new variable is absent or invalid, and MUST use the default when neither value is a positive integer.

#### Scenario: Ordinary API request consumes the general quota

- **WHEN** a client requests an API endpoint other than a dedicated hospital map or auth endpoint
- **THEN** the request consumes that client IP's general API quota
- **THEN** the default policy permits 600 requests within 15 minutes

#### Scenario: New general environment setting takes precedence

- **GIVEN** both a valid `GENERAL_API_RATE_LIMIT_MAX` and a valid legacy `RATE_LIMIT_MAX` are configured
- **WHEN** the general limiter is created
- **THEN** it uses `GENERAL_API_RATE_LIMIT_MAX`

#### Scenario: Invalid new general setting falls back safely

- **GIVEN** `GENERAL_API_RATE_LIMIT_MAX` is absent or is not a positive integer
- **WHEN** the general limiter is created
- **THEN** it uses a valid legacy `RATE_LIMIT_MAX`, or the default of 600 when the legacy value is also invalid or absent


<!-- @trace
source: fix-render-trust-proxy
updated: 2026-07-15
code:
  - backend/.env.example
  - src/api/auth.js
  - src/api/hospitals.js
  - backend/src/routes/hospitals.route.js
  - src/router/index.js
  - src/views/ForgotPasswordView.vue
  - backend/src/app.js
  - backend/src/config/rate_limit.js
  - backend/src/routes/auth.route.js
  - src/api/clientId.js
  - src/components/auth/ForgotPasswordForm.vue
  - src/components/auth/LoginForm.vue
tests:
  - backend/test/rate_limit.test.js
  - backend/test/hospitals.route.test.js
  - src/test/clientId.test.js
  - src/test/passwordRecoveryRemoval.test.js
  - src/test/routerLazyLoading.test.js
-->

---
### Requirement: Hospital map requests use an independent high-frequency policy

The backend SHALL apply a client-aware rate limit of 60 requests per 60 seconds exclusively to `GET /api/v1/hospitals/map` under Express's default case-insensitive and non-strict routing semantics. For a valid `X-PawPal-Client-ID` UUID v4, the limiter key MUST combine the Express-resolved IP normalized by `ipKeyGenerator` with the normalized client ID. The backend MUST apply an additional pure-IP ceiling of 600 requests per 60 seconds, MUST allow the client-aware policy to be configured through `HOSPITAL_MAP_RATE_LIMIT_WINDOW_MS` and `HOSPITAL_MAP_RATE_LIMIT_MAX`, and MUST allow the pure-IP ceiling to be configured through `HOSPITAL_MAP_IP_RATE_LIMIT_WINDOW_MS` and `HOSPITAL_MAP_IP_RATE_LIMIT_MAX`. Every route-equivalent hospital map request MUST NOT consume the general API quota.

#### Scenario: Repeated hospital map requests use only the map quota

- **WHEN** a client sends `GET /api/v1/hospitals/map`
- **THEN** the request consumes that client IP's hospital map quota
- **THEN** it does not consume the general API quota

#### Scenario: Browsers behind one public IP receive separate map quotas

- **GIVEN** two requests have the same Express-resolved IP and two different valid `X-PawPal-Client-ID` values
- **WHEN** the browsers request the hospital map endpoint
- **THEN** each browser consumes its own client-aware map quota
- **THEN** both requests consume the same pure-IP map ceiling

#### Scenario: Missing or invalid map client ID falls back to strict IP quota

- **WHEN** a hospital map request omits `X-PawPal-Client-ID`, supplies multiple values, or supplies a value that is not a canonical UUID v4
- **THEN** the client-aware limiter uses only the normalized Express-resolved IP as its key
- **THEN** the request remains subject to the 60-per-minute strict quota and the 600-per-minute pure-IP ceiling

#### Scenario: Rotating map client IDs reaches the IP ceiling

- **GIVEN** requests share one Express-resolved IP and use different valid client IDs
- **WHEN** the requests exceed 600 within 60 seconds
- **THEN** the pure-IP limiter returns the common HTTP 429 response

#### Scenario: Other hospital requests remain general API requests

- **WHEN** a client requests another `/api/v1/hospitals` endpoint or uses a different method
- **THEN** the request remains subject to the general API policy
- **THEN** it does not consume the hospital map quota

#### Scenario: Hospital map path variants retain quota independence

- **WHEN** a client sends `GET /api/v1/hospitals/map/` or `GET /api/v1/HOSPITALS/MAP`
- **THEN** Express routes the request to the hospital map endpoint
- **THEN** the request consumes only that client IP's hospital map quota and does not consume the general API quota


<!-- @trace
source: fix-render-trust-proxy
updated: 2026-07-15
code:
  - backend/.env.example
  - src/api/auth.js
  - src/api/hospitals.js
  - backend/src/routes/hospitals.route.js
  - src/router/index.js
  - src/views/ForgotPasswordView.vue
  - backend/src/app.js
  - backend/src/config/rate_limit.js
  - backend/src/routes/auth.route.js
  - src/api/clientId.js
  - src/components/auth/ForgotPasswordForm.vue
  - src/components/auth/LoginForm.vue
tests:
  - backend/test/rate_limit.test.js
  - backend/test/hospitals.route.test.js
  - src/test/clientId.test.js
  - src/test/passwordRecoveryRemoval.test.js
  - src/test/routerLazyLoading.test.js
-->

---
### Requirement: Sensitive auth requests use an independent strict policy

The backend SHALL apply a client-aware rate limit of 10 requests per 15 minutes to `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/google-login`, and `POST /api/v1/auth/line-login` under Express's default case-insensitive and non-strict routing semantics. For a valid `X-PawPal-Client-ID` UUID v4, the limiter key MUST combine the Express-resolved IP normalized by `ipKeyGenerator` with the normalized client ID. The backend MUST apply an additional pure-IP ceiling of 100 requests per 15 minutes, MUST allow the client-aware policy to be configured through `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`, and MUST allow the pure-IP ceiling to be configured through `AUTH_IP_RATE_LIMIT_WINDOW_MS` and `AUTH_IP_RATE_LIMIT_MAX`. Every route-equivalent sensitive auth request MUST NOT consume the general API quota.

#### Scenario: Auth validation failure consumes the strict quota

- **WHEN** a client sends any configured sensitive auth request
- **THEN** the auth limiter runs before request validation and the controller
- **THEN** the request consumes that client IP's auth quota even when validation fails

#### Scenario: Auth and general quotas are independent

- **WHEN** a client sends a configured sensitive auth request
- **THEN** the request does not consume the client's general API quota

#### Scenario: Browsers behind one public IP receive separate auth quotas

- **GIVEN** two requests have the same Express-resolved IP and two different valid `X-PawPal-Client-ID` values
- **WHEN** the browsers call any configured sensitive auth endpoint
- **THEN** each browser consumes its own client-aware auth quota
- **THEN** both requests consume the same pure-IP auth ceiling

#### Scenario: Missing or invalid auth client ID falls back to strict IP quota

- **WHEN** a sensitive auth request omits `X-PawPal-Client-ID`, supplies multiple values, or supplies a value that is not a canonical UUID v4
- **THEN** the client-aware limiter uses only the normalized Express-resolved IP as its key
- **THEN** the request remains subject to the 10-per-15-minute strict quota and the 100-per-15-minute pure-IP ceiling

#### Scenario: Rotating auth client IDs reaches the IP ceiling

- **GIVEN** requests share one Express-resolved IP and use different valid client IDs
- **WHEN** the requests exceed 100 within 15 minutes
- **THEN** the pure-IP limiter returns the common HTTP 429 response

#### Scenario: Sensitive auth path variants retain quota independence

- **WHEN** a client sends a configured sensitive auth POST request with different path casing or one trailing slash
- **THEN** Express routes the request to the corresponding sensitive auth endpoint
- **THEN** the request consumes only that client IP's auth quota and does not consume the general API quota


<!-- @trace
source: fix-render-trust-proxy
updated: 2026-07-15
code:
  - backend/.env.example
  - src/api/auth.js
  - src/api/hospitals.js
  - backend/src/routes/hospitals.route.js
  - src/router/index.js
  - src/views/ForgotPasswordView.vue
  - backend/src/app.js
  - backend/src/config/rate_limit.js
  - backend/src/routes/auth.route.js
  - src/api/clientId.js
  - src/components/auth/ForgotPasswordForm.vue
  - src/components/auth/LoginForm.vue
tests:
  - backend/test/rate_limit.test.js
  - backend/test/hospitals.route.test.js
  - src/test/clientId.test.js
  - src/test/passwordRecoveryRemoval.test.js
  - src/test/routerLazyLoading.test.js
-->

---
### Requirement: All API rate limiters retain one Traditional Chinese error contract

Every API rate limiter MUST return HTTP 429 with `{ "message": "請求過於頻繁，請稍後再試" }` when its corresponding client-aware or pure-IP quota is exceeded.

#### Scenario: Client exceeds any configured quota

- **WHEN** a client IP sends more requests than an applicable limiter permits within its window
- **THEN** the excess request receives HTTP 429
- **THEN** the response body is `{ "message": "請求過於頻繁，請稍後再試" }`


<!-- @trace
source: fix-render-trust-proxy
updated: 2026-07-15
code:
  - backend/.env.example
  - src/api/auth.js
  - src/api/hospitals.js
  - backend/src/routes/hospitals.route.js
  - src/router/index.js
  - src/views/ForgotPasswordView.vue
  - backend/src/app.js
  - backend/src/config/rate_limit.js
  - backend/src/routes/auth.route.js
  - src/api/clientId.js
  - src/components/auth/ForgotPasswordForm.vue
  - src/components/auth/LoginForm.vue
tests:
  - backend/test/rate_limit.test.js
  - backend/test/hospitals.route.test.js
  - src/test/clientId.test.js
  - src/test/passwordRecoveryRemoval.test.js
  - src/test/routerLazyLoading.test.js
-->

---
### Requirement: Frontend supplies a stable anonymous client identifier

The frontend SHALL create a UUID v4 with `crypto.randomUUID()` when no valid identifier exists at `localStorage` key `pawpal_client_id`, SHALL reuse the stored identifier across requests, and SHALL send it as `X-PawPal-Client-ID` on all four sensitive auth requests and hospital map requests. The identifier MUST NOT be used as authentication, authorization, an account identifier, or a hardware fingerprint.

#### Scenario: First eligible request creates and persists an identifier

- **GIVEN** `pawpal_client_id` is absent
- **WHEN** the frontend prepares an auth or hospital map request and browser crypto and storage are available
- **THEN** it creates and stores one UUID v4
- **THEN** it sends that value in `X-PawPal-Client-ID`

#### Scenario: Later eligible requests reuse the identifier

- **GIVEN** `pawpal_client_id` contains a valid UUID v4
- **WHEN** the frontend prepares another auth or hospital map request
- **THEN** it reuses the stored value without generating a replacement

#### Scenario: Invalid stored identifier is replaced

- **GIVEN** `pawpal_client_id` contains a value that is not a canonical UUID v4
- **WHEN** browser crypto and storage are available
- **THEN** the frontend replaces it with a newly generated UUID v4
- **THEN** it sends the replacement in `X-PawPal-Client-ID`

#### Scenario: Browser crypto or storage is unavailable

- **WHEN** UUID generation or local storage access fails
- **THEN** the frontend omits `X-PawPal-Client-ID`
- **THEN** it sends the API request without surfacing a client-ID error to the user

<!-- @trace
source: fix-render-trust-proxy
updated: 2026-07-15
code:
  - backend/.env.example
  - src/api/auth.js
  - src/api/hospitals.js
  - backend/src/routes/hospitals.route.js
  - src/router/index.js
  - src/views/ForgotPasswordView.vue
  - backend/src/app.js
  - backend/src/config/rate_limit.js
  - backend/src/routes/auth.route.js
  - src/api/clientId.js
  - src/components/auth/ForgotPasswordForm.vue
  - src/components/auth/LoginForm.vue
tests:
  - backend/test/rate_limit.test.js
  - backend/test/hospitals.route.test.js
  - src/test/clientId.test.js
  - src/test/passwordRecoveryRemoval.test.js
  - src/test/routerLazyLoading.test.js
-->