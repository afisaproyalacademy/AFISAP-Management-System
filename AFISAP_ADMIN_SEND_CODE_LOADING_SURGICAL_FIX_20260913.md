# Main Admin Forgot Password — Send Code Loading Fix

- Added immediate AFISAP logo loading overlay when Send Code is clicked.
- Shows Preparing verification code… with 10% → 90%, then 100% when Google Apps Script replies.
- Disables Send Code while one request is running to prevent duplicate OTP requests.
- Keeps the existing authorized-email verification and actual Google email send flow unchanged.
- No Code.gs change.
- Teacher Portal files unchanged.
