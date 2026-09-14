# AFISAP Teacher Portal — 30% Freeze Root Fix

## Verified root cause
The current ZIP had the transition overlay marked `hidden` in HTML, but the stylesheet also forced `.teacher-transition-overlay` to `display:grid`.

That meant the overlay could be visible immediately even though the sign-out function had never run. In that state it naturally stayed at the default 30% forever because no progress timers had been started.

## Correction
- Added an explicit CSS rule making `[hidden]` win with `display:none!important`.
- First page open now shows only the normal SIGN IN screen.
- Progress starts at 0% and visibly moves 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%.
- Visual transition is about 4.4–4.8 seconds, under 6 seconds.
- Sign-out cannot wait indefinitely for Apps Script.
- Sign-in still depends on real Apps Script authentication and never fakes success.
- If authentication/dashboard loading cannot complete within the 6-second bound, the login page shows an error rather than freezing.
- Teacher JS/CSS URLs were versioned again to prevent stale cached files.

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
  "Hidden overlay rule present": true,
  "Transition starts at 0%": true,
  "Sign-in progress starts at 0%": true,
  "Progress has 10% steps": true,
  "Sign-out reaches 100%": true,
  "Sign-in reaches 100% only after success": true,
  "Boot hides overlay": true,
  "Fresh build version": true
}

No live deployed browser/Apps Script login was performed.
