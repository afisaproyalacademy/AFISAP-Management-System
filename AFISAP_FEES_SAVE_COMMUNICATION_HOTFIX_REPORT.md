# AFISAP Fees Save / Teacher Communication Hotfix

## Root cause corrected

The Admin Fees frontend contained a separate `feesBackendStatus` deployment-version verification gate. If that probe failed or the live Apps Script did not expose the exact expected version string, the frontend stopped the fee operation and displayed:

`The live Google Apps Script deployment could not be verified...`

That check was not a valid condition for deciding whether a fee could be saved.

The single-fee save path also depended on the newer `createFeeRecordFast` action without falling back to the existing authenticated `create` action. An existing deployment that could already save to the `Fees` sheet could therefore be blocked unnecessarily.

## Repair

- Removed the deployment-version check as a blocker for Fees operations.
- `afisapVerifyLiveFeesBackend()` is now a compatibility no-op and cannot stop a legitimate fee operation.
- Single fee creation now tries `createFeeRecordFast` first.
- If that optional action is unavailable/unsupported, it automatically falls back to the existing authenticated `create` action using the same `Fees` sheet.
- Existing server confirmation / sheet verification logic remains in place.
- Teacher Portal still uses the same Apps Script URL and dedicated `type="fees"` request.
- Teacher Portal remains read-only.
- No second database, spreadsheet, Fees sheet, or backend was created.
- No unrelated modules were intentionally changed.

## Files changed

- `app.js`
- This report only.

`Code.gs` and `teacher-portal/teacher.js` were inspected but were not changed in this hotfix because the immediate save blocker was in the Admin frontend.
