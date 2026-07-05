# hospital-geocoding Specification

## Purpose

TBD - created by archiving change 'geocode-hospital-addresses'. Update Purpose after archive.

## Requirements

### Requirement: Geocoding script processes hospitals missing coordinates

The system SHALL provide an explicit backend command that geocodes hospitals with incomplete coordinate data. The command MUST query hospitals rows where latitude IS NULL OR longitude IS NULL and MUST NOT query hospitals that already have both latitude and longitude.

#### Scenario: Missing coordinate rows are selected

- **WHEN** the geocoding command looks up hospitals to process
- **THEN** it selects id, name, and address from hospitals where latitude IS NULL OR longitude IS NULL
- **AND** it orders the selected rows by id

#### Scenario: Complete coordinate rows are skipped

- **WHEN** a hospital row has both latitude and longitude populated
- **THEN** the geocoding command does not send that hospital address to Google Geocoding API


<!-- @trace
source: geocode-hospital-addresses
updated: 2026-07-05
code:
  - backend/.env.example
  - backend/scripts/clear-seed.js
  - backend/src/config/db.js
  - backend/database/scripts/geocode_hospitals.js
  - backend/database/scripts/import_hospitals.js
  - backend/scripts/setup-db.js
  - backend/package.json
  - backend/src/config/create_pool.js
tests:
  - backend/test/geocode_hospitals.test.js
  - backend/test/db_pool_config.test.js
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Geocoding uses Google API with configured key

The geocoding script SHALL require GOOGLE_GEOCODING_API_KEY before processing hospital rows. For each hospital with an address, it SHALL call Google Geocoding API with the address and configured key and SHALL parse latitude and longitude from the first result geometry location when the API status is OK.

#### Scenario: API key is required

- **WHEN** GOOGLE_GEOCODING_API_KEY is missing
- **THEN** the geocoding command fails before querying or updating hospital rows

#### Scenario: Successful geocoding returns coordinates

- **WHEN** Google Geocoding API returns status OK with results[0].geometry.location.lat 25.033964 and results[0].geometry.location.lng 121.564468
- **THEN** the geocoding script treats latitude as 25.033964
- **AND** it treats longitude as 121.564468


<!-- @trace
source: geocode-hospital-addresses
updated: 2026-07-05
code:
  - backend/.env.example
  - backend/scripts/clear-seed.js
  - backend/src/config/db.js
  - backend/database/scripts/geocode_hospitals.js
  - backend/database/scripts/import_hospitals.js
  - backend/scripts/setup-db.js
  - backend/package.json
  - backend/src/config/create_pool.js
tests:
  - backend/test/geocode_hospitals.test.js
  - backend/test/db_pool_config.test.js
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Geocoding updates only rows with usable coordinates

The geocoding script SHALL update hospitals.latitude, hospitals.longitude, and hospitals.updated_at for the corresponding hospital id only when a usable latitude and longitude pair is available. When no coordinate result is available, existing NULL coordinate values MUST remain NULL.

#### Scenario: Coordinates are written to the matching hospital

- **WHEN** hospital id 42 geocodes to latitude 25.033964 and longitude 121.564468
- **THEN** the script updates only hospital id 42 with latitude 25.033964, longitude 121.564468, and updated_at CURRENT_TIMESTAMP

#### Scenario: No result preserves NULL coordinates

- **WHEN** Google Geocoding API returns ZERO_RESULTS for a hospital address
- **THEN** the script does not update latitude or longitude for that hospital
- **AND** the hospital remains eligible for a later geocoding run


<!-- @trace
source: geocode-hospital-addresses
updated: 2026-07-05
code:
  - backend/.env.example
  - backend/scripts/clear-seed.js
  - backend/src/config/db.js
  - backend/database/scripts/geocode_hospitals.js
  - backend/database/scripts/import_hospitals.js
  - backend/scripts/setup-db.js
  - backend/package.json
  - backend/src/config/create_pool.js
tests:
  - backend/test/geocode_hospitals.test.js
  - backend/test/db_pool_config.test.js
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Geocoding continues after per-row failures

The geocoding script SHALL treat a single hospital geocoding failure as recoverable unless Google Geocoding API returns REQUEST_DENIED. It MUST log a recoverable failed hospital id, name, and address, then continue processing the next selected hospital row.

#### Scenario: API error does not stop the batch

- **WHEN** geocoding hospital id 10 fails because Google Geocoding API returns an error
- **THEN** the script logs hospital id 10, its name, and its address as failed
- **AND** the script continues processing hospital id 11 from the selected rows

#### Scenario: Missing address is skipped

- **WHEN** a selected hospital row has a NULL or blank address
- **THEN** the script logs hospital id, name, and address as skipped
- **AND** it does not call Google Geocoding API for that row


<!-- @trace
source: geocode-hospital-addresses
updated: 2026-07-05
code:
  - backend/.env.example
  - backend/scripts/clear-seed.js
  - backend/src/config/db.js
  - backend/database/scripts/geocode_hospitals.js
  - backend/database/scripts/import_hospitals.js
  - backend/scripts/setup-db.js
  - backend/package.json
  - backend/src/config/create_pool.js
tests:
  - backend/test/geocode_hospitals.test.js
  - backend/test/db_pool_config.test.js
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Geocoding stops on REQUEST_DENIED

The geocoding script SHALL treat Google Geocoding API status REQUEST_DENIED as a batch-level failure. It MUST log the current hospital id, name, address, and Google error message, then stop processing the remaining selected hospitals.

#### Scenario: REQUEST_DENIED aborts remaining requests

- **WHEN** Google Geocoding API returns status REQUEST_DENIED while processing hospital id 10
- **THEN** the script logs hospital id 10, its name, its address, and the Google error message
- **AND** the script stops before sending a Google Geocoding API request for hospital id 11
- **AND** the command fails with a non-zero exit path

#### Scenario: Prior successful updates remain before REQUEST_DENIED abort

- **WHEN** hospital id 9 is updated with coordinates before hospital id 10 receives REQUEST_DENIED
- **THEN** the update for hospital id 9 remains complete
- **AND** hospital id 11 is not sent to Google Geocoding API during the same run


<!-- @trace
source: geocode-hospital-addresses
updated: 2026-07-05
code:
  - backend/.env.example
  - backend/scripts/clear-seed.js
  - backend/src/config/db.js
  - backend/database/scripts/geocode_hospitals.js
  - backend/database/scripts/import_hospitals.js
  - backend/scripts/setup-db.js
  - backend/package.json
  - backend/src/config/create_pool.js
tests:
  - backend/test/geocode_hospitals.test.js
  - backend/test/db_pool_config.test.js
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Geocoding command is explicit and documented

The backend package SHALL expose a db:geocode:hospitals command for running hospital geocoding. The backend environment example SHALL document GOOGLE_GEOCODING_API_KEY.

#### Scenario: Package script runs geocoding

- **WHEN** a developer inspects backend package scripts
- **THEN** db:geocode:hospitals runs node database/scripts/geocode_hospitals.js

#### Scenario: Environment example documents Google key

- **WHEN** a developer inspects backend/.env.example
- **THEN** GOOGLE_GEOCODING_API_KEY is present as the Google Geocoding API credential name

<!-- @trace
source: geocode-hospital-addresses
updated: 2026-07-05
code:
  - backend/.env.example
  - backend/scripts/clear-seed.js
  - backend/src/config/db.js
  - backend/database/scripts/geocode_hospitals.js
  - backend/database/scripts/import_hospitals.js
  - backend/scripts/setup-db.js
  - backend/package.json
  - backend/src/config/create_pool.js
tests:
  - backend/test/geocode_hospitals.test.js
  - backend/test/db_pool_config.test.js
  - backend/test/import_hospitals.test.js
-->