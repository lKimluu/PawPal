## MODIFIED Requirements

### Requirement: Map bounds refresh follows the settled viewport without recentering

The hospital map SHALL request map hospitals for the final settled viewport. When a valid selected hospital is about to receive programmatic focus, the frontend MUST cancel any bounds callback that was scheduled by an earlier initialization, move, or zoom event. When no valid hospital will receive programmatic focus, the frontend MUST preserve an already scheduled bounds callback and MUST cancel any pending selection focus, reveal, or popup work. If the canceled focus still has an active programmatic movement waiting for completion, the frontend MUST unregister its stale movement-completion work before stopping that movement at the current viewport. The frontend MUST NOT stop the map when the canceled focus no longer owns an active programmatic movement. If marker synchronization was queued during the canceled focus and no replacement focus starts, the frontend MUST flush that synchronization using the latest hospital data without restoring the canceled popup or changing the viewport. A bounds API response MUST update marker data without changing the current map center, zoom, or viewport. Map initialization with a selected hospital, a programmatic hospital focus, and one manual zoom gesture MUST each produce no more than one debounced bounds request after the corresponding movement has settled.

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

#### Scenario: clearing hospital selection preserves pending bounds refresh and cancels stale selection work

- **GIVEN** a manual map move or current-location pan has scheduled a debounced bounds callback
- **AND** an earlier hospital focus is still waiting for movement, marker reveal, or popup completion
- **WHEN** the selected hospital becomes `null`
- **THEN** the frontend preserves the scheduled bounds callback
- **AND** the frontend cancels the earlier hospital focus, reveal, and popup work
- **AND** no programmatic hospital focus is started
- **AND** the scheduled callback requests hospitals for the settled viewport
- **AND** the cleared hospital popup does not open

#### Scenario: clearing selection flushes marker synchronization queued during focus

- **GIVEN** a bounds response changes the valid hospital markers while a hospital focus is still waiting for movement, marker reveal, or popup completion
- **AND** the selection coordinator has queued marker synchronization until that focus completes
- **WHEN** the selected hospital becomes `null` before the focus completes
- **THEN** the frontend cancels the earlier hospital focus, reveal, and popup work
- **AND** the frontend flushes the queued synchronization once using the latest hospital data
- **AND** the frontend does not restore the cleared hospital popup or change the current map center, zoom, or viewport

#### Scenario: clearing selection stops an unfinished hospital focus movement

- **GIVEN** a selected hospital has started a programmatic map movement that is still waiting for `moveend`
- **WHEN** the selected hospital becomes `null`
- **THEN** the frontend unregisters the stale `moveend` work before stopping the programmatic movement
- **AND** the map remains at the viewport reached when the selection was cleared
- **AND** the map does not continue moving toward or recenter on the cleared hospital
- **AND** the cleared hospital popup does not open

#### Scenario: clearing selection after movement does not stop unrelated map activity

- **GIVEN** the selected hospital's programmatic movement has completed and no coordinator-owned movement is waiting for `moveend`
- **WHEN** the selected hospital becomes `null` while reveal or popup work is pending
- **THEN** the frontend cancels the stale reveal or popup work
- **AND** the frontend does not issue another map stop operation

#### Scenario: one manual zoom produces one bounds request

- **WHEN** one zoom gesture emits both `moveend` and `zoomend`
- **THEN** the frontend combines those events into one debounced bounds request
