# google-login-single-init Specification

## Purpose

Defines that Google Identity Services (`google.accounts.id.initialize()`) is initialized exactly once per app session, at application bootstrap, and is never re-triggered by mounting auth UI components (login form, register form), while keeping the Google OAuth login/register flow fully functional.

## Requirements

### Requirement: Google Identity Services initializes exactly once per app session

The system SHALL call `google.accounts.id.initialize()` exactly once per browser session, at application bootstrap. Mounting any auth UI component (login form, register form) SHALL NOT trigger an additional call to `google.accounts.id.initialize()`.

#### Scenario: Visiting the login page does not re-initialize GSI

- **WHEN** a user navigates to `/login` after the app has already bootstrapped
- **THEN** no additional `google.accounts.id.initialize()` call occurs, and the browser console SHALL NOT log a `[GSI_LOGGER]` duplicate-initialization warning

#### Scenario: Visiting the register page does not re-initialize GSI

- **WHEN** a user navigates to `/register` after the app has already bootstrapped
- **THEN** no additional `google.accounts.id.initialize()` call occurs, and the browser console SHALL NOT log a `[GSI_LOGGER]` duplicate-initialization warning

---
### Requirement: Google OAuth login flow remains functional after removing per-component initialization

Triggering the Google login/register button SHALL still complete the OAuth token flow and log the user in, using the client ID registered once at application bootstrap.

#### Scenario: Successful Google login from the login page

- **WHEN** a user clicks "使用 Google 帳戶登入" and completes the Google OAuth popup successfully
- **THEN** the system receives an access token, calls the existing login callback, and navigates the user to `/dashboard`

#### Scenario: Successful Google login from the register page

- **WHEN** a user clicks "使用 Google 帳戶註冊" and completes the Google OAuth popup successfully
- **THEN** the system receives an access token, calls the existing login callback, and navigates the user to `/dashboard`

#### Scenario: User cancels the Google OAuth popup

- **WHEN** a user closes the Google OAuth popup before completing authorization
- **THEN** the system SHALL silently ignore the cancellation without logging an unhandled promise rejection to the console
