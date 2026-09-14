# AFISAP Results Edit/Delete + Teacher Login Wallpaper/Credit Surgical Fix — 13 Sept 2026

## Scope
Only the Teacher Portal Results & Marks result-row actions and Teacher Portal login presentation were changed.

## Results & Marks
- Added **Edit** and **Delete** columns after Remarks.
- Edit loads the selected official Google Sheets result back into the existing mark-entry form for correction. Saving uses the existing Result ID, so the same record is updated rather than duplicated.
- Delete requires confirmation, calls a teacher-authorized backend delete endpoint, removes the exact `Result ID` from the official `Results` Google Sheet, recalculates positions, removes the row immediately from My Class Results, and quietly refreshes afterward.
- Teacher authorization remains restricted to students/classes assigned to the logged-in teacher.

## Teacher login page
- Added the supplied blue technology wallpaper as `teacher-portal/afisap_teacher_login_wallpaper.png`.
- Added a subtle CSS pan/zoom animation to make the wallpaper move without JavaScript or video.
- Added the requested credit:
  - System built by **Mr Chael I.T Department**
  - Clickable link: `https://mr-chael-it-department.appiatusr.chatgpt.site/#services`
  - `© 2026 Afisap Royal Academy Management System`
- Existing login/session/logout behavior was not changed.

## Deployment
`Code.gs` changed because result deletion must delete the official Google Sheets row securely. Deploy this `Code.gs` as a **new version of the existing Web App**, keeping the same deployment URL.
