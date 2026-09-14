# AFISAP Teacher Portal — Surgical Login Performance Fix

## Investigation result

The login delay was caused primarily by the post-authentication `loadAuthenticatedTeacher()` chain, not by the visual percentage animation itself.

The previous flow was:

1. Authenticate teacher.
2. `api("teacher")` — reads the Teachers sheet and the assigned Students roster.
3. `loadTeacherProfile()` — reads the Teachers sheet again and then downloads the teacher photo as base64 through Apps Script.
4. `refreshData()` — calls `api("data")`.
5. `type="data"` reads the authorized Students roster, then reads the entire Fees sheet, Results sheet, Student Attendance sheet and Announcements & Assignments sheet, and also loads report dates.
6. Only after all of that can the progress reach 100% and the dashboard open.

The shared `teacherPortalReadUsedRows()` helper uses the whole used range of each requested sheet. Therefore the old `type="data"` call could become increasingly expensive as Results, Attendance, Fees and posts grow.

There was also duplicate Teachers-sheet work: the secured dispatcher resolves the authenticated teacher from `Teachers`, and `teacherPortalGet()` then rebuilt the teacher directory with `teacherPortalAllTeachers()` before the requested type was handled.

## Fix implemented

### Fast initial login

Added a dedicated `teacherPortalGet` type:

`initial`

It returns only:

- authenticated teacher identity
- teacher profile from the already-read teacher row
- assigned/authorized student roster
- lightweight school information

It does **not** preload:

- Results
- Attendance
- Fees
- Report Cards
- historical records
- Announcements

### Lazy loading

Added dedicated Teacher Portal endpoints:

- `results`
- `attendance`
- `fees`
- `posts`
- `reports`

The frontend now loads these datasets only when their corresponding Teacher Portal section is opened.

Results/attendance/reports requests are also filtered server-side by the authenticated teacher's authorized class/students and selected academic period.

### Teacher profile photo

The teacher photograph is no longer required to finish the initial dashboard load. The dashboard can open first, then the existing Google Drive photo is hydrated asynchronously.

### School branding

The public school-information request is now performed in the background so a slow branding request cannot block the login form.

### Navigation

Teacher Portal navigation now loads the required dataset for the selected section before rendering that section.

### Refresh after writes

The existing `refreshData()` compatibility function now refreshes the current relevant dataset rather than automatically downloading the entire Teacher Portal dataset.

### Security

The authenticated Teacher Portal identity continues to come from the server-side session.

Teacher class restrictions remain server-side.

No credentials or permanent school data were moved to browser storage.

## Expected result

A teacher with approximately 50 students should no longer wait for the entire school's Results, Attendance, Fees and historical data before the dashboard opens.

A school with approximately 1,000 students can scale without every teacher downloading all school-wide academic/financial records during login.

## Validation

- `teacher-portal/teacher.js`: JavaScript syntax check passed.
- `Code.gs`: syntax check passed after copying to a `.js` extension for Node validation.
- Existing custom-class authorization was preserved.
- Existing Fees read-only architecture was preserved.
- Existing authentication/session architecture was preserved.
- Existing Google Sheets/Drive source-of-truth architecture was preserved.

## Live deployment test still required

This local ZIP cannot measure the latency of the deployed Apps Script and real Google Sheets workbook. After deploying the updated `Code.gs` as a new version of the existing Web App (keeping the same Web App URL), test:

1. Correct teacher login.
2. Teacher with no students.
3. Teacher with approximately 50 students.
4. Results on-demand loading.
5. Attendance on-demand loading.
6. Fees on-demand loading.
7. Report Cards on-demand loading.
8. Announcements on-demand loading.
9. Teacher photo appearing after dashboard opens.
10. Unauthorized class access remaining blocked.
11. Login failure handling.
12. Logout and session behavior.

The critical architectural fix is that login no longer waits for the complete Teacher Portal database to be hydrated.
