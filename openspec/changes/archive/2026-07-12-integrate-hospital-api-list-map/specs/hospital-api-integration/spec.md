## ADDED Requirements

### Requirement: Hospital list and map use independent query state

The frontend SHALL maintain independent results, loading state, error state, retry context, and request sequencing for the hospital list and hospital map. Search filters MUST NOT change map results, and map navigation MUST NOT change list results, filters, sorting, or pagination.

#### Scenario: search does not overwrite map markers

- **WHEN** a user submits a hospital list search
- **THEN** the frontend updates only list query state
- **AND** the map continues to display hospitals from its latest visible-bounds query

#### Scenario: map movement does not overwrite list results

- **WHEN** a user moves or zooms the map
- **THEN** the frontend updates only map query state
- **AND** the current list results, filters, sorting, and page remain unchanged

### Requirement: Superseded hospital responses cannot commit state

The frontend MUST assign independent monotonically increasing request identifiers to list and map requests. A response, error, or completion handler MUST update state only when its identifier is still the latest identifier for that query stream.

#### Scenario: older list request finishes last

- **WHEN** list request A starts before list request B
- **AND** request B finishes before request A
- **THEN** only request B updates list results, pagination, error state, selection synchronization, and loading state

#### Scenario: older map request finishes last

- **WHEN** map request A starts before map request B
- **AND** request B finishes before request A
- **THEN** only request B updates map results, truncation state, error state, and loading state

### Requirement: Hospital map follows the visible bounds

The map SHALL request hospitals using its current north, south, east, and west bounds after map movement or zoom stops for 300 milliseconds. The map API MUST return only hospitals with coordinates inside the requested bounds, MUST limit results to 1,000 hospitals, and MUST return `total` and `truncated` metadata.

#### Scenario: visible bounds change

- **WHEN** map movement or zoom ends and no newer map interaction occurs for 300 milliseconds
- **THEN** the frontend requests `GET /api/v1/hospitals/map` with the latest north, south, east, and west bounds
- **AND** the map renders the latest response independently from list filters

#### Scenario: visible bounds contain more than the limit

- **WHEN** more than 1,000 hospitals exist within the requested bounds
- **THEN** the API returns at most 1,000 hospitals
- **AND** `truncated` is true
- **AND** the map prompts the user to zoom in

### Requirement: Hospital map clusters dense markers

The frontend SHALL cluster nearby hospital markers and SHALL expand clusters as the user zooms in. Map summary values SHALL be derived from map results only and SHALL NOT display a current-open count.

#### Scenario: multiple nearby markers overlap

- **WHEN** multiple hospital markers occupy the same cluster area at the current zoom
- **THEN** the map displays a cluster count instead of overlapping individual markers

### Requirement: Hospital list provides hybrid search controls

The hospital list SHALL search keyword across hospital name, city, district, and address. Keyword changes SHALL be submitted only by Enter or the search button. City, district, animal type, 24-hour status, and sorting changes SHALL submit immediately and reset pagination to page 1. The frontend SHALL remove the current-open filter.

#### Scenario: keyword is edited without submission

- **WHEN** a user edits the keyword without pressing Enter or the search button
- **THEN** the current list results remain unchanged

#### Scenario: immediate filter changes

- **WHEN** a user changes city, district, animal type, or 24-hour status
- **THEN** the frontend immediately requests page 1 with all committed search conditions

#### Scenario: clear all filters

- **WHEN** a user clears all search conditions
- **THEN** keyword, city, district, animal type, and 24-hour status reset
- **AND** the frontend immediately loads page 1 of the unfiltered hospital list

### Requirement: Hospital regions use database-backed dependent options

The system SHALL expose `GET /api/v1/hospitals/regions` returning the cities and districts present in hospital records. The frontend SHALL display city and district as dependent options and SHALL clear a district that does not belong to a newly selected city.

#### Scenario: city selection changes

- **WHEN** a user selects a different city
- **THEN** the district options contain only districts returned for that city
- **AND** an incompatible selected district is cleared before the list query is submitted

#### Scenario: regions request fails

- **WHEN** the regions API fails
- **THEN** the frontend displays a region-loading error and retry action
- **AND** the frontend does not replace the controls with free-text region inputs

### Requirement: Hospital list supports contextual sorting and pagination

The list API SHALL support `sort` values `relevance`, `distance`, and `name`, and SHALL return stable paginated results. Keyword searches SHALL default to relevance, searches without a keyword and with a real user location SHALL default to distance, and searches without a real user location SHALL default to name with distance disabled.

When real user location becomes available after the list was initialized without it, the frontend SHALL change a system-selected contextual default from name to distance for searches without a keyword. A location-state change MUST NOT overwrite a sorting option explicitly selected by the user.

#### Scenario: relevance ordering

- **WHEN** a keyword matches one hospital name and another hospital address
- **THEN** the name match ranks before the address match
- **AND** ties use city, district, name, and id as stable ordering keys

#### Scenario: distance requires real user location

- **WHEN** no real user location is available
- **THEN** general search defaults to name sorting
- **AND** the distance sorting option is disabled

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

#### Scenario: page changes preserve search state

- **WHEN** a user moves from page 1 to page 2
- **THEN** the list request preserves committed filters and sorting
- **AND** the result count displays the API total rather than the current page length

### Requirement: Initial list uses nearby location with an explicit fallback

The hospital page SHALL initially display hospitals nearest to the real user location when available. When real location is unavailable, it SHALL use `TAIPEI_CENTER = [25.033, 121.5654]` and SHALL identify the results as being near Taipei City center. The fallback coordinate MUST NOT enable or label distance sorting as distance from the user in general search.

#### Scenario: real location is available

- **WHEN** the hospital page opens with a valid shared user location
- **THEN** the initial list displays hospitals ordered by distance from that location

#### Scenario: location is unavailable

- **WHEN** location is denied, fails, or is unavailable on initial page load
- **THEN** the initial list displays hospitals near Taipei City center
- **AND** the page visibly identifies the fallback basis

#### Scenario: failed fallback nearby request is retried

- **WHEN** a nearby request without a real user location uses Taipei City center, fails, and is retried
- **THEN** the retry uses Taipei City center for the API request
- **AND** the frontend continues to identify the results as fallback-based
- **AND** the fallback coordinates do not enable or label distance as relative to the user

### Requirement: List selection navigates the independent map

Selecting a hospital list item with coordinates SHALL move the map to that hospital and open its marker popup without replacing the list results. A selected hospital outside the current map result SHALL remain available as a temporary marker until the latest bounds response includes or supersedes it.

#### Scenario: selected hospital is outside current map results

- **WHEN** a user selects a list hospital with coordinates that is absent from current map results
- **THEN** the map moves to the hospital
- **AND** the hospital marker and popup become visible
- **AND** the list query state remains unchanged

### Requirement: Hospital APIs expose reliable 24-hour and map data

`GET /api/v1/hospitals` SHALL accept `is_24h`, `sort`, and valid coordinates for distance sorting. Hospital responses SHALL expose `is_24h` and `emergency_available`, and distance-sorted responses SHALL expose `distance_km`. The system SHALL NOT infer current-open status without business-hours data.

#### Scenario: 24-hour filtering

- **WHEN** a caller requests `GET /api/v1/hospitals?is_24h=true`
- **THEN** every returned hospital has `is_24h` equal to true

#### Scenario: distance sorting without coordinates

- **WHEN** a caller requests distance sorting without a valid latitude and longitude pair
- **THEN** the API rejects the query with HTTP 400 and a Traditional Chinese validation message

### Requirement: Clustered hospital markers display a trusted compact information card

The frontend SHALL display a branded compact popup for clustered hospital markers containing hospital name, address, an optional 24-hour label, an optional telephone action, and a Google Maps directions action. It MUST NOT display current-open status, ratings, or animal-type labels in this compact card. Dynamic hospital values MUST NOT be interpreted as HTML or executable attributes.

#### Scenario: hospital has complete compact-card data

- **WHEN** a user opens a marker for a hospital with an address, telephone number, valid coordinates, and `is_24h` equal to true
- **THEN** the popup displays the hospital name, styled address block, 24H label, telephone action, and Google Maps directions action

#### Scenario: hospital has no telephone and is not 24-hour

- **WHEN** a user opens a marker for a hospital without a telephone number and with `is_24h` equal to false
- **THEN** the popup omits the telephone action and 24H label
- **AND** it continues to display the name, address, and navigation action

#### Scenario: hospital text contains markup characters

- **WHEN** hospital name or address contains HTML markup characters
- **THEN** the popup displays those characters as text
- **AND** no hospital field creates an HTML element, event handler, or arbitrary link target
