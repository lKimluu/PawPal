# hospital-24h-enrichment Specification

## Purpose

TBD - created by archiving change 'enrich-hospital-24h-from-google-places'. Update Purpose after archive.

## Requirements

### Requirement: Enrichment targets the three northern cities

The enrichment command SHALL query Google Places API (New) for veterinary care candidates in 台北市, 新北市, and 基隆市 only. It MUST use strict veterinary care type filtering, Traditional Chinese localization, the Taiwan region code, an explicit response field mask, and every page token returned for each city. The command MUST deduplicate results by Google Place ID.

#### Scenario: All configured cities are queried

- **WHEN** the enrichment command runs
- **THEN** it issues Text Search requests for exactly 台北市, 新北市, and 基隆市
- **AND** it follows every next page token returned for each city

#### Scenario: Duplicate places are counted once

- **WHEN** two search pages contain the same Google Place ID
- **THEN** the command evaluates that place once

#### Scenario: Omitted empty places field yields no candidates

- **WHEN** a successful Text Search protobuf JSON response omits the empty `places` repeated field
- **THEN** the command treats that response as containing zero candidates
- **AND** it continues querying and processing the remaining configured cities


<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->

---
### Requirement: Canonical Google periods determine 24-hour operation

A discovery candidate SHALL qualify as always open only when its business status is `OPERATIONAL` and `regularOpeningHours.periods` contains exactly one period whose open value is Sunday at 00:00 and whose close value is absent. Any other period with a valid open value and an absent close value MUST be classified as indeterminate rather than not always open. The command MUST NOT infer always-open status from the place name, search query, `openNow`, weekday descriptions, or search-result presence alone.

#### Scenario: Canonical always-open period qualifies

- **WHEN** an operational place has one period with open day 0, hour 0, minute 0, and no close value
- **THEN** the command classifies the place as always open

##### Example: canonical period classification

| Business status | Periods | Expected classification |
| ----- | ----- | ----- |
| OPERATIONAL | one Sunday 00:00 open with no close | always open |
| OPERATIONAL | seven daily open and close periods | not always open |
| OPERATIONAL | one Monday 08:00 open with no close | indeterminate |
| OPERATIONAL | missing periods | indeterminate |
| CLOSED_TEMPORARILY | one Sunday 00:00 open with no close | indeterminate |

#### Scenario: Non-canonical period without close is indeterminate

- **GIVEN** an operational place has a period with a valid open value that is not the sole Sunday 00:00 canonical period
- **WHEN** that period has no close value
- **THEN** the command classifies the place as indeterminate

#### Scenario: Search-result absence does not mean false

- **WHEN** an already linked hospital is absent from a Text Search response
- **THEN** the command leaves its existing `is_24h` value unchanged


<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->

---
### Requirement: City boundary and unique phone control matching

The command SHALL normalize `臺` to `台` in the Google formatted address and MUST accept a discovery candidate only when its address city equals the city being queried. It SHALL normalize phone numbers to local Taiwan digits, including converting a `+886` prefix to a leading `0`. A discovery candidate MUST match exactly one MOA hospital with the same canonical city and normalized phone before any database update is eligible.

#### Scenario: Out-of-city result is rejected

- **WHEN** the 基隆市 search returns a place whose formatted address city is 台北市
- **THEN** the command excludes the place from matching and database updates

#### Scenario: Unique same-city phone matches

- **GIVEN** one 新北市 hospital has normalized phone `0222728119`
- **WHEN** a qualifying 新北市 Google place has the same normalized phone
- **THEN** the command matches that place to the hospital

#### Scenario: Missing or ambiguous phone is not matched

- **WHEN** a qualifying place has no phone, no same-city hospital with that phone, or more than one same-city hospital with that phone
- **THEN** the command records the candidate as unmatched or ambiguous
- **AND** it does not update any hospital for that candidate


<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->

---
### Requirement: Google Place links remain one-to-one

A non-NULL Google Place ID MUST be unique across hospitals. An existing Google Place ID link SHALL take precedence over discovery matching. If a discovered Place ID is already linked to a different hospital, the command MUST record a conflict and MUST NOT change either hospital link.

#### Scenario: Existing link is refreshed without rematching

- **WHEN** a hospital already stores a Google Place ID
- **THEN** the command uses that link for Place Details refresh
- **AND** it does not use discovery phone matching to move the link

#### Scenario: Place ID conflict is rejected

- **WHEN** discovery matches a place to hospital B but that Place ID is already linked to hospital A
- **THEN** the command records one conflict
- **AND** neither hospital link is changed


<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->

---
### Requirement: Linked places are refreshed from Place Details

The command SHALL request Place Details for every hospital in the target cities that already stores a Google Place ID. A valid Details response MUST identify the requested place and MUST NOT require the optional `businessStatus` field to be present. It SHALL update `is_24h` only when Place Details reports `OPERATIONAL` and provides periods that are sufficient for canonical always-open classification. A determinately always-open response SHALL produce `true`; a determinately non-always-open response SHALL produce `false`. A missing business status, missing periods value, or non-operational status MUST leave the existing value and check timestamp unchanged.

#### Scenario: Linked place changes from always open to scheduled hours

- **GIVEN** a linked hospital has `is_24h = true`
- **WHEN** Place Details reports `OPERATIONAL` with complete non-always-open periods
- **THEN** a write run updates `is_24h` to `false`
- **AND** it updates the source and successful check timestamp

#### Scenario: Indeterminate refresh preserves state

- **GIVEN** a linked hospital has `is_24h = true` and an existing check timestamp
- **WHEN** Place Details omits regular opening periods or reports a non-operational business status
- **THEN** the command preserves `is_24h` and the existing check timestamp

#### Scenario: Incomplete no-close refresh preserves state

- **GIVEN** a linked hospital has `is_24h = true` and an existing check timestamp
- **WHEN** Place Details reports `OPERATIONAL` with a non-canonical period whose open value is valid and whose close value is absent
- **THEN** the command classifies the refresh as indeterminate
- **AND** it preserves the hospital's existing `is_24h` value and check timestamp

#### Scenario: Missing optional business status preserves state

- **GIVEN** a linked hospital has an existing `is_24h` value and check timestamp
- **WHEN** Place Details identifies the requested place but omits `businessStatus`
- **THEN** the command classifies the refresh as indeterminate
- **AND** it preserves the hospital's existing `is_24h` value and check timestamp
- **AND** it continues processing the remaining linked hospitals


<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->

---
### Requirement: Dry-run is the default and write is explicit

The backend SHALL expose `db:enrich:hospitals:24h` as the enrichment command. Running it without `--write` MUST perform discovery, refresh evaluation, matching, and statistics calculation without executing hospital UPDATE statements. Running it with `--write` SHALL apply every eligible update in one database transaction after all Google responses and matching decisions are complete.

#### Scenario: Default execution does not mutate hospitals

- **WHEN** an operator runs `npm run db:enrich:hospitals:24h`
- **THEN** the command reports `updated=0`
- **AND** it reports the number of eligible updates as `wouldUpdate`
- **AND** no hospital row is changed

#### Scenario: Explicit write commits eligible updates

- **WHEN** an operator runs `npm run db:enrich:hospitals:24h -- --write`
- **AND** every database update succeeds
- **THEN** the command commits one transaction containing all eligible updates
- **AND** each newly matched always-open hospital stores `is_24h = true`, its Google Place ID, source `google_places`, and the successful check timestamp

#### Scenario: Database failure rolls back every update

- **WHEN** any hospital update fails during a write run
- **THEN** the command rolls back the transaction
- **AND** no eligible hospital update from that run remains committed
- **AND** the process exits with a non-zero status


<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->

---
### Requirement: External failures cannot produce partial enrichment

The command MUST require `GOOGLE_PLACES_API_KEY`. Missing configuration, Google HTTP failure, authorization failure, or an invalid response shape MUST stop the run before a write transaction starts. An omitted empty Text Search `places` field and an omitted optional Place Details `businessStatus` field MUST NOT be classified as invalid response shapes. Tests MUST use injected HTTP, pool, environment, clock, and logger dependencies and MUST NOT call the live Google API or a production database.

#### Scenario: Missing key fails before requests and writes

- **WHEN** `GOOGLE_PLACES_API_KEY` is empty or absent
- **THEN** the command exits with a non-zero status before calling Google or updating hospitals

#### Scenario: Google failure leaves database unchanged

- **WHEN** any required Text Search or Place Details request fails
- **THEN** the command exits with a non-zero status
- **AND** no write transaction starts


<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->

---
### Requirement: Enrichment output is auditable

Every completed run SHALL report counters for `queried`, `fetched`, `alwaysOpen`, `matched`, `unmatched`, `ambiguous`, `conflicts`, `refreshed`, `wouldUpdate`, and `updated`. The database MUST persist only the Google Place ID, the PawPal-derived 24-hour boolean, source `google_places`, and the last successful check time; it MUST NOT persist Google display names, formatted addresses, phone numbers, full opening periods, or response snapshots.

#### Scenario: Completed dry-run reports decision counts

- **WHEN** a dry-run completes with matched, unmatched, ambiguous, and conflicting candidates
- **THEN** its summary contains every required counter
- **AND** `wouldUpdate` equals the number of eligible distinct hospital updates
- **AND** `updated` equals 0

#### Scenario: Google display content remains transient

- **WHEN** a write run matches and updates a hospital
- **THEN** the database does not store the Google display name, formatted address, phone number, full periods, or raw response

<!-- @trace
source: enrich-hospital-24h-from-google-places
updated: 2026-07-19
code:
  - backend/src/controllers/hospital_reviews.controller.js
  - src/components/hospital/HospitalReviewModal.vue
  - src/components/hospital/MapView.vue
  - backend/src/services/hospital_reviews.service.js
  - src/utils/hospitalMapSelection.js
  - src/components/pet/PetProfileModal.vue
  - backend/src/middlewares/upload_image.js
  - package.json
  - backend/src/services/ai_assistant.service.js
  - src/components/auth/LoginForm.vue
  - src/components/common/AvatarCropModal.vue
  - src/components/common/PetLoadingRunner.vue
  - backend/database/schema/hospital_reviews.sql
  - backend/package.json
  - src/components/growth/GrowthHistoryModal.vue
  - src/main.js
  - src/stores/hospital.js
  - src/views/MedicalView.vue
  - src/assets/main.css
  - src/components/hospital/HospitalList.vue
  - src/components/layout/AppHeader.vue
  - CLAUDE.md
  - backend/src/services/hospitals.service.js
  - backend/database/schema/hospitals.sql
  - src/utils/hospitalPopup.js
  - src/views/HospitalView.vue
  - src/components/pet/AddPetModal.vue
  - backend/database/scripts/enrich_hospital_24h.js
  - backend/src/routes/hospitals.route.js
  - src/api/hospitals.js
  - src/components/member/UserProfileModal.vue
  - src/views/HomeView.vue
  - backend/.env.example
  - src/components/auth/RegisterForm.vue
  - src/components/hospital/HospitalCard.vue
  - src/assets/hospital-map.css
  - src/assets/icons/pet-loading.svg
  - backend/scripts/setup-db.js
  - src/views/GrowthView.vue
  - backend/src/schemas/hospital_reviews.schema.js
  - backend/database/scripts/import_hospitals.js
tests:
  - backend/test/hospital_reviews.route.test.js
  - src/test/registerAutoLogin.test.js
  - backend/test/hospital_reviews.controller.test.js
  - backend/test/hospital_reviews.schema.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
  - src/test/hospitalReviews.test.js
  - backend/test/hospitals.route.test.js
  - backend/test/enrich_hospital_24h.test.js
  - src/test/hospitalCardDistance.test.js
  - src/test/hospitalMapSelection.test.js
  - backend/test/hospitals.controller.test.js
  - src/test/userProfileModal.test.js
  - backend/test/hospital_reviews.service.test.js
  - backend/test/import_hospitals.test.js
  - backend/test/upload_image.middleware.test.js
  - src/test/AddPetModal.test.js
  - src/test/petApi.test.js
  - src/test/petProfilePhotoUpload.test.js
  - backend/test/hospitals.service.test.js
-->