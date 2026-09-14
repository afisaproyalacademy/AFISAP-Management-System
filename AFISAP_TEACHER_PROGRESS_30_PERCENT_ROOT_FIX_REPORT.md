# AFISAP Teacher Portal — 30% Progress Freeze Root Fix

## What I verified
I inspected the exact uploaded ZIP, not an earlier copy.

The uploaded `teacher-portal/teacher.js` already contained code intended to move Sign Out from 30% to 60% after about 220 ms and then to 90%. Therefore, a browser remaining at 30% for minutes is not consistent with that exact JavaScript executing normally.

## Concrete issue addressed
The Teacher Portal loaded `teacher.js` and `teacher.css` using unchanged URLs:

- `teacher.js`
- `teacher.css`

That allows a browser/static host/CDN to reuse an older cached Teacher Portal JavaScript file even after a new ZIP is deployed. This exactly fits a screen that has the new HTML/overlay but continues running an older progress implementation.

## Fixes made
1. Added versioned cache-busting URLs to the Teacher Portal:
   - `teacher.js?v=20260911-ROOT-PROGRESS-FIX-3`
   - `teacher.css?v=20260911-ROOT-PROGRESS-FIX-3`
2. Added no-cache document meta directives to the Teacher Portal HTML.
3. Reworked Sign Out progress so 30%, 60%, and 90% are scheduled independently before the network request can affect the flow.
4. The browser bearer token is cleared immediately when Sign Out begins, so protected UI cannot be restored locally while server logout is being attempted.
5. Server logout is still attempted, but a slow/nonresponsive Apps Script request cannot freeze the transition.
6. Sign In uses the same independent 30% -> 60% -> 90% scheduling and only reaches 100% after real authentication succeeds.
7. Added runtime build marker:
   `AFISAP_TEACHER_UI_BUILD="20260911-ROOT-PROGRESS-FIX-3"`

## Direct timing test performed
I executed the actual corrected Sign Out progress functions in a local JavaScript harness while deliberately making the server logout request NEVER resolve.

Observed:
- ~20 ms: 30%
- ~320 ms: 60%
- ~650 ms: 90%
- ~1500 ms: 100%
- transition overlay then closes

This confirms the corrected client flow does not depend on a successful/fast Apps Script logout response to advance the progress display.

## Syntax validation
Passed:
- `teacher-portal/teacher.js`
- `app.js`
- `parent-portal/parent.js`
- `Code.gs`

## Important deployment note
Upload/deploy the complete corrected Teacher Portal files together, especially:
- `teacher-portal/index.html`
- `teacher-portal/teacher.js`
- `teacher-portal/teacher.css`

The versioned script URL in `index.html` is what forces the browser to fetch this corrected JavaScript rather than reusing a cached previous build.
