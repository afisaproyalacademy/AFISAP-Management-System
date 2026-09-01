
Student/Teacher fix: all AFISAP classes are now listed in dropdowns and both Add Student and Add Teacher/Staff use reliable form submit handlers with duplicate ID validation and success confirmation.


UI UPDATE: Dashboard and navigation have been redesigned to follow the supplied school-management-system layout: left navigation, top bar, metric cards, notice board, quick actions, recent students and school overview.


HEADER SEARCH & EMAIL UPDATE
- Search bar now searches students, teachers/staff, classes, results and fee records stored in V3.
- The email icon opens the school's main Gmail inbox: afisaproyalacademy@gmail.com.
- The standalone browser prototype cannot safely display a live Gmail unread count without Gmail API/OAuth credentials or a backend.
- For production V3, the next secure step is Gmail API/OAuth or a backend mail connector if live unread counts are required.


LATEST: Classes and Fee Items start at 0 and remain 0 until the administrator adds records. Student fee records now track amount due/paid and automatically create notification-bar entries for payments and outstanding balances.


SETUP / CLASS / STAFF UPDATE
- Academic Year remains a free-text field with suggested year examples; the administrator can type any academic year and save it.
- Current Term is a required selector with Term 1, Term 2 and Term 3.
- Create Class now provides a selector from Nursery 1 through JHS 3, while Class Teacher remains a free-text field.
- Add Teacher / Staff now reveals a real "Other Position" input when Other is selected.


SCHOOL OVERVIEW / ACADEMIC SETTINGS FINAL
- Academic Year is a typeable list (combobox): the administrator can choose a suggested year or type any academic year such as 2026/2027 and save it.
- Current Term is a fixed selector containing Term 1, Term 2 and Term 3.
- The saved academic year and term continue to appear in the school overview/dashboard.


STUDENT PASSPORT PHOTO UPDATE
- Add Student now requires a passport photograph.
- The selected photo is previewed before saving.
- The passport image is stored with the student record in the standalone prototype.
- The image is shown in the Students record table and can be opened in a larger profile-style view.
- Recent Students on the dashboard also uses the student's stored passport photo.
- The existing student data fields and class selection are preserved.


STUDENT PASSPORT PHOTO FINAL FIX: The Add New Student form visibly contains a Student Passport Photo upload area. The admin can select an image and immediately see the photo inside the form before saving. The photo is required, saved with the student record, shown in the Students table, and opens in a larger view.

TEACHER / STAFF PASSPORT PHOTO UPDATE
- Add Teacher / Staff now contains a visible passport-photo upload area.
- The selected photo is immediately previewed in the form before saving.
- The photo is required before the staff record can be saved.
- Saved staff photos appear in the Teachers & Staff table.
- Clicking a staff photo opens a larger profile-style view with the staff member's identity details.


RESULTS & MARKS PHOTO UPDATE: The selected student's stored passport photo now appears at the top of Results & Marks, with student details. The same photo is also shown beside each saved result record. The image is read directly from the student record, so changing the student record photo updates Results & Marks automatically.


ATTENDANCE PHOTO UPDATE: The Attendance section now has Class and Date controls, displays each student's stored passport photo and name, and allows the administrator to mark Present or Absent for the selected date. Attendance is saved per student and date.


NAME FIELD UPDATE: Student and Teacher/Staff records now collect Surname, First Name, and Middle/Other Name separately. The system also keeps a combined display name for existing areas that use the person's full name. Existing records are supported by deriving name parts from their previous full-name field when edited.


NAME VALIDATION FIX: Student creation now validates Student ID + Surname + First Name + Class instead of the removed legacy Full Name field. Teacher/Staff creation similarly uses Staff ID + Surname + First Name + Position.


TEACHER NAME FIX: The actual Add Teacher/Staff form now contains editable Surname, First Name and Middle/Other Name fields. The real submit handler reads those fields and no longer checks the removed Full Name field.


TEACHER SAVE FIX: Repaired the actual Teacher/Staff save handler so submitted records are pushed into d.staff, persisted with save(), the modal closes, and the Teachers/Staff list refreshes. Name separation remains Surname, First Name, Middle/Other Name.


TEACHER SAVE DIAGNOSTIC FIX: The teacher submit handler was rebuilt against the actual current V3 code. It now prevents default submission, reads the separated name fields, initializes d.staff when necessary, pushes the record, calls save(), closes the modal, and refreshes the staff list. The passport-photo variable is guarded so an undefined photo variable cannot stop saving.

ATTENDANCE UPDATE: Attendance is now linked directly to the Students records. When a student is added, the student automatically appears in Attendance with passport photo, name and class. The administrator selects a date and optionally filters by class, then answers “Did he/she come to school?” with YES or NO. Each selection is saved by student and date.

ATTENDANCE SAVE BUTTON UPDATE: Attendance selections are now held until the Administrator clicks “Save Attendance”. The system requires YES or NO for every displayed student, then saves all attendance records for the selected date/class. Existing saved attendance is loaded when the date/class is selected.

ATTENDANCE DAYS UPDATE: The Students list now includes an Attendance column showing the total number of days each student has been marked PRESENT. The count is calculated from saved attendance records, so it updates automatically as attendance is recorded. The label uses the concise professional term “Attendance”.


TEACHER ATTENDANCE UPDATE — ADDITIVE V3 FEATURE
- Added a separate Teacher Attendance area accessible directly from Teachers & Staff.
- The Administrator selects a date with a date picker.
- The system automatically loads all existing Teachers/Staff records; teacher information is not re-entered.
- Each record displays Passport Photo, Staff ID, Name, Position, Class, Subject and Phone.
- Each teacher is marked YES or NO for “Did he/she come to school?”
- YES is stored as 1 attendance day; NO is stored as 0 attendance days.
- Teacher attendance is stored separately from Student Attendance in d.teacherAttendance.
- Each teacher attendance record is uniquely keyed by Staff ID + Date, preventing duplicate records for the same teacher/date.
- Total attendance is automatically calculated from saved PRESENT/YES records across dates.
- Teacher attendance remains linked to Staff ID. If an existing teacher's Staff ID is edited, saved teacher-attendance records are migrated to the new Staff ID.
- Existing Student Attendance remains in d.attendance and is not replaced by Teacher Attendance.
