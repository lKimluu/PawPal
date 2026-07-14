## MODIFIED Requirements

### Requirement: Home page automatically requests the user's current location

The home page SHALL request the user's current location through navigator.geolocation.getCurrentPosition when the home page loads. The frontend SHALL store a successful location as latitude and longitude in shared frontend state. After the location request settles, the home page SHALL use the resulting shared location state to initiate its nearby hospital summary request.

#### Scenario: Home page load allows GPS location

- **WHEN** a user opens the home page and the browser returns coords.latitude 25.033964 and coords.longitude 121.564468
- **THEN** the frontend stores userLocation.lat as 25.033964
- **AND** the frontend stores userLocation.lng as 121.564468
- **AND** the frontend clears any previous location error

##### Example: successful shared location state

- **GIVEN** the current stored location is null
- **WHEN** getCurrentPosition succeeds with latitude 25.033964 and longitude 121.564468
- **THEN** userLocation becomes { lat: 25.033964, lng: 121.564468 }

#### Scenario: Home page location request precedes nearby hospital request

- **WHEN** the home page begins its automatic location request
- **THEN** the frontend calls navigator.geolocation.getCurrentPosition before requesting nearby hospitals
- **AND** the subsequent nearby request uses the successful shared coordinate or the documented Taipei City center fallback

### Requirement: Hospital map centers on the user's current location

The hospital map SHALL resolve its initial center once using this precedence: a valid selected hospital, a valid stored user location, the average of valid initial hospital markers, then `TAIPEI_CENTER`. Later map hospital responses MUST NOT change that initial center. When a hospital-page location refresh succeeds, the frontend SHALL clear the selected hospital and pan the map to the refreshed user coordinates once at the current zoom. When the refresh fails, the frontend MUST preserve the current selection and viewport.

#### Scenario: User location takes initial center precedence

- **WHEN** no hospital is selected and userLocation has lat 25.033964 and lng 121.564468 as the map is created
- **THEN** the Leaflet map initial center is [25.033964, 121.564468]

#### Scenario: Selected hospital takes initial center precedence

- **WHEN** a valid hospital is selected before the map is created
- **THEN** the Leaflet map initial center uses the selected hospital coordinates

#### Scenario: No initial user location preserves hospital center fallback

- **WHEN** no hospital is selected and userLocation is null as the map is created
- **THEN** the initial center is calculated from valid initial hospital markers when they exist
- **AND** the initial center falls back to `TAIPEI_CENTER` when no valid initial hospital marker exists

#### Scenario: Successful location refresh replaces hospital focus

- **WHEN** a hospital-page location refresh succeeds with valid coordinates while a hospital is selected
- **THEN** the frontend clears the hospital selection and popup
- **AND** the map pans to the refreshed coordinates once without changing zoom
- **AND** the settled viewport triggers one debounced bounds request

#### Scenario: Failed location refresh preserves hospital focus

- **WHEN** a hospital-page location refresh fails
- **THEN** the selected hospital and popup remain unchanged
- **AND** the map viewport remains unchanged
