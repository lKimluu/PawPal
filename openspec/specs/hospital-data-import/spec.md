# hospital-data-import Specification

## Purpose

TBD - created by archiving change 'import-moa-veterinary-hospitals'. Update Purpose after archive.

## Requirements

### Requirement: Hospital table stores official clinic records

The system SHALL provide a hospitals table for official veterinary clinic records imported from the MOA UnitId=078 dataset. The table SHALL store license_number, name, city, district, address, phone, latitude, longitude, license_status, is_24h, emergency_available, created_at, and updated_at. The license_number field MUST be required and unique.

#### Scenario: Table supports source identity

- **WHEN** a hospital record is inserted with license_number "九三府農畜字第21935號"
- **THEN** the database enforces that no second row uses the same license_number

#### Scenario: Unknown enrichment fields remain nullable

- **WHEN** a MOA clinic record does not include coordinates, 24-hour status, or emergency availability
- **THEN** latitude, longitude, is_24h, and emergency_available are stored as NULL


<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Import fetches the full MOA dataset

The import script SHALL use the MOA dataset detail page https://data.moa.gov.tw/open_detail.aspx?id=078 as the source reference and SHALL fetch the actual JSON data from the DataFileService endpoint for UnitId=078 with one axios GET request. The request MUST send UnitId as the only MOA query param. The import MUST NOT send $top or $skip params and MUST NOT paginate this dataset.

#### Scenario: Full dataset is fetched once

- **WHEN** the import fetches MOA UnitId=078 records
- **THEN** axios GET is called exactly once with the DataFileService endpoint
- **AND** the request params contain UnitId "078"

#### Scenario: Pagination params are not used

- **WHEN** the import fetches MOA UnitId=078 records
- **THEN** the request params do not contain $top
- **AND** the request params do not contain $skip

#### Scenario: Dataset detail page is documented separately from JSON API

- **WHEN** a developer inspects the import script source constants or tests
- **THEN** the MOA dataset detail URL is identifiable as "https://data.moa.gov.tw/open_detail.aspx?id=078"
- **AND** the JSON API URL remains the DataFileService endpoint used with UnitId "078"


<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Import transforms and cleans official fields

The import script SHALL transform MOA Chinese field names into the hospitals table fields. It SHALL map 字號 to license_number, 機構名稱 to name, 縣市 to city, 機構地址 to address, 機構電話 to phone, and 狀態 to license_status. The importer SHALL trim text, collapse redundant whitespace, convert empty strings to NULL, and derive district from the address when a township, town, city, or district token is present.

#### Scenario: MOA fields become database fields

- **WHEN** the source row contains 字號 "九三府農畜字第21935號", 機構名稱 " 德生動物醫院 ", 縣市 "宜蘭縣", 機構電話 "(039)312162", 狀態 "開業", and 機構地址 "宜蘭縣宜蘭市大東里新民路六十八號"
- **THEN** the normalized row has license_number "九三府農畜字第21935號", name "德生動物醫院", city "宜蘭縣", district "宜蘭市", phone "(039)312162", license_status "開業", and address "宜蘭縣宜蘭市大東里新民路六十八號"

#### Scenario: Additional MOA source fields are ignored

- **WHEN** the source row contains 執照類別 "獸醫師", 負責獸醫 "江彥德", and 發照日期 "20040224"
- **THEN** the normalized hospital object includes only the hospitals table fields
- **AND** it does not include license_type, responsible_vet, issued_date, 執照類別, 負責獸醫, or 發照日期 properties

#### Scenario: Empty optional values become NULL

- **WHEN** the source row contains an empty phone value and an address without a parseable district token
- **THEN** phone is NULL and district is NULL

#### Scenario: Township district is parsed from official address

- **WHEN** the source row contains 機構地址 "宜蘭縣羅東鎮中山路2段415號"
- **THEN** district is "羅東鎮"


<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Import includes only open licenses

The import script SHALL persist only records whose MOA 狀態 value equals 開業. Records with 補發 or any other status MUST NOT be inserted or updated.

#### Scenario: Non-open status is skipped

- **WHEN** the source contains one row with 狀態 "開業" and one row with 狀態 "補發"
- **THEN** only the 開業 row is written to hospitals


<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Import is idempotent

The import script SHALL upsert records by license_number. Re-running the import with the same source data MUST NOT create duplicate hospitals rows, and changed official basic fields MUST update the existing row. Re-running the import MUST NOT replace existing latitude or longitude values with NULL values from the official basic-data import.

#### Scenario: Repeated import does not duplicate records

- **WHEN** a row with license_number "九三府農畜字第21935號" already exists and the import receives the same license_number again
- **THEN** the existing row is updated and the total row count for that license_number remains 1

#### Scenario: Repeated import preserves geocoded coordinates

- **WHEN** a row with license_number "九三府農畜字第21935號" already has latitude 25.033964 and longitude 121.564468
- **AND** the MOA import receives the same license_number with latitude NULL and longitude NULL from normalized basic data
- **THEN** the existing row keeps latitude 25.033964
- **AND** the existing row keeps longitude 121.564468


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
### Requirement: Import exposes backend npm script

The backend package scripts SHALL expose a db:import:hospitals command that runs the hospital import script. The db:setup command MUST remain limited to database schema setup and MUST NOT implicitly import MOA hospital data.

#### Scenario: Import command is explicit

- **WHEN** a developer inspects backend package scripts
- **THEN** db:import:hospitals runs "node database/scripts/import_hospitals.js"
- **AND** db:setup runs "node scripts/setup-db.js"


<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Database setup preserves existing data

The backend db:setup command SHALL be safe to run against an existing Supabase PostgreSQL database. It MUST execute schema SQL files in the configured order to create missing database structures, and it MUST NOT drop tables, truncate tables, delete existing rows, clear imported hospitals, or automatically run the hospitals import script. Schema table definitions used by db:setup MUST use CREATE TABLE IF NOT EXISTS.

#### Scenario: Existing data remains after setup

- **GIVEN** the database already contains hospitals rows and other application data
- **WHEN** db:setup runs
- **THEN** existing tables are not dropped
- **AND** existing rows are not deleted or overwritten by the setup flow
- **AND** missing schema tables can still be created

#### Scenario: Setup can be run repeatedly

- **GIVEN** every configured schema table already exists
- **WHEN** db:setup runs again
- **THEN** the command does not fail because a table already exists
- **AND** db:setup does not call the hospitals import script


<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Enum creation is idempotent

Schema SQL that creates PostgreSQL ENUM types SHALL be safe to execute repeatedly. The calendar_events and growth_records schemas MUST NOT use DROP TYPE IF EXISTS ... CASCADE. ENUM creation MUST create the type when it is missing and skip it when it already exists without deleting dependent columns, tables, or data.

#### Scenario: Existing enum is preserved

- **GIVEN** an ENUM type used by calendar_events or growth_records already exists and has dependent table columns
- **WHEN** db:setup executes the schema SQL again
- **THEN** the existing ENUM type remains in place
- **AND** dependent columns, tables, and rows are not removed by a cascade operation

#### Scenario: Missing enum is created

- **GIVEN** an ENUM type used by calendar_events or growth_records does not exist
- **WHEN** db:setup executes the schema SQL
- **THEN** the schema creates the missing ENUM type before creating the dependent table


<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->

---
### Requirement: Seed data can be cleared explicitly

The backend package scripts SHALL expose a db:seed:clear command that runs a seed clear script. The script SHALL delete only data created by backend/database/seeds/ using explicit seed identifiers and child-before-parent ordering. It MUST run inside a transaction, roll back on error, close the database connection, and exit non-zero with a clear error message when cleanup fails. It MUST NOT use DROP TABLE, TRUNCATE, unqualified DELETE statements, delete or recreate ENUM types, touch hospitals, or delete non-seed data.

#### Scenario: Seed clear removes only seed rows

- **GIVEN** the database contains seed users identified by seed emails, seed pets identified by seed microchip numbers, dependent seed calendar_events, medical_records, and growth_records, plus non-seed rows
- **WHEN** db:seed:clear runs
- **THEN** seed dependent rows are deleted before seed pets and seed users
- **AND** non-seed rows remain in the database
- **AND** hospitals rows are not modified

#### Scenario: Seed clear rolls back on failure

- **GIVEN** the seed clear script encounters a database error after beginning cleanup
- **WHEN** the error occurs
- **THEN** the transaction is rolled back
- **AND** the database connection is closed
- **AND** the process exits with a non-zero code after printing a clear cleanup failure message

<!-- @trace
source: import-moa-veterinary-hospitals
updated: 2026-07-05
code:
  - backend/database/schema/calendar_events.sql
  - backend/scripts/setup-db.js
  - .agents/skills/spectra-ingest/SKILL.md
  - backend/database/seeds/medical_records.sql
  - .agents/skills/spectra-audit/SKILL.md
  - backend/database/schema/hospitals.sql
  - .agents/skills/spectra-archive/SKILL.md
  - backend/package.json
  - backend/scripts/clear-seed.js
  - AGENTS.md
  - backend/database/seeds/calendar_events.sql
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .agents/skills/spectra-commit/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
  - backend/database/schema/growth_records.sql
  - .agents/skills/spectra-discuss/SKILL.md
  - backend/database/scripts/import_hospitals.js
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - backend/database/seeds/growth_records.sql
tests:
  - backend/test/import_hospitals.test.js
-->