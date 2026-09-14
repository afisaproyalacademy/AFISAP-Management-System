# AFISAP Teacher Portal — Performance Fix Implemented

## Changes
- Teacher login now returns the minimal authenticated bootstrap in the same successful login response: teacher identity, profile, school branding, and only the teacher-authorized student roster.
- Results, Attendance, Fees, Announcements & Assignments, and Report Cards are loaded only when their module is opened.
- Teacher profile photograph is fetched asynchronously after the dashboard is rendered instead of blocking dashboard readiness.
- Teacher Portal requests are server-filtered to the authenticated teacher and authorized classes/students.
- Removed the Teacher Portal fallback to the legacy full-data request from the Fees refresh path.
- Session validation no longer scans every Script Property on every request; it validates the requested session key directly, reducing latency as the system grows.
- Existing Admin login, Teacher credentials, permissions, Google Sheets source of truth, and module structure are preserved.

## Validation
- `teacher-portal/teacher.js`: JavaScript syntax check passed.
- `Code.gs`: JavaScript syntax check passed after treating the `.gs` file as JavaScript.

## Intended flow
LOGIN → authenticated teacher identity/profile → authorized roster → dashboard opens → module data loads on demand.
