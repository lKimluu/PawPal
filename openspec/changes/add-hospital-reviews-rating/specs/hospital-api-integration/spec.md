## ADDED Requirements

### Requirement: Hospital map API exposes review aggregates while remaining public

The system SHALL include rating_average and review_count in every hospital object returned by GET /api/v1/hospitals/map. rating_average SHALL be computed from hospital_reviews.rating for the hospital. review_count SHALL be the number of reviews for the hospital. A hospital with no reviews SHALL return rating_average as null and review_count as 0. The map endpoint SHALL remain public and SHALL NOT require caller authentication.

#### Scenario: Anonymous caller reads map hospitals with aggregates

- **WHEN** a caller without an Authorization header sends GET /api/v1/hospitals/map with valid north, south, east, and west bounds
- **THEN** the API returns HTTP 200
- **AND** every hospital object includes rating_average and review_count

##### Example: map aggregate values

- **GIVEN** hospital A is inside the requested bounds and has reviews with ratings 5 and 3
- **AND** hospital B is inside the requested bounds and has no reviews
- **WHEN** the caller requests GET /api/v1/hospitals/map
- **THEN** hospital A includes rating_average 4.0 and review_count 2
- **AND** hospital B includes rating_average null and review_count 0

#### Scenario: Map aggregate fields preserve bounds response metadata

- **WHEN** more than 1000 hospitals exist within the requested bounds
- **THEN** GET /api/v1/hospitals/map returns at most 1000 hospitals with rating_average and review_count
- **AND** total and truncated metadata keep the existing visible-bounds semantics
