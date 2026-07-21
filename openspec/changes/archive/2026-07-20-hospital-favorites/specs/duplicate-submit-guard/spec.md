## ADDED Requirements

### Requirement: Hospital favorite toggle applies the duplicate-submit guard

`HospitalCard`'s favorite toggle button SHALL maintain a local per-card loading state and SHALL check that state at the start of its click handler, returning immediately without emitting a request when it is true, in addition to a disabled binding on the button.

#### Scenario: Rapid double-click on a favorite toggle sends only one request

- **WHEN** a user clicks a hospital card's favorite toggle twice in rapid succession before the first request completes
- **THEN** only one favorite or unfavorite request is sent for that hospital

#### Scenario: Toggling favorites on two different hospital cards is independent

- **WHEN** a user clicks the favorite toggle on hospital card A while a request for hospital card B's favorite toggle is still in flight
- **THEN** the click on hospital card A sends its own request
- **AND** hospital card B's in-flight request is unaffected

#### Scenario: Failed favorite toggle restores the button

- **WHEN** a favorite or unfavorite request fails
- **THEN** the local loading state is reset to false and the toggle button becomes clickable again
