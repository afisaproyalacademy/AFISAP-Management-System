# AFISAP Parent Communication + Attachment Download Surgical Fix

## Scope
Only the Parent Portal communication read path and published-attachment download behavior were changed.

## Root cause
Teacher posts are stored as `Target Audience = Specific Class`. The Parent Portal home/Announcements/Assignments feed is intentionally public before attendance verification, but the backend was filtering Specific Class rows unless a verified parent attendance session supplied a class. As a result, teacher-published rows were correctly saved in Google Sheets but hidden from the normal Parent Portal feed.

## Fix
- Parent Portal `announcements` now returns all rows whose Status is Published.
- Existing Class and Subject metadata remain intact, so Assignment filters still work.
- Attachment access remains restricted to file IDs that are referenced by an actual Published Announcements & Assignments row.
- Parent Portal attachment action now downloads the file using its real file name rather than only opening a temporary browser preview.

## Not changed
Teacher publishing, Results, Fees, Attendance, Report Cards, login/session logic, Admin Portal, and Google Sheets schemas were not rebuilt or redesigned.

## Deployment
`Code.gs` changed. Deploy it as a NEW VERSION of the EXISTING Web App and keep the SAME deployment URL. Upload/use the updated Parent Portal `parent.js` as well.
