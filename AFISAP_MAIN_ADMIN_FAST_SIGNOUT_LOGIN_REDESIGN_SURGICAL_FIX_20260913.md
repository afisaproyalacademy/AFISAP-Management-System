# AFISAP Main Admin Fast Sign-Out + Circular Login Redesign

Surgical Main Admin changes only:
- Sign-out now clears the local admin session immediately after confirmation.
- The server logout request runs in the background, so the administrator does not wait for Google Apps Script.
- Added the same AFISAP logo loading overlay with `Signing out...`.
- Login returns after a brief professional transition.
- Redesigned the existing circular login card with a cleaner premium ring/glass appearance while keeping the supplied moving background photo.
- Teacher Portal files were verified unchanged.
- No Code.gs change is required.
