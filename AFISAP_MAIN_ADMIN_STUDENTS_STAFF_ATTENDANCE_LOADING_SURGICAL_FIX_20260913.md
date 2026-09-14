# AFISAP Main Admin Surgical Fix — 2026-09-13

Scope: Main Admin System only. Teacher Portal is locked and unchanged.

Changes:
- Students: stable Edit/Delete actions using Student ID; update/delete confirmed against Google Sheets before UI changes; loading indicator added; Admission Date normalized to YYYY-MM-DD.
- Teachers & Staff: faster add/edit flow; loading indicator retained/added; full all-module reload removed after confirmed update; Appointment Date written to Teachers sheet; passport Drive File ID is saved in Teachers sheet so photos survive refresh/device changes.
- Teacher Attendance: one batch Google Sheets save request replaces one request per teacher plus a full-system reload; loading indicator added; selected-date attendance can be deleted from Google Sheets; staff photos are rehydrated from their permanent Drive File IDs.
- Google Sheets remains authoritative; no new localStorage data persistence was introduced.
- Code.gs adds only the admin-only saveTeacherAttendanceBatch endpoint.

Validation:
- app.js Node syntax check: PASS
- Code.gs JavaScript syntax check: PASS
- teacher-portal directory checksum unchanged from the supplied baseline.
