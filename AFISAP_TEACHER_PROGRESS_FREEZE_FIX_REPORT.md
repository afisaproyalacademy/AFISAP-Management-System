# AFISAP Teacher Portal Progress Freeze Fix

Root cause: the sign-out transition started at 30% and then awaited the Apps Script logout network request. If that request was slow or stalled, the UI could remain on the transition overlay for an excessive time.

Correction: sign-out progress is now driven by awaited UI stages (30 -> 60 -> 90 -> 100) and the server logout is performed concurrently with a bounded wait. Local authenticated state is always cleared and the login screen is restored promptly. Sign-in progress is also staged visibly while the real backend authentication remains authoritative; a 20-second network timeout returns an error rather than leaving the interface frozen.

No authentication credentials, permissions, Google Sheets logic, Admin credential system, or Teacher data authorization were changed.

Static JavaScript syntax checks passed. Live Apps Script/network testing was not performed.
