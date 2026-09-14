AFISAP ROYAL ACADEMY — FEES & TEXTBOOKS PERFORMANCE FIX
Date: 12 September 2026

Changes made in this ZIP:

1. Updated the Fees backend version to:
   AFISAP_FEES_FAST_V5_20260912

2. Added createFeeRecordFast:
   - Uses a targeted Fee ID TextFinder duplicate check instead of reading the entire Fees sheet.
   - Writes one fee record directly to the existing Fees sheet.
   - Returns the saved authoritative row to the Admin frontend.

3. Optimized bulkCreateFees:
   - Keeps duplicate protection.
   - Writes all new student fee rows in one Google Sheets setValues() operation instead of appending one row at a time.
   - Returns the saved rows to the frontend.

4. Removed unnecessary full-school synchronization after successful fee saves.
   - The frontend now updates only the fee record(s) confirmed by Google Sheets.
   - This avoids downloading Students, Teachers, Classes, Attendance, Results, Fees, Subjects, Academic Settings and Announcements again after every fee save.

5. Added visible Fees save progress:
   - The Save Fee Record button is disabled while saving.
   - A spinner and "Saving fee record to Google Sheets..." status are shown.
   - The successful result is displayed after the backend confirms the write.

6. Cached the live Fees backend compatibility check for the browser session so it is not requested before every fee save.

IMPORTANT DEPLOYMENT:
The Google Apps Script deployment cannot be changed by editing this ZIP alone. The Code.gs in this ZIP must be copied into the existing Apps Script project and deployed as a NEW VERSION of the EXISTING Web App, while keeping the SAME Web App deployment URL.

After deployment:
- Refresh/reload the GitHub Pages Admin site.
- Open Fees & Textbooks.
- Save one fee record and confirm it completes without the old-backend warning.
- Bulk fee assignment should also use the new one-batch backend write.

No unrelated modules were intentionally changed.
