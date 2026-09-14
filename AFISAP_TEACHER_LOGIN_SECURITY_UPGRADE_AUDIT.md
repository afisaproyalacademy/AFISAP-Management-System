# AFISAP Royal Academy — Final Teacher Portal Login Security Upgrade Audit

## Requested architecture
Admin creates Username + Password → Apps Script verifies → server-side teacher session → correct authorized Teacher Dashboard.

## Changes completed
- Replaced Teacher Staff-ID login with **Username + Password** only.
- Removed teacher First-Time Setup and teacher-created/reset/change-password paths.
- Added Admin-only Teacher Portal Login controls inside Edit Teacher / Staff: username, password, confirm password, show/hide, create/update credentials, reset password, enable/disable login, and status.
- Added unique username enforcement on the Apps Script backend.
- Added strong password rules (minimum 8 characters with uppercase, lowercase, number and special character).
- Passwords are salted and iteratively hashed; plaintext passwords are not stored in frontend/session/local storage.
- Credential fields are linked to the existing Teachers sheet and existing Staff ID; no second teacher database was created.
- Added failed-login tracking and temporary lockout.
- Password reset and login disable invalidate existing teacher sessions.
- Every authenticated Teacher Portal request derives Staff ID from the server-side session and rechecks account/login status. Request-supplied Staff ID cannot switch identity.
- Teacher selector is not part of the production login.
- Existing teacher data authorization remains server-side; Fees remain read-only.

## Static security assertions
- PASS — Teacher login accepts username
- PASS — Teacher login does not accept Staff ID as credential
- PASS — Backend username uniqueness
- PASS — Strong password validation
- PASS — Salted password hash fields
- PASS — Server-side failed-login lockout
- PASS — Admin can disable login
- PASS — Password reset invalidates sessions
- PASS — Teacher identity overwritten from server session
- PASS — Teacher frontend has no selector
- PASS — Teacher frontend has no first-time setup
- PASS — No plaintext password persistence
- PASS — No public Drive sharing

## Persistence/security scan
```json
{
  "Code.gs": {
    "localStorage": 0,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  },
  "app.js": {
    "localStorage": 1,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  },
  "teacher-portal/teacher.js": {
    "localStorage": 0,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  },
  "teacher-portal/index.html": {
    "localStorage": 0,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  },
  "teacher-portal/teacher.css": {
    "localStorage": 0,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  },
  "parent-portal/parent.js": {
    "localStorage": 0,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  },
  "index.html": {
    "localStorage": 0,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  },
  "parent-portal/index.html": {
    "localStorage": 0,
    "password_to_local_or_session": 0,
    "teacher_first_time_setup": 0,
    "anyone_with_link": 0,
    "setSharing": 0
  }
}
```

## Tests actually performed locally
- `node --check` passed for `app.js`, `teacher-portal/teacher.js`, `parent-portal/parent.js`, and a JavaScript copy of `Code.gs`.
- Static route/authorization inspection covered changed Staff ID/teacher identity, username uniqueness, session-bound identity, password reset invalidation, disabled-account handling, and teacher write authorization.
- Confirmed no active Teacher first-time setup route/UI remains.
- Confirmed no password is written to localStorage/sessionStorage/cookies/URL parameters by the active Teacher login flow.
- Confirmed no `ANYONE_WITH_LINK`/`setSharing()` was introduced.

## Live tests still required
The ZIP cannot prove deployed Apps Script behavior. After replacing `Code.gs` and redeploying the **existing Web App deployment as a new version using the same URL**, test: correct username/password; wrong password; wrong username; Admin reset (old password fails/new password works); disable/enable login; refresh; logout/back button; Teacher A attempting Teacher B Staff ID/class/student access; live Google Sheets header creation and writes; cross-device sessions; Apps Script POST/redirect response behavior.

No live Google Sheets, Google Drive, Apps Script, multi-device, or production authentication test is claimed in this report.
