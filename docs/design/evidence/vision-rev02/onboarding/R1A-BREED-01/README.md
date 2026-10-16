# R1a explicit breed choice — render evidence

The production `ProfileScreen` was built through the isolated React Native Web harness with synthetic catalog responses. The public and review bundles each completed seven verifier assertions with no browser page errors.

The verifier covers:

- Fresh non-empty catalog with every radio unselected, visible guidance, and Continue disabled until a deliberate choice and valid name/date.
- Optional kennel code after the other required fields are valid.
- Empty catalog with retry, recovery to ready/unselected, loading, failed-fetch retry recovery, and persistent failure feedback.
- Preservation of a selected breed after a later harness-only catalog fetch.
- 375×844, 430×844, and 375×667 viewport layouts, plus a 140% text proxy at 375 px without horizontal overflow.

`public/browser-results.json` and `review/browser-results.json` contain the machine-readable outcomes. Each mode has captures for ready/unselected, ready/selected, catalog loading/error/empty, empty retry recovery, and 140% text.

This is local synthetic RN Web evidence. It does not validate live Supabase/RLS, profile save/readback, native Dynamic Type or VoiceOver, device safe-area/keyboard behavior, or a shipped build. The reference image has no dedicated profile-create panel, so no direct pixel-match claim is made.
