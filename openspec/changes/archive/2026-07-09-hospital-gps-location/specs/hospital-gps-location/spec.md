## ADDED Requirements

### Requirement: Home page automatically requests the user's current location

The home page SHALL request the user's current location through navigator.geolocation.getCurrentPosition when the home page loads. The frontend SHALL store a successful location as latitude and longitude in shared frontend state. The location request MUST NOT call any PawPal backend API.

#### Scenario: Home page load allows GPS location

- **WHEN** a user opens the home page and the browser returns coords.latitude 25.033964 and coords.longitude 121.564468
- **THEN** the frontend stores userLocation.lat as 25.033964
- **AND** the frontend stores userLocation.lng as 121.564468
- **AND** the frontend clears any previous location error

##### Example: successful shared location state

- **GIVEN** the current stored location is null
- **WHEN** getCurrentPosition succeeds with latitude 25.033964 and longitude 121.564468
- **THEN** userLocation becomes { lat: 25.033964, lng: 121.564468 }

#### Scenario: Home page location request does not call hospital APIs

- **WHEN** the home page requests the user's current location
- **THEN** the frontend calls navigator.geolocation.getCurrentPosition
- **AND** the frontend does not call GET /api/v1/hospitals
- **AND** the frontend does not call GET /api/v1/hospitals/nearby

### Requirement: Shared location state is available to public hospital map flows

The frontend SHALL store GPS state in shared frontend state that is available to both HomeView and HospitalView. The hospital page SHALL allow users to request the current location again. The shared location state SHALL be available to visitors who are not logged in.

#### Scenario: Visitor location is shared between home and hospital pages

- **WHEN** an unauthenticated visitor opens the home page and GPS lookup succeeds
- **THEN** the stored userLocation is available to the hospital page
- **AND** the hospital route remains accessible without authentication

#### Scenario: Hospital page can refresh the current location

- **WHEN** a user opens the hospital page after a previous location lookup
- **THEN** the hospital page displays a current-location action
- **AND** the user can trigger another current-location request

### Requirement: Frontend exposes location request states

The frontend SHALL expose visible states for location request progress and outcome. The frontend SHALL show a locating state while a location request is pending. The frontend SHALL prevent simultaneous duplicate location requests.

#### Scenario: Home page shows locating state while waiting for GPS

- **WHEN** a current-location request is pending after home page load
- **THEN** the home page displays a locating state
- **AND** existing home page content remains visible

#### Scenario: Hospital page shows locating state while waiting for GPS

- **WHEN** a current-location request is pending from the hospital page
- **THEN** the hospital page displays a locating state
- **AND** the current-location action does not start another simultaneous location request

#### Scenario: User can retry location after a failure

- **WHEN** a current-location request fails
- **THEN** the frontend displays the location error
- **AND** the hospital page keeps the current-location action available for another attempt

#### Scenario: User can refresh location after success

- **WHEN** a current-location request succeeds
- **THEN** the frontend displays a success state indicating the current location is available
- **AND** the hospital page can trigger another current-location request

### Requirement: Hospital map centers on the user's current location

The hospital map SHALL accept the stored user location as an input. When a user location exists, the map center SHALL use the user location coordinates. When no user location exists, the map SHALL preserve the existing hospital-centered behavior.

#### Scenario: User location takes center precedence

- **WHEN** userLocation has lat 25.033964 and lng 121.564468
- **THEN** the Leaflet map center is [25.033964, 121.564468]

#### Scenario: No user location preserves existing map center

- **WHEN** userLocation is null
- **THEN** the Leaflet map center is calculated from valid hospital markers when they exist
- **AND** the Leaflet map falls back to the existing Taipei center when no valid hospital marker exists

### Requirement: Hospital map displays a user location marker

The hospital map SHALL display a distinct marker for the user's current location when userLocation exists. The user location marker SHALL NOT use the hospital marker component. The user location marker SHALL show popup text identifying it as the user's current location.

#### Scenario: User marker appears after successful GPS lookup

- **WHEN** userLocation has lat 25.033964 and lng 121.564468
- **THEN** the Leaflet map displays one user location marker at [25.033964, 121.564468]
- **AND** the marker popup text is 你目前的位置

#### Scenario: User marker is hidden before GPS lookup

- **WHEN** userLocation is null
- **THEN** the Leaflet map does not display a user location marker

### Requirement: Geolocation errors are handled without breaking public pages

The frontend SHALL handle unsupported geolocation, permission denial, unavailable position, timeout, and unknown geolocation errors. A geolocation failure SHALL NOT remove existing home page content, existing hospital markers, or prevent the hospital page from rendering.

#### Scenario: Browser does not support geolocation

- **WHEN** navigator.geolocation or navigator.geolocation.getCurrentPosition is unavailable
- **THEN** the frontend displays 此瀏覽器不支援定位功能
- **AND** the home page and hospital page remain usable

#### Scenario: User denies location permission

- **WHEN** getCurrentPosition fails with PERMISSION_DENIED
- **THEN** the frontend displays 定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試
- **AND** the home page and hospital page remain usable

#### Scenario: Browser permission is already blocked

- **WHEN** navigator.permissions.query returns geolocation state denied
- **THEN** the frontend displays 定位權限已被封鎖，請到瀏覽器網站設定允許定位後再試
- **AND** the frontend does not call navigator.geolocation.getCurrentPosition
- **AND** the hospital page displays guidance to allow PawPal location access from browser site settings

#### Scenario: Location is unavailable

- **WHEN** getCurrentPosition fails with POSITION_UNAVAILABLE
- **THEN** the frontend displays 目前無法取得位置，請稍後再試
- **AND** the home page and hospital page remain usable

#### Scenario: Location request times out

- **WHEN** getCurrentPosition fails with TIMEOUT
- **THEN** the frontend displays 定位逾時，請重新取得目前位置
- **AND** the home page and hospital page remain usable

#### Scenario: Unknown location error

- **WHEN** getCurrentPosition fails with an unrecognized geolocation error code
- **THEN** the frontend displays 定位失敗，請稍後再試
- **AND** the home page and hospital page remain usable
