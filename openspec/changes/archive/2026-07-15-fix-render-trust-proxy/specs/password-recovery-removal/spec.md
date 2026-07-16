## ADDED Requirements

### Requirement: Frontend omits unavailable password recovery

The frontend SHALL NOT display a forgot-password or reset-password action while PawPal has no password recovery backend flow. It MUST NOT register `/forgot-password` or a reset-password route, and a request for a removed password recovery path MUST resolve through the existing catch-all NotFound route.

#### Scenario: Login page has no password recovery action

- **WHEN** a guest views the login form
- **THEN** the form does not display a forgot-password or reset-password link
- **THEN** registration remains available

#### Scenario: Old forgot-password URL is no longer registered

- **WHEN** a user navigates directly to `/forgot-password`
- **THEN** Vue Router does not match a dedicated password recovery route
- **THEN** the existing NotFound route handles the URL

#### Scenario: Password recovery presentation files are absent

- **WHEN** the frontend is built
- **THEN** no forgot-password view or form component is included in the application source graph
- **THEN** the build does not produce a forgot-password page chunk
