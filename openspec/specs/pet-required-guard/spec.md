# pet-required-guard Specification

## Purpose

TBD - created by archiving change 'dashboard-pet-widget-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Pet existence check before creating records

The system SHALL verify that the logged-in member has at least one pet before opening the calendar event creation modal, the medical record creation modal, or the growth record creation modal. If the member has zero pets, the system SHALL NOT open the creation modal and SHALL display an error-styled toast notification instructing the member to add a pet first.

#### Scenario: Member with no pets tries to add a calendar event on the Dashboard page

- **WHEN** a member with zero pets clicks any calendar "add event" trigger on the Dashboard page (calendar grid add button, event list add button, or day-events-modal add button)
- **THEN** the system SHALL NOT open the add-event modal
- **AND** the system SHALL show a toast notification telling the member to add a pet first
- **AND** the system SHALL NOT navigate away from the Dashboard page

#### Scenario: Member with no pets tries to add a medical record

- **WHEN** a member with zero pets clicks "新增紀錄" or the empty-state "立即新增第一筆紀錄" button on the Medical page
- **THEN** the system SHALL NOT open the medical record modal
- **AND** the system SHALL show a toast notification telling the member to add a pet first
- **AND** the system SHALL navigate the member to the Dashboard page

#### Scenario: Member with no pets tries to add a growth record

- **WHEN** a member with zero pets clicks the add-growth-record button or the chart card's add-record trigger on the Growth page
- **THEN** the system SHALL NOT open the growth record modal
- **AND** the system SHALL show a toast notification telling the member to add a pet first
- **AND** the system SHALL navigate the member to the Dashboard page

#### Scenario: Member with at least one pet adds a record

- **WHEN** a member who has at least one pet triggers any of the three creation entry points (calendar event, medical record, growth record)
- **THEN** the system SHALL open the corresponding creation modal exactly as it does today
- **AND** the system SHALL NOT show the "add a pet first" toast
- **AND** the system SHALL NOT force a navigation

<!-- @trace
source: dashboard-pet-widget-redesign
updated: 2026-07-15
code:
  - src/views/GrowthView.vue
  - src/views/MedicalView.vue
  - src/views/DashboardView.vue
  - src/composables/useRequirePet.js
  - src/components/pet/AddPetButton.vue
  - src/components/layout/AppFooter.vue
  - src/components/pet/PetCard.vue
tests:
  - src/test/petCardMetaAlignment.test.js
  - src/test/petCardThemeColors.test.js
  - src/test/useRequirePet.test.js
  - src/test/petCardWidth.test.js
  - src/test/PetProfileModal.test.js
  - src/test/petCardPawTheme.test.js
-->