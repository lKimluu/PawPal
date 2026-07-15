# ai-pet-assistant Specification

## Purpose

TBD - created by archiving change 'ai-assistant-api'. Update Purpose after archive.

## Requirements

### Requirement: AI Pet Care Q&A Endpoint

The system SHALL provide a `POST /api/v1/ai-assistant` endpoint that accepts a user question and returns an AI-generated pet-care educational reply. The endpoint SHALL be publicly accessible without authentication.

#### Scenario: Successful pet care question

- **WHEN** a client sends `POST /api/v1/ai-assistant` with `{ "message": "貓咪一天要吃幾餐？" }`
- **THEN** the system SHALL respond with HTTP 200 and a body of shape `{ "reply": string }` containing pet-care educational content


<!-- @trace
source: ai-assistant-api
updated: 2026-07-13
code:
  - backend/src/app.js
  - backend/src/server.js
  - backend/.env.example
  - backend/src/config/rate_limit.js
  - backend/src/schemas/ai_assistant.schema.js
  - backend/src/services/ai_assistant.service.js
  - backend/src/routes/ai_assistant.route.js
  - backend/package.json
  - backend/src/controllers/ai_assistant.controller.js
tests:
  - backend/test/ai_assistant.route.test.js
  - backend/test/ai_assistant.service.test.js
  - backend/test/ai_assistant.schema.test.js
  - backend/test/ai_assistant.controller.test.js
-->

---
### Requirement: Input Validation

The system SHALL validate the `message` field of the request body. `message` SHALL be required, SHALL NOT be empty after trimming whitespace, and SHALL NOT exceed 150 characters.

#### Scenario: Empty message rejected

- **WHEN** a client sends `POST /api/v1/ai-assistant` with `{ "message": "" }` or `{ "message": "   " }`
- **THEN** the system SHALL respond with HTTP 400 and a Traditional Chinese error message
- **AND** the system SHALL NOT call the Gemini API

#### Scenario: Over-length message rejected

- **WHEN** a client sends `POST /api/v1/ai-assistant` with a `message` longer than 150 characters
- **THEN** the system SHALL respond with HTTP 400 and a Traditional Chinese error message
- **AND** the system SHALL NOT call the Gemini API

#### Scenario: Valid message accepted

- **WHEN** a client sends `POST /api/v1/ai-assistant` with a non-empty `message` of 150 characters or fewer
- **THEN** the system SHALL proceed to the emergency keyword check


<!-- @trace
source: ai-assistant-frontend-integration
updated: 2026-07-14
code:
  - src/components/ai/AiAssistantPanel.vue
  - backend/src/schemas/ai_assistant.schema.js
  - src/components/ai/AiAssistantMessageList.vue
  - src/stores/aiAssistant.js
  - src/api/ai.js
  - src/components/ai/AiAssistantInput.vue
tests:
  - backend/test/ai_assistant.schema.test.js
-->

---
### Requirement: Emergency Keyword Safety Net

Before calling the Gemini API, the system SHALL check whether the `message` contains any keyword from a predefined emergency keyword list, using substring matching. When a match is found, the system SHALL short-circuit: it SHALL NOT call the Gemini API, and SHALL instead respond with HTTP 200 and a fixed template `reply` that includes a veterinary-care reminder. This behavior SHALL NOT depend on the Gemini API's own judgment.

#### Scenario: Emergency keyword matched

- **WHEN** a client sends `POST /api/v1/ai-assistant` with a `message` containing an emergency keyword (e.g. "抽搐")
- **THEN** the system SHALL respond with HTTP 200 and a fixed template `reply` that includes a reminder to seek veterinary care
- **AND** the system SHALL NOT call the Gemini API for this request

##### Example: keyword matches trigger the fixed template

| Input message | Gemini called? | Reply content |
| --- | --- | --- |
| "我的狗狗一直抽搐怎麼辦" | No | Fixed template with veterinary-care reminder |
| "貓咪誤食巧克力怎麼辦" | No | Fixed template with veterinary-care reminder |
| "貓咪一天要吃幾餐？" | Yes | Gemini-generated pet-care reply |

#### Scenario: No emergency keyword matched

- **WHEN** a client sends `POST /api/v1/ai-assistant` with a `message` that does not contain any keyword from the emergency keyword list
- **THEN** the system SHALL call the Gemini API and return its generated reply


<!-- @trace
source: ai-assistant-api
updated: 2026-07-13
code:
  - backend/src/app.js
  - backend/src/server.js
  - backend/.env.example
  - backend/src/config/rate_limit.js
  - backend/src/schemas/ai_assistant.schema.js
  - backend/src/services/ai_assistant.service.js
  - backend/src/routes/ai_assistant.route.js
  - backend/package.json
  - backend/src/controllers/ai_assistant.controller.js
tests:
  - backend/test/ai_assistant.route.test.js
  - backend/test/ai_assistant.service.test.js
  - backend/test/ai_assistant.schema.test.js
  - backend/test/ai_assistant.controller.test.js
-->

---
### Requirement: Dedicated Rate Limiting

The `POST /api/v1/ai-assistant` endpoint SHALL enforce a dedicated rate limit of 10 requests per IP address per 60-second window. This limit SHALL be enforced independently of, and in addition to, the application's global rate limit.

#### Scenario: Requests within the dedicated limit

- **WHEN** a client sends 10 or fewer requests to `POST /api/v1/ai-assistant` from the same IP address within a 60-second window
- **THEN** the system SHALL process each request normally

#### Scenario: Requests exceeding the dedicated limit

- **WHEN** a client sends more than 10 requests to `POST /api/v1/ai-assistant` from the same IP address within a 60-second window
- **THEN** the system SHALL respond to the excess requests with HTTP 429 and a Traditional Chinese error message


<!-- @trace
source: ai-assistant-api
updated: 2026-07-13
code:
  - backend/src/app.js
  - backend/src/server.js
  - backend/.env.example
  - backend/src/config/rate_limit.js
  - backend/src/schemas/ai_assistant.schema.js
  - backend/src/services/ai_assistant.service.js
  - backend/src/routes/ai_assistant.route.js
  - backend/package.json
  - backend/src/controllers/ai_assistant.controller.js
tests:
  - backend/test/ai_assistant.route.test.js
  - backend/test/ai_assistant.service.test.js
  - backend/test/ai_assistant.schema.test.js
  - backend/test/ai_assistant.controller.test.js
-->

---
### Requirement: Gemini Quota Error Translation

When the Gemini API responds with a quota-exceeded error, the system SHALL translate it into a fixed Traditional Chinese error message. The system SHALL NOT leak the raw Gemini error content, status text, or stack trace to the client.

#### Scenario: Gemini quota exceeded

- **WHEN** the Gemini API call made by the service returns a quota-exceeded error
- **THEN** the system SHALL respond with a fixed Traditional Chinese error message indicating the AI assistant is currently busy
- **AND** the response body SHALL NOT contain the raw Gemini error message or an English stack trace


<!-- @trace
source: ai-assistant-api
updated: 2026-07-13
code:
  - backend/src/app.js
  - backend/src/server.js
  - backend/.env.example
  - backend/src/config/rate_limit.js
  - backend/src/schemas/ai_assistant.schema.js
  - backend/src/services/ai_assistant.service.js
  - backend/src/routes/ai_assistant.route.js
  - backend/package.json
  - backend/src/controllers/ai_assistant.controller.js
tests:
  - backend/test/ai_assistant.route.test.js
  - backend/test/ai_assistant.service.test.js
  - backend/test/ai_assistant.schema.test.js
  - backend/test/ai_assistant.controller.test.js
-->

---
### Requirement: Startup Environment Validation

The system SHALL require the `GEMINI_API_KEY` environment variable to be set at server startup. If `GEMINI_API_KEY` is missing or empty, the system SHALL refuse to start.

#### Scenario: Missing GEMINI_API_KEY prevents startup

- **WHEN** the server starts without `GEMINI_API_KEY` set in the environment
- **THEN** the system SHALL log that `GEMINI_API_KEY` is missing
- **AND** the system SHALL exit without listening for requests

<!-- @trace
source: ai-assistant-api
updated: 2026-07-13
code:
  - backend/src/app.js
  - backend/src/server.js
  - backend/.env.example
  - backend/src/config/rate_limit.js
  - backend/src/schemas/ai_assistant.schema.js
  - backend/src/services/ai_assistant.service.js
  - backend/src/routes/ai_assistant.route.js
  - backend/package.json
  - backend/src/controllers/ai_assistant.controller.js
tests:
  - backend/test/ai_assistant.route.test.js
  - backend/test/ai_assistant.service.test.js
  - backend/test/ai_assistant.schema.test.js
  - backend/test/ai_assistant.controller.test.js
-->