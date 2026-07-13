## ADDED Requirements

### Requirement: Hospital map code is loaded on demand

The frontend SHALL exclude non-home route views, including the hospital map view and Leaflet dependencies, from the initial application chunk and SHALL load each view when its route is visited.

#### Scenario: Building the frontend

- **WHEN** the production frontend build completes
- **THEN** the build emits separate on-demand chunks for non-home route views, including the Hospital view and Leaflet dependencies
- **AND** no emitted JavaScript chunk exceeds the configured 500 kB warning threshold

#### Scenario: Visiting the Hospital route

- **WHEN** a user navigates to `/hospital`
- **THEN** Vue Router loads the Hospital view dynamically
- **AND** the existing hospital map page is rendered without changing its route name or URL

#### Scenario: Visiting another non-home route

- **WHEN** a user navigates to a non-home route other than `/hospital`
- **THEN** Vue Router loads that route's view dynamically
- **AND** the route retains its existing name, URL, metadata, and page behavior
