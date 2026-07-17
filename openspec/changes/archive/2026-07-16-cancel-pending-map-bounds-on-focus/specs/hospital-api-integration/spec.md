## MODIFIED Requirements

### Requirement: Map bounds refresh follows the settled viewport without recentering

The hospital map SHALL request map hospitals for the final settled viewport. When a valid selected hospital is about to receive programmatic focus, the frontend MUST cancel any bounds callback that was scheduled by an earlier initialization, move, or zoom event. When no valid hospital will receive programmatic focus, the frontend MUST preserve an already scheduled bounds callback. A bounds API response MUST update marker data without changing the current map center, zoom, or viewport. Map initialization with a selected hospital, a programmatic hospital focus, and one manual zoom gesture MUST each produce no more than one debounced bounds request after the corresponding movement has settled.

#### Scenario: bounds response updates markers without moving the map

- **WHEN** the map API returns a different set of hospitals for the current bounds
- **THEN** the frontend rebuilds the hospital markers
- **AND** the map center and zoom remain unchanged
- **AND** the marker data update does not trigger another bounds request

#### Scenario: selected hospital navigation queries final bounds once

- **WHEN** the hospital page opens with a valid hospital selected from the home summary
- **THEN** the map completes its programmatic focus before requesting bounds
- **AND** the initial ready state does not issue a separate earlier bounds request

#### Scenario: pending bounds callback is discarded before hospital focus

- **GIVEN** a map initialization, move, or zoom event has scheduled a debounced bounds callback
- **WHEN** the user selects a hospital before that callback executes
- **THEN** the frontend cancels the scheduled callback before programmatic focus begins
- **AND** the canceled callback does not request bounds during the focus movement
- **AND** the final movement completion schedules the bounds request for the settled viewport

#### Scenario: clearing hospital selection preserves pending bounds refresh

- **GIVEN** a manual map move or current-location pan has scheduled a debounced bounds callback
- **WHEN** the selected hospital becomes `null`
- **THEN** the frontend preserves the scheduled callback
- **AND** no programmatic hospital focus is started
- **AND** the scheduled callback requests hospitals for the settled viewport

#### Scenario: one manual zoom produces one bounds request

- **WHEN** one zoom gesture emits both `moveend` and `zoomend`
- **THEN** the frontend combines those events into one debounced bounds request
