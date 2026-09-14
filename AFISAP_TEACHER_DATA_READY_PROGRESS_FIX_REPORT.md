# AFISAP Teacher Portal — Data-Ready Progress Architecture

The Teacher Portal progress is no longer a timer that can finish before the real data is ready.

## Final sign-in architecture

1. Teacher clicks SIGN IN.
2. Real Apps Script authentication starts immediately.
3. The visual progress starts at 10% and moves toward 90%.
4. If authentication is still working, progress continues but never exceeds 90%.
5. After authentication succeeds, the authenticated Teacher Portal data loads.
6. The progress remains at or below 90% until `loadAuthenticatedTeacher()` completes.
7. Only then does the progress finish to 100%.
8. The dashboard opens immediately after 100%.

Therefore, 100% now means the Teacher Dashboard is genuinely ready.

No 6-second, 11-second, or 12-second normal-operation timeout is used.

## Sign-out architecture
The same progress principle is used. Local authenticated access is cleared immediately, the backend logout is attempted, and 100% is reached only when the sign-out transition is ready to return to the login screen.

## Validation
Syntax:
{
  "teacher-portal/teacher.js": true,
  "app.js": true,
  "parent-portal/parent.js": true,
  "Code.gs": true
}

Checks:
{
  "Auth begins immediately": true,
  "Progress capped at 90 before data ready": true,
  "Dashboard data loads before 100": true,
  "100 only after data ready": true,
  "No 6s/11s/12s timeout gates": true,
  "Fresh cache build": true
}

No live deployed Apps Script/browser authentication was performed here.
