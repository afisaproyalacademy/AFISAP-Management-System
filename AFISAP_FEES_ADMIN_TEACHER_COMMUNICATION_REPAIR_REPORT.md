# AFISAP Fees Admin → Teacher Portal Communication Repair

Date: 12 September 2026
Scope: Fees & Textbooks communication only.

## ROOT CAUSE
The latest source already used the same Google Sheets `Fees` sheet for Admin and Teacher Portal, and the Teacher Portal already used the dedicated authenticated `type="fees"` endpoint. The remaining record-loss point was filtering compatibility, not a second database.

A fee could be successfully saved by Admin and canonicalized from the `Fees` sheet, but then be excluded in the Teacher path by strict formatting comparisons. In particular, Academic Year used exact string equality (`fy !== year`), and class authorization/filtering used only trim + lowercase. Values such as `2026/2027` versus `2026 - 2027`, or `Class 4A` versus `Class 4 A`, could therefore reject an otherwise valid authorized fee. Student matching already had ID → Admission Number → unique name compatibility, but there was no administrator-only count diagnostic to show where unmatched rows were being rejected.

## WHERE THE RECORD WAS BEING LOST
`teacherPortalGet(request)` → `type === "fees"` after `teacherPortalFinancialBundle()` had read/canonicalized the Fees sheet. A valid fee could be removed by strict year/class comparisons before it reached `state.fees`. The Teacher frontend also used strict Academic Year comparison in `teacherFeePeriodMatches()`, creating a second opportunity to hide a valid returned row.

## ADMIN SAVE
No new Admin fee store was introduced. Existing Admin create/update/delete continues to write the existing `Fees` sheet through the authenticated Apps Script backend. Existing canonical header mapping and duplicate protection were preserved.

## GOOGLE SHEETS
The existing `Fees` sheet remains the only financial source of truth. No sheet and no column was created. Existing aliases are still canonicalized through `afisapFeeCanonicalObject()` and written through `afisapFeeValueForHeader()`.

## TEACHER API
`teacherPortalGet(type="fees")` remains an authenticated POST endpoint. It reads `teacherPortalFinancialBundle()`, which reads the existing `Fees` sheet and returns only records resolved to students authorized for the authenticated teacher.

## STUDENT MATCHING
`afisapFeeStudentLink()` remains: Student ID first, then unique Admission Number, then unique exact normalized Student Name, then unique reordered-name compatibility. Ambiguous names are not matched. Stored Student IDs are not rewritten in Google Sheets; the canonical authorized Student ID is applied only to the returned Teacher Portal object for historical compatibility.

## YEAR / TERM FILTER
Added `teacherPortalAcademicYearKey_()` on the server and `teacherFeeYearKey()` in Teacher Portal. Common formatting differences such as `2026/2027` and `2026 - 2027` now compare consistently. Existing Term normalization remains in place for `Term 1`, `Term1`, `term 1`, etc.

## CLASS FILTER
Added/used normalized class keys for the Fees authorization path so harmless spacing/case/punctuation differences do not reject an authorized class. Authorization still comes from the authenticated teacher assignment and Students sheet, not from a fee row's class value.

## FRONTEND FILTER
`renderFees()` remains read-only and filters only the server-authorized roster. `teacherFeePeriodMatches()` now uses normalized Academic Year comparison. `refreshTeacherFinancialData()` still calls the dedicated `fees` endpoint and replaces `state.fees` with the confirmed backend response.

## SAFE ADMIN DIAGNOSTIC
Added administrator-only action `feesCommunicationDiagnostic`. It accepts a Staff ID and returns counts only: Fees rows found, authorized students, rows with Student ID, successfully matched rows, Student-ID mismatch rejects, and unresolved rejects. It does not return passwords, tokens, fee values, or other teachers' records.

## FILES / FUNCTIONS CHANGED
1. `Code.gs`
   - `afisapDispatchPost_()` — registered administrator-only `feesCommunicationDiagnostic`.
   - `teacherPortalAllowedClass()` — safe normalized class comparison.
   - `teacherPortalGet()` Fees branch — normalized class and Academic Year comparisons.
   - Added `teacherPortalAcademicYearKey_()` and `teacherPortalClassKey_()`.
   - Added `afisapFeesCommunicationDiagnostic()`.
2. `teacher-portal/teacher.js`
   - `teacherFeeClassKey()` — normalized class comparison.
   - Added `teacherFeeYearKey()`.
   - `teacherFeePeriodMatches()` — normalized Academic Year comparison.

No unrelated module source was intentionally changed.

## VALIDATION PERFORMED
- `node --check app.js` passed.
- `node --check teacher-portal/teacher.js` passed.
- `Code.gs` parsed successfully under Node syntax checking after copying to a `.js` filename.
- Static data-flow audit confirmed Admin and Teacher use the same Apps Script / `Fees` sheet and Teacher Fees remains lazy-loaded/read-only.

A live production Google Sheets test was NOT possible in this local environment because it does not possess the deployed Apps Script sessions or production Google authorization. Therefore the exact live Tests A–G must be run after deploying this source as a new version of the existing Web App deployment (same deployment/backend, not a second deployment).

## REQUIRED DATA FLOW AFTER REPAIR
Admin fee saved → existing Google Sheets `Fees` → authenticated Teacher Portal `type="fees"` → authorized student resolved → normalized year/term/class checks → canonical fee returned → `state.fees` replaced → `renderFees()` displays the fee.
