# hospital-query-api Specification

## Purpose

TBD - created by archiving change 'create-hospital-query-api'. Update Purpose after archive.

## Requirements

### Requirement: Hospitals list API supports search filters and pagination

The system SHALL expose GET /api/v1/hospitals for querying hospitals. The endpoint SHALL accept optional keyword, city, district, animal_type, favorites_only, page, and limit query parameters. The endpoint SHALL filter by hospital name, city, district, or address when keyword is present, filter exactly by city when city is present, filter exactly by district when district is present, and filter by animal_types.slug when animal_type is present. The endpoint MUST paginate results with page defaulting to 1, limit defaulting to 20, and limit capped at 100.

The endpoint SHALL accept an optional authentication token. When the caller is authenticated, each returned hospital MUST include an is_favorite boolean indicating whether the caller has favorited that hospital, and the caller SHALL be permitted to supply favorites_only=true to restrict the results to hospitals the caller has favorited. When the caller is not authenticated, returned hospitals MUST NOT include is_favorite, and a favorites_only=true request MUST be rejected.

#### Scenario: Default hospitals list response

- **WHEN** a caller sends GET /api/v1/hospitals without query parameters
- **THEN** the API returns HTTP 200 with a hospitals array and pagination object
- **AND** pagination.page equals 1
- **AND** pagination.limit equals 20

#### Scenario: Hospitals list filters by broad keyword and explicit location

- **WHEN** a caller sends GET /api/v1/hospitals with keyword, city, and district query parameters
- **THEN** the API returns only hospitals whose name, city, district, or address matches the keyword and whose city and district exactly match the supplied values

##### Example: keyword and district filtering

- **GIVEN** hospitals named "仁愛動物醫院" in "台北市" "大安區" and "仁心動物醫院" in "台北市" "中山區"
- **WHEN** the caller requests keyword "仁" with city "台北市" and district "大安區"
- **THEN** the response hospitals array contains "仁愛動物醫院" and excludes "仁心動物醫院"

##### Example: keyword matches district without frontend field inference

- **GIVEN** hospital A is named "安心動物醫院" in district "大安區" and hospital B is named "安心動物醫院" in district "中山區"
- **WHEN** the caller requests keyword "大安" without district
- **THEN** the response hospitals array contains hospital A and excludes hospital B

##### Example: keyword matches address without frontend field inference

- **GIVEN** hospital A has address "台北市大安區仁愛路1號" and hospital B has address "台北市中山區民生東路1號"
- **WHEN** the caller requests keyword "仁愛路" without district
- **THEN** the response hospitals array contains hospital A and excludes hospital B

#### Scenario: Hospitals list filters by animal type slug

- **WHEN** a caller sends GET /api/v1/hospitals with animal_type "cat"
- **THEN** the API returns only hospitals linked to the animal type whose slug is "cat"
- **AND** every returned hospital includes its known animal_types collection

#### Scenario: Hospitals list returns pagination metadata

- **WHEN** a caller sends GET /api/v1/hospitals with page 2 and limit 10
- **THEN** the API returns the second page of matching hospitals
- **AND** pagination includes page, limit, total, and total_pages

#### Scenario: Authenticated request includes favorite status per hospital

- **WHEN** an authenticated caller sends GET /api/v1/hospitals
- **THEN** every hospital in the response includes an is_favorite boolean
- **AND** is_favorite is true only for hospitals the caller has favorited

#### Scenario: Unauthenticated request omits favorite status

- **WHEN** an unauthenticated caller sends GET /api/v1/hospitals
- **THEN** the response hospitals array is returned without an is_favorite field
- **AND** the response otherwise behaves as the unauthenticated default list

#### Scenario: Authenticated favorites_only request returns only favorited hospitals

- **WHEN** an authenticated caller sends GET /api/v1/hospitals with favorites_only=true
- **THEN** the response hospitals array contains only hospitals the caller has favorited
- **AND** pagination.total reflects the count of the caller's favorited hospitals matching the other filters

#### Scenario: Authenticated favorites_only request combines with other filters

- **WHEN** an authenticated caller sends GET /api/v1/hospitals with favorites_only=true and is_24h=true
- **THEN** the response hospitals array contains only hospitals that are both favorited by the caller and open 24 hours

#### Scenario: Unauthenticated favorites_only request is rejected

- **WHEN** an unauthenticated caller sends GET /api/v1/hospitals with favorites_only=true
- **THEN** the API returns HTTP 401 with a message asking the caller to log in to view their favorites
- **AND** service query logic is not executed


<!-- @trace
source: hospital-favorites
updated: 2026-07-20
code:
  - backend/database/schema/hospital_favorites.sql
  - backend/scripts/setup-db.js
  - backend/src/controllers/hospitals.controller.js
  - backend/src/schemas/hospitals.schema.js
  - backend/src/routes/hospitals.route.js
  - src/components/hospital/SearchBar.vue
  - src/api/hospitals.js
  - src/components/hospital/HospitalCard.vue
  - src/components/hospital/HospitalList.vue
  - src/views/HospitalView.vue
  - backend/src/services/hospitals.service.js
  - src/stores/hospital.js
  - backend/src/services/hospital_favorites.service.js
  - backend/src/middlewares/auth.middleware.js
  - backend/src/controllers/hospital_favorites.controller.js
  - backend/src/schemas/hospital_favorites.schema.js
tests:
  - backend/test/hospitals.controller.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/hospitals.schema.test.js
  - backend/test/hospital_favorites.route.test.js
  - backend/test/auth.middleware.test.js
  - backend/test/hospital_favorites.controller.test.js
  - backend/test/hospital_reviews.route.test.js
  - backend/test/hospitals.route.test.js
  - src/test/hospitalApiIntegration.test.js
  - backend/test/hospital_favorites.service.test.js
  - backend/test/hospital_favorites.schema.test.js
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Nearby hospitals API supports radius search and distance ordering

The system SHALL expose GET /api/v1/hospitals/nearby for querying hospitals near a user coordinate. The endpoint SHALL require lat and lng query parameters, accept optional radius, limit, animal_type, and favorites_only query parameters, calculate the distance between the caller coordinate and each hospital coordinate in kilometers, return only hospitals within the radius, and order results by distance from nearest to farthest. The endpoint MUST exclude hospitals without latitude or longitude from nearby results. The radius parameter SHALL default to 5 kilometers and MUST be capped at 50 kilometers. The limit parameter SHALL default to 20 and MUST be capped at 100.

The endpoint SHALL accept an optional authentication token. When the caller is authenticated, each returned hospital MUST include an is_favorite boolean indicating whether the caller has favorited that hospital, and the caller SHALL be permitted to supply favorites_only=true to restrict the results to hospitals the caller has favorited. When the caller is not authenticated, returned hospitals MUST NOT include is_favorite, and a favorites_only=true request MUST be rejected.

#### Scenario: Nearby hospitals require coordinates

- **WHEN** a caller sends GET /api/v1/hospitals/nearby without lat or lng
- **THEN** the API returns HTTP 400 with a message describing the invalid query parameter

#### Scenario: Nearby hospitals are filtered by radius and sorted by distance

- **WHEN** a caller sends GET /api/v1/hospitals/nearby with valid lat, lng, and radius query parameters
- **THEN** the API returns only hospitals with coordinates inside the requested radius
- **AND** each returned hospital includes distance_km
- **AND** hospitals are ordered by distance_km from smallest to largest

##### Example: distance ordering

- **GIVEN** hospital A is 1.2 km from the caller, hospital B is 3.4 km from the caller, and hospital C is 8.0 km from the caller
- **WHEN** the caller requests nearby hospitals with radius 5
- **THEN** the response contains hospital A before hospital B
- **AND** the response excludes hospital C

#### Scenario: Nearby hospitals filter by animal type slug

- **WHEN** a caller sends GET /api/v1/hospitals/nearby with animal_type "dog"
- **THEN** the API returns only nearby hospitals linked to the animal type whose slug is "dog"

#### Scenario: Authenticated nearby request includes favorite status per hospital

- **WHEN** an authenticated caller sends GET /api/v1/hospitals/nearby
- **THEN** every hospital in the response includes an is_favorite boolean
- **AND** is_favorite is true only for hospitals the caller has favorited

#### Scenario: Unauthenticated nearby request omits favorite status

- **WHEN** an unauthenticated caller sends GET /api/v1/hospitals/nearby
- **THEN** the response hospitals array is returned without an is_favorite field

#### Scenario: Authenticated nearby favorites_only request returns only favorited hospitals

- **WHEN** an authenticated caller sends GET /api/v1/hospitals/nearby with favorites_only=true
- **THEN** the response hospitals array contains only hospitals the caller has favorited

#### Scenario: Unauthenticated nearby favorites_only request is rejected

- **WHEN** an unauthenticated caller sends GET /api/v1/hospitals/nearby with favorites_only=true
- **THEN** the API returns HTTP 401 with a message asking the caller to log in to view their favorites
- **AND** service query logic is not executed


<!-- @trace
source: create-hospital-query-api
updated: 2026-07-08
code:
  - src/components/medical/MedicalFilterTabs.vue
  - src/stores/growth.js
  - src/components/layout/AppHeader.vue
  - src/stores/medical.js
  - backend/src/routes/medical_records.route.js
  - src/components/pet/AddPetButton.vue
  - backend/src/middlewares/upload_image.js
  - backend/package.json
  - src/components/common/BaseButton.vue
  - backend/src/schemas/calendar_events.schema.js
  - backend/src/services/medical_records.service.js
  - backend/database/scripts/import_hospitals.js
  - src/components/calendar/EventCard.vue
  - src/router/index.js
  - src/components/layout/PublicSidebar.vue
  - src/assets/icons/other.svg
  - src/assets/icons/vaccine-icon.svg
  - backend/src/controllers/pets.controller.js
  - src/components/medical/MedicalRecordCard.vue
  - backend/scripts/clear-seed.js
  - src/assets/icons/grooming-icon.svg
  - src/components/calendar/AddEventModal.vue
  - backend/src/routes/hospitals.route.js
  - backend/src/services/growth_records.service.js
  - src/data/calendarEvents.js
  - backend/database/scripts/geocode_hospitals.js
  - src/components/common/ToastNotification.vue
  - src/components/calendar/EditEventModal.vue
  - backend/src/routes/pets.route.js
  - src/main.js
  - src/stores/calendar.js
  - src/utils/dateFormat.js
  - backend/scripts/setup-db.js
  - backend/src/config/create_pool.js
  - backend/src/services/calendar_events.service.js
  - src/assets/icons/pet.svg
  - src/components/growth/GrowthHistoryModal.vue
  - src/components/hospital/SearchBar.vue
  - src/assets/icons/checkup-icon.svg
  - src/assets/icons/history.svg
  - src/assets/icons/training.svg
  - backend/src/services/image_upload.service.js
  - src/components/calendar/DayEventsModal.vue
  - backend/src/controllers/growth_records.controller.js
  - src/components/layout/DashboardSidebar.vue
  - src/components/pet/PetSwitcher.vue
  - src/api/growth.js
  - src/components/growth/GrowthChartCard.vue
  - src/views/DashboardView.vue
  - src/components/calendar/CalendarGrid.vue
  - backend/src/middlewares/validate.js
  - src/stores/toast.js
  - src/api/pet.js
  - backend/src/schemas/pets.schema.js
  - src/components/pet/AddPetModal.vue
  - backend/src/config/cloudinary.js
  - src/App.vue
  - src/components/pet/PetProfileModal.vue
  - src/stores/petStore.js
  - backend/.env.example
  - src/views/BaseModalPreviewView.vue
  - src/views/HospitalView.vue
  - src/components/medical/MedicalTimeline.vue
  - backend/src/controllers/calendar_events.controller.js
  - backend/src/app.js
  - src/components/calendar/CalendarEventItem.vue
  - backend/src/config/db.js
  - src/components/pet/PetCard.vue
  - src/components/pet/PetProfileCard.vue
  - backend/src/controllers/hospitals.controller.js
  - src/components/growth/GrowthHistoryButton.vue
  - backend/src/services/hospitals.service.js
  - src/assets/images/pet_default.png
  - src/views/MedicalView.vue
  - src/api/calendar.js
  - src/api/medical.js
  - src/assets/icons/pet_gray.svg
  - src/components/medical/MedicalRecordModal.vue
  - src/utils/petDisplay.js
  - backend/src/schemas/medical_records.schema.js
  - src/assets/icons/shower.svg
  - src/assets/icons/diagnosis_b.svg
  - src/components/growth/GrowthRangeTabs.vue
  - src/components/hospital/MapView.vue
  - src/constants/calendarEventTypes.js
  - src/components/growth/GrowthRecordModal.vue
  - backend/src/schemas/hospitals.schema.js
  - src/views/GrowthView.vue
  - backend/src/controllers/medical_records.controller.js
tests:
  - backend/test/calendar_events.service.test.js
  - backend/test/hospitals.controller.test.js
  - backend/test/growth_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/petApi.test.js
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/pets.controller.test.js
  - backend/test/db_pool_config.test.js
  - src/test/PetProfileModal.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/calendar_events.controller.test.js
  - backend/test/geocode_hospitals.test.js
  - backend/test/pets.route.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/medical_records.controller.test.js
  - src/test/medicalApi.test.js
  - src/test/petDisplay.test.js
  - src/test/petProfileEditMode.test.js
  - backend/test/hospitals.schema.test.js
-->

---
### Requirement: Hospital query APIs validate query parameters consistently

The system SHALL validate all hospital query API query parameters before calling service logic. Invalid page, limit, lat, lng, radius, or animal_type values MUST return HTTP 400 with a JSON body containing a message string. Unexpected data access failures MUST return HTTP 500 with a JSON body containing a message string.

#### Scenario: Invalid pagination query returns a validation error

- **WHEN** a caller sends GET /api/v1/hospitals with page 0 or limit 101
- **THEN** the API returns HTTP 400 with a message string
- **AND** service query logic is not executed

#### Scenario: Invalid coordinate query returns a validation error

- **WHEN** a caller sends GET /api/v1/hospitals/nearby with lat 91 or lng 181
- **THEN** the API returns HTTP 400 with a message string
- **AND** service query logic is not executed

#### Scenario: Data access failure returns a server error

- **WHEN** hospital query service logic throws an unexpected error
- **THEN** the API returns HTTP 500 with a message string

#### Scenario: Valid query validation does not mutate Express query object

- **WHEN** hospital query validation receives a valid query object from Express 5
- **THEN** validation stores the parsed query on a writable request property
- **AND** validation does not reassign req.query
- **AND** the hospital controller calls service logic with the parsed query

<!-- @trace
source: create-hospital-query-api
updated: 2026-07-08
code:
  - src/components/medical/MedicalFilterTabs.vue
  - src/stores/growth.js
  - src/components/layout/AppHeader.vue
  - src/stores/medical.js
  - backend/src/routes/medical_records.route.js
  - src/components/pet/AddPetButton.vue
  - backend/src/middlewares/upload_image.js
  - backend/package.json
  - src/components/common/BaseButton.vue
  - backend/src/schemas/calendar_events.schema.js
  - backend/src/services/medical_records.service.js
  - backend/database/scripts/import_hospitals.js
  - src/components/calendar/EventCard.vue
  - src/router/index.js
  - src/components/layout/PublicSidebar.vue
  - src/assets/icons/other.svg
  - src/assets/icons/vaccine-icon.svg
  - backend/src/controllers/pets.controller.js
  - src/components/medical/MedicalRecordCard.vue
  - backend/scripts/clear-seed.js
  - src/assets/icons/grooming-icon.svg
  - src/components/calendar/AddEventModal.vue
  - backend/src/routes/hospitals.route.js
  - backend/src/services/growth_records.service.js
  - src/data/calendarEvents.js
  - backend/database/scripts/geocode_hospitals.js
  - src/components/common/ToastNotification.vue
  - src/components/calendar/EditEventModal.vue
  - backend/src/routes/pets.route.js
  - src/main.js
  - src/stores/calendar.js
  - src/utils/dateFormat.js
  - backend/scripts/setup-db.js
  - backend/src/config/create_pool.js
  - backend/src/services/calendar_events.service.js
  - src/assets/icons/pet.svg
  - src/components/growth/GrowthHistoryModal.vue
  - src/components/hospital/SearchBar.vue
  - src/assets/icons/checkup-icon.svg
  - src/assets/icons/history.svg
  - src/assets/icons/training.svg
  - backend/src/services/image_upload.service.js
  - src/components/calendar/DayEventsModal.vue
  - backend/src/controllers/growth_records.controller.js
  - src/components/layout/DashboardSidebar.vue
  - src/components/pet/PetSwitcher.vue
  - src/api/growth.js
  - src/components/growth/GrowthChartCard.vue
  - src/views/DashboardView.vue
  - src/components/calendar/CalendarGrid.vue
  - backend/src/middlewares/validate.js
  - src/stores/toast.js
  - src/api/pet.js
  - backend/src/schemas/pets.schema.js
  - src/components/pet/AddPetModal.vue
  - backend/src/config/cloudinary.js
  - src/App.vue
  - src/components/pet/PetProfileModal.vue
  - src/stores/petStore.js
  - backend/.env.example
  - src/views/BaseModalPreviewView.vue
  - src/views/HospitalView.vue
  - src/components/medical/MedicalTimeline.vue
  - backend/src/controllers/calendar_events.controller.js
  - backend/src/app.js
  - src/components/calendar/CalendarEventItem.vue
  - backend/src/config/db.js
  - src/components/pet/PetCard.vue
  - src/components/pet/PetProfileCard.vue
  - backend/src/controllers/hospitals.controller.js
  - src/components/growth/GrowthHistoryButton.vue
  - backend/src/services/hospitals.service.js
  - src/assets/images/pet_default.png
  - src/views/MedicalView.vue
  - src/api/calendar.js
  - src/api/medical.js
  - src/assets/icons/pet_gray.svg
  - src/components/medical/MedicalRecordModal.vue
  - src/utils/petDisplay.js
  - backend/src/schemas/medical_records.schema.js
  - src/assets/icons/shower.svg
  - src/assets/icons/diagnosis_b.svg
  - src/components/growth/GrowthRangeTabs.vue
  - src/components/hospital/MapView.vue
  - src/constants/calendarEventTypes.js
  - src/components/growth/GrowthRecordModal.vue
  - backend/src/schemas/hospitals.schema.js
  - src/views/GrowthView.vue
  - backend/src/controllers/medical_records.controller.js
tests:
  - backend/test/calendar_events.service.test.js
  - backend/test/hospitals.controller.test.js
  - backend/test/growth_records.controller.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/petApi.test.js
  - backend/test/image_upload.service.test.js
  - backend/test/medical_records.route.test.js
  - src/test/AddPetModal.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/pets.controller.test.js
  - backend/test/db_pool_config.test.js
  - src/test/PetProfileModal.test.js
  - backend/test/hospitals.service.test.js
  - backend/test/calendar_events.controller.test.js
  - backend/test/geocode_hospitals.test.js
  - backend/test/pets.route.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/medical_records.controller.test.js
  - src/test/medicalApi.test.js
  - src/test/petDisplay.test.js
  - src/test/petProfileEditMode.test.js
  - backend/test/hospitals.schema.test.js
-->

---
### Requirement: Hospital list distance projection is independent from ordering

`GET /api/v1/hospitals` SHALL accept an optional valid `lat` and `lng` pair with `relevance`, `name`, or `distance` sorting. When the pair is present, the service SHALL calculate `distance_km` with the existing hospital distance formula for every returned hospital that has stored coordinates. The selected `sort` SHALL remain the sole control for ordering. When the pair is absent, the service SHALL omit distance projection. A hospital with a null latitude or longitude MUST NOT expose zero as its distance.

#### Scenario: relevance sorting also projects distance

- **GIVEN** hospital A matches the keyword in its name and is 3.2 kilometers away
- **AND** hospital B matches the keyword only in its address and is 1.1 kilometers away
- **WHEN** the caller requests the keyword with `sort=relevance` and a valid `lat` and `lng` pair
- **THEN** hospital A remains ordered before hospital B
- **AND** hospital A has `distance_km` 3.2
- **AND** hospital B has `distance_km` 1.1

#### Scenario: name sorting also projects distance

- **WHEN** the caller requests `sort=name` with a valid `lat` and `lng` pair
- **THEN** hospitals remain ordered by the existing name ordering keys
- **AND** hospitals with stored coordinates include numeric `distance_km`

#### Scenario: query without coordinates omits distance projection

- **WHEN** the caller requests relevance or name sorting without `lat` and `lng`
- **THEN** the response ordering follows the selected sort
- **AND** hospitals do not expose calculated `distance_km`

#### Scenario: partial coordinate pair is rejected

- **WHEN** the caller supplies only `lat` or only `lng`
- **THEN** the API returns HTTP 400 with a message string
- **AND** service query logic is not executed

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