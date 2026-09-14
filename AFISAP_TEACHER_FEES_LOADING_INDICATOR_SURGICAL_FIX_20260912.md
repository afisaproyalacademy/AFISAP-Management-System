# AFISAP Teacher Fees Loading Indicator — Surgical Fix

Scope: Teacher Portal > Fees & Textbooks print preparation only.

Changes made:
- Added a centered AFISAP logo loading overlay while student/class financial records are being prepared.
- Added visible percentage progress in 10% steps (10%, 20%, ... 90%).
- When the financial data is ready, the indicator reaches 100%, briefly displays it, then the existing print preview opens.
- The AFISAP logo gently grows/fades in and out while loading.
- Applied to both "Print Student Fees" and "Print Entire Class Fees".
- Existing fee retrieval, Admin Fees, Google Sheets, report cards, print layouts, selectors, and backend Code.gs were not changed.

No Apps Script redeployment is required for this UI-only change.
