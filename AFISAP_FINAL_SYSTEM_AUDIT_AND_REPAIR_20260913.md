# AFISAP Royal Academy — Final System Audit & Repair

This build is based on the user's latest uploaded system and applies targeted corrections only.

## Final corrections applied

1. Teacher Report Cards
- Report Card results now use the same assigned-class authorization as Teacher Results & Marks.
- All valid subjects saved for students in the assigned class can appear on the report card.

2. Promotion / Demotion persistence
- Promotion destination is now stored centrally in Apps Script properties and merged into Student reads.
- If the production Students sheet already has `Promoted To` or `Promotion Class`, Teacher promotion writes that existing column too.
- Main Admin Student reads receive the central promotion marker, so `PROMOTED TO` survives refresh/new browser/new device.
- Student deletion also removes the central promotion marker.

3. Parent Portal communication privacy
- Unverified/public visitors see only school-wide published communications.
- Class-targeted announcements/assignments require a verified Parent session and must match the verified student's class.
- Attachment downloads enforce the same audience rule.
- Parent sign-out immediately returns the communication feed to the public/school-wide feed.

4. Teacher browser cache privacy
- The persistent refresh cache no longer stores student/guardian/profile records.
- It stores only the minimal Teacher identity/classes/subjects and basic school shell required to prevent a logout flash.
- The authenticated token remains persistent because the user explicitly requires refresh/reopen to stay logged in until Sign Out.
- Student/profile data is reloaded from Apps Script.

5. Official Report Card dates
- Teacher browser-only Vacation/Opening date overrides were removed.
- Teacher Report Cards now use the Admin-controlled Google Sheets Academic Settings dates as the single official source.
- Teacher date controls are read-only.

6. Subjects synchronization
- Subjects saved through central config are synchronized to the Google Sheets `Subjects` sheet.
- Teacher Results custom subjects and Teacher Assignment subjects are also synchronized to the `Subjects` sheet.
- Parent subject filters therefore use the same central subject list.

7. Fee Item compatibility
- The existing exact Fee Item recovery fixes are retained:
  aliases such as `Fee Type`, `Fee Description`, `Fees`, `Description`, `Particulars`;
  encoded Fee Item in new Fee IDs;
  conservative legacy amount-to-name recovery.
- New fee records preserve exact Fee Item names for Teacher fee preview and official report cards.

8. School Setup source of truth
- Teacher and Parent school-information readers now read through `configGet()`, whose authoritative source is the Google Sheets `System Settings` record.
- Script Properties remain only as compatibility fallback/mirror.

9. Main Admin background load
- Full-school background reconciliation was reduced from every 30 seconds to every 120 seconds.
- Active save/edit/delete flows continue to update immediately.
- This reduces unnecessary load on the large Google workbook and Apps Script.

10. Administrator OTP
- Existing final OTP fixes and one-time `afisapAuthorizeResetEmail()` authorization helper are retained.

## Validation
- `app.js`: JavaScript syntax check passed.
- `teacher-portal/teacher.js`: JavaScript syntax check passed.
- `parent-portal/parent.js`: JavaScript syntax check passed.
- `Code.gs`: JavaScript/V8 syntax check passed.

## Deployment
This final build changes `Code.gs`.

Deploy `Code.gs` as a **NEW VERSION of the EXISTING Web App** and keep the **same deployment URL**.

Do not create a second Web App deployment URL.
