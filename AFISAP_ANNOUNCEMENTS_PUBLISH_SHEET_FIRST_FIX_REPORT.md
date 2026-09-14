# AFISAP Announcements & Assignments — Publishing/Attachment Fix

## Root cause
The Admin Announcements & Assignments form uploaded the optional attachment to Google Drive **before** creating/updating the main record in the `Announcements & Assignments` Google Sheet.

That meant a slow or failed Drive upload blocked the entire publication flow. The UI could remain at the attachment-upload stage and eventually show:
`The attachment upload was not confirmed by Google Drive.`

## Fix applied
1. The main announcement/assignment record is now saved to **Google Sheets first**.
2. The browser updates its local state only after Google Sheets confirms the write.
3. The optional attachment is uploaded to Google Drive **after** the Sheet save.
4. After Drive confirms the file, the Sheet row is updated with the Drive file ID/name.
5. If Drive is slow or fails, the announcement/assignment **remains safely saved in Google Sheets** and the user gets a specific attachment warning instead of losing the publication.
6. Editing an existing item follows the same order: Sheet update first, attachment upload second, then attachment reference update.
7. Existing Drive upload and Sheet APIs were preserved; no unrelated modules were changed.

## Result
- No attachment is allowed to block the primary Sheet publication.
- Announcements, assignments and posts continue to use the existing `Announcements & Assignments` Google Sheet as the source of truth.
- Optional attachments remain stored in the existing Google Drive `announcements` category.

## Deployment
Replace the deployed frontend `app.js` with the one in this ZIP and publish the updated GitHub Pages site. No Apps Script URL change is required for this frontend fix.
