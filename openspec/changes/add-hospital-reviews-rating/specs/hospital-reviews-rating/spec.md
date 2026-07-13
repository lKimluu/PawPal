## ADDED Requirements

### Requirement: Hospital reviews store one member rating per hospital

The system SHALL provide a hospital_reviews table for member-authored hospital reviews. The table SHALL store id, hospital_id, user_id, rating, comment, created_at, and updated_at. hospital_id MUST reference hospitals.id. user_id MUST reference users.id. rating MUST accept only integer values from 1 through 5. comment MUST contain trimmed text from 1 through 1000 characters. The pair user_id and hospital_id MUST be unique so one member cannot create more than one review for the same hospital.

#### Scenario: Valid member review is stored

- **WHEN** member 7 creates a review for hospital 15 with rating 5 and comment "Careful doctor"
- **THEN** the database stores the review with hospital_id 15, user_id 7, rating 5, and the comment text

#### Scenario: Rating outside allowed range is rejected

- **WHEN** a review is inserted with rating 0 or rating 6
- **THEN** the database rejects the row through the rating constraint

##### Example: rating boundaries

| Rating | Expected Output | Notes |
| ----- | --------------- | ----- |
| 1 | accepted | minimum allowed rating |
| 5 | accepted | maximum allowed rating |
| 0 | rejected | below minimum |
| 6 | rejected | above maximum |

#### Scenario: Duplicate member review is rejected

- **WHEN** hospital_reviews already contains a row for user_id 7 and hospital_id 15
- **THEN** inserting another row for user_id 7 and hospital_id 15 violates the unique constraint

### Requirement: Hospital review list is public and excludes private user data

The system SHALL expose GET /api/v1/hospitals/:hospital_id/reviews as a public endpoint. The endpoint SHALL return reviews for the requested hospital ordered by created_at descending. Each review item SHALL include id, hospital_id, user_id, user_name, user_avatar_url, rating, comment, created_at, and updated_at. The response MUST NOT include user email, password, JWT data, or other private account fields.

#### Scenario: Anonymous caller reads hospital reviews

- **WHEN** a caller without an Authorization header sends GET /api/v1/hospitals/15/reviews
- **THEN** the API returns HTTP 200 with a reviews array
- **AND** the reviews are ordered newest first
- **AND** each review includes public reviewer display fields only

### Requirement: Hospital review writes require member authentication

The system SHALL require a valid member JWT for creating, updating, and deleting the caller's hospital review. POST /api/v1/hospitals/:hospital_id/reviews SHALL create the caller's review and return HTTP 201. PATCH /api/v1/hospitals/:hospital_id/reviews/me SHALL update the caller's existing review and return HTTP 200. DELETE /api/v1/hospitals/:hospital_id/reviews/me SHALL delete the caller's existing review and return HTTP 204. Unauthenticated write requests MUST return HTTP 401.

#### Scenario: Anonymous caller cannot create review

- **WHEN** a caller without an Authorization header sends POST /api/v1/hospitals/15/reviews with rating and comment
- **THEN** the API returns HTTP 401
- **AND** no hospital_reviews row is created

#### Scenario: Member creates own review

- **WHEN** authenticated member 7 sends POST /api/v1/hospitals/15/reviews with rating 5 and comment "Careful doctor"
- **THEN** the API returns HTTP 201 with the created review
- **AND** the review user_id equals 7

#### Scenario: Member updates only own review

- **WHEN** authenticated member 7 sends PATCH /api/v1/hospitals/15/reviews/me with rating 4 and comment "Long wait"
- **THEN** the API updates the review whose hospital_id is 15 and user_id is 7
- **AND** the API returns HTTP 200 with the updated review

#### Scenario: Member deletes own review

- **WHEN** authenticated member 7 sends DELETE /api/v1/hospitals/15/reviews/me
- **THEN** the API deletes the review whose hospital_id is 15 and user_id is 7
- **AND** the API returns HTTP 204

### Requirement: Hospital review write failures return explicit status codes

The system SHALL validate hospital_id route params and review request bodies before service logic. Invalid hospital_id, rating, or comment values MUST return HTTP 400 with a JSON body containing a Traditional Chinese message string. Creating a second review for the same member and hospital MUST return HTTP 409. Updating or deleting a review that the caller has not created MUST return HTTP 404.

#### Scenario: Invalid review body is rejected

- **WHEN** an authenticated member sends rating 6 or a blank comment to a review write endpoint
- **THEN** the API returns HTTP 400 with a message string
- **AND** service write logic is not executed

#### Scenario: Duplicate create returns conflict

- **WHEN** authenticated member 7 already has a review for hospital 15 and sends another POST /api/v1/hospitals/15/reviews
- **THEN** the API returns HTTP 409 with a Traditional Chinese message string

#### Scenario: Missing own review returns not found

- **WHEN** authenticated member 7 sends PATCH or DELETE for hospital 15 but has no review for hospital 15
- **THEN** the API returns HTTP 404 with a Traditional Chinese message string
