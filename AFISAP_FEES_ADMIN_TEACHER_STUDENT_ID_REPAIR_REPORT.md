# AFISAP Fees Admin → Teacher Communication Repair

## Root communication issue repaired
The financial chain is now enforced around the permanent Student ID. A fee row that already contains a Student ID can no longer be silently reassigned to another student by legacy name/admission matching. Legacy matching is used only for historical fee rows whose Student ID is genuinely blank.

Admin single-fee and bulk-fee writes are now canonicalized against the existing Students sheet before the Fees row is written. This confirms that the Student ID exists and writes the authoritative Student ID/name/admission values into the existing Fees sheet. No second database or new sheet was created.

Teacher `type=fees` remains the lightweight, authenticated, read-only route. `teacherPortalFinancialBundle()` returns only fee rows whose Student ID belongs to the authenticated teacher's authorized roster.

Status is read from an existing Status/Payment Status/Fee Status column when present; otherwise it is derived from the authoritative Due/Paid/Balance values. No Fees column is added.

## Files modified
- `Code.gs`
- `teacher-portal/teacher.js`

Admin `app.js` was inspected but not changed. Existing Admin fee UI/write calls already send Student ID and use the same Fees sheet.

## Deployment
Because `Code.gs` changed, deploy this `Code.gs` as a NEW VERSION of the EXISTING Apps Script Web App while keeping the SAME deployment URL. Do not create a new Apps Script project or database.

## Validation
Syntax: {"app.js": true, "teacher-portal/teacher.js": true, "parent-portal/parent.js": true, "Code.gs": true}
Checks: {"Student ID authoritative when present": true, "Legacy name/admission only when ID blank": true, "Admin single fee validates Students sheet": true, "Bulk fees canonicalized by Student ID": true, "Teacher backend rejects foreign stored IDs": true, "Teacher fees remains dedicated endpoint": true, "Teacher remains read-only": true, "Status canonicalized without new column": true}

Static code-path validation passed. Live Google Sheets/Apps Script/browser testing cannot be executed from this environment.
