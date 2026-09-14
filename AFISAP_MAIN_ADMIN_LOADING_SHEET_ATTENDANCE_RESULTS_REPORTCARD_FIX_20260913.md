# AFISAP Main Admin Surgical Fix — 13 September 2026

This package uses the supplied `AFISAP_MAIN_ADMIN_STUDENTS_STAFF_ATTENDANCE_LOADING_SURGICAL_FIX_20260913(2).zip` as the exact baseline.

## Scope locked
- Teacher Portal folder was not modified.
- Parent Portal was not modified.
- No redesign or broad refactor was performed.

## Main Admin changes only

### 1. Teacher Attendance print preview passport photos
- The print preview now resolves each teacher/staff passport photo from the permanent Google Drive File ID.
- It retrieves the image bytes through the existing authenticated `driveGet` path before creating the print rows.
- Raw teacher names/text are no longer used as the print-photo source.

### 2. School Setup save
- Added the existing AFISAP loading-logo/progress overlay while saving.
- School Setup now saves to the Google Sheets `System Settings` sheet as the authoritative `AFISAP_CONFIG` row.
- Script Properties are retained only as a compatibility mirror/fallback.
- The success message now states that the record was saved to Google Sheets.
- No new System Settings columns are created. The backend accepts common existing ID/value header names and fails safely if the sheet does not contain a usable ID + value pair.

### 3. Admin Results & Marks — Delete Result
- Added loading/deleting progress while deleting an official result.
- Existing Google Sheets deletion and position recalculation remain intact.

### 4. Report Cards — Save Report Card Dates
- Added loading/saving progress while writing Vacation Date and Opening Date to `Academic Settings` in Google Sheets.

### 5. Admin Student Attendance — Save Attendance
- Replaced one HTTP request per student with one authenticated `saveStudentAttendanceBatch` request.
- Existing rows are updated and new rows are written in a single backend operation.
- Removed the unnecessary full-system cloud reload after every attendance save.
- Added loading/saving progress.
- Google Sheets remains the authoritative storage source.

### 6. Admin Student Attendance — Edit Attendance Days
- Added loading/updating progress.
- Removed the unnecessary full-system cloud reload after the Google Sheets update.
- The confirmed Report Days marker is updated immediately in the current admin state after Google Sheets succeeds.

## Backend deployment
`Code.gs` changed. Deploy it as a NEW VERSION of the EXISTING Apps Script Web App and keep the SAME deployment URL.

## Validation
- `node --check app.js` passed.
- `Code.gs` copied to JavaScript and `node --check` passed.
- Teacher Portal files were verified byte-for-byte unchanged from the supplied ZIP.
