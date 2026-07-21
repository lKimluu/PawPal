## MODIFIED Requirements

### Requirement: Hospital list supports contextual sorting and pagination

The list API SHALL support `sort` values `relevance`, `distance`, and `name`, and SHALL return stable paginated results. Keyword searches SHALL default to relevance, searches without a keyword and with a real user location SHALL default to distance, and searches without a real user location SHALL default to name with distance disabled.

When real user location becomes available after the list was initialized without it, the frontend SHALL change a system-selected contextual default from name to distance for searches without a keyword. A location-state change MUST NOT overwrite a sorting option explicitly selected by the user. Whenever a real user location is available, frontend hospital list requests SHALL include that latitude and longitude regardless of the selected sort, so distance can be displayed independently from ordering. Fallback coordinates MUST NOT be sent as real user coordinates in general list searches.

#### Scenario: relevance ordering

- **WHEN** a keyword matches one hospital name and another hospital address
- **THEN** the name match ranks before the address match
- **AND** ties use city, district, name, and id as stable ordering keys

#### Scenario: keyword relevance search displays distance from real location

- **GIVEN** a valid real user location is stored
- **WHEN** the user submits a keyword search
- **THEN** the list request includes the keyword, `sort=relevance`, latitude, and longitude
- **AND** result cards display returned distances without changing relevance ordering

#### Scenario: distance requires real user location

- **WHEN** no real user location is available
- **THEN** general search defaults to name sorting
- **AND** the distance sorting option is disabled
- **AND** keyword searches do not send fallback coordinates as user coordinates

#### Scenario: real location replaces the no-location contextual default

- **GIVEN** the list was initialized without a real user location
- **AND** name sorting was selected by the system as the contextual default
- **WHEN** a valid real user location becomes available
- **THEN** the current sort changes to distance
- **AND** a subsequent city, district, animal-type, or 24-hour filter query uses distance sorting with the real user coordinates

#### Scenario: explicit sorting survives a location-state change

- **GIVEN** the user explicitly selected name sorting
- **WHEN** a valid real user location becomes available or changes
- **THEN** name sorting remains selected
- **AND** subsequent filter queries preserve name sorting
- **AND** those queries include the real user coordinates for distance display

#### Scenario: page changes preserve search state

- **WHEN** a user moves from page 1 to page 2
- **THEN** the list request preserves committed filters, sorting, and any real user coordinates
- **AND** the result count displays the API total rather than the current page length

### Requirement: Hospital APIs expose reliable 24-hour and map data

`GET /api/v1/hospitals` SHALL accept `is_24h`, `sort`, and an optional valid latitude and longitude pair. Hospital responses SHALL expose `is_24h` and `emergency_available`. List responses with a valid coordinate pair SHALL expose `distance_km` for hospitals with stored coordinates regardless of sort, while hospitals without stored coordinates SHALL keep distance unknown. The API and full hospital search SHALL NOT infer current-open status without business-hours data. The home summary SHALL retain its product-approved static `營業中` presentation label as a scoped exception, but that label MUST NOT be derived from API fields and MUST NOT affect queries, ordering, filtering, map summaries, or full-search cards.

#### Scenario: 24-hour filtering

- **WHEN** a caller requests `GET /api/v1/hospitals?is_24h=true`
- **THEN** every returned hospital has `is_24h` equal to true

#### Scenario: relevance response includes distance when coordinates are provided

- **WHEN** a caller requests a keyword with `sort=relevance` and a valid latitude and longitude pair
- **THEN** hospitals with stored coordinates include numeric `distance_km`
- **AND** the response remains ordered by relevance rather than distance

#### Scenario: hospital without coordinates keeps distance unknown

- **WHEN** a coordinate-bearing list query returns a hospital whose latitude or longitude is null
- **THEN** that hospital does not expose a numeric zero distance
- **AND** the frontend displays distance as unknown

#### Scenario: distance sorting without coordinates

- **WHEN** a caller requests distance sorting without a valid latitude and longitude pair
- **THEN** the API rejects the query with HTTP 400 and a Traditional Chinese validation message

#### Scenario: home static label does not become current-open data

- **WHEN** the home page renders nearby hospital summaries before business-hours data exists
- **THEN** each home summary can display the static `營業中` text
- **AND** the nearby API remains ordered only by distance
- **AND** the hospital map and full-search cards do not receive or infer a verified current-open value from that text
