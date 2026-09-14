# AFISAP Classes & Subjects — Create Class Duplicate Check Fix

## Problem found
The Create Class form was checking the new class name against `afisapCentralClassNames()`.

That function intentionally contains the full built-in AFISAP class catalogue such as Nursery 1, KG 1, Class 1, JHS 1, etc., even when those classes have not actually been created in the Classes records.

Therefore, selecting any standard class caused the frontend to immediately report:

`This class already exists.`

before it ever attempted to save the class.

## Surgical correction
The duplicate check now compares the requested class name only against the actual records currently stored in `d.classes`.

This means:
- A standard class can now be created when it is not actually saved yet.
- A genuinely existing class is still blocked.
- Custom class duplicate protection remains active.
- The built-in class catalogue is still preserved for class selection, ordering, promotion and other existing behavior.
- Google Sheets remains the central source of truth.
- No new sheet, database or Apps Script project was created.
- `Code.gs` was not changed.

## Validation
Syntax:
{
  "app.js": true,
  "teacher-portal/teacher.js": true,
  "parent-portal/parent.js": true,
  "Code.gs": true
}

Checks:
{
  "Static standard class list is no longer treated as saved classes": true,
  "Duplicate check uses actual saved class records": true,
  "Existing duplicate warning retained": true,
  "Class creation still saves to Google Sheets": true,
  "No Apps Script change": true
}

Live Google Sheets/browser testing was not possible here.
