## ADDED Requirements

### Requirement: Hospital list distance projection is independent from ordering

`GET /api/v1/hospitals` SHALL accept an optional valid `lat` and `lng` pair with `relevance`, `name`, or `distance` sorting. When the pair is present, the service SHALL calculate `distance_km` with the existing hospital distance formula for every returned hospital that has stored coordinates. The selected `sort` SHALL remain the sole control for ordering. When the pair is absent, the service SHALL omit distance projection. A hospital with a null latitude or longitude MUST NOT expose zero as its distance.

#### Scenario: relevance sorting also projects distance

- **GIVEN** hospital A matches the keyword in its name and is 3.2 kilometers away
- **AND** hospital B matches the keyword only in its address and is 1.1 kilometers away
- **WHEN** the caller requests the keyword with `sort=relevance` and a valid `lat` and `lng` pair
- **THEN** hospital A remains ordered before hospital B
- **AND** hospital A has `distance_km` 3.2
- **AND** hospital B has `distance_km` 1.1

#### Scenario: name sorting also projects distance

- **WHEN** the caller requests `sort=name` with a valid `lat` and `lng` pair
- **THEN** hospitals remain ordered by the existing name ordering keys
- **AND** hospitals with stored coordinates include numeric `distance_km`

#### Scenario: query without coordinates omits distance projection

- **WHEN** the caller requests relevance or name sorting without `lat` and `lng`
- **THEN** the response ordering follows the selected sort
- **AND** hospitals do not expose calculated `distance_km`

#### Scenario: partial coordinate pair is rejected

- **WHEN** the caller supplies only `lat` or only `lng`
- **THEN** the API returns HTTP 400 with a message string
- **AND** service query logic is not executed
