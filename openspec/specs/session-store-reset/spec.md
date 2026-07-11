# session-store-reset Specification

## Purpose

Defines how the frontend clears user-scoped Pinia state when an authenticated session ends or successfully changes accounts.

## Requirements

### Requirement: Session transitions clear user-scoped stores

The frontend SHALL clear all user-scoped Pinia state when the authenticated session ends or successfully changes to another account.

#### Scenario: User logs out after loading account data

- **WHEN** an authenticated user logs out after medical, growth, pet, and calendar data have been loaded
- **THEN** the frontend clears those stores before completing the logout flow
- **AND** no data or selected pet from the previous account remains available to authenticated views

##### Example: Account A logs out

- **GIVEN** account A has medical record `record-12`, growth record `growth-8`, selected pet `pet-3`, and calendar event `event-5` in Pinia
- **WHEN** account A logs out
- **THEN** medical records, growth records, pets, and calendar events are empty and the selected pet is reset

#### Scenario: User successfully switches accounts

- **WHEN** authentication succeeds for account B while user-scoped state from account A exists
- **THEN** the frontend clears account A state before the successful login action returns to its caller
- **AND** account B views load data from account B APIs instead of displaying account A state

#### Scenario: Login attempt fails

- **WHEN** an authentication request fails
- **THEN** the frontend returns the authentication failure without clearing the current session stores


<!-- @trace
source: reset-session-stores-on-logout
updated: 2026-07-09
code:
  - src/stores/petStore.js
  - src/stores/calendar.js
  - src/stores/session.js
  - src/views/LoginView.vue
  - src/components/layout/DashboardSidebar.vue
  - src/components/auth/LoginForm.vue
  - src/stores/growth.js
tests:
  - src/test/sessionStoreReset.test.js
-->

---
### Requirement: Each user-scoped store owns its reset behavior

Each medical, growth, pet, and calendar store MUST expose a synchronous `reset()` action that restores every state field owned by that store to its initial value without sending an API request.

#### Scenario: Store reset is invoked

- **WHEN** `reset()` is called on a user-scoped store containing loaded data, an active loading flag, an error, or a selected pet
- **THEN** that store restores its documented initial data, loading, error, and selection values
- **AND** no other store's internal state is directly mutated by that reset action


<!-- @trace
source: reset-session-stores-on-logout
updated: 2026-07-09
code:
  - src/stores/petStore.js
  - src/stores/calendar.js
  - src/stores/session.js
  - src/views/LoginView.vue
  - src/components/layout/DashboardSidebar.vue
  - src/components/auth/LoginForm.vue
  - src/stores/growth.js
tests:
  - src/test/sessionStoreReset.test.js
-->

---
### Requirement: Session lifecycle is the single mutation entry point

Login and logout UI flows SHALL invoke the session lifecycle store rather than directly combining auth mutations with individual data-store resets.

#### Scenario: Logout is initiated from the dashboard sidebar

- **WHEN** the user selects logout from the dashboard sidebar
- **THEN** the sidebar invokes the session lifecycle logout action
- **AND** the sidebar does not directly reset the medical, growth, pet, or calendar stores

#### Scenario: Login succeeds from a login interface

- **WHEN** a login interface receives a successful authentication result
- **THEN** that result has passed through the session lifecycle login action and user-scoped reset has completed before navigation continues

<!-- @trace
source: reset-session-stores-on-logout
updated: 2026-07-09
code:
  - src/stores/petStore.js
  - src/stores/calendar.js
  - src/stores/session.js
  - src/views/LoginView.vue
  - src/components/layout/DashboardSidebar.vue
  - src/components/auth/LoginForm.vue
  - src/stores/growth.js
tests:
  - src/test/sessionStoreReset.test.js
-->

---
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


<!-- @trace
source: guard-stale-session-requests
updated: 2026-07-11
code:
  - src/stores/petStore.js
  - src/stores/medical.js
  - src/stores/growth.js
  - src/components/auth/LoginForm.vue
  - src/components/layout/DashboardSidebar.vue
  - src/views/LoginView.vue
  - src/stores/calendar.js
  - src/stores/session.js
tests:
  - src/test/sessionStoreReset.test.js
-->

---
### Requirement: Session reset preserves current-session error handling

The frontend session reset capability SHALL ignore errors from stale medical, growth, pet, and calendar requests that started before reset. Errors from requests that start after reset MUST continue to use each store's existing error handling behavior.

#### Scenario: stale request rejects after reset

- **WHEN** a medical, growth, pet, or calendar request starts before `resetSessionStores()`, reset completes, and that old request rejects afterward
- **THEN** the store does not show the stale error and does not mutate loading or submitting state for the new session

#### Scenario: current request rejects after reset

- **WHEN** a medical, growth, pet, or calendar request starts after `resetSessionStores()` and rejects before another reset occurs
- **THEN** the owning store records or exposes the error using its existing current-session error behavior

<!-- @trace
source: guard-stale-session-requests
updated: 2026-07-11
code:
  - src/stores/petStore.js
  - src/stores/medical.js
  - src/stores/growth.js
  - src/components/auth/LoginForm.vue
  - src/components/layout/DashboardSidebar.vue
  - src/views/LoginView.vue
  - src/stores/calendar.js
  - src/stores/session.js
tests:
  - src/test/sessionStoreReset.test.js
-->