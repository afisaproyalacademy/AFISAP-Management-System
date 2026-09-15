# AFISAP Teacher → Parent Communication Surgical Repair — 15 September 2026

## Scope
Only Teacher Portal announcement/assignment publishing ownership/delete behavior and Parent Portal communication refresh were touched. Admin, Students, Fees, Results, Attendance, Report Cards, Promotion, authentication and unrelated modules were not redesigned or refactored.

## Repairs
- Teacher post deletion now verifies ownership using exact Staff ID boundaries for legacy records.
- The backend deletes the exact shared `Announcements & Assignments` row and verifies that it is gone.
- If Google Sheets refuses a structural row deletion, the backend safely marks the post `Deleted`; Parent and Teacher feeds exclude it immediately.
- Teacher `My Posts` now returns only Published records and reloads from the shared Google Sheet after a delete.
- Parent Portal refreshes the shared communication feed every 15 seconds, so newly published or deleted Teacher/Admin communication appears/disappears without a manual browser refresh.
- No new Google Sheet columns were added.

## Deployment
`Code.gs` changed: deploy it as a NEW VERSION of the EXISTING Web App and keep the SAME deployment URL.
Frontend changed: publish the updated `teacher-portal/teacher.js` and `parent-portal/parent.js` through the existing GitHub repository.
