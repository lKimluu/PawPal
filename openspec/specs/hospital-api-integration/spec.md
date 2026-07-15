# hospital-api-integration Specification

## Purpose

TBD - created by archiving change 'integrate-hospital-api-list-map'. Update Purpose after archive.

## Requirements

### Requirement: Hospital list and map use independent query state

The frontend SHALL maintain independent results, loading state, error state, retry context, and request sequencing for the hospital list and hospital map. Search filters MUST NOT change map results, and map navigation MUST NOT change list results, filters, sorting, or pagination.

#### Scenario: search does not overwrite map markers

- **WHEN** a user submits a hospital list search
- **THEN** the frontend updates only list query state
- **AND** the map continues to display hospitals from its latest visible-bounds query

#### Scenario: map movement does not overwrite list results

- **WHEN** a user moves or zooms the map
- **THEN** the frontend updates only map query state
- **AND** the current list results, filters, sorting, and page remain unchanged


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Superseded hospital responses cannot commit state

The frontend MUST assign independent monotonically increasing request identifiers to list and map requests. A response, error, or completion handler MUST update state only when its identifier is still the latest identifier for that query stream.

#### Scenario: older list request finishes last

- **WHEN** list request A starts before list request B
- **AND** request B finishes before request A
- **THEN** only request B updates list results, pagination, error state, selection synchronization, and loading state

#### Scenario: older map request finishes last

- **WHEN** map request A starts before map request B
- **AND** request B finishes before request A
- **THEN** only request B updates map results, truncation state, error state, and loading state


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Hospital map follows the visible bounds

The map SHALL request hospitals using its current north, south, east, and west bounds after map movement or zoom stops for 300 milliseconds. The map API MUST return only hospitals with coordinates inside the requested bounds, MUST limit results to 1,000 hospitals, and MUST return `total` and `truncated` metadata.

#### Scenario: visible bounds change

- **WHEN** map movement or zoom ends and no newer map interaction occurs for 300 milliseconds
- **THEN** the frontend requests `GET /api/v1/hospitals/map` with the latest north, south, east, and west bounds
- **AND** the map renders the latest response independently from list filters

#### Scenario: visible bounds contain more than the limit

- **WHEN** more than 1,000 hospitals exist within the requested bounds
- **THEN** the API returns at most 1,000 hospitals
- **AND** `truncated` is true
- **AND** the map prompts the user to zoom in


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Hospital map clusters dense markers

The frontend SHALL cluster nearby hospital markers and SHALL expand clusters as the user zooms in. Map summary values SHALL be derived from map results only and SHALL NOT display a current-open count.

#### Scenario: multiple nearby markers overlap

- **WHEN** multiple hospital markers occupy the same cluster area at the current zoom
- **THEN** the map displays a cluster count instead of overlapping individual markers


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Hospital list provides hybrid search controls

The hospital list SHALL search keyword across hospital name, city, district, and address. Keyword changes SHALL be submitted only by Enter or the search button. City, district, animal type, 24-hour status, and sorting changes SHALL submit immediately and reset pagination to page 1. The frontend SHALL remove the current-open filter.

#### Scenario: keyword is edited without submission

- **WHEN** a user edits the keyword without pressing Enter or the search button
- **THEN** the current list results remain unchanged

#### Scenario: immediate filter changes

- **WHEN** a user changes city, district, animal type, or 24-hour status
- **THEN** the frontend immediately requests page 1 with all committed search conditions

#### Scenario: clear all filters

- **WHEN** a user clears all search conditions
- **THEN** keyword, city, district, animal type, and 24-hour status reset
- **AND** the frontend immediately loads page 1 of the unfiltered hospital list


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Hospital regions use database-backed dependent options

The system SHALL expose `GET /api/v1/hospitals/regions` returning the cities and districts present in hospital records. The frontend SHALL display city and district as dependent options and SHALL clear a district that does not belong to a newly selected city.

#### Scenario: city selection changes

- **WHEN** a user selects a different city
- **THEN** the district options contain only districts returned for that city
- **AND** an incompatible selected district is cleared before the list query is submitted

#### Scenario: regions request fails

- **WHEN** the regions API fails
- **THEN** the frontend displays a region-loading error and retry action
- **AND** the frontend does not replace the controls with free-text region inputs


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Hospital list supports contextual sorting and pagination

The list API SHALL support `sort` values `relevance`, `distance`, and `name`, and SHALL return stable paginated results. Keyword searches SHALL default to relevance, searches without a keyword and with a real user location SHALL default to distance, and searches without a real user location SHALL default to name with distance disabled.

When real user location becomes available after the list was initialized without it, the frontend SHALL change a system-selected contextual default from name to distance for searches without a keyword. A location-state change MUST NOT overwrite a sorting option explicitly selected by the user.

#### Scenario: relevance ordering

- **WHEN** a keyword matches one hospital name and another hospital address
- **THEN** the name match ranks before the address match
- **AND** ties use city, district, name, and id as stable ordering keys

#### Scenario: distance requires real user location

- **WHEN** no real user location is available
- **THEN** general search defaults to name sorting
- **AND** the distance sorting option is disabled

#### Scenario: real location replaces the no-location contextual default

- **GIVEN** the list was initialized without a real user location
- **AND** name sorting was selected by the system as the contextual default
- **WHEN** a valid real user location becomes available
- **THEN** the current sort changes to distance
- **AND** a subsequent city, district, animal-type, or 24-hour filter query uses distance sorting with the real user coordinates

#### Scenario: explicit sorting survives a location-state change

- **GIVEN** the user explicitly selected name sorting
- **WHEN** a valid real user location becomes available or changes
- **THEN** name sorting remains selected
- **AND** subsequent filter queries preserve name sorting

#### Scenario: page changes preserve search state

- **WHEN** a user moves from page 1 to page 2
- **THEN** the list request preserves committed filters and sorting
- **AND** the result count displays the API total rather than the current page length


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Initial list uses nearby location with an explicit fallback

The hospital page SHALL initially display hospitals nearest to the real user location when available. When real location is unavailable, it SHALL use `TAIPEI_CENTER = [25.033, 121.5654]` and SHALL identify the results as being near Taipei City center. The fallback coordinate MUST NOT enable or label distance sorting as distance from the user in general search.

#### Scenario: real location is available

- **WHEN** the hospital page opens with a valid shared user location
- **THEN** the initial list displays hospitals ordered by distance from that location

#### Scenario: location is unavailable

- **WHEN** location is denied, fails, or is unavailable on initial page load
- **THEN** the initial list displays hospitals near Taipei City center
- **AND** the page visibly identifies the fallback basis

#### Scenario: failed fallback nearby request is retried

- **WHEN** a nearby request without a real user location uses Taipei City center, fails, and is retried
- **THEN** the retry uses Taipei City center for the API request
- **AND** the frontend continues to identify the results as fallback-based
- **AND** the fallback coordinates do not enable or label distance as relative to the user


<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
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


<!-- @trace
source: connect-home-nearby-hospitals
updated: 2026-07-14
code:
  - src/components/hospital/MapStatusOverlay.vue
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - src/utils/hospitalMapSelection.js
  - src/views/HospitalView.vue
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
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


<!-- @trace
source: connect-home-nearby-hospitals
updated: 2026-07-14
code:
  - src/components/hospital/MapStatusOverlay.vue
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - src/utils/hospitalMapSelection.js
  - src/views/HospitalView.vue
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Clustered hospital markers display a trusted compact information card

The frontend SHALL display a branded compact popup for clustered hospital markers containing hospital name, address, an optional 24-hour label, an optional telephone action, and a Google Maps directions action. It MUST NOT display current-open status, ratings, or animal-type labels in this compact card. Dynamic hospital values MUST NOT be interpreted as HTML or executable attributes.

#### Scenario: hospital has complete compact-card data

- **WHEN** a user opens a marker for a hospital with an address, telephone number, valid coordinates, and `is_24h` equal to true
- **THEN** the popup displays the hospital name, styled address block, 24H label, telephone action, and Google Maps directions action

#### Scenario: hospital has no telephone and is not 24-hour

- **WHEN** a user opens a marker for a hospital without a telephone number and with `is_24h` equal to false
- **THEN** the popup omits the telephone action and 24H label
- **AND** it continues to display the name, address, and navigation action

#### Scenario: hospital text contains markup characters

- **WHEN** hospital name or address contains HTML markup characters
- **THEN** the popup displays those characters as text
- **AND** no hospital field creates an HTML element, event handler, or arbitrary link target

<!-- @trace
source: integrate-hospital-api-list-map
updated: 2026-07-12
code:
  - src/utils/hospitalPopup.js
  - src/utils/hospitalMapMarkers.js
  - src/components/hospital/HospitalList.vue
  - src/constants/hospitalFilters.js
  - backend/src/schemas/hospitals.schema.js
  - src/components/hospital/MapStatusOverlay.vue
  - src/api/hospitals.js
  - src/assets/hospital-map.css
  - src/components/hospital/HospitalListState.vue
  - src/components/hospital/HospitalLocationSelects.vue
  - src/main.js
  - src/stores/hospital.js
  - backend/src/routes/hospitals.route.js
  - src/views/HospitalView.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - package.json
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalMarker.vue
  - src/components/hospital/MapView.vue
  - src/components/hospital/HospitalSearchInput.vue
tests:
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
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

<!-- @trace
source: connect-home-nearby-hospitals
updated: 2026-07-14
code:
  - src/components/hospital/MapStatusOverlay.vue
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - src/utils/hospitalMapSelection.js
  - src/views/HospitalView.vue
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->