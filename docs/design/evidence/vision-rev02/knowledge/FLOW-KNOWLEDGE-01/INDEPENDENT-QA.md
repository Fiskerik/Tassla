# Independent QA — FLOW-KNOWLEDGE-01 (R4d)

**Datum:** 2026-10-18\
**Plan:** `FLOW-KNOWLEDGE-01` v5 · Architect **APPROVE** · Critic **PROCEED** · Dog Expert **PASS**\
**Branch:** `codex/mvp-v2-panel4-checklists-2026-10-16` · local and uncommitted\
**Risk:** M\
**QA:** `/root/r4d_qa`, independent of implementation\
**Implementation review and browser run:** `/root/r4d_reviewer`, independent of implementation\
**Scope:** Published Knowledge surfaces, local search, version-keyed decorative images, article/source/return, FAQ and Checklistor navigation.

## Verdict

**QA PASS for locally testable R4d behavior.** Focused selector/search/workspace tests, typecheck, lint, queue validation and diff check pass. The Reviewer independently ran the final public and review browser matrices: each reports **4 checks passed** and **0 page errors**. QA inspected both saved manifests and all screenshot scenarios but could not execute Playwright in its own environment; the browser execution is therefore Reviewer-run evidence, not an independent QA rerun.

The implementation Reviewer found the grant matrix, age windows, no-fallback selector behavior, title/body-only local filtering and exact-version image map consistent with plan v5. Its initial closeout result was **CHANGES** for stale task/queue status and missing repository evidence. Those records are now synchronized, and the final independent Reviewer closeout recheck is **PASS** with no findings.

## Checks and rendered scenarios

| Check | Result |
|---|---|
| `node --experimental-strip-types --test tests/content-delivery.test.mjs tests/knowledge-search.test.mjs tests/workspace-data.test.mjs` | **33/33 PASS** |
| `pnpm check` | **PASS** · app and edge typecheck, lint, **581/581 tests** |
| Public browser matrix | **4 checks PASS**, `pageErrors: []` |
| Review browser matrix | **4 checks PASS**, `pageErrors: []` |
| `python -m py_compile tools/visual-check/verify.py` | **PASS** |
| `python tools/dev_flow.py validate` | **PASS** |
| `git diff --check` | **PASS** |

The existing local toolchain built the public and review bundles without installing packages. Browser evidence uses a local content bundle and synthetic callbacks; it does not read an account or backend. Each mode includes screenshots for eligible guides at 375×844, 430×844 and 375×667; a clearly labelled visual-only hero-plus-compact-card fixture; article search and source/return; query-empty/clear; selector-empty, unknown age, error and loading; FAQ/Checklistor access; and the 140% CSS text proxy. The two-card fixture places exact published bundle versions together only to inspect layout; it is not an age-eligible selector result and does not change product data.

| Evidence | Public | Review |
|---|---|---|
| Eligible guides at three viewports | [375×844](public/public-knowledge-for-you-375x844.png) · [430×844](public/public-knowledge-for-you-430x844.png) · [375×667](public/public-knowledge-for-you-375x667.png) | [375×844](review/review-knowledge-for-you-375x844.png) · [430×844](review/review-knowledge-for-you-430x844.png) · [375×667](review/review-knowledge-for-you-375x667.png) |
| Hero and compact-card layout | [Screenshot](public/public-knowledge-hero-compact-layout-375x844.png) | [Screenshot](review/review-knowledge-hero-compact-layout-375x844.png) |
| Search and 140% web text proxy | [Search](public/public-knowledge-query-empty-375x844.png) · [140%](public/public-knowledge-140-text-375x844.png) | [Search](review/review-knowledge-query-empty-375x844.png) · [140%](review/review-knowledge-140-text-375x844.png) |
| Browser manifest | [Public results](public/browser-results.json) | [Review results](review/browser-results.json) |

At 140%, Knowledge titles, helper and search status remain visible and there is no horizontal overflow. The shared BottomNav label “Kunskap” wraps onto two lines. This is recorded as a visual observation; the R4d-specific content remains readable.

## Design rules §14

Status applies only to this slice. **NOT TESTABLE** identifies missing evidence and is not a pass.

| # | Status | Assessment |
|---:|---|---|
| 1 | PASS · web | Search, selected guide and opening the guide form a clear path. |
| 2 | PASS · web with note | Hero and compact cards fit at 375/430/short viewport. At the 140% proxy, the shared BottomNav label wraps to two lines. |
| 3 | N/A | This slice has no destructive action. |
| 4 | N/A | This rule concerns Home activity rows; R4d renders Knowledge cards. |
| 5 | PASS · web | Tested viewports have no horizontal overflow; search, cards, and destination controls remain available. Native safe areas are not tested. |
| 6 | PASS · source | Existing shared components and design tokens are used. |
| 7 | PASS · source | The Knowledge images and interface icons use existing local assets/icon family. |
| 8 | NOT TESTABLE | Token colors render, but reference color distribution and independent contrast measurements were not checked. |
| 9 | PASS · web | Search, clear, open-guide, source, FAQ and Checklistor actions perform their stated fixture behaviors. |
| 10 | PASS · web/source | Cards do not imply completion or status; images are decorative and not dog identity. |
| 11 | N/A | No encouragement banner is in this slice. |
| 12 | PASS · web/source | Swedish copy distinguishes eligible, empty, query-empty, unknown, loading and error states. |
| 13 | NOT TESTABLE | Copy hierarchy was not compared against the absent reference image. |
| 14 | PASS · web | Eligible, selector-empty, missing-age/unknown, loading, error/retry and query-empty/clear states are represented. |
| 15 | NOT TESTABLE | RN Web renders labelled `role=tab` elements but omits `aria-selected` for the selected tab. Native screen-reader and device Dynamic Type behavior were not tested. |
| 16 | NOT TESTABLE · direct reference comparison | Current screen captures were reviewed; the exact `vision_rev02.jpg` file is absent from this checkout, so reference similarity cannot be asserted. See the six dimensions below. |
| 17 | PASS · web | Article → source action → return, FAQ and Checklistor destinations are exercised in both public and review fixtures. Real external handoff remains untested. |
| 18 | PASS · source/web | Only the two explicitly mapped existing images appear; they are decorative, version-keyed and have no fallback. Their resemblance to the missing reference cannot be assessed. |

### Point 16 — six visual dimensions

| Dimension | Status | Assessment |
|---|---|---|
| Composition | NOT TESTABLE against reference | Captures show the search field, hero, compact card and Knowledge shortcuts; no reference image is available for comparison. |
| Colors | NOT TESTABLE against reference | Production tokens are visible; color similarity and measured contrast are not independently established. |
| Typography | PASS · web proxy / NOT TESTABLE native | Copy remains visible at 140% CSS text; the BottomNav “Kunskap” label wraps. Device Dynamic Type is not covered. |
| Component shapes | NOT TESTABLE against reference | Existing cards, tabs and buttons render; reference-specific shapes cannot be compared. |
| Imagery | PASS · mapping / NOT TESTABLE similarity | Exact-version mapping and decorative treatment are verified; comparison with reference imagery is unavailable. |
| Content density | NOT TESTABLE against reference | Current eligible and two-card layout are captured; the intended reference density cannot be measured. |

## Data boundary and limitations

- Selector tests cover exact 13/16 and 27/52-week endpoints, gaps, missing age, and no fallback. Only versions `...0004` and `...0006` receive the approved grants. Version `...0002` remains excluded without a recent-homecoming signal.
- Search filters the exact list already supplied to the current tab. It reads title/body locally and adds no database request. Search clears when the tab changes.
- Sources are intercepted by the fixture; no real browser handoff is made. Bundle fixtures do not certify live published rows, Supabase/RLS, or publication state.
- **NOT TESTABLE:** live Supabase/RLS and publication; real external source opening; installed iOS/Android app; VoiceOver/TalkBack; device Dynamic Type; direct screenshot comparison with `vision_rev02.jpg`.
- The React Native Web tab selection attribute gap is recorded but not changed in this slice; fixing shared accessibility behavior would require a separate scoped review.
