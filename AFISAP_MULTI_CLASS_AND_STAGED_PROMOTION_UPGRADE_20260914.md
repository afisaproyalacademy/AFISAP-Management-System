# AFISAP Royal Academy — Multi-Class Teacher + Staged Promotion Upgrade

Date: 14 September 2026

## Scope
This upgrade is limited to the two requested architecture corrections:
1. One teacher/staff record and one Teacher Portal login can now be assigned to up to three classes.
2. Teacher Term 3 promotion no longer moves students immediately. It records a pending promotion recommendation, and the Administrator applies all pending promotions together during the new academic-year rollover.

No redesign or broad rewrite was performed.

## 1. Multi-Class Teacher Assignment
- Main Admin → Teachers & Staff → Add Teacher / Staff now supports selecting 1–3 classes.
- Main Admin → Teachers & Staff → Edit Teacher / Staff now supports selecting 1–3 classes.
- The existing Teachers sheet `Class` field remains the only storage field. Multiple assignments are stored as a comma-separated value such as `Class 4, Class 5, Class 6`.
- No new Google Sheets column is required.
- The existing Teacher Portal backend already splits the stored Class value and authorizes all assigned classes, so the same Staff ID / username / password works across all assigned classes.
- Teacher Portal continues to expose assigned classes in its class selectors and filters.

## 2. Staged Promotion Architecture
### Teacher Portal — Term 3
- The section is now presented as `Student Promotion Recommendation`.
- A teacher selects an assigned class and recommends students for the next class.
- Saving a recommendation does **not** change the student's active `Class` field.
- The recommendation is saved centrally in Apps Script Script Properties, preserving the existing near-10M-cell workbook safety strategy.
- The student's report-card `PROMOTED TO` value can still be populated from the central promotion record.
- The student remains visible in the current teacher's class until the Administrator applies the rollover.

### Main Admin — Academic Year Promotion
- Classes & Subjects now contains an `Academic Year Promotion` panel.
- It loads all pending teacher promotion recommendations.
- It shows Student, Student ID, Current Class, Promoted To, Academic Year and Term.
- The Administrator enters/reviews the new Academic Year and confirms one rollover operation.
- Before changing any class, the backend validates every pending student and destination class.
- Approved students are then moved together.
- Roll numbers / class totals are synchronized using the existing roll-sync logic.
- Promotion records are marked `applied` after the successful rollover.
- The School Setup academic year is also updated to the new year where the existing central configuration save succeeds.

### Newly Promoted Visibility
After rollover, Teacher Portal → My Students can show:
- `NEWLY PROMOTED`
- `Promoted from <Previous Class>`
for students whose effective promotion academic year matches the active school academic year.

### Manual Class Correction
The previous Admin class-change capability remains available, but it is separated from the normal year-end promotion process under `Manual Student Class Correction`.
Manual corrections are marked as manual rather than pending promotions, so they are not accidentally re-applied during rollover.

## Files changed
- `app.js`
- `teacher-portal/teacher.js`
- `Code.gs`

## Files intentionally not changed
- Parent Portal files
- Main HTML layout
- Teacher Portal HTML layout
- Fees architecture
- Results architecture
- Attendance architecture
- OTP/authentication architecture
- Report-card visual design
- Google Drive photo architecture

## Static validation
Passed:
- `node --check app.js`
- `node --check teacher-portal/teacher.js`
- `node --check` on a JavaScript copy of `Code.gs`

## Deployment requirement
`Code.gs` changed in this upgrade.

Deploy the updated `Code.gs` as a **NEW VERSION of the EXISTING Google Apps Script Web App** and keep the **SAME deployment URL**.

Do not create a new Web App URL.

## Recommended live test
1. In Admin, edit one teacher and assign Class 4 + Class 5 using the same Staff ID/login.
2. Log into Teacher Portal and confirm both assigned classes are available.
3. Set Results & Marks to Term 3.
4. In Student Promotion Recommendation, recommend one Class 4 student for Class 5.
5. Confirm that student still remains in Class 4 immediately after saving the recommendation.
6. Confirm the report card shows `PROMOTED TO: Class 5`.
7. In Admin → Classes & Subjects → Academic Year Promotion, verify the recommendation appears.
8. Enter the new academic year and apply rollover.
9. Confirm the student's active class changes to Class 5 only at this point.
10. Log into the Class 5 teacher account and confirm the student appears with the `NEWLY PROMOTED` indicator when the active School Setup academic year matches the rollover year.
