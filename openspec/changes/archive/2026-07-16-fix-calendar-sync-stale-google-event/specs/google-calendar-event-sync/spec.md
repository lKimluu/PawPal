## ADDED Requirements

### Requirement: Push local event changes to Google Calendar

When a local calendar event that is already linked to Google Calendar (`google_event_id` is set) is updated, the system SHALL patch the existing Google Calendar event using that `google_event_id`.

#### Scenario: Update a linked event

- **WHEN** a local event with `google_event_id = 'google-event-9'` is updated and pushed to Google
- **THEN** the system SHALL call the Google Calendar patch operation with `google_event_id = 'google-event-9'`
- **THEN** the local record SHALL keep `google_event_id = 'google-event-9'` and `google_sync_failed = false`

### Requirement: Fallback to creating a new Google event when the linked event is gone

When patching a Google Calendar event fails because the target event no longer exists on Google's side (HTTP status 404 Not Found or 410 Gone), the system SHALL create a new Google Calendar event instead of surfacing the failure, and SHALL persist the newly created event's id as the local event's `google_event_id`.

#### Scenario: Patch fails with 404, fallback creates a new event

- **WHEN** patching a local event whose `google_event_id = 'old-abc'` returns HTTP 404
- **THEN** the system SHALL call the Google Calendar insert operation to create a new event
- **THEN** the local record's `google_event_id` SHALL be updated to the newly created event id
- **THEN** the local record's `google_sync_failed` SHALL be set to `false`

#### Scenario: Patch fails with 410, fallback creates a new event

- **WHEN** patching a local event whose `google_event_id = 'old-abc'` returns HTTP 410
- **THEN** the system SHALL call the Google Calendar insert operation to create a new event
- **THEN** the local record's `google_event_id` SHALL be updated to the newly created event id

##### Example: status code mapping for the fallback path

| Google response status | Behavior |
| --- | --- |
| 404 | Fallback: insert a new event, persist new id |
| 410 | Fallback: insert a new event, persist new id |
| 500 | No fallback: error is surfaced, `google_event_id` unchanged |
| network timeout | No fallback: error is surfaced, `google_event_id` unchanged |

### Requirement: Non-recoverable sync errors are surfaced as failed

When pushing an event to Google Calendar fails for any reason other than the linked event being gone (404/410), the system SHALL propagate the error to the caller, SHALL mark the local event's `google_sync_failed = true`, and SHALL leave the existing `google_event_id` unchanged so a later resync can retry against the same id.

#### Scenario: Transient error leaves the stored Google event id untouched

- **WHEN** patching a local event whose `google_event_id = 'old-abc'` fails with HTTP 500
- **THEN** the system SHALL mark the local event's `google_sync_failed = true`
- **THEN** the local record's `google_event_id` SHALL remain `'old-abc'`

### Requirement: Manual resync reuses the same push behavior

When a user triggers a manual resync for a local event, the system SHALL apply the same patch-then-fallback behavior used for automatic updates, including the 404/410 fallback to creating a new Google event.

#### Scenario: Resync recovers from a stale linked event

- **WHEN** a user triggers resync for a local event whose `google_event_id = 'old-abc'` no longer exists on Google (HTTP 404)
- **THEN** the system SHALL create a new Google Calendar event and persist its id as the local event's `google_event_id`
- **THEN** the resync result SHALL indicate success
