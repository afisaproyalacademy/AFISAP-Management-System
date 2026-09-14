# AFISAP Fees & Textbooks Surgical Repair Report

Date: 2026-09-12

## Scope
Only Fees & Textbooks frontend behavior was changed. No unrelated module was redesigned or refactored.

## Root causes found
1. Teacher Portal deliberately preserved the previous `state.fees` whenever the backend returned an empty Fees array. That made a confirmed Admin deletion (especially the last matching fee) remain visible indefinitely in Teacher Portal.
2. Admin single-fee save fallback verification called `search` through JSONP/GET, while the current `Code.gs` security dispatcher permits `search` only through authenticated POST. Therefore the fallback verification path could never verify a write against the secured backend.
3. Admin fee-record Edit referenced `saveStatus`, `submitButton`, and `originalSubmitText` without defining them in the edit submit handler. This could throw a JavaScript `ReferenceError` before the Google Sheets update request was made.
4. Fee-record and Fee Item delete actions had no operation-specific confirmation/loading/disabled state.
5. Fee Item edit did not disable its submit control or expose a persistent saving/error state.

## Files changed
- `app.js`
  - Fee record add: authenticated POST verification; clearer loading state.
  - Fee record edit: fixed undefined loading-state variables; disabled button; success/error handling; confirmed refresh.
  - Fee Item create/edit: loading, disabled controls, error/success state.
  - Fee record/Fee Item delete: confirmation, disabled Delete button, deleting state, backend-confirmed deletion before refresh/success.
- `teacher-portal/teacher.js`
  - Fees refresh remains lazy and uses `teacherPortalGet` type `fees`.
  - Removed stale zero-row fallback; backend empty result now correctly clears deleted fees.
  - Refresh button disables during request and shows Refreshing/Success/Error state.

## Backend audit
`Code.gs` was inspected but did not require modification for this repair. Its existing `teacherPortalGet(type='fees')` reads the existing `Fees` sheet, links legacy records where necessary, filters to the authenticated teacher's authorized students on the server, and returns read-only fee data. Admin `createFeeRecordFast`, `update`, `delete`, `read`, and `search` are admin-authenticated POST operations.

## Source of truth
The flow remains:
Admin Fees & Textbooks -> authenticated Google Apps Script -> existing Google Sheets `Fees` sheet -> authenticated Teacher Portal `type='fees'` endpoint.

No second fee database was created. Teacher Portal remains view-only and server-side restricted.

## Lazy loading
Preserved. Teacher login does not preload Fees. Fees are requested only when the teacher opens/refreshes Fees & Textbooks.

## Tests performed locally
- `node --check app.js` passed.
- `node --check teacher-portal/teacher.js` passed.
- Source-flow audit confirmed Teacher Fees uses authenticated POST `teacherPortalGet` with `type='fees'` and the server reads the existing `Fees` sheet.
- Source-flow audit confirmed Admin fee verification now uses authenticated POST instead of blocked GET/JSONP.
- Source-flow audit confirmed an empty backend Fees result replaces `state.fees` rather than retaining stale deleted rows.

## Live test limitation
The exact Admin -> live Google Sheet -> Teacher Portal scenario cannot be truthfully executed from this offline source-code sandbox because it does not have the deployed Apps Script session, production spreadsheet authorization, or a teacher/admin login session. Deploy the included source as a new version of the existing Web App and run the acceptance scenario against the production workbook before treating live synchronization as deployment-verified.
