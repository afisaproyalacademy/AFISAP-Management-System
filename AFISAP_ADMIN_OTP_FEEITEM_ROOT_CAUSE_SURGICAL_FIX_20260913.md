# AFISAP Surgical Fix — Admin OTP Delivery + Exact Fee Item Root Cause

What was fixed:

## 1. Administrator password-reset verification email
- MailApp now uses the simple `sendEmail(to, subject, body)` overload first.
- GmailApp is used as a fallback.
- The OTP is stored only after Google accepts the send request.
- If the deployment does not have email authorization, the frontend receives a clear instruction instead of a false "sent" message.
- Added `afisapAuthorizeResetEmail()` for one-time manual authorization from the Apps Script editor.

## 2. Exact Fee Item on Teacher fee preview and report cards
The supplied PDFs proved the amount/student link worked, but the exact Fee Item did not:
- fee preview showed generic `Fee`;
- report card showed `Unspecified Fee Item`.

Root cause:
- the existing production Fees sheet may use a fee-name header not covered by the canonical alias list, or may have legacy rows saved without a dedicated fee-name value.

Fix:
- Added compatibility for `Fees`, `Fee Type`, `Fee Description`, `Description`, and `Particulars`.
- All new fee records embed the exact fee item in the permanent Fee ID as a compatibility backup:
  `FEE|<encoded fee item>|<unique id>`.
- New configured fee items similarly preserve their name in the ID.
- Teacher Portal fee preview/report cards decode the exact item when needed.
- Legacy unnamed student fee rows are repaired conservatively when exactly one configured fee item has the same Amount Due.
- No guessing occurs when multiple fee items share an amount.

Deployment:
- Deploy the included `Code.gs` as a NEW VERSION of the EXISTING Web App and keep the same URL.
- In Apps Script, run `afisapAuthorizeResetEmail` once manually and approve the email permission before testing Forgot Password.
