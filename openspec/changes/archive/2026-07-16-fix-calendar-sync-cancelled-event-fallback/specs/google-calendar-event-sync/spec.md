## MODIFIED Requirements

### Requirement: Fallback to creating a new Google event when the linked event is gone

When pushing an update to Google Calendar for an event whose linked `google_event_id` no longer represents a live event, the system SHALL create a new Google Calendar event instead of leaving the local record pointing at the dead id, and SHALL persist the newly created event's id as the local event's `google_event_id`. A linked event SHALL be treated as gone in either of two ways:

- the patch call fails with HTTP status 404 (Not Found) or 410 (Gone), or
- the patch call succeeds (HTTP 200) but the response body's `status` field is `cancelled` — Google Calendar marks a user-deleted event as a `cancelled` tombstone rather than rejecting further patch calls against it.

#### Scenario: Patch fails with 404, fallback creates a new event

- **WHEN** patching a local event whose `google_event_id = 'old-abc'` returns HTTP 404
- **THEN** the system SHALL call the Google Calendar insert operation to create a new event
- **THEN** the local record's `google_event_id` SHALL be updated to the newly created event id
- **THEN** the local record's `google_sync_failed` SHALL be set to `false`

#### Scenario: Patch fails with 410, fallback creates a new event

- **WHEN** patching a local event whose `google_event_id = 'old-abc'` returns HTTP 410
- **THEN** the system SHALL call the Google Calendar insert operation to create a new event
- **THEN** the local record's `google_event_id` SHALL be updated to the newly created event id

#### Scenario: Patch succeeds but the event is a cancelled tombstone, fallback creates a new event

- **WHEN** patching a local event whose `google_event_id = 'old-abc'` returns HTTP 200 with response `status: 'cancelled'`
- **THEN** the system SHALL call the Google Calendar insert operation to create a new event
- **THEN** the local record's `google_event_id` SHALL be updated to the newly created event id
- **THEN** the local record's `google_sync_failed` SHALL be set to `false`

##### Example: patch response mapping for the fallback path

| Patch outcome | Response status field | Behavior |
| --- | --- | --- |
| Throws HTTP 404 | n/a (error thrown) | Fallback: insert a new event, persist new id |
| Throws HTTP 410 | n/a (error thrown) | Fallback: insert a new event, persist new id |
| Succeeds HTTP 200 | `cancelled` | Fallback: insert a new event, persist new id |
| Succeeds HTTP 200 | `confirmed` | No fallback: patched event id is kept as-is |
| Throws HTTP 500 | n/a (error thrown) | No fallback: error is surfaced, `google_event_id` unchanged |
