## MODIFIED Requirements

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
