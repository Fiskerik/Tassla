# TRAINING-PROGRESSION-01 — lokal verifiering

Datum: 2026-10-24. Körningarna avser syntetiska data på arbetsgrenen `codex/agent-workflow-stabilization`.

## Kontroller

- `pnpm check` — PASS: TypeScript, edge TypeScript, ESLint och 80/80 Node-testfiler.
- `python -X utf8 tools/dev_flow.py validate` — PASS.
- `git diff --check` — PASS.
- `python tools/visual-check/verify-flow-training.py` — PASS 23/23 public och 23/23 review. Resultat och skärmbilder finns i `public/` och `review/`; respektive `RESULTS.json` har testnamnen.
- Manuell jämförelse med panel 6 och §14 per punkt: [`visual-review.md`](visual-review.md); referensbeskärning finns i `panel6-reference-crop.png`. Visuell likhet är fortsatt partiell, och native-tillgänglighet är inte verifierad.
- Samtliga 21 migrationsfiler följda av `supabase/tests/training-progression.sql` — PASS i PGlite 0.3.14 med syntetiska auth-roller och `auth.uid()`-stub. Detaljer och utfall finns i `sql-check.txt`.
- `git diff --check` kontrollerar whitespace; skärmbilder lästes manuellt för översikten, sparat pass och explicit stegbyte.

## Vad som verifierades

De riktade testerna och RN Web-fixturerna täcker exakt version/hundscope, äldre legacy-markeringar, träningsresans start/återupptagning, separat passlogg och delmålsbekräftelse, uttryckligt nästa/back/paus/underhåll, slutsteg, Home-länk till sparad version, läs-/källfel, unknown retry med samma operation-ID/payload, stor-text-proxy och en aktiv stegmarkering. Dataadapterns pagineringstest läser 45 pass över två sidor (40 + 5) med stabil tidsstämpel/ID-sortering. En separat kontraktsassertion håller versionsradens lås före validering och första mutation. SQL-fixturen provar roller/grants, ägarisolering, hund-/versionsvalidering, idempotent replay, payloadkonflikt, withdrawal replay, hund- och kontokaskad samt oförändrat `training_progress`.

## Begränsningar

Ingen live migration eller Supabase-miljö användes. PGlite-fixturen körde inte två oberoende samtidiga anslutningar; unik hund/version-constraint och hundradslås finns, men parallell race verifieras inte direkt. Verklig Supabase/PostgREST/JWT/RLS, hund-/kontoborttagning i drift, iOS/VoiceOver/native Dynamic Type och TestFlight återstår. Den visuella jämförelsen mot panel 6 är dokumenterad som partiell i [`visual-review.md`](visual-review.md). Innehåll från bilagan som påstår sex inkallningssteg, källor eller sakgranskning ingår inte; ingen ny träningsrådstext har publicerats.
