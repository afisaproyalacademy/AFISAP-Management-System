# AFISAP Teacher Portal — Disabled-after-Credential-Creation Fix

## Root cause
The Teacher login code used a strict check:

`login.enabled !== true`

That can incorrectly treat an otherwise valid credential record as disabled when the stored `enabled` value is represented in a compatible legacy/string form, or when older credential metadata exists without an explicit boolean flag.

## Correction
- Added a single server-side enabled-state normalizer.
- New credential creation still writes `enabled: true`.
- Existing valid credential records with username + password hash and no explicit disabled flag are treated as active.
- Explicit disabled values remain disabled.
- Admin status display uses the same server-side interpretation.
- Credential creation now re-reads the stored record and confirms it is active before returning success.
- Teacher employment status remains authoritative: an actually inactive/disabled/terminated/removed teacher record is still blocked.

## Expected behavior
When Admin creates valid username/password credentials successfully, the Teacher Portal login is immediately **Active** and the same username/password can authenticate the teacher.

## Validation
Syntax:
{
  "app.js": true,
  "teacher-portal/teacher.js": true,
  "parent-portal/parent.js": true,
  "Code.gs": true
}

Static checks:
{
  "Credential creation forces enabled true": true,
  "Enabled-state compatibility helper present": true,
  "Admin status uses normalized enabled state": true,
  "Teacher login uses normalized enabled state": true,
  "Teacher employment status still enforced": true,
  "Saved credentials are re-read and confirmed": true,
  "No new Teachers sheet login columns": true,
  "No public Drive sharing": true,
  "No active localStorage DB calls": true
}

No live Apps Script/Google Sheets login was performed here. Redeploy the included `Code.gs` as a new version of the existing Web App, keeping the same URL, then recreate or simply re-save the teacher credentials and test login.
