# AFISAP — Teacher Fees Briefly Appearing Then Disappearing — Race Condition Fix

## Root cause found

The disappearing fee was caused by two different Teacher Portal modules sharing the same frontend array:

- Fees & Textbooks used `state.fees`
- Report Cards also wrote its report-specific fee response into `state.fees`

Because Teacher Portal uses asynchronous lazy loading, an older/slower Report Cards request could finish after the dedicated Fees request.

Sequence:

1. Teacher opens Fees & Textbooks.
2. Dedicated `type="fees"` request returns the correct Admin/Google Sheets records.
3. `state.fees` is populated and the fee becomes visible.
4. A previously-started Report Cards request finishes later.
5. That Report Cards response writes its own filtered/empty `r.fees` into the same `state.fees`.
6. The current Fees screen re-renders.
7. The correct fee appears briefly and then disappears.

This was a frontend async race/state-ownership problem, not a need for another database.

## Surgical correction

Modified only `teacher-portal/teacher.js`.

### Separate fee state
- `state.fees` is now owned only by Teacher → Fees & Textbooks.
- Added `state.reportFees` for Report Cards.
- Report Card rendering reads `state.reportFees`.
- Report Card lazy-loading no longer overwrites `state.fees`.

### Navigation race protection
A navigation token now prevents an older asynchronous section request from re-rendering a newer/current section after its request eventually finishes.

### Fee-refresh repaint protection
A completed fee refresh repaints the Fees UI only when the teacher is still on the Fees section.

## Architecture preserved
- Admin remains the financial master.
- Existing Google Sheets `Fees` sheet remains the only source of truth.
- Student ID remains the primary link.
- Teacher financial access remains read-only.
- Same Apps Script endpoint.
- No new database.
- No new sheet.
- No localStorage financial database.
- No fake fee values.
- No changes to Admin, Parent Portal, authentication, Google Sheets schema, or Apps Script backend.

## Deployment
`Code.gs` was NOT changed. No Apps Script redeployment is required for this specific correction.

## Testing performed
Static code inspection confirmed the competing `state.fees` writers.
JavaScript syntax validation passed for the active Admin, Teacher and Parent files.
Apps Script syntax validation passed.
Live Google Sheets/deployed-browser testing was not available in this environment.
