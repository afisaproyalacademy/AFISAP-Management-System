# AFISAP Teacher Portal Attendance — Loading + Faster Update Surgical Fix

Scope: Teacher Portal Attendance only.

Changes:
- Added the same AFISAP logo loading overlay used by Fees when saving Report Days or OUT OF Days.
- Progress displays 10%, 20%, ... up to 90% while the Google Sheets save is in progress, then 100% after the save succeeds.
- After the authoritative Apps Script save succeeds, the successful value is reflected immediately in the current Attendance page instead of forcing a full Attendance re-download first. This removes the avoidable extra wait while preserving Google Sheets as the source of truth.
- Existing Attendance calculations, normal daily attendance saving, Report Cards, Fees, Results, login/session, Admin and other modules were not redesigned or changed.

Deployment:
- No Code.gs change in this surgical fix.
- Replace/use the updated teacher-portal files from this ZIP.
