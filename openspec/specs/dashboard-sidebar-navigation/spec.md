# dashboard-sidebar-navigation Specification

## Purpose

TBD - created by archiving change 'fix-dashboard-sidebar-undefined-route'. Update Purpose after archive.

## Requirements

### Requirement: Sidebar items render according to route availability

The dashboard sidebar SHALL retain only configured navigation items in its menu data and SHALL render an item as a RouterLink only when the item provides a valid route target. The rendering fallback for an item without a route target SHALL remain non-interactive and SHALL NOT receive active-state styling.

#### Scenario: Item with a route target

- **WHEN** a dashboard sidebar item provides a valid `to` string
- **THEN** the item is rendered as a RouterLink that preserves its existing destination, icon, and active-state behavior

#### Scenario: Unconfigured placeholder items

- **WHEN** the dashboard sidebar menu is rendered
- **THEN** the unconfigured "通知中心" and "設定" placeholder items are absent
- **AND** their icon imports are not retained by DashboardSidebar

#### Scenario: Defensive rendering for an item without a route target

- **WHEN** a future dashboard sidebar item does not provide `to`
- **THEN** the item is rendered as a non-link element
- **AND** it does not navigate, receive active-state styling, or pass an undefined target to Vue Router


<!-- @trace
source: fix-dashboard-sidebar-undefined-route
updated: 2026-07-09
code:
  - src/data/medicalRecords.js
  - src/components/layout/DashboardSidebar.vue
  - src/data/pets.js
  - src/data/growthRecords.js
  - src/data/calendarEvents.js
  - src/data/user.js
-->

---
### Requirement: Unreferenced mock modules are absent

The frontend SHALL NOT retain the calendarEvents, growthRecords, medicalRecords, pets, or user mock data modules when no project code references them. Mock hospital data that remains referenced SHALL be retained.

#### Scenario: Production build after mock cleanup

- **WHEN** the five unreferenced mock modules are removed
- **THEN** no project import references those modules or their exports
- **AND** the production frontend build completes successfully

<!-- @trace
source: fix-dashboard-sidebar-undefined-route
updated: 2026-07-09
code:
  - src/data/medicalRecords.js
  - src/components/layout/DashboardSidebar.vue
  - src/data/pets.js
  - src/data/growthRecords.js
  - src/data/calendarEvents.js
  - src/data/user.js
-->