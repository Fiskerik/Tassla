# FLOW-KNOWLEDGE-CHECKLIST-UI-02 — rendering and acceptance report

Date: 2026-10-21 · Branch: `codex/dog-profile-search-pilot` · HEAD: `a57e17388d380800c6a378b6368babe6877b4f1c` · Plan: v1

This is an uncommitted local-worktree checkpoint. Browser screenshots use separate React Native Web builds and synthetic fixtures.

## Before and after

The supplied screenshot shows a checklist context card, the full-width review notice, a separate “Läs mer” control, two headings and repeated full-size phase cards. The recommended phase’s intro and progress occupy another large block before the other phases begin. See the captured [before image](../../flow-knowledge-01/review/checklist-review-overview-375x844.png).

The updated overview keeps only the selected mode (“Vald fas” or “Efter ålder”) and its existing edit action. It shortens the shared review label to “Exempel · ej sakgranskat”, presents the recommended phase on an existing editorial puppy image, removes the overview intro and duplicate review disclosure, and puts the remaining five phases in one compact icon-led list with confirmed counts. The generic image is decorative and is not presented as Luna’s profile photo. See [375×844](review/checklist-review-overview-375x844.png), [430×844](review/checklist-review-overview-430x844.png), and [375×667](review/checklist-review-overview-375x667.png).

The nearest visual model in [vision_rev02.jpg](../../../../vision_rev02.jpg) is panel 7’s editorial feature card followed by smaller content cards. This checklist is a support view with no exact panel composition, so the render adopts that hierarchy without claiming a literal panel match. At 375×844 and 430×844 all six phase entries fit in the viewport above the bottom navigation. At 375×667 the list continues vertically; no horizontal overflow was detected. The screen uses the app’s existing warm surface, green selection outline, lavender semantic badges, shared type tokens and generic local image assets.

The browser regression also checks all five secondary phases remain individually openable, the recommended phase remains openable, overview copy does not reappear, and the context/preference route still works. Existing detail, confirmed-progress, public-empty, loading, error, failed/unknown-write recovery, scope isolation, FAQ route, and Training return checks remain in the full KNOW-02 journey. Public mode continues to make zero checklist reads and writes.

## Design rules §14

Assessment applies to this local code and the linked standard-scale React Native Web captures. A “No” or “NOT TESTABLE” below limits the corresponding acceptance; successful functional checks do not convert it into full visual approval.

| §14 | Status | Evidence and limit |
|---|---|---|
| 1. Primary action and next action | Yes | The featured phase and every list row open a named phase; “Ändra” opens the existing context sheet. [Overview](review/checklist-review-overview-375x844.png). |
| 2. Equal actions have equal weight | Yes | The five secondary phases share one row format; the current recommendation is distinctly featured. |
| 3. Delete vs normal action | Ej tillämpligt | No delete action or delete flow changed. |
| 4. Home row conventions | Ej tillämpligt | This is a Knowledge support view, not a Home activity row. |
| 5. Spacing, sections, safe area and margin | Yes, Web | Three viewports render and no horizontal overflow is detected. Native safe-area behavior is NOT TESTABLE here. |
| 6. Shared tokens/components | Yes | Existing tokens, `KnowledgeIconBadge`, `MotionPressable`, and the existing context sheet are reused; no dependency was added. |
| 7. Icon family and meaning | Yes | Existing Ionicons mappings are reused for the phase and context IDs. |
| 8. Reference color distribution | No, partial | Warm canvas, green outline and lavender icons remain consistent; the screen does not reproduce panel 7’s color-chip distribution. |
| 9. Symbol, label and action agree | Yes | Each phase badge accompanies its own title and opens that phase; the edit label opens context selection. |
| 10. Status noise and confirmed progress | Yes | No overview intro or repeated progress sentence; counts use confirmed summaries and the recommended card shows `done/total`. |
| 11. Truthful banners | Yes | Review mode retains one concise “Exempel · ej sakgranskat” marker. Public mode hides review-only content. |
| 12. Everyday Swedish copy | Yes | The overview removes duplicate explanatory prose while preserving phase names and the unknown-birthdate help when it is needed. |
| 13. Copy, metadata and image hierarchy | Yes for this fixture | The generic editorial photo leads, the phase title follows, and progress is secondary. Production content/image selection is NOT TESTABLE. |
| 14. Loading, empty, error and saved states | Yes | Public empty, loading, error, confirmed progress and write-recovery states are captured or exercised in the KNOW-02 verifier. |
| 15. Accessibility matrix | Ej tillämpligt | Per owner decision 2026-10-21, systematic accessibility work is deferred until MVP release and approval. Existing semantics were preserved. |
| 16. Match to rev02 | Partial/open | The feature-image/list hierarchy moves toward panel 7; this support screen has no exact target composition. See the separate dimensions below. |
| 17. Headers and return routes | Yes | Existing FAQ/checklist navigation and Training return routes pass in the full browser journey. |
| 18. Dog scope, image role and relevant content | Yes for synthetic UI | The photo is explicitly generic and checklist rows retain phase scope. Live dog relevance and published content are NOT TESTABLE. |

### §14.16 dimensions

| Dimension | Status | Assessment |
|---|---|---|
| Composition | Partial | Panel 7’s featured-image-then-smaller-card order is adapted to a recommended phase and compact phase list. There is no dedicated reference composition for this support screen, so exact match remains open. |
| Colors | No for exact panel match | Existing warm/green/lavender app colors are coherent, but panel 7’s chip color distribution is not reproduced on this view. |
| Typography | Yes for hierarchy | Existing typography tokens provide a clear selected-mode, phase-title and progress order at the three standard viewports. |
| Component shapes | Yes | A rounded image card leads a shared rounded, divider-separated list; phase rows use one repeated shape. |
| Image language | Partial | An existing generic editorial puppy photo provides the requested warmth and does not imply dog identity. Production image/content assignment is NOT TESTABLE. |
| Content density | Yes at 375×844 and 430×844; scroll at 375×667 | All six phases fit at the two 844-pixel heights. The shorter screen scrolls vertically through the same compact list. |

Visual acceptance is **PARTIAL**, not full rev02 panel acceptance. The checklist overview now follows the closest documented panel 7 hierarchy and removes the excess blocks and repeated copy seen in the supplied image. The remaining limitation is the lack of a dedicated checklist composition in the reference.

## Exact build and captures

- Public: **31/31 PASS**, 0 failures, 0 browser errors, 10 captures. Served JS SHA-256: `d6eadc3464563465dd74e340fae2c9656befbf3a78967f2369307b344d2f9b20`.
- Review: **90/90 PASS**, 0 failures, 0 browser errors, 28 captures. Served JS SHA-256: `1490556e0c78662c2993f5cf0f518b6128747263ee51409c50cdb6e7bed9ec67`. Added explicit open/detail/back checks for each of the five secondary phase rows.
- Both manifests record branch, HEAD, Chromium, viewport, route/state, fixture, served URL, and equality with the exact bundle artifact. See [public manifest](public/browser-results.json) and [review manifest](review/browser-results.json).
- `pnpm check`: PASS, including typecheck, edge-account typecheck, lint, and 65/65 tests. `pnpm bundle:ios`: PASS for the public channel; exported iOS JavaScript bundle SHA-256: `7d110964325f643e25260089171b466b15ed6e11d2f282e34a67552df90e78ff`.
- `python -m py_compile tools/visual-check/verify-know02.py`, `git diff --check`, and queue validation: PASS.
- An Expo/Xcode archive, signed native app and release build were not created; the export is JavaScript bundle evidence only.

## Separate acceptance status

- **Code:** PASS for the local checklist overview slice; phase/data/navigation/write semantics remain unchanged.
- **Local QA:** PASS. Independent QA re-ran `pnpm check` (65/65) and focused tests (3/3), inspected all three standard viewports, all 38 captures and the exact bundle hashes. Reviewer: PASS after confirming the synchronized manifests/report/task/queue and five secondary-phase detail/back checks.
- **Live published content, Supabase and RLS:** NOT TESTABLE; fixtures are synthetic.
- **Native:** NOT TESTABLE in React Native Web; no device verification was performed.
- **Visual acceptance:** PARTIAL/open for full rev02 match, as documented above.
- **Signed build and release:** not created.
