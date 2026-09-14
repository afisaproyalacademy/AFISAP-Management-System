# AFISAP ROYAL ACADEMY — COMPLETE SECURITY AUDIT & HARDENING REPORT

**Audit basis:** the supplied ZIP `AFISAP_FULL_PERSISTENCE_AUDIT_AND_CENTRALIZATION_FIXED(1).zip` only.

**Active execution sources confirmed**
- Admin Portal: `index.html → app.js`
- Teacher Portal: `teacher-portal/index.html → teacher-portal/teacher.js`
- Parent Portal: `parent-portal/index.html → parent-portal/parent.js`

Historical JavaScript backup files were reviewed as inactive artifacts and were not treated as live execution sources or deleted.

---

## 1. Executive Summary

The current ZIP still contained several **critical server-side authorization weaknesses** even though it had a working login screen and Google Sheets/Drive integration. The most important problem was architectural: the Apps Script Web App still exposed generic operations through request routing that could be invoked independently of the Admin UI. Browser login state was therefore not a sufficient security boundary.

The hardened version changes the architecture to:

```text
Browser UI
   ↓ HTTPS POST
Apps Script authentication + authorization
   ↓
Google Sheets / Google Drive
```

Privileged operations now require a **server-issued, short-lived, unpredictable session token**. The server validates the token and role before dispatching protected operations. Browser `sessionStorage` holds only the bearer token / temporary UI state; it is never accepted as authorization without server validation.

---

## 2. Vulnerabilities Found and Corrections

| Severity | Vulnerability | Affected file / function | Correction |
|---|---|---|---|
| **CRITICAL** | Generic Apps Script CRUD/bulk/config/Drive routes could be reached independently of the Admin login UI. | `Code.gs` — old `doGet`, `doPost` routing | Replaced routing with authorization-aware POST dispatcher. `read`, `search`, `count`, `create`, `update`, `delete`, fee bulk actions, promotion, config, admin profile and Drive actions require a valid Admin server session. |
| **CRITICAL** | Browser `sessionStorage` login flag could gate the UI but was not a backend authorization mechanism. | `app.js` Admin authentication | Added server-issued Admin session token; every privileged request is validated in Apps Script. Startup validates the token server-side before opening Admin. |
| **HIGH** | Admin password verification/reset architecture allowed credential operations through URL/JSONP patterns. | `app.js`, `Code.gs` legacy `authVerify`, `authSetPassword` | Legacy auth endpoints disabled. Login/reset use POST request bodies. Password reset now uses emailed 6-digit OTP with expiry and attempt limiting. |
| **CRITICAL** | Teacher identity was selectable by Staff ID in the browser, allowing potential teacher impersonation. | `teacher-portal/index.html`, `teacher.js`, `teacherPortalGet/Write` | Removed development Staff ID selector. Added Teacher password authentication and server session. Backend derives Staff ID from the server session and ignores browser identity as authority. |
| **HIGH** | Teacher APIs could expose data outside the teacher's actual subject authorization. | `Code.gs` — `teacherPortalGet`, `teacherPortalAllowedSubject`, `teacherPortalSaveResult` | Teacher data/results now restricted to assigned classes, students and subjects. Empty subject assignment no longer means all subjects. |
| **HIGH** | Teacher could potentially overwrite another teacher's announcement by supplying its ID. | `Code.gs` — `teacherPortalSavePost` | Existing post ownership is checked by Staff ID before update. |
| **HIGH** | Parent attendance could be accessed using Student ID alone; public student enumeration supported discovery. | `parent-portal/parent.js`, `Code.gs` — `parentPortalGet` | Public student directory removed. Attendance now requires Student ID + guardian contact verification and a server-issued Parent session. Attendance Student ID is taken from the session principal, not the request. |
| **CRITICAL** | Sensitive Drive uploads were made `ANYONE_WITH_LINK`. | `Code.gs` — `driveUpload` | Public sharing removed. New sensitive uploads remain private and are retrieved through authorized Apps Script paths. |
| **HIGH** | Drive operations accepted arbitrary File IDs/categories without sufficient ownership boundary. | `Code.gs` — `driveGet`, `driveDelete`, `driveList` | Generic Drive actions are Admin-only; File IDs must resolve beneath the AFISAP managed Drive root; categories are whitelisted. Teacher uploads use role-specific backend operations. |
| **HIGH** | Teacher profile/attachment uploads called generic Drive routes directly from browser. | `teacher.js`, `Code.gs` | Routed through authenticated Teacher Portal write operations with server-selected categories/teacher identity. |
| **HIGH** | Result creation/position synchronization could leave browser and Sheets partially synchronized. | `app.js` — `addResult`, `afisapRecalculateAcademicPositions`; `Code.gs` | Result creation is cloud-first. Position recalculation is a protected server action; failures are reported as incomplete and UI reconciles from Google Sheets. |
| **MEDIUM/HIGH** | Student/Staff/Class creation still had local-first or rollback-oriented remnants. | `app.js` creation flows | Changed primary creation paths to Google Sheets/Drive confirmation first, followed by authoritative re-sync. Staff failure path now reconciles from Sheets instead of deleting a supposed local record. |
| **MEDIUM** | Admin allowed-email list was exposed in active frontend code. | `app.js` | Browser allow-list removed. Authorization is checked only on the server. |
| **MEDIUM** | Public Fees backend probe exposed workbook row/column dimensions. | `Code.gs` — `afisapFeesBackendStatus` | Reduced public response to backend version only. |

---

## 3. Authentication and Session Design

### Administrator
- Authorized email is checked **server-side**.
- Password is submitted in an HTTPS POST body, not JSONP/query string.
- Successful login issues a random server session token.
- Only a SHA-256 digest of the token is stored in Apps Script Script Properties.
- Session lifetime: **30 minutes**, renewed only by validated requests.
- Logout deletes the server-side session.
- Password reset:
  - request by email;
  - random 6-digit verification code;
  - code hash stored server-side;
  - 10-minute expiry;
  - limited attempts;
  - verification code sent using `MailApp`.
- Password records use a salted iterative hash and legacy old hashes are upgraded after a successful login.

### Teacher
- Staff ID alone no longer authenticates.
- First-time setup requires:
  - Staff ID;
  - email matching Teachers sheet;
  - phone matching Teachers sheet;
  - a new password.
- Successful authentication issues a Teacher server session.
- Backend Staff ID comes from the session principal.
- Admin can set/reset or clear a Teacher Portal password from the Teacher/Staff edit interface.

### Parent
- Student ID alone is rejected for private attendance.
- Verification requires Student ID + guardian contact matching the Students record.
- Successful verification issues a Parent session bound to that Student ID.
- Attendance backend ignores any caller-supplied Student ID after login and uses the session principal.

---

## 4. Authorization Matrix

| Operation | Administrator | Teacher | Parent | Unauthenticated |
|---|---|---|---|---|
| Generic Sheets read/search/count | Full authorized access | No generic access | No | No |
| Generic create/update/delete | Full authorized access | No generic access | No | No |
| Students | Full management | Assigned students only through Teacher Portal | Own verified student only where exposed | No private student list |
| Teachers | Full management | Own profile only | No | No |
| Results | Full management | Assigned students/classes/**subjects** only | Not exposed | No |
| Attendance | Full management | Assigned class/students only | Own verified student read-only | No private attendance |
| Fees | Full management | Assigned students read-only | Not exposed | No |
| Promotion/Demotion | Full management | Assigned class, permitted Teacher workflow only | No | No |
| Announcements/Assignments | Full management | Own assigned class/subject posts | Public or verified student's class | Public Entire-School posts only |
| Config / School setup | Full management | Read portal-safe school info | Read public school info | Public school info only |
| Drive generic list/get/delete/upload | Admin only | No generic Drive endpoint | No generic Drive endpoint | No |
| Teacher profile photo / attachment | Admin full; Teacher through restricted Teacher action | Own photo / permitted post attachment | No | No |
| Private Parent attachment | Admin | As allowed by Teacher portal workflow | Only if published and public or matching verified class | Public published attachment only |

---

## 5. IDOR / BOLA Review

The code was specifically reviewed for changing identifiers in requests:

- **Staff ID:** Teacher backend ignores browser identity as authority and resolves the teacher from the server session.
- **Student ID:** Teacher student/photo/result/attendance operations check the student against the teacher's assigned roster. Parent attendance ignores request Student ID and uses the Parent session's Student ID.
- **Result ID:** generic Result CRUD is Admin-session protected; Teacher Result writes additionally verify assigned class/student/subject.
- **Fee ID:** generic fee update/delete requires Admin session. Teacher finances are read-only and filtered by assigned students.
- **Announcement ID:** Teacher update now verifies existing record ownership before upsert.
- **Drive File ID:** generic operations require Admin session and the File ID must belong to AFISAP managed Drive storage.
- **Attachment File ID:** Teacher post attachment must be an AFISAP-managed Announcements/Assignments attachment.

These are **code-path/static authorization tests**, not live penetration tests against the deployed Apps Script endpoint.

---

## 6. Google Drive Security

New uploads are no longer made publicly accessible with `ANYONE_WITH_LINK`.

Sensitive categories are explicitly whitelisted:
- Student Passports
- Student Documents
- Teacher/Staff Passports
- Teacher/Staff Documents
- Reports
- School Documents
- Announcements/Assignments attachments
- Administrator Profile

`driveGet` and `driveDelete` additionally verify the target File ID belongs under the AFISAP managed Drive root.

### Important legacy limitation
Removing the public-sharing code prevents **new** uploads from being exposed. This offline audit cannot prove that files uploaded by an **older deployed version** are no longer publicly shared. Existing legacy Drive files that were previously set to Anyone With Link should be reviewed/restricted in the live Google Drive environment.

---

## 7. Persistence Re-Audit After Security Changes

The active code was rescanned after security hardening.

### Permanent browser database
**No active `localStorage.getItem/setItem/removeItem/clear` calls were found in Admin, Teacher or Parent active scripts.**

### Remaining `sessionStorage`
Remaining uses are intentionally temporary:
- Admin: server-issued Admin session token + UI login marker.
- Teacher: server-issued Teacher session token.
- Teacher: per-session report-card date override.
- Parent: server-issued Parent session token.

A value in `sessionStorage` does **not** authorize an operation by itself; Apps Script validates the bearer token and role.

### Other browser storage
- IndexedDB: no active use found.
- `document.cookie`: no active use found.
- Cache API / CacheStorage as a permanent database: no active use found.

This preserves the required architecture:

```text
Google Sheets / Google Drive = permanent authority
Apps Script = backend + authorization authority
Browser = UI + temporary session/display state
```

---

## 8. Static Tests Actually Performed

The following tests were performed on the supplied codebase:

- Full active-entry-point review.
- Search for `localStorage`, `sessionStorage`, IndexedDB, cookies, cache storage.
- Search for `ANYONE_WITH_LINK` and `setSharing`.
- Search for `no-cors` privileged writes.
- Static review of `doGet` / `doPost` routing.
- Static authorization-path review for Admin, Teacher and Parent.
- Static IDOR/BOLA checks for Student ID, Staff ID, Result/Announcement IDs and Drive File IDs.
- JavaScript syntax validation:
  - `app.js`: **PASS**
  - `teacher-portal/teacher.js`: **PASS**
  - `parent-portal/parent.js`: **PASS**
  - `Code.gs` Node-compatible syntax check: **PASS**
- Static assertions for protected generic CRUD, server-side sessions, private Drive policy, Teacher subject restrictions and Parent attendance verification: **PASS**.

Security assertion results:

```json
{
  "GET generic CRUD blocked": true,
  "Admin privileged dispatcher has session validation": true,
  "Teacher session principal authoritative": true,
  "Parent session principal authoritative": true,
  "Legacy auth endpoints disabled": true,
  "Admin login uses POST": true,
  "Teacher selector removed": true,
  "Parent public student directory blocked": true,
  "Sensitive Drive public sharing removed": true,
  "Managed Drive file check present": true,
  "Active localStorage school DB calls absent": true,
  "IndexedDB absent": true,
  "Cookie auth absent": true,
  "No no-cors writes": true,
  "Teacher subject authorization enforced": true,
  "Teacher post IDOR ownership check": true,
  "Parent attendance requires auth": true,
  "Results position server action protected": true
}
```

Active storage scan:

```json
{
  "app.js": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 9,
    "indexedDB": 0,
    "document_cookie": 0,
    "public_drive_sharing": 0
  },
  "teacher-portal/teacher.js": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 5,
    "indexedDB": 0,
    "document_cookie": 0,
    "public_drive_sharing": 0
  },
  "parent-portal/parent.js": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 3,
    "indexedDB": 0,
    "document_cookie": 0,
    "public_drive_sharing": 0
  },
  "index.html": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 0,
    "indexedDB": 0,
    "document_cookie": 0,
    "public_drive_sharing": 0
  },
  "teacher-portal/index.html": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 0,
    "indexedDB": 0,
    "document_cookie": 0,
    "public_drive_sharing": 0
  },
  "parent-portal/index.html": {
    "localStorage_calls": 0,
    "sessionStorage_calls": 0,
    "indexedDB": 0,
    "document_cookie": 0,
    "public_drive_sharing": 0
  }
}
```

---

## 9. Tests NOT Performed / Deployment Requirements

The following were **not** performed and are not claimed:

- live Google Sheets reads/writes;
- live Google Drive permissions;
- live MailApp OTP delivery;
- live session expiry behavior;
- direct live HTTP penetration tests against the deployed Web App;
- real multi-device authentication tests;
- browser CORS/redirect compatibility of POST responses from the currently deployed Apps Script Web App;
- real IDOR attempts against production identifiers;
- revocation of old `ANYONE_WITH_LINK` permissions on legacy files.

### Critical deployment test
The hardened portals use authenticated **POST** requests whose JSON responses must be readable by the website. The old code used JSONP/no-cors patterns in places. Before production rollout, verify that the **existing deployed Apps Script Web App** returns readable POST responses to the actual Admin/Teacher/Parent hosting origins. If the deployment/browser blocks this because of CORS/redirect behavior, the safe solution is a same-origin/proxy or equivalent secure POST-capable architecture — **not putting passwords or bearer tokens back into URLs/JSONP**.

### Apps Script authorization
The first administrator OTP email will require the Apps Script project/deployment to have permission to use `MailApp`.

---

## 10. Remaining Security Limitations

1. **Legacy Drive sharing:** previously public files need a live Drive permission review.
2. **Static frontend/XSS risk:** bearer tokens exist in browser memory/sessionStorage during a session. A future strict Content Security Policy and XSS review would further reduce token-stealing risk.
3. **Password derivation:** Apps Script lacks modern native Argon2/bcrypt in this codebase; the implementation uses salted iterative hashing. A dedicated identity provider would provide stronger enterprise-grade credential management.
4. **Parent verification strength:** Student ID + registered guardian phone is substantially stronger than Student ID alone, but it is not multi-factor authentication. A future Parent account/OTP design can strengthen this further.
5. **Teacher first-time setup:** requires accurate Teacher email and phone already stored in the Teachers sheet.
6. **Rate limiting:** implemented in Script Properties; a production-scale identity platform would provide stronger distributed abuse controls.

---

## 11. Files Changed

Changed existing files:

- `Code.gs`
- `app.js`
- `parent-portal/parent.js`
- `teacher-portal/index.html`
- `teacher-portal/teacher.css`
- `teacher-portal/teacher.js`

New audit/report file added to package:
- `AFISAP_SECURITY_AUDIT_REPORT.md`

Historical backup source files were preserved.

---

## 12. Deployment Instructions

Because `Code.gs` changed:

1. Replace the current Apps Script `Code.gs` with the included version.
2. Redeploy the **existing AFISAP Web App deployment as a new version**.
3. Keep the **same Web App URL**.
4. Deploy the included active frontend files together.
5. Test Admin login + OTP reset.
6. Test Teacher first-time setup/login with one controlled teacher record.
7. Test Parent Student ID + Guardian Contact verification.
8. Attempt direct unauthenticated calls to `read`, `create`, `delete`, `driveGet`, Teacher private data and Parent attendance.
9. Confirm sensitive Drive files remain private.
10. Perform the CORS/POST compatibility test before rolling out to all users.

The final code is designed so a working login screen is **not** the security boundary; authorization is enforced in Apps Script.
