# AFISAP Teacher Portal — Refresh Session Persistence Surgical Fix

## Scope
Only `teacher-portal/teacher.js` was changed. No Fees, Results, Students, Report Cards, Admin, Google Sheets, or Apps Script backend logic was rebuilt or altered.

## Root cause
The Teacher Portal stored its authentication token only in `sessionStorage`. The portal also forced the logged-out UI at the start of every boot before validating any saved token. This could make a refresh return the teacher to the login screen, especially when the portal is opened from local/extracted files where session storage behavior can be unreliable.

## Surgical correction
1. Teacher token storage now uses `localStorage` as the persistent browser-side store, with `sessionStorage` retained as a compatibility fallback.
2. Existing sessionStorage tokens are automatically migrated to localStorage.
3. Refresh boot checks the saved token before forcing the login screen.
4. A valid server session restores the authenticated shell automatically.
5. Temporary network errors no longer immediately erase the saved token.
6. Explicit Logout still removes the token from both stores and revokes the server session.

## Backend
No `Code.gs` deployment is required for this UI-only correction. The existing secure server-side session validation remains unchanged.
