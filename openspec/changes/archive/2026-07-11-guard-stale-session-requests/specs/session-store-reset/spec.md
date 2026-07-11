## ADDED Requirements

### Requirement: Session reset invalidates stale store requests

The frontend session reset capability SHALL invalidate in-flight medical, growth, pet, and calendar store requests that started before the reset. A stale request MUST NOT write user-scoped data, selected-pet state, error state, loading state, or submitting state after the reset has occurred.

#### Scenario: stale requests resolve after reset

- **WHEN** medical, growth, pet, and calendar requests start for account A, `resetSessionStores()` runs before those requests complete, and the account A requests complete afterward
- **THEN** the medical, growth, pet, and calendar stores remain in their reset state and do not contain account A data

##### Example: account A data ignored

- **GIVEN** medical returns record `medical-a`, growth returns record `growth-a`, pet returns pet `pet-a`, and calendar returns event `event-a`
- **WHEN** those promises resolve after `resetSessionStores()` has already completed
- **THEN** medical records, growth records, pets, and calendar events remain empty and selected pet state remains at the reset default

#### Scenario: new requests after reset remain valid

- **WHEN** account A requests start, `resetSessionStores()` runs, account B requests start, account A requests complete first, and account B requests complete afterward
- **THEN** account A request results do not update any store and account B request results update their stores normally

### Requirement: Session reset preserves current-session error handling

The frontend session reset capability SHALL ignore errors from stale medical, growth, pet, and calendar requests that started before reset. Errors from requests that start after reset MUST continue to use each store's existing error handling behavior.

#### Scenario: stale request rejects after reset

- **WHEN** a medical, growth, pet, or calendar request starts before `resetSessionStores()`, reset completes, and that old request rejects afterward
- **THEN** the store does not show the stale error and does not mutate loading or submitting state for the new session

#### Scenario: current request rejects after reset

- **WHEN** a medical, growth, pet, or calendar request starts after `resetSessionStores()` and rejects before another reset occurs
- **THEN** the owning store records or exposes the error using its existing current-session error behavior
