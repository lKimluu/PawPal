# hospital-gps-location Specification

## Purpose

TBD - created by archiving change 'hospital-gps-location'. Update Purpose after archive.

## Requirements

### Requirement: Home page automatically requests the user's current location

The home page SHALL request the user's current location through navigator.geolocation.getCurrentPosition when the home page loads. The frontend SHALL store a successful location as latitude and longitude in shared frontend state. After the location request settles, the home page SHALL use the resulting shared location state to initiate its nearby hospital summary request.

#### Scenario: Home page load allows GPS location

- **WHEN** a user opens the home page and the browser returns coords.latitude 25.033964 and coords.longitude 121.564468
- **THEN** the frontend stores userLocation.lat as 25.033964
- **AND** the frontend stores userLocation.lng as 121.564468
- **AND** the frontend clears any previous location error

##### Example: successful shared location state

- **GIVEN** the current stored location is null
- **WHEN** getCurrentPosition succeeds with latitude 25.033964 and longitude 121.564468
- **THEN** userLocation becomes { lat: 25.033964, lng: 121.564468 }

#### Scenario: Home page location request precedes nearby hospital request

- **WHEN** the home page begins its automatic location request
- **THEN** the frontend calls navigator.geolocation.getCurrentPosition before requesting nearby hospitals
- **AND** the subsequent nearby request uses the successful shared coordinate or the documented Taipei City center fallback


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
### Requirement: Shared location state is available to public hospital map flows

The frontend SHALL store GPS state in shared frontend state that is available to both HomeView and HospitalView. The hospital page SHALL allow users to request the current location again. The shared location state SHALL be available to visitors who are not logged in.

#### Scenario: Visitor location is shared between home and hospital pages

- **WHEN** an unauthenticated visitor opens the home page and GPS lookup succeeds
- **THEN** the stored userLocation is available to the hospital page
- **AND** the hospital route remains accessible without authentication

#### Scenario: Hospital page can refresh the current location

- **WHEN** a user opens the hospital page after a previous location lookup
- **THEN** the hospital page displays a current-location action
- **AND** the user can trigger another current-location request


<!-- @trace
source: hospital-gps-location
updated: 2026-07-09
code:
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - backend/src/schemas/hospitals.schema.js
  - src/views/HospitalView.vue
  - src/api/pet.js
  - src/components/common/BaseButton.vue
  - backend/src/middlewares/validate.js
  - src/components/calendar/EditEventModal.vue
  - src/components/pet/AddPetButton.vue
  - src/stores/petStore.js
  - src/views/DashboardView.vue
  - src/components/pet/PetCard.vue
  - src/stores/location.js
  - src/components/pet/PetProfileModal.vue
  - src/components/pet/AddPetModal.vue
  - src/components/calendar/AddEventModal.vue
  - backend/src/app.js
  - backend/src/routes/hospitals.route.js
  - src/components/calendar/DeleteEventModal.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - src/utils/petDisplay.js
tests:
  - src/test/petDisplay.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospitals.controller.test.js
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.route.test.js
  - src/test/petCardMetaAlignment.test.js
  - src/test/petProfileEditMode.test.js
  - src/test/addPetGenderOptions.test.js
  - src/test/petApi.test.js
  - src/test/petCardThemeColors.test.js
  - src/test/PetProfileModal.test.js
  - src/test/petCardWidth.test.js
  - src/test/petProfileDeleteButton.test.js
  - src/test/petProfilePlaceholders.test.js
  - src/test/petCardPawTheme.test.js
  - src/test/locationStore.test.js
  - backend/test/hospitals.service.test.js
  - src/test/petModalCloseIcon.test.js
-->

---
### Requirement: Frontend exposes location request states

The frontend SHALL expose visible states for location request progress and outcome. The frontend SHALL show a locating state while a location request is pending. The frontend SHALL prevent simultaneous duplicate location requests.

#### Scenario: Home page shows locating state while waiting for GPS

- **WHEN** a current-location request is pending after home page load
- **THEN** the home page displays a locating state
- **AND** existing home page content remains visible

#### Scenario: Hospital page shows locating state while waiting for GPS

- **WHEN** a current-location request is pending from the hospital page
- **THEN** the hospital page displays a locating state
- **AND** the current-location action does not start another simultaneous location request

#### Scenario: User can retry location after a failure

- **WHEN** a current-location request fails
- **THEN** the frontend displays the location error
- **AND** the hospital page keeps the current-location action available for another attempt

#### Scenario: User can refresh location after success

- **WHEN** a current-location request succeeds
- **THEN** the frontend displays a success state indicating the current location is available
- **AND** the hospital page can trigger another current-location request


<!-- @trace
source: hospital-gps-location
updated: 2026-07-09
code:
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - backend/src/schemas/hospitals.schema.js
  - src/views/HospitalView.vue
  - src/api/pet.js
  - src/components/common/BaseButton.vue
  - backend/src/middlewares/validate.js
  - src/components/calendar/EditEventModal.vue
  - src/components/pet/AddPetButton.vue
  - src/stores/petStore.js
  - src/views/DashboardView.vue
  - src/components/pet/PetCard.vue
  - src/stores/location.js
  - src/components/pet/PetProfileModal.vue
  - src/components/pet/AddPetModal.vue
  - src/components/calendar/AddEventModal.vue
  - backend/src/app.js
  - backend/src/routes/hospitals.route.js
  - src/components/calendar/DeleteEventModal.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - src/utils/petDisplay.js
tests:
  - src/test/petDisplay.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospitals.controller.test.js
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.route.test.js
  - src/test/petCardMetaAlignment.test.js
  - src/test/petProfileEditMode.test.js
  - src/test/addPetGenderOptions.test.js
  - src/test/petApi.test.js
  - src/test/petCardThemeColors.test.js
  - src/test/PetProfileModal.test.js
  - src/test/petCardWidth.test.js
  - src/test/petProfileDeleteButton.test.js
  - src/test/petProfilePlaceholders.test.js
  - src/test/petCardPawTheme.test.js
  - src/test/locationStore.test.js
  - backend/test/hospitals.service.test.js
  - src/test/petModalCloseIcon.test.js
-->

---
### Requirement: Hospital map centers on the user's current location

The hospital map SHALL resolve its initial center once using this precedence: a valid selected hospital, a valid stored user location, the average of valid initial hospital markers, then `TAIPEI_CENTER`. Later map hospital responses MUST NOT change that initial center. When a hospital-page location refresh succeeds, the frontend SHALL clear the selected hospital and pan the map to the refreshed user coordinates once at the current zoom. When the refresh fails, the frontend MUST preserve the current selection and viewport.

#### Scenario: User location takes initial center precedence

- **WHEN** no hospital is selected and userLocation has lat 25.033964 and lng 121.564468 as the map is created
- **THEN** the Leaflet map initial center is [25.033964, 121.564468]

#### Scenario: Selected hospital takes initial center precedence

- **WHEN** a valid hospital is selected before the map is created
- **THEN** the Leaflet map initial center uses the selected hospital coordinates

#### Scenario: No initial user location preserves hospital center fallback

- **WHEN** no hospital is selected and userLocation is null as the map is created
- **THEN** the initial center is calculated from valid initial hospital markers when they exist
- **AND** the initial center falls back to `TAIPEI_CENTER` when no valid initial hospital marker exists

#### Scenario: Successful location refresh replaces hospital focus

- **WHEN** a hospital-page location refresh succeeds with valid coordinates while a hospital is selected
- **THEN** the frontend clears the hospital selection and popup
- **AND** the map pans to the refreshed coordinates once without changing zoom
- **AND** the settled viewport triggers one debounced bounds request

#### Scenario: Failed location refresh preserves hospital focus

- **WHEN** a hospital-page location refresh fails
- **THEN** the selected hospital and popup remain unchanged
- **AND** the map viewport remains unchanged


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
### Requirement: Hospital map displays a user location marker

The hospital map SHALL display a distinct marker for the user's current location when userLocation exists. The user location marker SHALL NOT use the hospital marker component. The user location marker SHALL show popup text identifying it as the user's current location.

#### Scenario: User marker appears after successful GPS lookup

- **WHEN** userLocation has lat 25.033964 and lng 121.564468
- **THEN** the Leaflet map displays one user location marker at [25.033964, 121.564468]
- **AND** the marker popup text is 你目前的位置

#### Scenario: User marker is hidden before GPS lookup

- **WHEN** userLocation is null
- **THEN** the Leaflet map does not display a user location marker


<!-- @trace
source: hospital-gps-location
updated: 2026-07-09
code:
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - backend/src/schemas/hospitals.schema.js
  - src/views/HospitalView.vue
  - src/api/pet.js
  - src/components/common/BaseButton.vue
  - backend/src/middlewares/validate.js
  - src/components/calendar/EditEventModal.vue
  - src/components/pet/AddPetButton.vue
  - src/stores/petStore.js
  - src/views/DashboardView.vue
  - src/components/pet/PetCard.vue
  - src/stores/location.js
  - src/components/pet/PetProfileModal.vue
  - src/components/pet/AddPetModal.vue
  - src/components/calendar/AddEventModal.vue
  - backend/src/app.js
  - backend/src/routes/hospitals.route.js
  - src/components/calendar/DeleteEventModal.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - src/utils/petDisplay.js
tests:
  - src/test/petDisplay.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospitals.controller.test.js
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.route.test.js
  - src/test/petCardMetaAlignment.test.js
  - src/test/petProfileEditMode.test.js
  - src/test/addPetGenderOptions.test.js
  - src/test/petApi.test.js
  - src/test/petCardThemeColors.test.js
  - src/test/PetProfileModal.test.js
  - src/test/petCardWidth.test.js
  - src/test/petProfileDeleteButton.test.js
  - src/test/petProfilePlaceholders.test.js
  - src/test/petCardPawTheme.test.js
  - src/test/locationStore.test.js
  - backend/test/hospitals.service.test.js
  - src/test/petModalCloseIcon.test.js
-->

---
### Requirement: Geolocation errors are handled without breaking public pages

The frontend SHALL handle unsupported geolocation, permission denial, unavailable position, timeout, and unknown geolocation errors. A geolocation failure SHALL NOT remove existing home page content, existing hospital markers, or prevent the hospital page from rendering.

#### Scenario: Browser does not support geolocation

- **WHEN** navigator.geolocation or navigator.geolocation.getCurrentPosition is unavailable
- **THEN** the frontend displays 此瀏覽器不支援定位功能
- **AND** the home page and hospital page remain usable

#### Scenario: User denies location permission

- **WHEN** getCurrentPosition fails with PERMISSION_DENIED
- **THEN** the frontend displays 定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試
- **AND** the home page and hospital page remain usable

#### Scenario: Browser permission is already blocked

- **WHEN** navigator.permissions.query returns geolocation state denied
- **THEN** the frontend displays 定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試
- **AND** the frontend does not call navigator.geolocation.getCurrentPosition
- **AND** the hospital page displays guidance to allow PawPal location access from browser site settings

#### Scenario: Location is unavailable

- **WHEN** getCurrentPosition fails with POSITION_UNAVAILABLE
- **THEN** the frontend displays 目前無法取得位置，請稍後再試
- **AND** the home page and hospital page remain usable

#### Scenario: Location request times out

- **WHEN** getCurrentPosition fails with TIMEOUT
- **THEN** the frontend displays 定位逾時，請重新取得目前位置
- **AND** the home page and hospital page remain usable

#### Scenario: Unknown location error

- **WHEN** getCurrentPosition fails with an unrecognized geolocation error code
- **THEN** the frontend displays 定位失敗，請稍後再試
- **AND** the home page and hospital page remain usable

<!-- @trace
source: hospital-gps-location
updated: 2026-07-09
code:
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - backend/src/schemas/hospitals.schema.js
  - src/views/HospitalView.vue
  - src/api/pet.js
  - src/components/common/BaseButton.vue
  - backend/src/middlewares/validate.js
  - src/components/calendar/EditEventModal.vue
  - src/components/pet/AddPetButton.vue
  - src/stores/petStore.js
  - src/views/DashboardView.vue
  - src/components/pet/PetCard.vue
  - src/stores/location.js
  - src/components/pet/PetProfileModal.vue
  - src/components/pet/AddPetModal.vue
  - src/components/calendar/AddEventModal.vue
  - backend/src/app.js
  - backend/src/routes/hospitals.route.js
  - src/components/calendar/DeleteEventModal.vue
  - backend/src/controllers/hospitals.controller.js
  - backend/src/services/hospitals.service.js
  - src/utils/petDisplay.js
tests:
  - src/test/petDisplay.test.js
  - src/test/hospitalGpsView.test.js
  - backend/test/hospitals.controller.test.js
  - backend/test/hospitals.schema.test.js
  - backend/test/hospitals.route.test.js
  - src/test/petCardMetaAlignment.test.js
  - src/test/petProfileEditMode.test.js
  - src/test/addPetGenderOptions.test.js
  - src/test/petApi.test.js
  - src/test/petCardThemeColors.test.js
  - src/test/PetProfileModal.test.js
  - src/test/petCardWidth.test.js
  - src/test/petProfileDeleteButton.test.js
  - src/test/petProfilePlaceholders.test.js
  - src/test/petCardPawTheme.test.js
  - src/test/locationStore.test.js
  - backend/test/hospitals.service.test.js
  - src/test/petModalCloseIcon.test.js
-->