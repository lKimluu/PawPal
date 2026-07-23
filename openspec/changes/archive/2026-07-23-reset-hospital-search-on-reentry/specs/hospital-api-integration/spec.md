## ADDED Requirements

### Requirement: Hospital page entry resets transient search state

The frontend SHALL synchronously reset hospital page search state before each newly created Hospital page renders. The reset MUST clear the committed keyword, city, district, 24-hour filter, favorites-only filter, explicit sort selection, pagination, list results, list errors, retry context, map results, map errors, map truncation, and prior page selection. The frontend MUST retain cached region reference data and location-store state. After the reset, the page SHALL load the default nearby hospital list with a limit of 20; a valid real location SHALL produce the contextual distance sort, while unavailable real location SHALL use the existing Taipei City center fallback and name sort.

#### Scenario: User returns after a filtered search

- **GIVEN** the user previously searched with a keyword, city, district, 24-hour filter, favorites-only filter, explicit sorting, and a later page
- **WHEN** the user leaves the Hospital page and later enters it again
- **THEN** the page first contains empty search conditions, page 1, no prior list or map results, no prior errors, and no prior selection
- **AND** it loads the default nearby hospital list with a limit of 20

#### Scenario: Entry uses the existing real location

- **GIVEN** the location store contains a valid real latitude and longitude
- **WHEN** the user enters the Hospital page
- **THEN** the default nearby request uses that location
- **AND** the contextual sort becomes distance without requesting location permission again

#### Scenario: Entry uses the fallback location

- **GIVEN** the location store does not contain a valid real location
- **WHEN** the user enters the Hospital page
- **THEN** the default nearby request uses the existing Taipei City center fallback
- **AND** the search sort remains name

### Requirement: Hospital page reset invalidates stale requests

The hospital page entry reset MUST invalidate every list and map request started before the reset. A stale success, failure, or completion MUST NOT update list results, map results, pagination, errors, truncation, or loading state after reset. An active map request SHALL be aborted when cancellation is available.

#### Scenario: Old list request completes after re-entry

- **WHEN** a list request starts, the Hospital page entry reset occurs, and the old request resolves or rejects afterward
- **THEN** the old request does not update any current Hospital page state

#### Scenario: Old map request completes after re-entry

- **WHEN** a map request starts, the Hospital page entry reset occurs, and the old request resolves or rejects afterward
- **THEN** the map request is aborted when possible
- **AND** the old request does not update any current Hospital page state

### Requirement: Hospital entry selection is explicit and single-use

The frontend SHALL allow the Home page to queue one normalized hospital as an entry selection before navigating to the Hospital page. The next Hospital page entry SHALL consume that selection exactly once, preserve its hospital identifier and snapshot for map focus, and still reset and reload the default list and map query streams. A Hospital page entry without a queued selection MUST clear every prior hospital selection. Selecting another hospital inside the Hospital page SHALL replace the entry selection fallback. Whenever review loading or a successful review create, update, or delete refreshes a hospital's rating and review count, the frontend MUST apply that summary to a matching entry selection snapshot as well as matching list and map records.

#### Scenario: Home hospital card opens the Hospital page

- **WHEN** the user selects a hospital card on the Home page
- **THEN** the Home page queues the complete normalized hospital and navigates to the Hospital page
- **AND** the Hospital page focuses that hospital while independently loading the default list and current map bounds

#### Scenario: Queued selection is consumed once

- **GIVEN** a Home page hospital was consumed as the Hospital page entry selection
- **WHEN** the user later enters the Hospital page without queuing another hospital
- **THEN** the previous entry selection is not restored

#### Scenario: Review summary refreshes an entry-only hospital

- **GIVEN** the selected hospital exists only in the entry selection snapshot because list and map requests are pending or have failed
- **WHEN** review loading or a successful review create, update, or delete refreshes that hospital's rating and review count
- **THEN** the entry selection snapshot contains the refreshed rating and review count
- **AND** hospital lookup returns the refreshed snapshot to the review modal and map popup

### Requirement: Hospital map refreshes on every page entry

The hospital map SHALL schedule a visible-bounds query whenever the map becomes ready, including when an entry hospital is selected for initial focus. When initial focus moves the map, the frontend MUST defer that query until focus movement completes or the final `moveend`; it MUST NOT send an intermediate visible-bounds query during the movement. When initial focus does not move the map, the frontend SHALL schedule the query directly. The map query SHALL remain independent from the default hospital list request.

#### Scenario: Selected hospital is focused during map initialization

- **GIVEN** the Hospital page has a queued entry selection
- **AND** focusing that hospital starts a map movement longer than the bounds-query debounce interval
- **WHEN** the map becomes ready and focuses the selected hospital
- **THEN** the map does not send a visible-bounds query while the movement is in progress
- **AND** it schedules the query after focus movement completes or the final `moveend`
- **AND** no map markers from the previous Hospital page visit are reused

#### Scenario: Map initialization does not move the map

- **GIVEN** the Hospital page has no selected hospital or focusing the selected hospital does not move the map
- **WHEN** the map becomes ready
- **THEN** the map directly schedules a query for its current visible bounds
