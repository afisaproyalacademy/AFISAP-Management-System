# AFISAP Results Loader Center + Teacher Refresh Session Surgical Fix — 2026-09-13

Only the two requested Teacher Portal areas were changed.

## 1. Results & Marks loading position
The Save Result loader used the wrong CSS class (`teacher-fee-print-loader-overlay`) while the fixed centered overlay style is named `teacher-fee-print-loader`. The Result save loader now uses the existing fixed, full-screen centered loader class. No result-save or report-card logic was changed.

## 2. Teacher refresh session behavior
A small authenticated-session snapshot is now cached only after a successful teacher login/data load. On refresh, if the durable teacher token exists, the last authenticated teacher shell is restored immediately while the existing server session is verified. The login form is not flashed during that verification.

The server remains authoritative. If the session is actually invalid, the local token/cache is cleared and the login screen is shown. Temporary network verification failures do not visually log out a teacher who already has a valid cached session.

## Logout
SIGN OUT still clears the durable token and the cached teacher snapshot immediately, removes the saved-session UI marker, clears in-memory teacher data, shows the login screen, and then revokes the server token in the background. Nothing is retained locally to auto-sign the teacher back in after explicit logout.

## Backend
No Code.gs change was required for these two corrections.
