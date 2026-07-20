## MODIFIED Requirements

### Requirement: Hospital table stores official clinic records

The system SHALL provide a hospitals table for official veterinary clinic records imported from the MOA UnitId=078 dataset. The table SHALL store license_number, name, city, district, address, phone, latitude, longitude, license_status, is_24h, emergency_available, google_place_id, is_24h_source, is_24h_checked_at, created_at, and updated_at. The license_number field MUST be required and unique. A non-NULL google_place_id MUST be unique across hospitals.

#### Scenario: Table supports source identity

- **WHEN** a hospital record is inserted with license_number "九三府農畜字第21935號"
- **THEN** the database enforces that no second row uses the same license_number

#### Scenario: Google Place identity is unique when present

- **GIVEN** one hospital stores google_place_id "ChIJleIT6DqpQjQRGJ4YBxYeVmw"
- **WHEN** another hospital attempts to store the same non-NULL google_place_id
- **THEN** the database rejects the duplicate link

#### Scenario: Unknown enrichment fields remain nullable

- **WHEN** a MOA clinic record does not include coordinates, 24-hour status, emergency availability, or Google enrichment metadata
- **THEN** latitude, longitude, is_24h, emergency_available, google_place_id, is_24h_source, and is_24h_checked_at are stored as NULL

### Requirement: Import is idempotent

The import script SHALL upsert records by license_number. Re-running the import with the same source data MUST NOT create duplicate hospitals rows, and changed official basic fields MUST update the existing row. Re-running the import MUST NOT replace existing latitude, longitude, is_24h, emergency_available, google_place_id, is_24h_source, or is_24h_checked_at values with NULL values from the official basic-data import.

#### Scenario: Repeated import does not duplicate records

- **WHEN** a row with license_number "九三府農畜字第21935號" already exists and the import receives the same license_number again
- **THEN** the existing row is updated and the total row count for that license_number remains 1

#### Scenario: Repeated import preserves geocoded coordinates

- **WHEN** a row with license_number "九三府農畜字第21935號" already has latitude 25.033964 and longitude 121.564468
- **AND** the MOA import receives the same license_number with latitude NULL and longitude NULL from normalized basic data
- **THEN** the existing row keeps latitude 25.033964
- **AND** the existing row keeps longitude 121.564468

#### Scenario: Repeated import preserves external enrichment

- **GIVEN** a hospital has is_24h true, emergency_available true, google_place_id "ChIJleIT6DqpQjQRGJ4YBxYeVmw", is_24h_source "google_places", and a non-NULL is_24h_checked_at
- **WHEN** the MOA import upserts the same license_number with NULL enrichment values
- **THEN** every existing enrichment value remains unchanged

### Requirement: Database setup preserves existing data

The backend db:setup command SHALL be safe to run against an existing Supabase PostgreSQL database. It MUST execute schema SQL files in the configured order to create missing database structures, including missing nullable Google enrichment columns and the partial unique Google Place ID index. It MUST NOT drop tables, truncate tables, delete existing rows, clear imported hospitals, or automatically run the hospitals import or Google enrichment command. Schema table definitions used by db:setup MUST use CREATE TABLE IF NOT EXISTS, and additions to existing tables MUST be idempotent.

#### Scenario: Existing data remains after setup

- **GIVEN** the database already contains hospitals rows and other application data
- **WHEN** db:setup runs
- **THEN** existing tables are not dropped
- **AND** existing rows are not deleted or overwritten by the setup flow
- **AND** missing schema tables, Google enrichment columns, and the Google Place ID index are created

#### Scenario: Setup can be run repeatedly

- **GIVEN** every configured schema table, Google enrichment column, and index already exists
- **WHEN** db:setup runs again
- **THEN** the command does not fail because a table, column, or index already exists
- **AND** db:setup does not call the hospitals import or Google enrichment command
