# AFISAP Surgical Fix — Admin Reset OTP + Exact Report Card Fee Item

Changes:
1. Administrator password reset:
   - MailApp now sends both required plain-text `body` and formatted `htmlBody`.
   - OTP is stored only after the send call succeeds.
   - Mail quota is checked before attempting delivery.
   - The frontend now displays a send failure instead of incorrectly saying the code was sent.
   - Unauthorized email addresses remain private and still receive only the generic response.
2. Report-card fees:
   - Official report cards display the exact stored Fee Item name (for example `Admission Fee`) rather than a generic `Fee/Fees` fallback.
   - Legacy aliases (`Fee Name`, `Fee`, `Item`) are supported without changing Google Sheets fee records.

Teacher Portal lock:
- Only `teacher-portal/teacher.js` was changed, specifically the report-card Fee Item display requested by the user.
- No other Teacher Portal file/function was modified.

Deployment:
- `Code.gs` must be deployed as a NEW VERSION of the EXISTING Web App, keeping the same deployment URL.
- The Apps Script project owner may be prompted once to authorize email sending (MailApp).
