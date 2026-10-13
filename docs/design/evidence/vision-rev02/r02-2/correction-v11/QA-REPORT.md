# R02-2 v11 Home QA

Date: 2026-10-13. **Verdict: PASS for the Home visual/code checkpoint.**

## Results

- Public and review Home both show the shared generic portrait, visible `Standardbild` cue, and measured week strip layered over the portrait.
- The fixed review frame visibly says `AI-GENERERAD STANDARDBILD`; its accessible description identifies the synthetic review fixture.
- Fresh public/review browser runs passed at 375 and 430 px, including the 140% text, short viewport, reduced motion, navigation, source states, and review interactions exercised by the verifier. The in-app portrait label measured 14.91:1. The verifier checks each week numeral's opacity and ≥4.5:1 contrast at standard and 140% text.
- The prior SQL fixture-age concern is withdrawn. Dog B is seeded at `current_date-80` (about 11 weeks); version 5 uses the inclusive 0–20 week range. The migration uses `between min_age_weeks and max_age_weeks`, so that fixture is age-eligible and can test rejection of a breed-target mismatch.

Evidence: `public/browser-results.json`, `review/browser-results.json`, and the screenshots beside them. The independent review renders inspected the 375 px ready, 140% text, and reference images, plus the 430 px ready views.

## Limits

The browser fixture uses synthetic content and React Native Web. Supabase migration/RLS, purge/scheduler, midnight lock-wait, and native-device accessibility remain **NOT TESTABLE** in this environment. This result approves the local Home checkpoint, not a production database activation or native release.
