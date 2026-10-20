# CONTENT-PUBLISH-LABEL-01 — publicera MVP-innehåll med AI-ursprung

Plan v1 — 2026-10-18

## Mål
Publicera de tio runtime-stödda v1-versionerna från `mvp-content-approval-v1.md`, behålla `before-homecoming` som draft och visa en tydlig svensk AI-ursprungsetikett när publicerat innehåll öppnas i Kunskap. Samma ursprungsfält följer med innehåll och träningsprogram för att undvika dold/inkonsekvent provenance.

## Slice A: lokal modell, UI och reproducerbar SQL

**Risk:** H (schema, publicering, läsbehörighet); inga nya persondata eller beroenden.

**Filer:** `docs/tasks/dev/CONTENT-PUBLISH-LABEL-01.md`, `docs/plans/CONTENT-PUBLISH-LABEL-01-ux-spec.md`, `docs/tasks/dev/queue.json`, `docs/decisions/MASTER-LOG.md`, `src/data/app-data.ts`, `src/data/workspace-data.ts`, `src/features/knowledge/KnowledgeScreen.tsx`, `src/features/knowledge/review-content.ts`, `src/features/training/PublishedTrainingScreen.tsx`, `tests/content-delivery.test.mjs`, `tests/workspace-data.test.mjs`, `tests/training-activity-date.test.mjs`, `tests/content-bundle.test.mjs`, new numbered migration in `supabase/migrations/`, `supabase/content/mvp-content-v1.sql`, `supabase/content/publish-mvp-content-v1.sql`, `docs/content/README.md`, `supabase/README.md`, checkpoint report.

**Implementation:** Apply the new migration adding `is_ai_generated boolean not null default false` before importing content or shipping app code that selects it. Mark all eleven v1 records as AI-origin in the draft import. The publish SQL locks all eleven version rows in stable ID order, checks the ten approved IDs/slug/type/version/title/age bounds and canonical body/sorted-source hashes, then sets publication status and the existing approval metadata. It aborts on a mismatch or protected published rows with conflicting values. It verifies the onboarding-only row’s exact identity/body/source/status/AI-origin and leaves it draft. Select/validate/map the field in both content loaders and show `AI-genererat innehåll` on opened knowledge and training details, including an opened step; do not change citations or imply expert status.

**Acceptance:** the migration is applied before code deploy/import; all ten runtime-supported records pass publish-time canonical identity/type/title/body/source checks and are published with `is_ai_generated=true` by reviewed SQL even if previously imported; onboarding-only exists exactly once, is exact, and remains draft with AI-origin true; non-AI rows remain compatible via default false; an opened AI-origin item shows the badge and human-authored content does not; sources and dog-specific age selection remain unchanged; local validators/checks pass; remote DB is only reported applied after a successful real target readback.

**Checks:** `python tools/validate_content_bundle.py --publication-check`, focused content-delivery and workspace-data node tests, `pnpm check`, `git diff --check`. Database execution/readback is separate and currently expected NOT TESTABLE unless a verified local Supabase link/credential is found.

**Dependencies/guards:** Erik’s explicit request authorizes publishing these approved runtime rows. Approval evidence is `docs/content/mvp-content-approval-v1.md`; preserve the recorded review timestamp/reference without inventing new review evidence. Apply migration → draft import → publication SQL → readback → app rollout. Preserve `before-homecoming` draft. Do not run SQL on a remote environment unless the intended development project is positively identified and its connection is available. Save Architect/Security/QA/Reviewer findings before closing the queue task.







## Resultat för lokal checkpoint

2026-10-18: Lokal implementation klar och kontrollerad: `python tools/validate_content_bundle.py --publication-check`, `pnpm check` (493/493), `pnpm bundle:ios`, `git diff --check`; Architect, Security, QA och Reviewer har PASS för lokal källkod/statisk granskning. Det här stänger inte live publicering: Supabase-projektet kunde inte verifieras från miljön, så migration, import, publish SQL och readback är NOT TESTABLE och inget databasinnehåll har ändrats.
