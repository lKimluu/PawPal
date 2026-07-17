# home-hospital-summary Specification

## Purpose

TBD - created by archiving change 'connect-home-nearby-hospitals'. Update Purpose after archive.

## Requirements

### Requirement: Home page loads nearby hospital summaries

After the shared location request settles, the home page SHALL request `GET /api/v1/hospitals/nearby` with a 5-kilometer radius and a limit of 3. When a valid shared user location exists, the request SHALL use that latitude and longitude. When a valid location is unavailable, the request SHALL use `TAIPEI_CENTER = [25.033, 121.5654]` and the page MUST identify the results as being near Taipei City center.

#### Scenario: valid user location loads nearest hospitals

- **WHEN** the home page receives a shared user location with latitude 25.033964 and longitude 121.564468
- **THEN** it requests nearby hospitals with those coordinates, radius 5, and limit 3
- **AND** it displays at most the first 3 hospitals in API distance order

##### Example: API distance order is preserved

- **GIVEN** the API returns hospital A at 0.44 kilometers, hospital B at 1.26 kilometers, and hospital C at 2.01 kilometers
- **WHEN** the home page renders the summaries
- **THEN** it displays A, B, and C in that order
- **AND** it displays their distances as 0.4 km, 1.3 km, and 2.0 km

#### Scenario: unavailable location uses Taipei fallback

- **WHEN** the location request fails or returns no valid coordinate
- **THEN** the home page requests nearby hospitals using latitude 25.033 and longitude 121.5654
- **AND** it displays `未取得目前位置，顯示台北市中心附近醫院。`


<!-- @trace
source: connect-home-nearby-hospitals
updated: 2026-07-14
code:
  - src/components/hospital/MapStatusOverlay.vue
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - src/utils/hospitalMapSelection.js
  - src/views/HospitalView.vue
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Home page represents hospital summary states without fake data

The desktop and mobile home layouts SHALL use the same normalized nearby hospital results. Each summary SHALL display the hospital name, district, and one-decimal distance when the distance is finite. While the request is pending, the page SHALL display 3 instances of a shared pet-loading-animation component in place of the summary cards. A successful empty response SHALL display `附近 5 公里內暫無醫院`. A failed request SHALL display the existing Traditional Chinese API error message. The page MUST NOT display the previous hard-coded hospital names in any state.

#### Scenario: nearby request is pending

- **WHEN** the nearby hospital request has not settled
- **THEN** both responsive layouts preserve the summary area with 3 pet-loading-animation instances
- **AND** no fake hospital name is displayed
- **AND** no skeleton placeholder is displayed

##### Example: pet loading animation composition

- **GIVEN** the shared `PetLoadingRunner` component renders a single-path cat SVG filled with `#ffa002` (the project's `--color-brand-orange` token)
- **WHEN** the request is pending
- **THEN** the cat plays an in-place bounce animation simulating a walking cadence, without horizontal translation
- **AND** 3 small dots near the cat's hind legs animate in a staggered sequence to read as a loading ellipsis (`...`)

#### Scenario: nearby request succeeds with no hospitals

- **WHEN** the nearby hospital API returns an empty hospital array
- **THEN** the home page displays `附近 5 公里內暫無醫院`
- **AND** the full hospital search action remains available

#### Scenario: nearby request fails

- **WHEN** the nearby hospital API returns a failure message
- **THEN** the home page displays that failure message
- **AND** the full hospital search action remains available


<!-- @trace
source: add-pet-loading-animation
updated: 2026-07-16
code:
  - .agents/skills/spectra-archive/SKILL.md
  - src/assets/main.css
  - .agents/skills/spectra-commit/SKILL.md
  - src/components/common/PetLoadingRunner.vue
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - src/views/HomeView.vue
  - .agents/skills/spectra-audit/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
tests:
  - src/test/hospitalGpsView.test.js
-->

---
### Requirement: Home hospital cards transfer selection to full search

The home page SHALL retain the existing responsive card visual language. Each real hospital summary SHALL display the static text `營業中` as a presentation-only label. The label MUST NOT alter API parameters, result ordering, or filters and MUST NOT be treated as verified current-open data. Selecting a summary card SHALL store that hospital identifier before navigating to `/hospital`. The `立即搜尋醫院` action SHALL navigate to `/hospital` without changing the selected hospital.

#### Scenario: user selects a hospital summary

- **WHEN** a user activates the summary card for hospital identifier 42
- **THEN** the hospital store selects identifier 42 before navigation
- **AND** the router navigates to `/hospital`
- **AND** the full search map can focus the selected hospital through its existing selection flow

#### Scenario: user opens full search without choosing a summary

- **WHEN** a user activates `立即搜尋醫院`
- **THEN** the router navigates to `/hospital`
- **AND** the action does not assign a new selected hospital identifier


<!-- @trace
source: connect-home-nearby-hospitals
updated: 2026-07-14
code:
  - src/components/hospital/MapStatusOverlay.vue
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - src/utils/hospitalMapSelection.js
  - src/views/HospitalView.vue
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->

---
### Requirement: Newer full-search requests supersede home requests

The shared hospital store MUST keep nearby list requests under its existing monotonically increasing list request identifier. A home request response, error, or completion handler MUST NOT update shared list state after a newer full-search request has started.

#### Scenario: user navigates before home request finishes

- **WHEN** home nearby request A starts with limit 3
- **AND** full-search nearby request B starts later with limit 20
- **AND** request A settles after request B
- **THEN** request A does not replace the full-search hospitals, error, pagination, or loading state

<!-- @trace
source: connect-home-nearby-hospitals
updated: 2026-07-14
code:
  - src/components/hospital/MapStatusOverlay.vue
  - src/components/hospital/MapView.vue
  - src/views/HomeView.vue
  - src/utils/hospitalMapSelection.js
  - src/views/HospitalView.vue
tests:
  - src/test/hospitalMapSelection.test.js
  - src/test/hospitalGpsView.test.js
  - src/test/hospitalApiIntegration.test.js
-->