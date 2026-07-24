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

When real user location becomes available after the list was initialized without it, the frontend SHALL change a system-selected contextual default from name to distance for searches without a keyword. A location-state change MUST NOT overwrite a sorting option explicitly selected by the user. Whenever a real user location is available, frontend hospital list requests SHALL include that latitude and longitude regardless of the selected sort, so distance can be displayed independently from ordering. Fallback coordinates MUST NOT be sent as real user coordinates in general list searches.

#### Scenario: relevance ordering

- **WHEN** a keyword matches one hospital name and another hospital address
- **THEN** the name match ranks before the address match
- **AND** ties use city, district, name, and id as stable ordering keys

#### Scenario: keyword relevance search displays distance from real location

- **GIVEN** a valid real user location is stored
- **WHEN** the user submits a keyword search
- **THEN** the list request includes the keyword, `sort=relevance`, latitude, and longitude
- **AND** result cards display returned distances without changing relevance ordering

#### Scenario: distance requires real user location

- **WHEN** no real user location is available
- **THEN** general search defaults to name sorting
- **AND** the distance sorting option is disabled
- **AND** keyword searches do not send fallback coordinates as user coordinates

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
- **AND** those queries include the real user coordinates for distance display

#### Scenario: page changes preserve search state

- **WHEN** a user moves from page 1 to page 2
- **THEN** the list request preserves committed filters, sorting, and any real user coordinates
- **AND** the result count displays the API total rather than the current page length


<!-- @trace
source: fix-hospital-search-distance
updated: 2026-07-23
code:
  - src/components/pet/AddPetModal.vue
  - src/assets/images/dog.webp
  - backend/src/controllers/hospitals.controller.js
  - src/components/ai/AiAssistantInput.vue
  - src/components/pet/PetProfileModal.vue
  - .github/workflows/ci.yml
  - src/components/pet/PetCard.vue
  - src/assets/images/rabbit.webp
  - package.json
  - src/router/index.js
  - backend/.env.example
  - backend/src/services/hospitals.service.js
  - src/assets/images/turtle.webp
  - src/stores/hospital.js
  - backend/database/schema/hospitals.sql
  - backend/src/controllers/hospital_favorites.controller.js
  - src/components/hospital/MapView.vue
  - src/constants/hospitalFilters.js
  - src/views/GrowthView.vue
  - src/components/medical/MedicalRecordModal.vue
  - backend/src/middlewares/auth.middleware.js
  - src/components/auth/RegisterForm.vue
  - backend/scripts/setup-db.js
  - src/assets/images/hamster.webp
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalCard.vue
  - src/views/PetTriviaView.vue
  - backend/database/scripts/import_hospitals.js
  - src/components/layout/PublicSidebar.vue
  - src/components/trivia/TriviaCardStack.vue
  - src/App.vue
  - backend/package.json
  - src/assets/images/cat.webp
  - src/views/HospitalView.vue
  - backend/src/routes/hospitals.route.js
  - backend/src/services/hospital_favorites.service.js
  - src/assets/images/hedgehog.webp
  - src/components/growth/GrowthHistoryModal.vue
  - src/components/layout/AppHeader.vue
  - src/views/MedicalView.vue
  - backend/src/services/calendar_events_sync.service.js
  - index.html
  - backend/src/schemas/hospital_favorites.schema.js
  - backend/src/schemas/hospitals.schema.js
  - src/utils/hospitalMapSelection.js
  - src/assets/images/goldfish.webp
  - backend/src/services/google_calendar.service.js
  - src/components/growth/GrowthRecordModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/favoriteHospital.js
  - src/views/HomeView.vue
  - src/views/DashboardView.vue
  - src/components/layout/DashboardSidebar.vue
  - src/components/pet/AddPetButton.vue
  - src/views/AboutView.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/hospital/HospitalList.vue
  - src/api/hospitals.js
  - backend/database/schema/hospital_favorites.sql
tests:
  - src/test/hospitalGpsView.test.js
  - backend/test/auth.middleware.test.js
  - src/test/hospitalApiIntegration.test.js
  - backend/test/calendar_events_sync.test.js
  - src/test/petCardWidth.test.js
  - backend/test/hospital_favorites.service.test.js
  - backend/test/enrich_hospital_24h.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/hospital_reviews.route.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/AddPetModal.test.js
  - backend/test/hospital_favorites.schema.test.js
  - backend/test/hospitals.schema.test.js
  - backend/test/hospital_favorites.controller.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospital_favorites.route.test.js
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

`GET /api/v1/hospitals` SHALL accept `is_24h`, `sort`, and an optional valid latitude and longitude pair. Hospital responses SHALL expose `is_24h` and `emergency_available`. List responses with a valid coordinate pair SHALL expose `distance_km` for hospitals with stored coordinates regardless of sort, while hospitals without stored coordinates SHALL keep distance unknown. The API and full hospital search SHALL NOT infer current-open status without business-hours data. The home summary SHALL retain its product-approved static `營業中` presentation label as a scoped exception, but that label MUST NOT be derived from API fields and MUST NOT affect queries, ordering, filtering, map summaries, or full-search cards.

#### Scenario: 24-hour filtering

- **WHEN** a caller requests `GET /api/v1/hospitals?is_24h=true`
- **THEN** every returned hospital has `is_24h` equal to true

#### Scenario: relevance response includes distance when coordinates are provided

- **WHEN** a caller requests a keyword with `sort=relevance` and a valid latitude and longitude pair
- **THEN** hospitals with stored coordinates include numeric `distance_km`
- **AND** the response remains ordered by relevance rather than distance

#### Scenario: hospital without coordinates keeps distance unknown

- **WHEN** a coordinate-bearing list query returns a hospital whose latitude or longitude is null
- **THEN** that hospital does not expose a numeric zero distance
- **AND** the frontend displays distance as unknown

#### Scenario: distance sorting without coordinates

- **WHEN** a caller requests distance sorting without a valid latitude and longitude pair
- **THEN** the API rejects the query with HTTP 400 and a Traditional Chinese validation message

#### Scenario: home static label does not become current-open data

- **WHEN** the home page renders nearby hospital summaries before business-hours data exists
- **THEN** each home summary can display the static `營業中` text
- **AND** the nearby API remains ordered only by distance
- **AND** the hospital map and full-search cards do not receive or infer a verified current-open value from that text


<!-- @trace
source: fix-hospital-search-distance
updated: 2026-07-23
code:
  - src/components/pet/AddPetModal.vue
  - src/assets/images/dog.webp
  - backend/src/controllers/hospitals.controller.js
  - src/components/ai/AiAssistantInput.vue
  - src/components/pet/PetProfileModal.vue
  - .github/workflows/ci.yml
  - src/components/pet/PetCard.vue
  - src/assets/images/rabbit.webp
  - package.json
  - src/router/index.js
  - backend/.env.example
  - backend/src/services/hospitals.service.js
  - src/assets/images/turtle.webp
  - src/stores/hospital.js
  - backend/database/schema/hospitals.sql
  - backend/src/controllers/hospital_favorites.controller.js
  - src/components/hospital/MapView.vue
  - src/constants/hospitalFilters.js
  - src/views/GrowthView.vue
  - src/components/medical/MedicalRecordModal.vue
  - backend/src/middlewares/auth.middleware.js
  - src/components/auth/RegisterForm.vue
  - backend/scripts/setup-db.js
  - src/assets/images/hamster.webp
  - src/components/hospital/SearchBar.vue
  - src/components/hospital/HospitalCard.vue
  - src/views/PetTriviaView.vue
  - backend/database/scripts/import_hospitals.js
  - src/components/layout/PublicSidebar.vue
  - src/components/trivia/TriviaCardStack.vue
  - src/App.vue
  - backend/package.json
  - src/assets/images/cat.webp
  - src/views/HospitalView.vue
  - backend/src/routes/hospitals.route.js
  - backend/src/services/hospital_favorites.service.js
  - src/assets/images/hedgehog.webp
  - src/components/growth/GrowthHistoryModal.vue
  - src/components/layout/AppHeader.vue
  - src/views/MedicalView.vue
  - backend/src/services/calendar_events_sync.service.js
  - index.html
  - backend/src/schemas/hospital_favorites.schema.js
  - backend/src/schemas/hospitals.schema.js
  - src/utils/hospitalMapSelection.js
  - src/assets/images/goldfish.webp
  - backend/src/services/google_calendar.service.js
  - src/components/growth/GrowthRecordModal.vue
  - src/components/auth/LoginForm.vue
  - src/stores/favoriteHospital.js
  - src/views/HomeView.vue
  - src/views/DashboardView.vue
  - src/components/layout/DashboardSidebar.vue
  - src/components/pet/AddPetButton.vue
  - src/views/AboutView.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - src/components/common/DeleteConfirmModal.vue
  - src/components/hospital/HospitalList.vue
  - src/api/hospitals.js
  - backend/database/schema/hospital_favorites.sql
tests:
  - src/test/hospitalGpsView.test.js
  - backend/test/auth.middleware.test.js
  - src/test/hospitalApiIntegration.test.js
  - backend/test/calendar_events_sync.test.js
  - src/test/petCardWidth.test.js
  - backend/test/hospital_favorites.service.test.js
  - backend/test/enrich_hospital_24h.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/hospital_reviews.route.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/AddPetModal.test.js
  - backend/test/hospital_favorites.schema.test.js
  - backend/test/hospitals.schema.test.js
  - backend/test/hospital_favorites.controller.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/hospital_favorites.route.test.js
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

<!-- @trace
source: cancel-cleared-hospital-map-focus
updated: 2026-07-16
code:
  - src/utils/hospitalMapSelection.js
  - src/components/hospital/MapView.vue
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Obsolete hospital map requests are canceled

The frontend MUST pass an AbortSignal to each Axios hospital map request. Before starting a new hospital map request, the frontend MUST abort the preceding in-flight hospital map request. Cancellation MUST NOT clear the currently displayed hospitals, change map truncation state, surface a map error, or end the loading state owned by a newer request. The frontend MUST retain request sequencing so that a response that cannot be aborted in time still cannot commit stale state.

#### Scenario: New map request supersedes an in-flight request

- **WHEN** hospital map request A is still in flight and hospital map request B starts for newer visible bounds
- **THEN** the frontend aborts request A
- **AND** request B receives a distinct AbortSignal that is not aborted
- **AND** cancellation of request A does not update map hospitals, truncation state, error state, or the loading state owned by request B

#### Scenario: Superseded request completes before cancellation takes effect

- **WHEN** hospital map request A is superseded by request B but request A cannot be aborted before it completes
- **THEN** the request sequencing guard prevents request A from updating map hospitals, truncation state, error state, or loading state
- **AND** only request B can commit the latest map result

#### Scenario: Current map request fails without cancellation

- **WHEN** the latest hospital map request fails with an HTTP, network, or data error that Axios does not classify as cancellation
- **THEN** the frontend exposes the normal map error message
- **AND** retrying the map query requests the last visible bounds

#### Scenario: Hospital store is disposed with a request in flight

- **WHEN** the hospital store scope is disposed while a hospital map request is in flight
- **THEN** the frontend aborts that request
- **AND** its cancellation completion does not update hospital map state

<!-- @trace
source: cancel-stale-hospital-map-requests
updated: 2026-07-16
code:
  - backend/src/services/hospitals.service.js
  - src/components/auth/LoginForm.vue
  - src/components/member/UserProfileModal.vue
  - src/components/growth/GrowthHistoryModal.vue
  - src/views/GrowthView.vue
  - backend/database/schema/hospital_reviews.sql
  - CLAUDE.md
  - backend/src/schemas/hospital_reviews.schema.js
  - src/views/MedicalView.vue
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - backend/src/services/ai_assistant.service.js
  - src/stores/hospital.js
  - src/components/auth/RegisterForm.vue
  - src/api/hospitals.js
  - backend/src/routes/hospitals.route.js
  - backend/scripts/setup-db.js
tests:
  - backend/test/hospital_reviews.schema.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/hospitals.controller.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/hospital_reviews.controller.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.route.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospital_reviews.route.test.js
-->

---
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


<!-- @trace
source: reset-hospital-search-on-reentry
updated: 2026-07-23
code:
  - src/utils/hospitalMapSelection.js
  - src/views/HomeView.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/stores/hospital.js
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalGpsView.test.js
-->

---
### Requirement: Hospital page reset invalidates stale requests

The hospital page entry reset MUST invalidate every list and map request started before the reset. A stale success, failure, or completion MUST NOT update list results, map results, pagination, errors, truncation, or loading state after reset. An active map request SHALL be aborted when cancellation is available.

#### Scenario: Old list request completes after re-entry

- **WHEN** a list request starts, the Hospital page entry reset occurs, and the old request resolves or rejects afterward
- **THEN** the old request does not update any current Hospital page state

#### Scenario: Old map request completes after re-entry

- **WHEN** a map request starts, the Hospital page entry reset occurs, and the old request resolves or rejects afterward
- **THEN** the map request is aborted when possible
- **AND** the old request does not update any current Hospital page state


<!-- @trace
source: reset-hospital-search-on-reentry
updated: 2026-07-23
code:
  - src/utils/hospitalMapSelection.js
  - src/views/HomeView.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/stores/hospital.js
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalGpsView.test.js
-->

---
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


<!-- @trace
source: reset-hospital-search-on-reentry
updated: 2026-07-23
code:
  - src/utils/hospitalMapSelection.js
  - src/views/HomeView.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/stores/hospital.js
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalGpsView.test.js
-->

---
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

<!-- @trace
source: reset-hospital-search-on-reentry
updated: 2026-07-23
code:
  - src/utils/hospitalMapSelection.js
  - src/views/HomeView.vue
  - src/views/HospitalView.vue
  - src/components/hospital/MapView.vue
  - src/stores/hospital.js
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalGpsView.test.js
-->