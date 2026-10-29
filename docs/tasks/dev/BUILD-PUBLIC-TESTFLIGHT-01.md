# BUILD-PUBLIC-TESTFLIGHT-01 — publikt innehåll i ordinarie TestFlight-flöde

Status: `done` · Plan v1 · Skrivägare: huvudsessionen.

Bas: `main@be2efa60ad6cdbbd6bf209194425b2fd03d1679e`, vanlig branch `fix/mvp-build-feedback`. Mandat: Eriks uttryckliga instruktion 2026-10-29 att ändra Codemagic från review till public. Risk L: tre konfigurationsvärden ändras i befintlig pipeline; samma signering, buildnummer och TestFlight-distribution bevaras. Ingen pipeline startas av detta arbete och inga app-/server-/databasändringar ingår.

## Omfattning och skrivvägar

- `codemagic.yaml`: befintligt `tassla-ios` behåller sitt ID men får public-namn, `TASSLA_BUILD_CHANNEL=public` och `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false`. Artefaktworkflowen och App Store-inställningen bevaras.
- `docs/dev/review-content-builds.md`: dokumentera de faktiska workflow-inställningarna.
- `docs/tasks/dev/ACCOUNT-DELETE-STATUS-01.md`: registrera ägarens nya felrapport utan att anta serverutfall eller upprepa radering.
- `docs/tasks/dev/BUILD-PUBLIC-TESTFLIGHT-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`
- `docs/decisions/MASTER-LOG.md`

Ingen UI-ändring, expertgranskning eller arkitekturändring behövs för denna konfigurationsslice. Riktad QA utförs av skrivägaren; en separat read-only Reviewer granskar slutdiffen enligt L-riskflödet.

## Acceptans

1. YAML kan läsas med PyYAML. Bara standardworkflowens namn och två innehållsvariabler skiljer sig från basen i YAML-objektet.
2. Båda workflowens miljövärden passerar den riktiga `tools/check-content-release.cjs` och skriver metadata `channel: public`, `reviewContentEnabled: false`.
3. Befintliga guard-tester fortsätter avvisa public med review-innehåll. Signering, buildnummer, `submit_to_testflight` och `submit_to_app_store` är oförändrade.
4. Dokumenten skiljer kanaländring från kontoraderingsfelet och verifierad Codemagic-/TestFlight-körning.
5. `pnpm check`, `git diff --check`, kövalidering och oberoende Reviewer PASS före slutcheckpoint.

## Checkpoint

- Implementerat: kanalbyte och dokumentation; ägarrapport om fungerande hundradering och fortsatt okänd kontoradering sparad.
- Riktad QA PASS: PyYAML läser båda workflows; semantisk basjämförelse visar exakt tre ändrade värden. Båda workflow-miljöerna körde den verkliga guard-processen och gav public/false-metadata. Befintliga guard-tester PASS. `CI=1 pnpm check` PASS (TypeScript, Edge TypeScript, ESLint, 100/100 testfiler); diffcheck PASS. Oberoende Frozen Reviewer PASS på slutdiff, alla åtta deklarerade paths och verifieringslogg; inga blockerande fynd.
- Codemagic, signerad IPA, faktisk katalog i Supabase och kontoradering i drift är inte verifierade genom denna uppgift.
