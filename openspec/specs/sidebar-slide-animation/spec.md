# sidebar-slide-animation Specification

## Purpose

TBD - created by archiving change 'fix-sidebar-slide-animation'. Update Purpose after archive.

## Requirements

### Requirement: Sidebar panels slide in and out on open/close

On mobile and tablet viewports, both the public sidebar (PublicSidebar) and the member sidebar (DashboardSidebar mobile section) SHALL animate their panel with a horizontal slide transition when opened or closed, driven by the shared `sidebarStore.isOpen` state. The animated panel SHALL be the actual width-bearing `<aside>` element, not a wrapper without width.

#### Scenario: Opening the public sidebar on mobile

- **WHEN** an unauthenticated user on a mobile/tablet viewport clicks the menu toggle button
- **THEN** the PublicSidebar `<aside>` panel slides in from the right edge over 0.3s using an ease timing function, transitioning from `translateX(100%)` to `translateX(0)`

#### Scenario: Closing the public sidebar on mobile

- **WHEN** an unauthenticated user closes the open PublicSidebar (via close button or overlay click)
- **THEN** the PublicSidebar `<aside>` panel slides out to the right edge over 0.3s, transitioning from `translateX(0)` to `translateX(100%)`, and is then removed from the DOM

#### Scenario: Opening the member sidebar on mobile

- **WHEN** an authenticated user on a mobile/tablet viewport clicks the menu toggle button
- **THEN** the DashboardSidebar mobile `<aside>` panel slides in from the right edge over 0.3s, matching the same transform and timing used by PublicSidebar

#### Scenario: Closing the member sidebar on mobile

- **WHEN** an authenticated user closes the open DashboardSidebar mobile panel (via close button or overlay click)
- **THEN** the DashboardSidebar mobile `<aside>` panel slides out to the right edge over 0.3s and is then removed from the DOM

#### Scenario: Overlay has no slide animation

- **WHEN** either sidebar is opened or closed on mobile/tablet
- **THEN** the background overlay appears/disappears immediately without a transform transition, independent of the `<aside>` panel's slide animation

#### Scenario: Overlay visual weight is consistent between sidebars

- **WHEN** either PublicSidebar or DashboardSidebar is opened on mobile/tablet
- **THEN** the background overlay renders with `bg-black/50`, producing the same visible darkening effect regardless of which sidebar is open

#### Scenario: Desktop sidebar is unaffected

- **WHEN** the viewport is at `lg` breakpoint or wider
- **THEN** the DashboardSidebar desktop `<aside>` (rendered when `showDesktop` is true) SHALL render and behave exactly as before this change, with no slide transition applied

<!-- @trace
source: fix-sidebar-slide-animation
updated: 2026-07-17
code:
  - src/components/layout/AppHeader.vue
  - src/components/layout/PublicSidebar.vue
  - src/components/layout/DashboardSidebar.vue
-->