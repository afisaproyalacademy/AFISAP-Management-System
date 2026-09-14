# AFISAP Teacher Portal — Progress First, Then Load Teacher Data

## Correction made
The previous version used a 6-second ceiling while the Teacher Portal was still authenticating and loading the teacher's data. That could produce the error:

`Sign in could not complete within 6 seconds. Please check the connection and try again.`

even when the username and password were correct and the backend simply needed more time to return the teacher's records.

The sign-in flow is now:

1. 10%
2. 20%
3. 30%
4. 40%
5. 50%
6. 60%
7. 70%
8. 80%
9. 90%
10. 100%
11. Then the real Apps Script authentication begins.
12. After authentication succeeds, the Teacher Portal loads the authenticated teacher's data.
13. The dashboard opens as soon as the data is ready.

There is no artificial extra delay after 100%.

The only remaining time control is an 11-second safety ceiling for a truly stalled network request, so the portal does not freeze indefinitely. If the server responds sooner, the dashboard opens immediately.

## Validation
{
  "teacher-portal/teacher.js": true,
  "app.js": true,
  "parent-portal/parent.js": true,
  "Code.gs": true
}

Checks:
{
  "Progress completes before auth starts": true,
  "Shows 100 before data load": true,
  "No 6 second timeout text": true,
  "11 second safety ceiling exists": true,
  "Real auth still required": true,
  "Dashboard data still loaded after auth": true,
  "Fresh cache-busting build": true
}

No live deployed browser/Apps Script test was performed here.
