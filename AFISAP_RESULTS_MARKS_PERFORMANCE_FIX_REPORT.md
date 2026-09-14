AFISAP RESULTS & MARKS SAVE PERFORMANCE FIX
=============================================

Changes made in this ZIP:

1. Results & Marks now uses d.school.term as a fallback when d.settings.term
   is unavailable. This fixes the false "Class, Academic Year and Term are
   required" position-synchronization message.

2. Added validation before saving so a missing Academic Year or Term is
   reported before any Result row is written.

3. Replaced the old save flow:
   create Result -> separate recalculatePositions request -> full 10-sheet
   afisapSyncAllFromCloud()
   with one authenticated saveResult request.

4. Added the server-side saveResult endpoint. It writes the Result and
   recalculates academic positions in the same Apps Script request, then
   returns the authoritative position map to the browser.

5. Optimized position synchronization in Code.gs. Instead of calling
   setValue() separately for every changed Position cell, the complete
   Position column is written once with setValues(). This substantially
   reduces Apps Script spreadsheet write overhead as the Results sheet grows.

6. Removed the slow full-school reconciliation after a successful Result
   save. The browser reconciles only the Results collection from the
   authoritative save response.

7. Added a visible saving loader:
   25%  Writing the result to Google Sheets
   55%  Saving and calculating positions
   90%  Updating the screen
   100% Result saved successfully

8. The Save Result button is disabled while the operation is running and
   shows a small spinner, preventing duplicate submissions.

Files changed:
- app.js
- Code.gs

Important:
- The same Google Apps Script Web App URL can be retained.
- After replacing Code.gs in Apps Script, deploy the existing Web App as a
  NEW VERSION using the SAME deployment URL so the new saveResult action is
  available.
- No unrelated modules were intentionally changed.
