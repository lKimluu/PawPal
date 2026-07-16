## ADDED Requirements

### Requirement: API rate limiting identifies clients behind one trusted proxy

The backend SHALL configure Express to trust exactly one proxy hop before registering API middleware. When a request arrives through that proxy with an `X-Forwarded-For` client address, every IP-based API rate limiter MUST use the Express-resolved client IP and MUST NOT emit `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.

#### Scenario: Proxied request uses the forwarded client address

- **WHEN** a request reaches an API endpoint through one proxy with `X-Forwarded-For: 203.0.113.10`
- **THEN** Express resolves `203.0.113.10` as the client IP used by the API rate limiter
- **THEN** the request processing does not emit `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`

#### Scenario: Direct development request remains supported

- **WHEN** a request reaches the backend without an `X-Forwarded-For` header
- **THEN** Express uses the socket remote address as the client IP
- **THEN** the API rate limiter processes the request under the existing rate limit policy

### Requirement: Rate limit counters remain isolated by resolved client IP

The backend MUST maintain independent rate limit counters for different Express-resolved client IP values and MUST retain the existing limit response for repeated requests from the same client IP.

#### Scenario: Different forwarded clients do not share a counter

- **GIVEN** the rate limit is one request per window
- **WHEN** client `203.0.113.10` makes one proxied request and client `198.51.100.20` makes one proxied request in the same window
- **THEN** both requests are allowed

#### Scenario: Same forwarded client exceeds the limit

- **GIVEN** the rate limit is one request per window
- **WHEN** client `203.0.113.10` makes two proxied requests in the same window
- **THEN** the second request receives HTTP 429 with `{ "message": "請求過於頻繁，請稍後再試" }`
