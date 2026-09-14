# AFISAP FEES ADMIN -> TEACHER PORTAL LIVE SYNCHRONIZATION

## Implemented

The Teacher Portal Fees & Textbooks module now treats the Admin Fees & Textbooks system and the Google Sheets `Fees` sheet as the single financial source of truth.

### Synchronization flow

1. Administrator saves a fee for a specific student in Admin -> Fees & Textbooks.
2. The Admin backend validates the Student ID and writes the fee record to the existing Google Sheets `Fees` sheet.
3. The saved record contains the canonical Student ID, student name/admission number, fee item, academic year, term, amount due, amount paid, balance and status.
4. Teacher Portal -> Fees & Textbooks requests the latest authorized financial records from the same Google Sheets `Fees` sheet.
5. The Teacher Portal matches records to the authenticated teacher's authorized students.
6. The fee appears in the authorized student table:
   - Student
   - Student ID
   - Class
   - Fee Item
   - Academic Year
   - Term
   - Amount Due
   - Amount Paid
   - Balance
   - Status

## Automatic synchronization

When a teacher has the Fees & Textbooks page open, the portal automatically checks the central Fees records every 30 seconds. A manual `Refresh Financial Records` button remains available as an immediate on-demand refresh.

This means the teacher does not have to manually reload the browser page to see a fee that the Administrator has just saved.

## Security

Teachers remain view-only. They cannot create, edit, delete or change fee structures, payments or balances.

The backend returns only fee records belonging to students authorized for the authenticated teacher.

## Important behavior

Cross-browser instant push is not available from Google Sheets/Apps Script alone. Therefore, the implemented behavior is:

**Admin saves successfully -> Google Sheets is updated -> Teacher Portal automatically detects the new record within the synchronization interval (maximum normal interval: about 30 seconds while the Fees page is open).**

Opening the Fees page also performs an immediate fresh synchronization.

No Results, Attendance, Posts or other large Teacher Portal datasets are loaded merely to synchronize fees.
