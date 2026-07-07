## ADDED Requirements

### Requirement: Backend uses shared PostgreSQL pool configuration

The backend SHALL provide one shared helper for constructing PostgreSQL Pool instances from environment variables. The helper MUST use DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, and MUST preserve the existing Supabase SSL option with ssl.rejectUnauthorized set to false.

#### Scenario: Shared helper maps database environment variables

- **WHEN** createPoolFromEnv receives an environment object containing DB_USER "postgres", DB_PASSWORD "secret", DB_HOST "db.example.supabase.co", DB_PORT "5432", and DB_NAME "postgres"
- **THEN** it constructs a pg Pool with user "postgres", password "secret", host "db.example.supabase.co", port "5432", and database "postgres"
- **AND** the Pool options include ssl.rejectUnauthorized false

### Requirement: Runtime database config uses shared pool helper

The backend runtime database config SHALL export its pool from the shared Pool helper. It MUST NOT define a separate duplicate PostgreSQL Pool options object.

#### Scenario: Runtime pool remains available

- **WHEN** backend/src/config/db.js is imported by backend services
- **THEN** it exports pool with the same public module interface as before
- **AND** the pool is created through the shared createPoolFromEnv helper

### Requirement: Database scripts use shared pool helper

Database maintenance and hospital data scripts SHALL use the shared Pool helper for database connections. Existing script-level createPoolFromEnv exports MUST remain available for compatibility with tests and direct imports.

#### Scenario: Scripts preserve compatible pool factory exports

- **WHEN** backend/scripts/clear-seed.js, backend/database/scripts/import_hospitals.js, or backend/database/scripts/geocode_hospitals.js exports createPoolFromEnv
- **THEN** callers can still import createPoolFromEnv from those scripts
- **AND** the exported function uses the same shared Pool helper behavior

#### Scenario: Setup command uses shared pool configuration

- **WHEN** backend/scripts/setup-db.js creates the Pool used by db:setup
- **THEN** it uses the shared Pool helper
- **AND** db:setup, db:setup:seed, db:import:hospitals, db:geocode:hospitals, and db:seed:clear do not define separate duplicate PostgreSQL Pool options
