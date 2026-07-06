## MODIFIED Requirements

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
