# AFISAP Results Save + Teacher Session Persistence Surgical Fix — 2026-09-13

## Scope
Only the two requested areas were changed:
1. Teacher Portal → Results & Marks save/display flow.
2. Teacher Portal authenticated session persistence across refreshes.

No changes were made to Fees, Attendance, Announcements/Post Delete, Profile, Promotion, Parent Portal, Report Cards layout, Admin UI, or unrelated modules.

## Results & Marks correction
- Fixed the Teacher Portal results read endpoint so Results & Marks follows the same class-level authorization already used by result saving.
- Removed the old assigned-subject-only read filter that could hide successfully saved subjects from `My Class Results`.
- Result save now returns the exact authoritative record written to Google Sheets plus recalculated positions.
- The Teacher Portal merges that confirmed result immediately into `state.results`, so the row appears at once in the bottom `My Class Results` table.
- A quiet background reconciliation with Google Sheets still runs after the visible save, but it no longer blocks the teacher or produces the false "saved but could not be confirmed" warning.
- Added AFISAP result-save loading overlay with logo and 10% → 100% progress while the Google Sheets write is taking place.

## Teacher login refresh persistence
- Existing browser token storage in `localStorage` was retained.
- Teacher server sessions now use a 30-day sliding lifetime instead of the generic 30-minute lifetime.
- Every authenticated teacher request renews that 30-day window.
- Clicking Sign Out still immediately deletes the browser token and revokes the exact server-side session.
- Admin and Parent session lifetimes were not changed.

## Deployment
`Code.gs` changed. Deploy it as a NEW VERSION of the EXISTING Apps Script Web App and keep the SAME deployment URL.
Use the updated `teacher-portal/teacher.js` from this ZIP.
