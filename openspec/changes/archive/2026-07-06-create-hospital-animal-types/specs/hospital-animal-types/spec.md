## ADDED Requirements

### Requirement: Animal types reference data is fixed

The system SHALL provide an animal_types table for fixed animal type reference data. The table SHALL store id, name, slug, and created_at. The name and slug fields MUST be unique and required. The reference seed SHALL include exactly the canonical animal type rows dog, cat, rabbit, rodent, bird, reptile, amphibian, and other_exotic with Traditional Chinese display names.

#### Scenario: Canonical animal types are seeded once

- **WHEN** the animal type seed is executed one or more times
- **THEN** the database contains one row for each canonical slug: dog, cat, rabbit, rodent, bird, reptile, amphibian, and other_exotic
- **AND** rerunning the seed does not create duplicate rows for any canonical slug

##### Example: canonical animal type rows

| name | slug |
| ---- | ---- |
| 狗 | dog |
| 貓 | cat |
| 兔 | rabbit |
| 鼠類 | rodent |
| 鳥類 | bird |
| 爬蟲類 | reptile |
| 兩棲類 | amphibian |
| 其他特殊寵物 | other_exotic |

### Requirement: Hospitals are related to animal types through a many-to-many table

The system SHALL provide a hospital_animal_types table that links hospitals to animal_types. The table SHALL store hospital_id, animal_type_id, created_at, verification_status, and source. hospital_id MUST reference hospitals.id. animal_type_id MUST reference animal_types.id. The pair hospital_id and animal_type_id MUST be unique so the same hospital cannot be linked to the same animal type more than once.

#### Scenario: One hospital can support multiple animal types

- **WHEN** a hospital is linked to animal types dog and cat
- **THEN** querying animal types through hospital_animal_types for that hospital returns dog and cat

#### Scenario: One animal type can be supported by multiple hospitals

- **WHEN** animal type dog is linked to two different hospitals
- **THEN** querying hospitals through hospital_animal_types for dog returns both hospitals

#### Scenario: Duplicate hospital and animal type links are rejected

- **WHEN** a hospital_animal_types row already exists for hospital_id 10 and animal_type_id 1
- **THEN** inserting another row with hospital_id 10 and animal_type_id 1 violates the composite uniqueness constraint

### Requirement: Treatment scope records preserve unknown status separately from unsupported service

The system SHALL treat hospital_animal_types rows as known treatment scope records. A hospital without a row for an animal type SHALL NOT be interpreted by the database model as confirmed unsupported for that animal type. Each treatment scope row SHALL record a verification_status value and source value so callers can distinguish unverified records from verified records and inspect the data source. verification_status MUST be constrained to unverified, verified, or rejected. rejected MUST mean the relationship record was checked and not accepted as reliable treatment-scope data; it MUST NOT mean the hospital is confirmed to reject or refuse treating that animal type.

#### Scenario: Missing relationship means unknown treatment scope

- **WHEN** a hospital has no hospital_animal_types row for rabbit
- **THEN** the database contains no confirmed statement that the hospital does not treat rabbits
- **AND** queries for known rabbit-supporting hospitals return only hospitals that have a rabbit relationship row

#### Scenario: Treatment scope records include verification metadata

- **WHEN** a hospital_animal_types row is inserted for a hospital and animal type
- **THEN** the row stores verification_status
- **AND** the row can store source for the data origin

#### Scenario: Verification status accepts only canonical values

- **WHEN** a hospital_animal_types row is inserted or updated with verification_status
- **THEN** the database accepts only unverified, verified, or rejected
- **AND** any other verification_status value violates the status constraint
