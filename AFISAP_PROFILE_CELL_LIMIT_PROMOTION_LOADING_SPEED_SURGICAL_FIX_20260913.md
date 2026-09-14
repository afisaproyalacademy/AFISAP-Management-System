# AFISAP Teacher Profile Cell-Limit + Promotion Loading/Speed Surgical Fix — 2026-09-13

## Scope
Only two areas were changed:
1. Teacher Portal → Update Personal Profile
2. Teacher Portal → Classes & Subjects → Student Promotion & Demotion

No changes were made to Fees, Attendance, Results & Marks, Report Cards, post deletion, Parent Portal communication, or login persistence.

## Teacher profile save fix
The production workbook is already close to the Google Sheets 10,000,000-cell limit. The previous profile save attempted to add missing Teacher Profile columns to the `Teachers` sheet. This triggered the safety error before the profile could save.

The corrected implementation does not add any rows or columns for teacher profile saving.
- Existing `Teachers` columns are updated in one row write when those columns already exist.
- Extra editable profile values whose columns do not exist are stored in Apps Script Script Properties, keyed by Staff ID.
- Profile reads merge the existing Teachers row with those stored profile-only values.
- Protected employment/assignment fields remain controlled by the Admin Teachers record.

This avoids increasing workbook allocated cells and removes the cell-limit failure.

## Promotion loading and speed
The existing confirmation and security checks remain in place.
- Clicking `PROMOTE ENTIRE CLASS` or `PROMOTE SELECTED STUDENTS` now displays the AFISAP loading overlay.
- Progress displays 10%, 20%, ... 90%, then 100% only after Google Sheets confirms the promotion.
- The backend replaces the old repeated per-cell promotion writes with batched RangeList writes.
- Roll No. / No. on Roll recalculation for promotion is written in column batches instead of repeated individual cell writes.
- The Teacher Portal no longer performs an unnecessary full `refreshData()` immediately after a successful promotion; the local roster is updated and the Classes view is re-rendered immediately.

## Deployment
`Code.gs` changed and must be deployed as a NEW VERSION of the EXISTING Web App while keeping the SAME deployment URL.
The updated `teacher-portal/teacher.js` must also be used.
