# AFISAP Teacher Fees Root-Cause Surgical Fix — 12 Sep 2026

## Scope inspected
- Admin Fees & Textbooks save/write flow (`app.js`)
- Shared Apps Script Fees reader (`Code.gs`)
- Teacher Portal Fees print flow (`teacher-portal/teacher.js`)
- Working Report Card fee read path

## Root cause 1 — `[object HTMLSelectElement]`
The Teacher Portal used filter element IDs such as `tfYear`, `tfTerm`, `tfClass`, and `tfStudent`, while also storing selected values on `window.tfYear`, `window.tfTerm`, etc.

In browsers, elements with IDs can be exposed automatically as properties on `window`. Therefore `window.tfYear` and `window.tfTerm` could resolve to the actual `<select>` elements instead of strings. Calling `String(window.tfYear)` produced `[object HTMLSelectElement]`.

That bad string was then sent to Apps Script as the requested Academic Year and Term. The backend correctly tried to filter Google Sheets rows using those bad values, which caused the fee record to be filtered out.

### Fix
All Teacher Fees filter values now live in a dedicated `teacherFeeFilters` plain object. The print endpoint receives actual strings such as `2026/2027` and `Term 1`.

## Root cause 2 — duplicate fee-reading logic
The Report Card already displayed the student's fee correctly because it uses `teacherPortalFinancialBundle()`, the canonical teacher-authorized Fees reader. The newer Student Fees print endpoint had separate matching logic. This created two different read paths for the same Google Sheets Fees data.

### Fix
The `studentfees` endpoint now uses the same `teacherPortalFinancialBundle()` path as Report Cards, then filters by the selected student, academic year and term.

## Compatibility protection
The Teacher Portal print function also has a read-only fallback to the existing `reports` endpoint. If an older live Apps Script deployment does not yet support `studentfees`, or returns no rows, the print function reuses the already-proven Report Card fees read path and isolates the selected student.

## Admin Fees findings
The Admin Fees save flow already writes the required canonical fields to the `Fees` sheet, including:
- Fee ID
- Student ID
- Admission Number
- Student Name
- Fee Item
- Amount Due
- Amount Paid
- Balance
- Academic Year
- Term

No destructive changes were made to the working Admin Fees save logic.

## Sections intentionally untouched
- Students
- Teachers & Staff
- Attendance
- Results & Marks
- Report Card layout and fee display
- Parent Portal
- Admin fee item/record editing and deletion
- Google Drive photo system

## Deployment
Deploy the included `Code.gs` as a NEW VERSION of the EXISTING Apps Script Web App and keep the SAME deployment URL. Then use the included updated Teacher Portal files.
