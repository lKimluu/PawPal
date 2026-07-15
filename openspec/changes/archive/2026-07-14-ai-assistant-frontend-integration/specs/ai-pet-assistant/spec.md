## MODIFIED Requirements

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
