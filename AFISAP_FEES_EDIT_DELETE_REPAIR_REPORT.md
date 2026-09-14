# AFISAP Fees & Textbooks — Simplification + Edit/Delete Repair

## Requested simplification
Removed these two display sections from Admin → Fees & Textbooks:
- Official Academic & Other Fee Reference
- Official Textbook Reference

The fee assignment/payment functions remain available. No stored fee records were removed by this UI cleanup.

## Edit repair
The Admin edit flow now sends the authoritative Fees sheet row number when available. The Apps Script backend first verifies that exact row and Fee ID, falls back to normalized Fee ID lookup when necessary, writes the updated values to the existing Fees row, recalculates Balance/Status, flushes Google Sheets, reads the row back, and only then reports success.

The configured Fee Item edit flow uses the same exact-row targeting when available.

## Delete repair
Fee deletion now physically deletes the matching row from the existing Google Sheets `Fees` sheet with `deleteRow()` after verifying the requested Fee ID. If the stored sheet-row number is stale, the backend finds the record by normalized Fee ID and deletes that exact row.

The frontend continues to refresh from Google Sheets after confirmed deletion, so the deleted record is removed from the AFISAP interface as well.

## Architecture preserved
- Same Google Sheets Fees sheet
- Same Apps Script Web App
- No new database or sheet
- Teacher Portal unchanged
- Parent Portal unchanged
- No changes to Students, Attendance, Results, Reports, Promotion or Authentication

## Important deployment step
`Code.gs` was modified. Replace the existing Apps Script `Code.gs` with the one in this ZIP and deploy a NEW VERSION of the EXISTING Web App deployment, keeping the SAME deployment URL.

## Validation
- app.js syntax: PASS
- teacher-portal/teacher.js syntax: PASS
- parent-portal/parent.js syntax: PASS
- Code.gs syntax: PASS

Static checks:
{
  "Official Academic & Other Fee Reference removed": true,
  "Official Textbook Reference removed": true,
  "Fee edit sends sheetRow": true,
  "Configured fee edit sends sheetRow": true,
  "Backend fee update exact-row support": true,
  "Backend physically deletes fee rows": true,
  "No Teacher Portal change": true,
  "No Parent Portal change": true
}

Live Google Sheets/browser execution could not be performed in this environment.
