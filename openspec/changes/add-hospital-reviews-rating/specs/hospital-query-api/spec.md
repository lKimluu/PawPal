## ADDED Requirements

### Requirement: Hospital list and nearby APIs expose review aggregates

The system SHALL include rating_average and review_count in every hospital object returned by GET /api/v1/hospitals and GET /api/v1/hospitals/nearby. rating_average SHALL be computed from hospital_reviews.rating for the hospital. review_count SHALL be the number of reviews for the hospital. A hospital with no reviews SHALL return rating_average as null and review_count as 0. These aggregate fields SHALL NOT require caller authentication.

#### Scenario: Hospital list returns rating aggregates

- **WHEN** a caller sends GET /api/v1/hospitals without an Authorization header
- **THEN** the API returns HTTP 200
- **AND** every hospital object includes rating_average and review_count

##### Example: list aggregate values

- **GIVEN** hospital A has reviews with ratings 5 and 4, and hospital B has no reviews
- **WHEN** the caller requests GET /api/v1/hospitals
- **THEN** hospital A includes rating_average 4.5 and review_count 2
- **AND** hospital B includes rating_average null and review_count 0

#### Scenario: Nearby hospitals return rating aggregates

- **WHEN** a caller sends GET /api/v1/hospitals/nearby with valid lat and lng and without an Authorization header
- **THEN** the API returns HTTP 200
- **AND** every nearby hospital object includes rating_average and review_count

#### Scenario: Review aggregates do not change existing filters or sorting

- **WHEN** a caller requests GET /api/v1/hospitals with keyword, city, district, animal_type, is_24h, pagination, or sorting parameters
- **THEN** the API applies the existing filters, pagination, and ordering semantics
- **AND** rating_average and review_count are included for the returned hospital rows only
