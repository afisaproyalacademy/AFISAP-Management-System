# AFISAP ROYAL ACADEMY — FULL DATA PERSISTENCE AUDIT

## Executive finding

The audit found that the active Admin frontend still initialized the entire school state object from `localStorage` (`afisap_v3_final`) and repeatedly persisted Students, Teachers, Classes, Results, Attendance, Fees and settings back into that browser object. Although many modules also synchronized with Apps Script, this meant the browser was still acting as a second database and several save/edit/delete flows were local-first.

The updated system removes `localStorage` as a permanent school-data source in the active Admin application. The Admin state now starts from empty/default UI state and is hydrated from Apps Script / Google Sheets / Google Drive. The compatibility `persist()` helper is memory-only.

## A. PASS / central source already present

| Module | Central source | Apps Script path | Audit result |
|---|---|---|---|
| Students | Students | read/create/update/delete | Central backend exists |
| Teachers & Staff | Teachers | read/create/update/delete | Central backend exists |
| Classes | Classes | read/create/update/delete | Central backend exists |
| Subjects | Subjects + central config | read/configGet/configSet | Central backend exists |
| Student Attendance | Student Attendance | read/create | Central backend exists |
| Teacher Attendance | Teacher Attendance | read/create | Central backend exists |
| Results & Marks | Results | read/create/update/delete | Central backend exists |
| Fees & Textbooks | Fees | read/create/update/delete/bulkCreateFees | Central backend exists |
| Report-card dates | Academic Settings | read/create/update | Central backend exists |
| Announcements & Assignments | Announcements & Assignments | read/create/update/delete | Central backend exists |
| Promotion/Demotion | Students | update / promotion helpers | Same Student ID retained |
| Teacher Profile | Teachers | teacherPortalGet/teacherPortalWrite | Central backend exists |
| Parent Portal | central read APIs | parentPortalGet | No separate permanent browser DB found |
| Student/Teacher photos | Google Drive + Sheet reference | driveUpload/driveGet | Central file architecture exists |
| Admin profile photo | Google Drive + Script Property reference | adminProfileGet/adminProfileSet | Central reference exists |

## B. NEEDS FIXING — findings and corrections

1. **Admin permanent local database** — `app.js` loaded `d` from `localStorage['afisap_v3_final']`. FIXED: active Admin now starts from fresh default state and hydrates from the cloud.
2. **Admin `persist()` wrote the complete school database to localStorage.** FIXED: `persist()` is now memory-only.
3. **Student edit was local-first.** FIXED: Google Sheets must confirm before the visible student object is changed.
4. **Teacher/staff edit was local-first and did not await backend confirmation.** FIXED: Google Sheets confirmation is required first.
5. **Student attendance was written to local state before Google Sheets.** FIXED: no local commit before all central writes succeed; authoritative refresh follows.
6. **Teacher attendance was written locally before Google Sheets.** FIXED the same way.
7. **School Setup displayed success before central config confirmation.** FIXED: central confirmation is required; failed saves restore previous UI state.
8. **Admin profile photo removal was local-only.** FIXED: removal now clears the central Apps Script profile reference first.
9. **Some delete paths tolerated 'record not found' by deleting only the browser copy.** FIXED for active student/staff paths so a missing cloud record is not treated as a successful permanent deletion.
10. **Legacy backup JavaScript files contain old localStorage implementations.** They are not loaded by any HTML entry point and were left untouched as historical/backup files. They must not be deployed in place of `app.js`.

## C. REMAINING BROWSER STORAGE

### Active Admin `app.js`
No `localStorage` school-database read/write remains. `sessionStorage` remains for the Admin login session only. This is security/session state, not school records.

### Teacher Portal
`sessionStorage` remains for:
- selected development Teacher Staff ID;
- temporary teacher report-card date overrides for the current browser session.

These are not the authoritative school database. Official Admin report-card dates continue to come from Academic Settings. The Staff ID selector is a known pre-security development mechanism and should be replaced during the later final authentication/security stage.

### Parent Portal
No permanent browser database was found.

### Legacy files
`AFISAP_APP_JS_ADMIN_PHOTO_LOADING_FIXED.js`, `AFISAP_TEACHER_STAFF_PHOTO_FIXED_FRESH.js`, `AFISAP_TEACHER_STAFF_STATE_RENDER_FIXED.js`, and `app(20260831-072646).js` contain historical localStorage code, but `index.html` loads only `app.js`. They are not execution sources.

## D. HARDCODED DATA

The active Admin app contains default/fallback school metadata and standard class/subject lists. These are configuration/fallback values, not live student/teacher/fee/result records. Custom classes and live records are loaded from the central backend.

No active hard-coded live student, teacher, fee, attendance, or result database was found in the loaded portal entry points.

## E. DATABASE MAP

```text
Students -> Students -> Apps Script generic CRUD -> Google Sheets
Teachers -> Teachers -> Apps Script generic CRUD / Teacher Profile -> Google Sheets
Classes -> Classes -> Apps Script generic CRUD -> Google Sheets
Subjects -> Subjects / AFISAP_CONFIG -> Apps Script read + configGet/configSet -> Google Sheets / Script Properties
Student Attendance -> Student Attendance -> Apps Script create/read -> Google Sheets
Teacher Attendance -> Teacher Attendance -> Apps Script create/read -> Google Sheets
Results -> Results -> Apps Script CRUD -> Google Sheets
Fees -> Fees -> Apps Script CRUD + bulkCreateFees -> Google Sheets
Report Card Dates -> Academic Settings -> Apps Script CRUD -> Google Sheets
Announcements/Assignments -> Announcements & Assignments -> Apps Script CRUD -> Google Sheets
Promotion/Demotion -> Students.Class -> Apps Script update -> Google Sheets
Teacher Personal Profile -> Teachers -> teacherPortalGet/teacherPortalWrite -> Google Sheets
Photos/Documents -> Drive -> driveUpload/driveGet -> Google Drive, reference in central record/config
Parent Portal -> parentPortalGet -> reads central records only
```

## F. RISKS FOUND

- Cross-device inconsistency from the old Admin localStorage database.
- A local edit could appear successful before Sheets confirmation.
- Attendance could survive only in one browser when a cloud write failed.
- Local-only delete behavior could hide a record on one device while it remained centrally.
- Background cloud synchronization could overwrite or conflict with local-first state.
- The Teacher Portal development identity selector is not final authentication and remains a security-stage task.
- The workbook is extremely close to the Google Sheets 10-million-cell allocation limit; structural row/column operations should remain minimized.

## Final verification performed

- Inspected every file in the ZIP and identified the actual loaded scripts from all three HTML entry points.
- Searched the full project for localStorage, sessionStorage, IndexedDB, cookies and cache APIs.
- Traced the major Admin CRUD paths and Apps Script routes.
- JavaScript syntax checks passed for Admin, Teacher and Parent portal scripts.
- `Code.gs` syntax check passed using Node-compatible parsing.
- Active Admin permanent school data no longer uses localStorage as its database.

### Tests that cannot be truthfully claimed from this offline audit

Live Google Sheets writes, Google Drive writes, browser restart on the school's devices, and real multi-device synchronization were not executed from this environment. Those require deploying this exact `Code.gs`/frontend and testing against the live AFISAP workbook and Web App.

The code-level acceptance target after these fixes is: **Google Sheets/Drive through Apps Script are authoritative; browser state is display/session state only.**
