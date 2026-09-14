# AFISAP Teacher Portal Login — Cell-Limit Fix

## Cause
The Teachers sheet is already extremely close to Google Sheets' 10,000,000-cell allocation limit. The previous Teacher Portal login upgrade attempted to add nine new credential/security columns to the Teachers sheet, so the existing workbook safety check correctly stopped the operation.

## Fix
No Teacher Portal login columns are added anymore.

Teacher login credentials/security metadata are now stored centrally in Apps Script Script Properties, securely linked to the teacher's existing Staff ID in the Teachers sheet. The Teachers sheet remains the source of truth for teacher identity, class, subject, profile and staff information.

This avoids adding rows/columns and therefore avoids the workbook cell-limit error.

The stored authentication metadata contains only:
- Staff ID link
- Portal username
- salted password hash
- salt / iterations
- login enabled state
- password updated timestamp
- last login timestamp
- failed attempts
- lockout timestamp

The plaintext password is never stored.

## Username rule
Username must be 6–40 characters and include:
- uppercase letter
- lowercase letter
- number
- one special character from `. _ - @`
- no spaces

Example: `Ama.Kwaku1`

## Password rule
Minimum 8 characters with uppercase, lowercase, number and special character.

## Validation
Syntax:
{
  "app.js": true,
  "teacher-portal/teacher.js": true,
  "parent-portal/parent.js": true,
  "Code.gs": true
}

Static checks:
{
  "No Teacher login column insertion": true,
  "Central auth uses Script Properties": true,
  "Auth remains linked to Staff ID": true,
  "Username complexity enforced server-side": true,
  "Username uniqueness enforced server-side": true,
  "Password complexity preserved": true,
  "No public Drive sharing": true,
  "No active localStorage database calls": true
}

No live Apps Script or Google Sheets authentication test was performed here. Deploy the updated Code.gs as a new version of the existing Web App, keeping the same URL.
