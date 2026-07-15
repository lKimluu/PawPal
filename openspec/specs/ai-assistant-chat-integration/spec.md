# ai-assistant-chat-integration Specification

## Purpose

TBD - created by archiving change 'ai-assistant-frontend-integration'. Update Purpose after archive.

## Requirements

### Requirement: Real AI Reply Rendering

The frontend chat interface SHALL call the backend `POST /api/v1/ai-assistant` endpoint via `src/api/ai.js` and SHALL render the returned `reply` as an assistant message. The frontend SHALL NOT call the Gemini API directly and SHALL NOT expose any Gemini API key in client-side code or network requests.

#### Scenario: Successful reply is appended to the chat

- **WHEN** a user submits a question and the backend responds with HTTP 200 and `{ "reply": "..." }`
- **THEN** the frontend SHALL append a new assistant message containing the `reply` text to the message list
- **AND** the frontend SHALL NOT include any Gemini API key in the request or in client-side source


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
### Requirement: Error Message Display Without Fake Replies

When the backend responds with a non-2xx status (400, 429, 503, or 500), the frontend SHALL display the backend-provided `message` text to the user and SHALL NOT append it to the chat message list as if it were an assistant reply.

#### Scenario: Validation error (400) is shown as an error, not a reply

- **WHEN** a user submits an empty message or a message exceeding 150 characters and the backend responds with HTTP 400 and `{ "message": "..." }`
- **THEN** the frontend SHALL display the `message` text in the error area of the chat panel
- **AND** the frontend SHALL NOT add any new entry to the chat message list

#### Scenario: Rate limit error (429) is shown as an error

- **WHEN** the backend responds with HTTP 429 and `{ "message": "..." }`
- **THEN** the frontend SHALL display the `message` text in the error area of the chat panel
- **AND** the frontend SHALL NOT add any new entry to the chat message list

#### Scenario: Gemini quota error (503) is shown as an error

- **WHEN** the backend responds with HTTP 503 and `{ "message": "..." }`
- **THEN** the frontend SHALL display the `message` text in the error area of the chat panel
- **AND** the frontend SHALL NOT add any new entry to the chat message list

#### Scenario: Unexpected server error (500) is shown as an error

- **WHEN** the backend responds with HTTP 500 and `{ "message": "..." }`
- **THEN** the frontend SHALL display the `message` text in the error area of the chat panel
- **AND** the frontend SHALL NOT add any new entry to the chat message list

#### Scenario: Error message clears on next send

- **WHEN** a user submits a new message after a previous error was displayed
- **THEN** the frontend SHALL clear the previously displayed error message before processing the new request


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
### Requirement: Client-Side Message Length Limit

The chat input SHALL limit the message to 150 characters, matching the backend's validation limit. When the user attempts to type or paste content that would exceed 150 characters, the frontend SHALL display an inline tooltip near the input stating that the maximum is 150 characters.

#### Scenario: Typing beyond the limit shows a tooltip

- **WHEN** a user types additional characters after the input already contains 150 characters
- **THEN** the frontend SHALL prevent the input value from exceeding 150 characters
- **AND** the frontend SHALL display an inline tooltip near the input indicating the 150-character maximum

#### Scenario: Pasting content beyond the limit shows a tooltip

- **WHEN** a user pastes text that would make the input exceed 150 characters
- **THEN** the frontend SHALL truncate the input value to 150 characters
- **AND** the frontend SHALL display an inline tooltip near the input indicating the 150-character maximum

#### Scenario: Tooltip auto-dismisses

- **WHEN** the length-limit tooltip has been displayed
- **THEN** the frontend SHALL automatically hide the tooltip after a short delay without requiring user interaction

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