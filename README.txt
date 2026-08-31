AFISAP ROYAL ACADEMY — ADMISSIONS PORTAL

This build contains the Admissions Portal with the supplied school photographs displayed as a continuous, low-opacity background watermark slideshow behind the page content.

The slideshow is implemented with HTML/CSS image cross-fades, so it does not depend on a separate MP4 video.

Included: admissions-v2.html, styles.css, script.js, assets (logo, 9 supplied gallery photos, print header).


UPDATED: The gallery is now a FULL-VISIBILITY background slideshow, not a watermark. The white wash has been removed and the admission form panels remain clean for readability.

POST-SUBMISSION FIX
- The admission form explicitly uses method="POST" and enctype="multipart/form-data".
- FormSubmit _next now points to submission-success.html using the current site origin.
- A same-site success page confirms submission and provides a print action.
- The existing four-page print preview remains in admissions-v2.html.


APPLICANT EMAIL FIX — FINAL
- Parent/Guardian Email is now the actual FormSubmit field named "email".
- It is required and is used directly for the applicant's autoresponse.
- The previous hidden email mirror was removed.
- CAPTCHA disabling was removed because FormSubmit states that _autoresponse does not work when CAPTCHA is disabled.
- The existing POST submission, school email delivery, 4-page populated print preview, and success page are preserved.


APPLICANT EMAIL WORDING UPDATE: Only the FormSubmit _autoresponse wording was professionally reformatted. All existing admission, email-delivery, upload, application-number and 4-page print functionality was preserved.
