# KNOWLEDGE-PHASE-CATALOG-01 — publicerad faschecklistekatalog v1

Planversion: **v8**. V8 applies the owner's latest spacing correction: numbered source links have no additional inter-link gap, while each control retains its 44×44 pt target. All six phase details keep a low banner with the whole dog face visible; sources show only small `1) 2)` marks with no visible label, title or URL. Existing local editorial photos are reused. Generated-SQL parity remains a mandatory preflight: the validator compares both embedded SQL payloads and digest references with the reviewed JSON before either SQL script may be run. Disposable PostgreSQL 16 runtime verification is complete; independent QA and Reviewer remain before closeout.

## Uppgiftskontrakt

| Fält | Innehåll |
|---|---|
| ID / status | `KNOWLEDGE-PHASE-CATALOG-01` / `done` |
| Bas | `origin/main@ff3af0bcfe5c29cd1077ac45fce622e60c7bdee4`; separat lokal branch `knowledge/d3-catalog-delivery` |
| Mål | Göra de sex befintliga faschecklistorna till en versionsmärkt, källbelagd publicerad katalog som appen kan läsa utan att ändra användarens sparade progress eller egna punkter. |
| Mandat | Ägarens instruktion 2026-10-26 att fortsätta actionplanens paket 2/Kunskap; `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md` §2; godkänt D3-schema-/mappingkontrakt v5 och migrationen `202610240002_knowledge_catalog.sql`. Ägarens acceptans av andra nämnda öppna punkter dokumenteras som accepterade avgränsningar, inte som körda tester eller nya sakkunniggranskningar. |
| Bevara | Alla sex `review-v1:*`-template-ID:n, samtliga 18 befintliga item keys, owner progress/custom item/icon/context rows, public/review-separation, published-only RLS och befintliga checklist UI-fel-/sparlägen. Åldersfönster är katalogurval, inte milstolpslöften. |
| Ingår | Källspårad faslistversion 1; sakkunniggranskning av exakt svensk copy före innehållsapproval; strikt innehållsvalidator; separat idempotent draft-import och separat publiceringsskript mot det befintliga D3-schemat; appens publicerade katalogläsning och visning av källor; behåll review-fixtures bakom nuvarande explicita flagga; regressionstester/renderbevis samt dokumenterad handbok/status. Fasbilderna får en låg banner där hela hundansiktet syns utan att klippas; källor visas endast som små numrerade länkar (`1) 2)`), utan synlig etikett, titel eller URL, men med full tillgänglig källidentitet och 44×44 pt tryckyta. |
| Ingår inte | FAQ-katalogen (egen nästa slice); nya råd eller semantiskt nya checklistpunkter; migration/schema/ACL/RLS-ändring; någon live Supabase-anslutning, migration, import eller publicering; veterinärgranskning av andra artiklar; ändring av D2/D5/dog deletion verifieringsstatus; ämnestaxonomi eller rekommendationslogik; annan skärm/navigering/dependency. |
| Ägare / granskare | Skrivägare: Codex-koordinator. Förhand: `dog_expert` copy/source review; `architect` adapter-/cache-/datakontraktsreview; `security` review av läsgrind och content-write scripts; `critic` planreview; UI Critic brief + review för ändrad checklistdetail; därefter oberoende QA och Reviewer read-only. |
| Beroenden / risk | `KNOWLEDGE-D3-CATALOG-SCHEMA-01` (done). H-risk: befintlig hundprogress och katalogens publicerings-/RLS-gräns. |

## Läsunderlag

- `AGENTS.md`, `docs/dev/workflow.md`, `docs/tasks/template.md`.
- `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md` §2 och D3-schema v5.
- `docs/content/README.md` och `docs/content/mvp-content-approval-v1.md`.
- `docs/design-rules.md`, `docs/design/vision-rev02-screen-contracts.md`, `.agents/skills/tassla-consumer-ux/SKILL.md`.
- `src/features/knowledge/checklist-model.ts`, `checklist-content.ts`, `checklist-data.ts`, `PuppyChecklistScreen.tsx`, `source-links.ts`, `README.md`.
- `supabase/migrations/202610040001_foundation.sql`, `202610110002_puppy_checklists.sql`, `202610180002_content_ai_origin.sql`, `202610240002_knowledge_catalog.sql`; directly affected SQL probes and Knowledge tests/harness.
- Officiella källor öppnade 2026-10-26: RSPCA Puppy Care, RSPCA left-alone training, RSPCA home environment, RSPCA recall guidance, AVSAB Humane Dog Training Position Statement 2021, AVSAB Puppy Socialization Position Statement. SVA används inte eftersom RSPCA Puppy Care redan stöder den praktiska punkten om att hitta veterinär. Se reviewfilen för exakta URL:er, stöd och caveat per punkt.

## Planerade skrivvägar

- `docs/tasks/dev/KNOWLEDGE-PHASE-CATALOG-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md`
- `docs/content/README.md`
- `assets/images/README.md`
- `docs/content/knowledge-phase-checklists-v1.json`
- `docs/content/knowledge-phase-checklists-review-v1.md`
- `tools/validate_knowledge_catalog.py`
- `supabase/content/knowledge-phase-checklists-v1.sql`
- `supabase/content/publish-knowledge-phase-checklists-v1.sql`
- `supabase/tests/knowledge-phase-catalog-content.sql`
- `src/features/knowledge/checklist-model.ts`
- `src/features/knowledge/checklist-data.ts`
- `src/features/knowledge/PuppyChecklistScreen.tsx`
- `src/features/knowledge/source-links.ts`
- `src/features/knowledge/checklist-phase-visuals.ts`
- `src/features/knowledge/README.md`
- `tests/knowledge-catalog-content.test.mjs`
- `tests/checklist-data.test.mjs`
- `tests/checklist-ui.test.mjs`
- `tests/ui-copy-cleanup.test.mjs` (update the stale review-flag assertion after the public loader was refactored)
- `tools/visual-check/know02-app.tsx`
- `tools/visual-check/verify-know02.py`
- `docs/design/evidence/knowledge-d3-catalog-v1/results.json`
- `docs/design/evidence/knowledge-d3-catalog-v1/browser-results.json`
- `docs/design/evidence/knowledge-d3-catalog-v1/VERIFICATION.md`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-review-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-detail-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-detail-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-detail-bottom-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-detail-bottom-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-empty-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-error-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-overview-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-overview-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-partial-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-3_6_months-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-3_6_months-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-6_12_months-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-6_12_months-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-8_12_weeks-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-8_12_weeks-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-3_6_months-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-3_6_months-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-6_12_months-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-6_12_months-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-8_12_weeks-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-8_12_weeks-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-first_days-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-first_days-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-over_1_year-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-bottom-over_1_year-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-first_days-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-first_days-430.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-over_1_year-375.png`
- `docs/design/evidence/knowledge-d3-catalog-v1/checklist-public-phase-over_1_year-430.png`

If review finds a necessary path outside this exact list, pause, add it to a new plan version, and rerun the affected review gates before editing it.

## Acceptanskriterier och bevis

| Kriterium | Bevis / kontroll | Resultat |
|---|---|---|
| Dog Expert reviews exact Swedish phase intros, the 18 item labels and their source map; all public copy is PASS or its documented caveats are applied. No item enters a publishable bundle while UNSUPPORTED/UNSAFE remains. | Exact-copy review recorded in `knowledge-phase-checklists-review-v1.md`; review re-run after edits. | PASS; expert reviewed the checked source excerpts, which the coordinator opened. No veterinarian signoff. |
| JSON includes exactly six stable phase slugs, contexts, approved age metadata, 18 original stable `(template_id,item_key)` pairs, explicit reviewed copy, source IDs/URLs and review reference. Existing approved bundle v1 is untouched. | `python -X utf8 tools/validate_knowledge_catalog.py`; structural tests; key-set parity against source registry and approved D3 mapping. | PASS |
| Draft import is transactional and idempotent only for exact matching data; it refuses mismatches/duplicates and creates no dog-owned progress, custom-item, icon or preference rows. Publication is separate and requires all six complete, reviewed versions and 18 exact children. Scripts require a trusted database-owner/admin context outside the app/Edge Functions; they add no grants and do not use `service_role` for mappings or child rows. | Disposable PostgreSQL 16.15: D3 migrations; foundation, puppy-checklist, icon and catalog probes; import twice; alter one reviewed title and confirm import refuses; restore, publish separately; run phase-catalog published-only RLS/owner-data probe. | PASS on the disposable fixture; no live Supabase operation. |
| Before either SQL script is run, the preflight validator parses both embedded JSON payloads, compares every imported field and URL to the reviewed bundle, and checks the embedded digest/review references. It rejects duplicate phase/version/item identities. | `python -X utf8 tools/validate_knowledge_catalog.py`; `tests/knowledge-catalog-content.test.mjs` mutates a SQL payload and confirms rejection. The same validator passed immediately before the PostgreSQL script run. | PASS |
| Public means the ordinary authenticated, non-review app experience, not anonymous access. It reads only rows allowed by published-only RLS, validates the complete six-phase/key set and renders source links safely. The app never uses `service_role`; review mode cannot bypass RLS. Review fixtures remain inaccessible in public mode. | Focused adapter/UI tests plus public/review harness and disposable PostgreSQL published-only RLS probe. | PASS for local adapter/harness and disposable PostgreSQL; live Supabase/RLS remains unverified. |
| Existing progress, custom rows/icons, context selection, retry/unknown handling, and cache/scope isolation continue to work with published versions. | Checklist regression tests, existing owner-grant SQL probes in disposable PostgreSQL, `pnpm check`. | PASS; 85 test files and direct owner/catalog SQL probes passed. |
| Public checklist interactions work after a complete published catalog is loaded: phase selection, saved context choice, progress toggle, custom item CRUD, retry/reconciliation and cache restoration use the same stable template/key IDs. No operation is allowed before a validated template is loaded. | Focused public/review interaction and regression tests, including existing failure/unknown cases. | PASS |
| The catalog adapter performs three RLS-scoped reads: mapped `checklist_templates` → `content_versions` where `status=published` for the mapped `content_item_id`s → `content_version_checklist_items` for those version IDs. It validates exactly six mapped roots, contexts, unique published versions and all 18 expected `(template_id,item_key)` pairs. Empty catalog yields the existing honest empty state; partial/malformed catalog is an error. | Adapter contract tests and disposable SQL publication/read probe. | PASS; live RLS is not implied. |
| Review cache and public cache remain separate. Public cache identity changes with the sorted set of returned published `content_versions.id`s, and a newly published version cannot reuse stale titles, body, sources or age metadata. | Cache tests cover content-version change and public/review/session/dog scope isolation. | PASS |
| Each of the six phase detail views has a low decorative image banner at the top, using a per-phase focus over existing local assets; the full dog face is visible and not clipped at the top or sides. It does not become a checklist/progress card or obscure the task. | Render every mapped phase at 375/430px, inspect all six face crops, and verify decorative accessibility state and banner height (target 80–96 pt). | PASS; UI Critic checked all six faces at both widths. |
| After checklist actions, sources remain directly tappable but compact: show only small numbered marks such as `1) 2)` outside the card, with no visible label, publisher/title rows or URLs. Numbered targets touch edge-to-edge with zero additional gap while remaining visually distinct. Each accessible link name identifies the reviewed source title and publisher; unknown URLs fail closed. Each mark has a minimum 44×44 pt touch target and stays reachable above the fixed footer after scrolling. | Source-metadata lookup tests cover all seven bundle URLs; public render shows only smaller numbered links; UI Critic checks the 0-gap render; scroll every phase at 375/430px and verify the final link stays above navigation; tap a link in the synthetic harness without horizontal overflow. | PASS |
| The changed checklist detail is assessed against its existing support-screen contract; behavior/accessibility, UI Critic brief/review, independent QA and Reviewer are recorded separately. | Saved public/review captures and review reports in `docs/design/evidence/knowledge-d3-catalog-v1/`; no claim of native/iPhone validation. | UI Critic, independent QA and frozen Reviewer PASS on the zero-gap adjustment. |
| App-code changes export successfully for iOS using the repository's review-content build channel. | `TASSLA_BUILD_CHANNEL=review EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true __UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home pnpm bundle:ios`. | PASS; JS/assets exported to `dist/ios`; this does not verify signing, installation or device behavior. |
| Docs, queue and plan distinguish local implementation from any live import/publication or runtime/RLS verification. Exact changed paths match this write list. | `python -X utf8 tools/dev_flow.py validate`; JSON parse; `git diff --check`; final path audit. | PASS; independent QA and frozen Reviewer PASS. |

## Public copy and version contract

The content may improve clarity and add safety/individual-pace caveats, but it must retain each existing key's meaning and identity. Do not claim that a dog should achieve a skill within its displayed age band. Handle, recall, alone-time and exploration wording must remain voluntary, gradual, safe and responsive to the individual dog. Do not include veterinary schedules or treatment claims. The owner has accepted that the pre-existing D2/D5/native-delete/article-review evidence gaps need not block this Knowledge slice and asked that the image-focus queue be reconciled; the separate checkbox Critic review remains planned. This acceptance does not convert any gap into a passed verification or extend the dog-expert review beyond this exact new catalog.

Catalog root/version/child rows use the approved D3 schema and exact stable mapping. Public mode may render only the published catalog; no fallback to local review text is allowed. Review mode remains explicit and separate. A missing/empty published catalog stays an honest empty state; a partial/malformed catalog is a read error, not a fabricated partial success. Keep existing user-owned progress/checklist semantics and never reset or migrate those rows in this task.

The app adapter reads mapped templates, then only their `published` versions, then the child rows for those version IDs. It validates the full six-phase catalog against the unchanged key registry. The screen uses the local checklist copy only in the explicit review mode; ordinary authenticated mode uses the validated catalog for both display and the existing owner-scoped checklist mutations. Keep all six versions and 18 children in one publication transaction. Cache keys are split by public/review mode, dog/session scope, and—for public data—the sorted published version-ID set.

Phase intro copy to use: `before_homecoming` — “Förbered det som kan göra starten lugn och trygg.”; `first_days` — “Låt hunden landa i sin egen takt.”; all four age-selected phases — “I läget Efter ålder väljs en lista utifrån hundens ålder. Punkterna är förslag, inte mål.” Dog Expert reviewed the exact combined JSON and source map; official pages were opened by the coordinator, not the expert, and no veterinary approval is implied.

## Checkpoint

- Current state: D3 catalog, content review, adapter and numeric source metadata lookup are implemented locally on `knowledge/d3-catalog-delivery`. V5 added low per-phase banners and accessible numbered links. The owner clarified that all six full dog faces must remain visible and source UI must show only small `1) 2)` marks, with no visible “Referenser” label. V8 removes the extra gap between adjacent source controls while preserving their minimum 44×44 pt target.
- Current UI result: all six faces pass the 375/430 synthetic render checks. The source row contains only small `1)`/`2)` links with no visible label, title or URL; the 0-gap treatment is visually distinct, targets remain 44×44 pt, and long-phase bottom scrolling passes. UI Critic final review is PASS. This is synthetic RN Web evidence, not native/iPhone validation.
- Security and Architect initially found the publication script's duplicate `DECLARE`, weak duplicate/missing-row guards and missing SQL-to-JSON parity check. Those findings are corrected; both reviewers gave focused static PASS. The validator now compares each imported field and URL in both SQL payloads with the reviewed JSON and checks the review SHA-256 references. The validator is a required pre-execution step; the SQL scripts do not recompute the JSON digest.
- Disposable PostgreSQL 16.15 runtime: affected migrations plus existing foundation, puppy-checklist, icon and D3 catalog probes pass; import is idempotent on second run, rejects a mismatched reviewed title, publication passes separately, and the new published-only RLS/owner-data probe rolls back successfully. The container had no network or host ports, used a read-only repository mount and synthetic data. No live Supabase operation occurred.
- `pnpm check` passes (85 test files); UI verifier 128/128; Dog Expert, Architect, Security, plan Critic, UI Critic, independent QA and frozen Reviewer decisions are recorded.
- Review-channel `pnpm bundle:ios` exports the iOS JS bundle/assets to `dist/ios`; it does not verify a signed build or physical device. The successful output is recorded in `VERIFICATION.md`.
- Final checkpoint lists the actual diff, executed local/disposable checks, frozen Reviewer findings, unverified runtime/native/live-D3 status, and the next Knowledge slice (FAQ catalog).
