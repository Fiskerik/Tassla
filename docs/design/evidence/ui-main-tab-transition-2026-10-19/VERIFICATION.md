# UI-MAIN-TAB-TRANSITION — verification

Date: 2026-10-19 · Plan: `docs/tasks/dev/UI-ACCESSIBILITY-PHASE-2-5.md` v4 · Branch: `codex/tassla-ui-ux-bundle-2026-10-18`

## Change

Main-tab-to-main-tab navigation now passes the existing direction into `ScreenTransition` and uses the named `tokens.motion.pageDistance` value of 28 pt. Child/support transitions retain the shared default of 8 pt. The duration, easing and opacity cue stay at their existing 240 ms values. The transition uses `useLayoutEffect`, skips its first mount, stops the prior animation on a key change and immediately settles when reduced motion is enabled. Bottom-tab taps and the existing swipe responder use the same route transition; no pager or navigation-stack behavior was added.

## Verification

- Focused policy suite: **12/12 PASS** (`tests/main-swipe-navigation-policy.test.mjs`, `tests/motion-policy.test.mjs`).
- `pnpm check`: **547/547 tests PASS**; app typecheck, edge typecheck and ESLint passed.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`: **PASS**, public-content guard passed and Expo exported 1,446 modules.
- Synthetic RN Web preview used the production `ScreenTransition`, `MainSwipeNavigation`, `BottomNav`, and Home/Log/Training screens. A temporary copy of the existing preview entry supplied the same direction/axis/distance props as `ProductWorkspace`; that temporary source was removed after the run. No account or backend data was used.
- At 375×844, Home→Log entered from positive X (computed translateX **+7.69 px** at 50 ms) and settled at 0/opacity 1. At 375×667, Training→Log entered from negative X (**−7.11 px** at 50 ms) and settled at 0/opacity 1. At 430×844, Home→Log also entered from positive X (**+6.84 px** at 50 ms). Values are browser CSS pixels in the synthetic renderer, not native point measurements.
- With browser reduced motion enabled, Home→Log was at 0 translation/opacity 1 at the same 50 ms sample. The first Home mount had no transform and opacity 1. A synthetic mouse swipe changed Home to Log; bottom-tab taps changed routes in both tested directions. The preview reported no JavaScript page errors.
- `git diff --check` and `PYTHONUTF8=1 python tools/dev_flow.py validate`: **PASS**.

Captures: [forward 375×844](forward-home-to-log-375x844.png), [backward 375×667](backward-training-to-log-375x667.png), [forward 430×844](forward-home-to-log-430x844.png), [reduced motion](reduced-motion-home-to-log-375x844.png), [swipe route](swipe-home-to-log-375x844.png).

## Design-rules §14 and limits

| Check | Result |
|---|---|
| Direction after left/right main-tab change | **PASS** in the synthetic web render; intermediate CSS translations recorded above |
| Initial mount, interruption implementation, duration and support-page distance | **PASS** in source/policy checks; support route keeps `tokens.motion.distance` (8 pt) |
| Reduced motion | **PASS** in synthetic browser preference; native OS preference remains **NOT TESTABLE** |
| Viewports | **PASS** at the tested 375×667, 375×844 and 430×844 synthetic sizes |
| Native touch responder, iOS animation timing/frame rate, VoiceOver and device behavior | **NOT TESTABLE** on this Windows run |
| Live Supabase/RLS, signed native archive and TestFlight | **NOT TESTABLE**; not needed for this UI-only checkpoint |

No full-panel visual sign-off is claimed. Independent QA **PASS** (focused 12/12; synthetic route/reduced-motion contract confirmed) and Reviewer **PASS** (scope, direction, interruption, mount guard and distance policy confirmed). Native device behavior remains NOT TESTABLE.
