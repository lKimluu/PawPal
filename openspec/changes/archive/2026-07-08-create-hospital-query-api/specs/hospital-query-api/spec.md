## ADDED Requirements

### Requirement: Hospitals list API supports search filters and pagination

The system SHALL expose GET /api/v1/hospitals for querying hospitals. The endpoint SHALL accept optional keyword, city, district, animal_type, page, and limit query parameters. The endpoint SHALL filter by hospital name, city, district, or address when keyword is present, filter exactly by city when city is present, filter exactly by district when district is present, and filter by animal_types.slug when animal_type is present. The endpoint MUST paginate results with page defaulting to 1, limit defaulting to 20, and limit capped at 100.

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

### Requirement: Nearby hospitals API supports radius search and distance ordering

The system SHALL expose GET /api/v1/hospitals/nearby for querying hospitals near a user coordinate. The endpoint SHALL require lat and lng query parameters, accept optional radius, limit, and animal_type query parameters, calculate the distance between the caller coordinate and each hospital coordinate in kilometers, return only hospitals within the radius, and order results by distance from nearest to farthest. The endpoint MUST exclude hospitals without latitude or longitude from nearby results. The radius parameter SHALL default to 5 kilometers and MUST be capped at 50 kilometers. The limit parameter SHALL default to 20 and MUST be capped at 100.

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
