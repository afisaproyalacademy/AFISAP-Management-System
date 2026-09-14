# AFISAP Dynamic Promotion Destination Fix — 14 September 2026

## Problem corrected
The Teacher Portal promotion destination was still partly dependent on a fixed built-in class progression list. Administrator-created class/stream names such as `Nursery 1 A`, `Nursery 1 B`, `Class 1 A`, or `Class 1 B` could therefore leave **Destination Class** empty.

## Surgical correction
- `Code.gs` now sends the current central class list to the Teacher Portal during login/initial load.
- The Teacher Portal **Destination Class** selector is populated from the actual AFISAP central Classes data, including administrator-created classes/streams.
- The normal built-in progression is now only a suggested default when it exactly exists; it is no longer an authorization restriction.
- A teacher may select another existing administrator-created destination class.
- Backend validation still prevents an empty destination, prevents selecting the same current class, and requires the destination to exist in AFISAP Classes.
- The selected destination is saved in the pending promotion recommendation, so the Main Admin Academic Year Promotion review displays the same destination and rollover applies it.

## Intentionally unchanged
No redesign or unrelated changes were made to Fees, Results, Attendance, Report Cards, Parent Portal, OTP/login, student records, or the staged rollover architecture.

## Deployment
`Code.gs` changed. Replace the existing Apps Script `Code.gs` and deploy a **NEW VERSION of the EXISTING Web App**, keeping the **SAME deployment URL**.
