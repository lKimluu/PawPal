## MODIFIED Requirements

### Requirement: List selection navigates the independent map

Selecting a hospital list item with coordinates SHALL move the map to that hospital at zoom 15 or greater and open its marker popup without replacing the list results. Every list selection action MUST trigger this focus behavior even when the selected identifier is unchanged. A selected hospital outside the current map result SHALL remain available as a temporary marker until the latest bounds response includes or supersedes it. When the user selects a hospital summary on the home page before navigating to the hospital page, the full search SHALL preserve that selected identifier and use the same map selection behavior after navigation. If the selected hospital lacks valid coordinates, the frontend SHALL preserve list selection but MUST NOT move the map or attempt to open a marker popup.

#### Scenario: selected hospital is outside current map results

- **WHEN** a user selects a list hospital with coordinates that is absent from current map results
- **THEN** the map moves to the hospital
- **AND** the hospital marker and popup become visible
- **AND** the list query state remains unchanged

#### Scenario: list selection opens hospital information

- **WHEN** a user selects a list hospital with valid coordinates
- **THEN** the map moves to that hospital at zoom 15 or greater
- **AND** the selected hospital marker becomes visible outside any collapsed cluster
- **AND** the marker popup opens with the existing hospital information

#### Scenario: selected hospital remains inside an animated cluster

- **WHEN** a selected hospital marker is still grouped while the preceding map movement is finishing its cluster animation
- **THEN** the frontend waits until the marker cluster animation has fully settled
- **AND** the cluster zooms or spiderfies until the selected marker becomes visible
- **AND** the selected marker popup opens after the cluster reveal callback

#### Scenario: selected hospital shares exact coordinates with other hospitals

- **WHEN** marker clustering spiderfies a selected hospital that shares exact coordinates with another hospital
- **AND** a bounds response arrives while its popup is open
- **THEN** the frontend keeps the spiderfied marker and popup mounted
- **AND** the latest marker data is applied once after the popup closes
- **AND** applying that data does not move, zoom, or reopen the map popup

#### Scenario: repeated selection reopens hospital information

- **WHEN** a user selects the same list hospital identifier again
- **THEN** the frontend issues a new map focus request
- **AND** the map refocuses the hospital and reopens its marker popup

#### Scenario: marker rebuild preserves selected popup

- **WHEN** a bounds response rebuilds clustered markers after a list hospital has been selected
- **THEN** the map resolves the selected hospital's latest marker instance
- **AND** the selected hospital popup opens again only if the previous marker popup was open
- **AND** popup restoration does not move or zoom the map and does not trigger another bounds query
- **AND** list query state and selection remain unchanged

#### Scenario: bounds data arrives before the selected popup opens

- **WHEN** a bounds response updates map hospitals while a list selection is still moving or revealing its marker
- **THEN** the frontend defers the clustered marker rebuild until the selected marker popup has opened
- **AND** the popup operation targets the current selection rather than a removed marker instance
- **AND** the deferred rebuild restores the open popup without moving or zooming the map again

#### Scenario: a newer selection supersedes pending map focus

- **WHEN** a user selects another hospital before the previous hospital has finished moving or opening its popup
- **THEN** the frontend cancels the previous pending map focus listener
- **AND** only the latest selected hospital can open its popup

#### Scenario: selected hospital has no coordinates

- **WHEN** a user selects a list hospital without finite latitude and longitude
- **THEN** the list item remains selected
- **AND** the map position remains unchanged
- **AND** no marker popup operation is attempted

#### Scenario: home selection is preserved after navigation

- **WHEN** a user selects a nearby hospital summary on the home page and navigates to `/hospital`
- **THEN** the selected hospital identifier remains active while the full-search nearby query loads
- **AND** the map uses the selected hospital object from shared list state to focus and open its marker
- **AND** the full-search query subsequently replaces the 3-item home list with its normal 20-item nearby list without clearing the selection

### Requirement: Hospital APIs expose reliable 24-hour and map data

`GET /api/v1/hospitals` SHALL accept `is_24h`, `sort`, and valid coordinates for distance sorting. Hospital responses SHALL expose `is_24h` and `emergency_available`, and distance-sorted responses SHALL expose `distance_km`. The API and full hospital search SHALL NOT infer current-open status without business-hours data. The home summary SHALL retain its product-approved static `營業中` presentation label as a scoped exception, but that label MUST NOT be derived from API fields and MUST NOT affect queries, ordering, filtering, map summaries, or full-search cards.

#### Scenario: 24-hour filtering

- **WHEN** a caller requests `GET /api/v1/hospitals?is_24h=true`
- **THEN** every returned hospital has `is_24h` equal to true

#### Scenario: distance sorting without coordinates

- **WHEN** a caller requests distance sorting without a valid latitude and longitude pair
- **THEN** the API rejects the query with HTTP 400 and a Traditional Chinese validation message

#### Scenario: home static label does not become current-open data

- **WHEN** the home page renders nearby hospital summaries before business-hours data exists
- **THEN** each home summary can display the static `營業中` text
- **AND** the nearby API remains ordered only by distance
- **AND** the hospital map and full-search cards do not receive or infer a verified current-open value from that text

## ADDED Requirements

### Requirement: Map bounds refresh follows the settled viewport without recentering

The hospital map SHALL request map hospitals for the final settled viewport. A bounds API response MUST update marker data without changing the current map center, zoom, or viewport. Map initialization with a selected hospital and one manual zoom gesture MUST each produce no more than one debounced bounds request after the corresponding movement has settled.

#### Scenario: bounds response updates markers without moving the map

- **WHEN** the map API returns a different set of hospitals for the current bounds
- **THEN** the frontend rebuilds the hospital markers
- **AND** the map center and zoom remain unchanged
- **AND** the marker data update does not trigger another bounds request

#### Scenario: selected hospital navigation queries final bounds once

- **WHEN** the hospital page opens with a valid hospital selected from the home summary
- **THEN** the map completes its programmatic focus before requesting bounds
- **AND** the initial ready state does not issue a separate earlier bounds request

#### Scenario: one manual zoom produces one bounds request

- **WHEN** one zoom gesture emits both `moveend` and `zoomend`
- **THEN** the frontend combines those events into one debounced bounds request
