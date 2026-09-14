# AFISAP Results Other Subject Mark Entry — Surgical Fix

## Problem
When **Other** was selected in Teacher Portal → Results & Marks, the custom subject name could be typed, but the Class Score, Exam Score, Remarks, and Save Result controls stayed disabled.

## Root cause
The form enabled mark entry only when `teacherSelectedResultSubject()` already returned a non-empty subject. For **Other**, that helper is empty until the teacher types a custom subject, but typing did not re-render the form. Therefore the controls remained disabled.

## Surgical correction
- Mark-entry controls now become available as soon as any Subject option is selected, including **Other**.
- The custom subject box still requires an actual subject name before saving.
- The mark-entry heading updates live from `Other — Mark Entry` to the typed subject name, e.g. `ICT — Mark Entry`.
- Existing score validation and backend saving behavior were not changed.

## Untouched
Fees, login/session persistence, attendance, students, report-card layout, Admin portal, Google Sheets synchronization, and Code.gs were not modified for this fix.

## Deployment
No Apps Script redeployment is required. Replace/use the updated Teacher Portal frontend files from this ZIP.
