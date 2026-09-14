# AFISAP FINAL SECURITY CORRECTIONS — STATIC AUDIT REPORT

## Scope
Only the supplied ZIP was used: `AFISAP_SECURITY_AUDIT_AUTHORIZATION_HARDENED_FIXED(1).zip`.

No unrelated features were changed.

## Final corrections completed

1. **`driveUpload()` corrected**
   - `viewUrl` and `thumbnailUrl` are now defined from the newly created `fileId`.
   - Duplicate `fileId` in the returned response was removed.

2. **Parent authentication throttling strengthened**
   - Existing per-Student-ID throttle remains.
   - Added a broader Parent Portal authentication throttle so changing Student IDs does not bypass the overall protection.

3. **Teacher throttling strengthened**
   - Existing per-Staff-ID Teacher login and setup throttles remain.
   - Added broader Teacher login and first-time setup throttles.

4. **Expired server sessions cleanup added**
   - Expired/malformed `AFISAP_SESSION_*` Script Properties are removed during session creation and validation.

5. **Sensitive Drive handling rechecked**
   - `ANYONE_WITH_LINK` remains absent.
   - `setSharing()` remains absent.
   - Generic Drive operations remain server-authorized.
   - Managed Drive File ID checks remain active.
   - Sensitive references were reviewed to prefer File IDs rather than direct public URLs.

6. **Authentication transport rechecked**
   - No restoration of GET/JSONP passwords or tokens.
   - Secure POST/session model remains intact.

7. **Persistence re-audit**
   - No active Admin/Teacher/Parent `localStorage` permanent database calls were reintroduced.

## Static IDOR/BOLA tests performed

{
  "Admin generic CRUD requires admin session": true,
  "Teacher identity derives from server session": true,
  "Parent attendance derives Student ID from server session": true,
  "Teacher subject authorization remains enforced": true,
  "Teacher announcement ownership check remains enforced": true,
  "Managed Drive File ID enforcement remains": true,
  "Parent public student enumeration remains blocked": true,
  "Teacher directory remains blocked": true,
  "Fee writes/deletes remain under admin dispatcher": true,
  "Drive generic operations remain admin-only": true
}

Overall static result: **PASS**

The code paths were reviewed against changed:
- Student IDs
- Staff IDs
- Result IDs
- Fee IDs
- Drive File IDs
- Announcement/Post IDs

These are static/code-path tests, not live penetration tests.

## Static security/persistence scan

{
  "app.js": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 9,
    "indexedDB": 0,
    "document_cookie": 0,
    "ANYONE_WITH_LINK": 0,
    "setSharing": 0,
    "no_cors": 0
  },
  "teacher-portal/teacher.js": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 5,
    "indexedDB": 0,
    "document_cookie": 0,
    "ANYONE_WITH_LINK": 0,
    "setSharing": 0,
    "no_cors": 0
  },
  "parent-portal/parent.js": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 3,
    "indexedDB": 0,
    "document_cookie": 0,
    "ANYONE_WITH_LINK": 0,
    "setSharing": 0,
    "no_cors": 0
  },
  "Code.gs": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 0,
    "indexedDB": 0,
    "document_cookie": 0,
    "ANYONE_WITH_LINK": 0,
    "setSharing": 0,
    "no_cors": 0
  },
  "index.html": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 0,
    "indexedDB": 0,
    "document_cookie": 0,
    "ANYONE_WITH_LINK": 0,
    "setSharing": 0,
    "no_cors": 0
  },
  "teacher-portal/index.html": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 0,
    "indexedDB": 0,
    "document_cookie": 0,
    "ANYONE_WITH_LINK": 0,
    "setSharing": 0,
    "no_cors": 0
  },
  "parent-portal/index.html": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 0,
    "indexedDB": 0,
    "document_cookie": 0,
    "ANYONE_WITH_LINK": 0,
    "setSharing": 0,
    "no_cors": 0
  }
}

## Syntax checks actually performed locally

{
  "app.js": true,
  "teacher-portal/teacher.js": true,
  "parent-portal/parent.js": true,
  "Code.gs": true
}

All active JavaScript/Apps Script syntax checks passed.

## Tests that still require live deployment

These were **not** performed from the ZIP and are not claimed:

- deployed Apps Script POST response readability from the real hosting origin;
- redirects/CORS behavior in the real browser;
- real Admin/Teacher/Parent login against live Apps Script;
- MailApp OTP delivery and Google authorization scopes;
- real Google Sheets writes and role restrictions;
- real Drive permissions, especially historical files uploaded before hardening;
- real expiry cleanup over time;
- multi-device session behavior;
- direct live unauthenticated calls to privileged routes;
- real IDOR/BOLA attempts using production Student IDs, Staff IDs, Result IDs, Fee IDs and File IDs;
- live Drive access tests for Ghana Cards, passports, student/staff documents, reports and administrator files.

The next correct step is a controlled deployment test using the existing Apps Script project and existing Web App URL.

## Files changed

- `Code.gs`
