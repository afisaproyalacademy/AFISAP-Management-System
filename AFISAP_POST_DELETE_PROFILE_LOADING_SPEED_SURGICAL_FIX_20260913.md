# AFISAP Teacher Portal — Surgical Post Delete + Profile Save Loading/Speed Fix

Baseline: AFISAP_PARENT_COMMUNICATION_DOWNLOAD_SURGICAL_FIX_20260912(2).zip

## Changes only
- Added Delete Post button to each Teacher Portal My Posts card.
- Added backend `deletepost` action with ownership verification by Staff ID.
- Deletes the exact row from `Announcements & Assignments`; Parent Portal no longer sees it because both portals read the same sheet.
- Added AFISAP 10% → 100% loading overlay while deleting.
- Added AFISAP 10% → 100% loading overlay to SAVE PROFILE.
- Profile save now writes the teacher row once instead of many individual cell writes.
- Removed the extra profile reload after a successful save; the backend returns the updated profile in the same response.

## Intentionally untouched
Fees, Attendance, Results & Marks, Report Cards, Students, Parent Portal layout, login/session persistence and unrelated Admin modules.

## Deployment
Deploy the included Code.gs as a NEW VERSION of the EXISTING Apps Script Web App, keeping the SAME deployment URL.
