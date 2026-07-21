## MODIFIED Requirements

### Requirement: Hospitals list API supports search filters and pagination

The system SHALL expose GET /api/v1/hospitals for querying hospitals. The endpoint SHALL accept optional keyword, city, district, animal_type, favorites_only, page, and limit query parameters. The endpoint SHALL filter by hospital name, city, district, or address when keyword is present, filter exactly by city when city is present, filter exactly by district when district is present, and filter by animal_types.slug when animal_type is present. The endpoint MUST paginate results with page defaulting to 1, limit defaulting to 20, and limit capped at 100.

The endpoint SHALL accept an optional authentication token. When the caller is authenticated, each returned hospital MUST include an is_favorite boolean indicating whether the caller has favorited that hospital, and the caller SHALL be permitted to supply favorites_only=true to restrict the results to hospitals the caller has favorited. When the caller is not authenticated, returned hospitals MUST NOT include is_favorite, and a favorites_only=true request MUST be rejected.

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

#### Scenario: Authenticated request includes favorite status per hospital

- **WHEN** an authenticated caller sends GET /api/v1/hospitals
- **THEN** every hospital in the response includes an is_favorite boolean
- **AND** is_favorite is true only for hospitals the caller has favorited

#### Scenario: Unauthenticated request omits favorite status

- **WHEN** an unauthenticated caller sends GET /api/v1/hospitals
- **THEN** the response hospitals array is returned without an is_favorite field
- **AND** the response otherwise behaves as the unauthenticated default list

#### Scenario: Authenticated favorites_only request returns only favorited hospitals

- **WHEN** an authenticated caller sends GET /api/v1/hospitals with favorites_only=true
- **THEN** the response hospitals array contains only hospitals the caller has favorited
- **AND** pagination.total reflects the count of the caller's favorited hospitals matching the other filters

#### Scenario: Authenticated favorites_only request combines with other filters

- **WHEN** an authenticated caller sends GET /api/v1/hospitals with favorites_only=true and is_24h=true
- **THEN** the response hospitals array contains only hospitals that are both favorited by the caller and open 24 hours

#### Scenario: Unauthenticated favorites_only request is rejected

- **WHEN** an unauthenticated caller sends GET /api/v1/hospitals with favorites_only=true
- **THEN** the API returns HTTP 401 with a message asking the caller to log in to view their favorites
- **AND** service query logic is not executed
