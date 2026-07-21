# hospital-favorites Specification

## Purpose

TBD - created by archiving change 'hospital-favorites'. Update Purpose after archive.

## Requirements

### Requirement: Authenticated users can add a hospital to their favorites

The system SHALL expose POST /api/v1/hospitals/:hospital_id/favorite. The endpoint SHALL require a valid authenticated session and SHALL create a favorite record linking the caller's user id and the given hospital id. The endpoint MUST reject unauthenticated callers and MUST reject a hospital id that does not correspond to an existing hospital.

#### Scenario: Authenticated user favorites a hospital for the first time

- **WHEN** an authenticated user sends POST /api/v1/hospitals/:hospital_id/favorite for a hospital they have not favorited
- **THEN** the API returns HTTP 201 with a message confirming the favorite was created
- **AND** a favorite record linking the caller's user id and the hospital id is persisted

#### Scenario: Favoriting an already-favorited hospital returns a conflict

- **WHEN** an authenticated user sends POST /api/v1/hospitals/:hospital_id/favorite for a hospital they have already favorited
- **THEN** the API returns HTTP 409 with a message stating the hospital is already favorited
- **AND** no duplicate favorite record is created

#### Scenario: Favoriting a nonexistent hospital returns not found

- **WHEN** an authenticated user sends POST /api/v1/hospitals/:hospital_id/favorite for a hospital id that does not exist
- **THEN** the API returns HTTP 404 with a message stating the hospital was not found

#### Scenario: Unauthenticated favorite request is rejected

- **WHEN** a caller without a valid authentication token sends POST /api/v1/hospitals/:hospital_id/favorite
- **THEN** the API returns HTTP 401 with a message asking the caller to log in again
- **AND** no favorite record is created


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
### Requirement: Authenticated users can remove a hospital from their favorites

The system SHALL expose DELETE /api/v1/hospitals/:hospital_id/favorite. The endpoint SHALL require a valid authenticated session and SHALL delete the favorite record linking the caller's user id and the given hospital id. The endpoint MUST reject unauthenticated callers and MUST return an explicit not-found result when no matching favorite exists.

#### Scenario: Authenticated user removes an existing favorite

- **WHEN** an authenticated user sends DELETE /api/v1/hospitals/:hospital_id/favorite for a hospital they have favorited
- **THEN** the API returns HTTP 200 with a message confirming the favorite was removed
- **AND** the favorite record linking the caller's user id and the hospital id no longer exists

#### Scenario: Removing a favorite that does not exist returns not found

- **WHEN** an authenticated user sends DELETE /api/v1/hospitals/:hospital_id/favorite for a hospital they have not favorited
- **THEN** the API returns HTTP 404 with a message asking the caller to double-check the favorite
- **AND** no other user's favorite record is affected

#### Scenario: Unauthenticated unfavorite request is rejected

- **WHEN** a caller without a valid authentication token sends DELETE /api/v1/hospitals/:hospital_id/favorite
- **THEN** the API returns HTTP 401 with a message asking the caller to log in again

#### Scenario: A user cannot remove another user's favorite

- **WHEN** authenticated user A sends DELETE /api/v1/hospitals/:hospital_id/favorite for a hospital that only user B has favorited
- **THEN** the API returns HTTP 404 with a message asking the caller to double-check the favorite
- **AND** user B's favorite record remains unaffected

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