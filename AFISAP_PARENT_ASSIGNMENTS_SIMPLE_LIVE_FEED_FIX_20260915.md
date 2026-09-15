# AFISAP Parent Assignments Simple Live Feed — 15 September 2026

## Scope
Surgical change only to Teacher Assignment → Parent Portal communication. No Admin, Students, Fees, Results, Attendance, Report Cards, Promotion, Teacher assignments/classes, or other modules were redesigned.

## Changes
- Removed Class and Subject filters from the Parent Portal Assignments view.
- Every published Assignment is now returned to the Parent Portal feed, while its teacher-selected Class, Subject, Posted Date and Due Date remain visible on the assignment card.
- Published Assignment attachments follow the same visibility rule and remain downloadable.
- Parent communication refresh reduced from 15 seconds to 5 seconds.
- Announcement privacy behavior is unchanged: class-specific announcements still require the verified student's class unless they are school-wide.

## Deployment
- `Code.gs` changed: deploy as a NEW VERSION of the EXISTING Web App and keep the SAME deployment URL.
- `parent-portal/parent.js` changed: commit and push through the existing GitHub repository.
