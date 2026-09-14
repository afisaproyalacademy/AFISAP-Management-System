# AFISAP Teacher Portal — Post-Login Disabled Bug Fix

## Exact root cause found
The username/password authentication itself was succeeding correctly.

That is why the Teacher Portal first displayed a loading/signing-in message.

Immediately afterwards, the Teacher Portal requested the authenticated teacher data through `teacherPortalGet`. The protected-route dispatcher still contained an older security check that tried to read:

`Teachers -> Portal Login Enabled`

from the Google Sheet.

But the previous cell-limit fix intentionally stopped creating those Teacher Portal security columns because the workbook is already at the Google Sheets 10,000,000-cell allocation limit.

Therefore the dispatcher read a blank/nonexistent `Portal Login Enabled` value and interpreted the account as disabled. It invalidated the valid Teacher session a few seconds after successful login.

## Correction made
The protected Teacher Portal API gate now uses the **same Script Properties credential record** as:
- teacher username/password login;
- Teacher session-status verification;
- Admin Teacher Portal credential controls.

The authorization flow is now consistent:

Admin-created credentials -> Script Properties login record -> successful username/password verification -> Teacher session -> protected Teacher Portal data request -> same login record checked -> dashboard loads.

The existing Teachers sheet remains the source for Staff ID, teacher identity, class, subject, status, profile and school records.

The portal login/security metadata remains in Script Properties to avoid adding columns to the nearly-full workbook.

An actually disabled login or an actually inactive teacher/staff record is still denied.

## Static validation
Syntax:
{
  "app.js": true,
  "teacher-portal/teacher.js": true,
  "parent-portal/parent.js": true,
  "Code.gs": true
}

Checks:
{
  "Login endpoint uses Script Properties enabled state": true,
  "Session-status endpoint uses Script Properties enabled state": true,
  "Protected Teacher API route uses Script Properties enabled state": true,
  "Protected Teacher API route no longer checks Teachers-sheet Portal Login Enabled": true,
  "Teacher identity remains server-session authoritative": true,
  "No new Teacher security columns": true,
  "No public Drive sharing": true,
  "No active localStorage permanent DB calls": true
}

No live deployed Apps Script/Google Sheets browser login was performed here.
