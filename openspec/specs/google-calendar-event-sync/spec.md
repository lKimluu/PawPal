# google-calendar-event-sync Specification

## Purpose

Defines how local calendar events are synced to Google Calendar: pushing updates, falling back to creating a new Google event when the linked event id is stale (patch fails with 404/410, or succeeds but the event is a cancelled tombstone), surfacing non-recoverable errors, and how manual resync reuses the same push behavior.

## Requirements

### Requirement: Push local event changes to Google Calendar

When a local calendar event that is already linked to Google Calendar (`google_event_id` is set) is updated, the system SHALL patch the existing Google Calendar event using that `google_event_id`.

#### Scenario: Update a linked event

- **WHEN** a local event with `google_event_id = 'google-event-9'` is updated and pushed to Google
- **THEN** the system SHALL call the Google Calendar patch operation with `google_event_id = 'google-event-9'`
- **THEN** the local record SHALL keep `google_event_id = 'google-event-9'` and `google_sync_failed = false`


<!-- @trace
source: fix-calendar-sync-stale-google-event
updated: 2026-07-16
code:
  - backend/src/services/calendar_events_sync.service.js
tests:
  - backend/test/calendar_events_sync.test.js
-->

---
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


<!-- @trace
source: fix-calendar-sync-cancelled-event-fallback
updated: 2026-07-16
code:
  - backend/src/services/calendar_events_sync.service.js
  - backend/src/services/google_calendar.service.js
tests:
  - backend/test/calendar_events_sync.test.js
-->

---
### Requirement: Non-recoverable sync errors are surfaced as failed

When pushing an event to Google Calendar fails for any reason other than the linked event being gone (404/410), the system SHALL propagate the error to the caller, SHALL mark the local event's `google_sync_failed = true`, and SHALL leave the existing `google_event_id` unchanged so a later resync can retry against the same id.

#### Scenario: Transient error leaves the stored Google event id untouched

- **WHEN** patching a local event whose `google_event_id = 'old-abc'` fails with HTTP 500
- **THEN** the system SHALL mark the local event's `google_sync_failed = true`
- **THEN** the local record's `google_event_id` SHALL remain `'old-abc'`


<!-- @trace
source: fix-calendar-sync-stale-google-event
updated: 2026-07-16
code:
  - backend/src/services/calendar_events_sync.service.js
tests:
  - backend/test/calendar_events_sync.test.js
-->

---
### Requirement: Manual resync reuses the same push behavior

When a user triggers a manual resync for a local event, the system SHALL apply the same patch-then-fallback behavior used for automatic updates, including the 404/410 fallback to creating a new Google event.

#### Scenario: Resync recovers from a stale linked event

- **WHEN** a user triggers resync for a local event whose `google_event_id = 'old-abc'` no longer exists on Google (HTTP 404)
- **THEN** the system SHALL create a new Google Calendar event and persist its id as the local event's `google_event_id`
- **THEN** the resync result SHALL indicate success

<!-- @trace
source: fix-calendar-sync-stale-google-event
updated: 2026-07-16
code:
  - backend/src/services/calendar_events_sync.service.js
tests:
  - backend/test/calendar_events_sync.test.js
-->