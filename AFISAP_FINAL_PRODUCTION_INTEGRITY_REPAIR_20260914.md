# AFISAP Royal Academy — Final Production Integrity Repair

Date: 14 September 2026

This repair was applied to the latest uploaded AFISAP build after a head-to-toe audit. It is a surgical production-integrity update; unrelated working modules were intentionally left unchanged.

## Corrections applied

1. Academic-year rollover now resets School Setup to **Term 1** together with the new Academic Year.
2. Admin pending promotions and rollover are restricted to the **current Academic Year / Term 3** so stale recommendations from old years are not applied later.
3. Teacher Term 3 promotion review now records a real decision for every reviewed student: checked students = **Promote**, unchecked students = **Repeat**. A previous pending promotion is therefore replaced when the teacher changes the decision.
4. Admin Academic Year Promotion now has a **Cancel** action for an individual pending promotion recommendation.
5. Report-card `PROMOTED TO` is shown only for the promotion Academic Year and Term 3; it does not incorrectly carry into the new year's Term 1/2 report card.
6. Historical report cards now prefer the student's class stored in that period's Results records (with promotion history as fallback) instead of blindly using the student's current class after rollover.
7. The Admin and Teacher class selectors now treat the actual **Classes** records as authoritative once classes exist. Built-in defaults are only a bootstrap fallback for an empty system.
8. Class deletion is blocked when the class still has students, is assigned to a teacher, or is referenced by a pending promotion.
9. Legacy Teacher communication ownership matching was hardened to avoid Staff ID substring collisions.
10. Obsolete, unreachable immediate-promotion confirmation/execution code was removed from the active Admin frontend. Manual Student Class Correction remains available as the explicit correction path.

## Storage / communication status

- Main Admin permanent school data remains Apps Script / Google Sheets backed.
- Teacher student/results/attendance/fees/report data remains Apps Script / Google Sheets backed.
- Parent data remains Apps Script backed; only the authentication token uses session storage.
- Teacher localStorage remains limited to the intended login/session shell; central school records are not made browser-authoritative.
- No new Google Sheets columns or sheets were added by this repair.

## Validation completed

Static syntax validation passed for:
- `app.js`
- `teacher-portal/teacher.js`
- `Code.gs` (validated as JavaScript)

The final ZIP also passed archive integrity testing.

## Deployment requirement

`Code.gs` changed. Replace the current Apps Script `Code.gs`, then deploy a **NEW VERSION of the EXISTING Web App** while keeping the **SAME deployment URL**.

Live Google Sheets / Apps Script behavior still requires deployment and real-device testing; static validation alone is not a claim of production execution success.
