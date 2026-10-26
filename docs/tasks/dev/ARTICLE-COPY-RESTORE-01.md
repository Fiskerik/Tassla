# ARTICLE-COPY-RESTORE-01 — återställ originaltexter och ta bort profilpersonalisering

Plan v2 · local implementation checkpoint · 2026-10-25

Plan v2 adds `tests/content-delivery.test.mjs` after `pnpm check` exposed one existing assertion that still requires article-title personalization. This is a directly affected regression contract, not a product-scope expansion. Architect APPROVE and Critic PROCEED confirmed the delta before the assertion was updated.

## Mål och mandat

Återställ de tre Drive-artiklarna till källornas exakta generiska ordalydelse och visa samma artikeltext oberoende av hundens namn eller kön.

Mandat: Eriks uttryckliga instruktion i denna arbetsgren 2026-10-25: ”Vill att vi återställer artiklarna till original och INTE hänvisar till något av valpens/hundens namn eller pronomen i texten.” Exakta original lästes skrivskyddat från Drive: `01_Forsta_dygnet_hemma.docx` (`1fRBAmcWvjYY7qZhNJNfIqELQ6WgGvfcc`), `02_Rumsrenhet.docx` (`1GmbcxvE7mWDibrgUFbE3ZsCDwVte4U-P`) och `03_Valpens_somn.docx` (`12s7ykNsBiyqGReyWrTdQj9JfI2VHyLEn`). Behåll deras innehåll, befintliga ålders-/rasregler, ämnesmetadata, källreferenser och publicerade versionshistorik. Strukturell Markdown för rubriker är endast presentation; inga artikelmeningar skrivs om.

Produktgranskning: Product scope godkänd och Critic PROCEED 2026-10-25. Inget nytt dataändamål eller urvalssignal tillkommer. Dog Expert PROCEED för ordagrann återställning utan omedelbar välfärdsrisk; separat veterinärsakgranskning av medicinska påståenden är fortfarande öppen och får inte beskrivas som utförd. Architect APPROVE för framåtriktad importrevision i plan v1: receipt-nyckeln ska utökas med `review_reference`, samma källhash får en ny immutable version endast med ny referens och senare granskningsdatum, gamla versioner och receipts bevaras, identisk retry återanvänder versionen.

## Avgränsning

**Ingår:** återställ källtexterna i importmanifest och publikera nya oföränderliga artikelversioner via en ny migration; låt samma källfil kunna få en ny ägarattesterad payloadrevision utan att skriva om historiska versioner; ta bort namn-/könspersonalisering i Kunskap och Hemmets artikelutdrag; håll framtida import fri från personliga platshållare.

**Ingår inte:** ändra Drive-filer, göra live-import eller live-migrering, verifiera TestFlight-/serverstatus, skriva om råd, lägga till nytt innehåll/urval eller ändra artikelns layout. Fullbreddslayout, ingress, karusell och den permanenta läsregeln hanteras i `ARTICLE-READING-EXPERIENCE-01`. Hundradering hanteras separat i `DOG-PROFILE-DELETE-01`.

## Bas, ägare och risk

- Bas: `07cd4da19b266a30f1ba13f01ede5c40098a645d` (`fix: refine checklist and knowledge visuals`) på `codex/ui-visual-review-loop`.
- Skrivägare: Codex-koordinatorn; ingen annan skriver i uppgiftens paths.
- Risk: H — publicerat råd, innehållsimport och versions-/granskningshistorik ändras.
- Beroenden: `KNOWLEDGE-D3-CATALOG-SCHEMA-01`, `VISION-R02-3C` och aktuell branch-checkpoint (klara).
- Skyddat: externa Drive-filer, live Supabase, signerad build, publicering/distribution, veterinärpåståenden.

## Skrivvägar

- `docs/tasks/dev/ARTICLE-COPY-RESTORE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/content/artiklar/drive-articles-v1.json`
- `docs/content/artiklar/README.md`
- `tools/sync_drive_articles.py`
- `tests/test_drive_articles.py`
- `tests/content-delivery.test.mjs`
- `tests/article-delivery.test.mjs`
- `src/content/article-targeting.ts`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-drive-articles.py`
- `supabase/migrations/202610250001_article-review-revisions.sql`
- `supabase/tests/article-review-revisions.sql`

## Acceptans och bevis

| Kriterium | Kontroll/evidens | Status |
|---|---|---|
| Titel och brödtext för alla tre poster matchar Drive-originalen ord för ord; endast rubrikernas Markdown-markörer tillkommer. | Källhashar och textfingeravtryck dokumenterade; `tests/test_drive_articles.py` 7/7 och `tests/article-delivery.test.mjs` verifierar tre kanoniska fingerprint. | PASS lokalt |
| Inga `{{dog.*}}`-platshållare eller profilbaserad person-/könsersättning finns kvar i importer, sökresultat, Kunskap, Hemmets artikelutdrag eller fixture. | Python/Node-prover; `tests/content-delivery.test.mjs`; 12 RN Web-scenarier med Nemo/hane, Nala/tik och Max/ej angivet vid 375/430 px. | PASS lokalt |
| Ny granskad revision med oförändrad Drive-hash/-modified_time och nyare ägarreferens skapar ny publicerad version, drar tillbaka föregående utan att radera den och ger samma versions-ID vid exakt retry. | Forward-only migration och rollback-SQL-prob skriven; Security PASS. PostgreSQL-runtime ej körbar här då Docker-daemonen inte är åtkomlig och psql/Supabase CLI saknas. | Kod/prob PASS statiskt; runtime NOT TESTABLE |
| Källans ålder/ras/hemkomstdatum, sökning och rätt att läsa hela publicerade biblioteket ändras inte. | Befintligt `fetchKnowledgeContent`-test i artikelleveranssviten och samma render-/regressionstest. | PASS lokalt |
| `pnpm check`, verifieringsskript, `python -X utf8 tools/dev_flow.py validate` och `git diff --check` passerar. | `CI=1 pnpm check` 83/83; Python-importtest 7/7; visuell verifiering 12/12; queue validation, py_compile och diff-check PASS. | PASS lokalt |
| Ingen live-Supabase-import/-migrering eller iPhone/TestFlight-verifiering påstås. | Ingen live-/enhetsåtgärd utförd. | NOT TESTABLE, korrekt avgränsat |

## Specialist- och UI-granskning

- Product: PROCEED. Critic: PROCEED för scope 2026-10-25.
- Dog Expert: PROCEED med notering att medicinska källpåståenden fortfarande kräver veterinärsakgranskning före en ny extern release; granskningen verifierar inte dessa påståenden.
- UI Critic BRIEF på befintlig 375×844-render: identifierade inramad artikel, färgad ingress och saknad hundrelevant karusell. Layoutändring tillhör den beroende separata UI-tasken; inga visuella godkännanden görs här.
- Architect: APPROVE plan v1. Samma Drive SHA och `modified_at` kan revideras med nyare `review_reference`/`reviewed_at`; receipt-ID blir `(source_id, source_hash, review_reference)`; gammal payloadhistorik ska bestå.
- Security: PASS för plan v1. Behåll `SECURITY DEFINER`, tom `search_path`, källans advisory lock, endast service_role-exekvering och tidigare receipts/versioner; granska faktisk migration/SQL-probe före implementation.
- Critic: PROCEED för implementationstask v1. Generic original words such as `valpen` and `den` remain verbatim under the owner’s exact-restoration instruction.
- QA och Reviewer: read-only efter implementation.

## Checkpoint

Plan v1 har Architect APPROVE, Security PASS och Critic PROCEED. Plan v2 lägger endast till `tests/content-delivery.test.mjs`; Critic PROCEED och Architect APPROVE efter att full check hittade en assertion från det upphävda personaliseringskontraktet. Ägarens senaste förtydligande bekräftar att hundradering saknas i dag och tillhör en separat task; skärmbilden avser kontoradering och ger inget säkert besked om serverns slutstatus.

Implementerad lokalt inom frysta skrivvägar: kanoniskt JSON återställer de tre källornas titel/brödtext och granskningsreferens; importer och klientrendering avvisar/tar inte emot personliga hundtokens; regressionstester verifierar textfingeravtryck och samma text för syntetiska profiler; forward-only review-revision-migration och rollback-prob är skrivna. README och Master Log markerar 2026-10-25-beslutet som gällande och tidigare personaliseringsregel som upphävd. Security granskade den faktiska migrationen/proben och gav PASS; SQL-runtime är ännu inte körd eftersom Docker-daemonen inte är åtkomlig och ingen psql/Supabase CLI finns i miljön.

Efter v2-godkännande ersattes den gamla assertionen med krav på direkt generisk titelrendering och frånvaro av personaliseringssymboler. `CI=1 pnpm check` passerar (typecheck, edge typecheck, lint och 83/83 testfiler); riktad Python 7/7, verifieringsharness 12/12 vid 375/430, Python-kompilering, `tools/dev_flow.py validate` och `git diff --check` passerar. Läsar-/artikelbilderna är kontrollerade, men den större fullbreddslayouten och relevanskarusellen hör till nästa task.

Oberoende QA gav PASS efter att själv ha kört `CI=1 pnpm check` (83/83) och kontrollerat alla skrivvägar/dokumentstatusar. Efter QA:s PASS gjordes en dokumentationsrättning som markerade 2026-10-24-layoutbedömningen som historisk; QA gjorde en andra read-only kontroll och gav PASS. Frozen Reviewer gav därefter PASS; tasken är stängd i kön som lokal kodcheckpoint. Ingen live Drive-, Supabase- eller TestFlight-åtgärd har utförts. SQL-proben är inte runtime-körd här; veterinärsakgranskning av de bevarade påståendena kvarstår separat.
