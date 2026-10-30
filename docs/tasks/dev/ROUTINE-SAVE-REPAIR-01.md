# ROUTINE-SAVE-REPAIR-01 — giltiga rutiner går att spara

Status done (lokalt verifierad rättning) · plan v1 · risk H (framåtriktad SQL-rättning) · bas 8620e72ec1bb78c34c26c1f2e90e046cba619c7f · branch fix/routines-training-flow · root ensam skrivägare.

Mandat: Eriks sparfel 2026-10-30. Lokal PostgreSQL17.5/PGlite0.3.14 reproducerar 42883: senaste validatorn i 202610220001 anropar obefintlig pg_catalog.jsonb_object_length. create_daily_routine_v2 och replace_daily_routine_v2 använder den. Produktionsloggen är inte tillgänglig; detta bevisar ett konkret fel i repoets migrationskedja, inte den enskilda telefonbegärans serverstatus.

Ny migration ersätter endast private.valid_daily_routine_checklist. Kontrollera objektform först och räkna sedan jsonb_object_keys med count(*). Bevara alla exakta fält, typer, UUID, trimning, dubblettskydd, max50/160, valfri tillåten ikon, IMMUTABLE, tom search_path och ACL. Äldre migreringar, RLS, RPC/API, data och appkod ändras inte. Inga liveåtgärder, dependencies i appen, deploy eller riktiga konton. PGlite används som tillfälligt verifieringsverktyg utanför repot enligt redan etablerat tools/verify-insights-today-sql.mjs-mönster.

Acceptans: riktat verktyg bootstrappar verkliga migrationskedjan från foundation/daily activities/routine checklist/repeat weekdays/icons och visar samma faktiska create-v2 RPC misslyckas med42883 före fix och sparar korrekt efter. Idempotent retry, replace/revision och dag/vecka/månad, ogiltiga former/fält/ikoner/typer/UUID/dubblett/storleksgränser, annan ägares create/replace/read och helper-ACL verifieras med syntetiska roller. Separat SQL-probe kan köras i avsedd devdatabas med rollback. Full pnpm check, diff/path-/köaudit, Architect, Security och oberoende QA/Reviewer krävs. Live Supabase/telefon förblir NOT TESTABLE.

Relevant läsning: AGENTS, workflow, dessa migrationsfunktioner och daglig rutinadapter. Architect initialt rekommenderar just denna avgränsning. Architect/Securitys konfigurerade gpt-5.6-sol saknas; gpt-6.1-sol medium används som tillgänglig efterföljare. QA/Reviewer använder konfigurerad Luna medium.

Skrivvägar:
- `supabase/migrations/202610300001_routine_checklist_validation_fix.sql`
- `supabase/tests/routine-checklist-validation.sql`
- `tools/verify-routine-save-sql.mjs`
- `src/features/home/README.md`
- `docs/tasks/dev/ROUTINE-SAVE-REPAIR-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`
- `docs/decisions/MASTER-LOG.md`

## Fortsättning efter hållbar checkpoint

1. Separat omdesign av Rutiner och aktiviteter med lika stor modal, korta ikoner/rader, enkel ny rutin och sanningsenlig hämtning av aktivt träningssteg/nästa förslag. Skydda versions-/hundscope och bekräftat sparande.
2. Separat träningsmodal: fast låg bild/rubrik, rullbar instruktion; sparat pass stänger modalen och ger kompakt bekräftelseruta med delmålsval för lyckat pass. Inga automatiska delmål.
3. Separat manuell lokal återställning av kontoraderingsspärr efter verifiering av aktuell ägare, enligt Eriks uttryckliga nya besked. Ingen automatisk radering eller generell cachetömning.

Varje del får egen konkret plan/review, avgränsade skrivvägar och checkpoint före nästa. Inga worktrees.

Checkpoint: Architect APPROVE v1 och Security initial PASS före implementation. Ny migration ersätter bara validatorn; objekttypkontroll står före count(jsonb_object_keys). Samtliga gamla gränser/ACL/search_path kvarstår. `node tools/verify-routine-save-sql.mjs` PASS på PostgreSQL17.5/PGlite0.3.14: faktisk autentiserad create-v2 ger42883 före fix; efter fix passerar giltig skapning, samma-ID retry, replace/revision/ankare, dag/vecka/månad/engång, negativa former/extra-fält/ikoner/UUID/dubbletter och50/160 vs51/161. Ägar-B kan varken läsa eller skapa/redigera A:s rutiner; nekade writes lämnar rader oförändrade. Helper-ACL och exekveringsinställningar verifierade. Migrationens omkörning PASS. Inga liveåtgärder.

Security final PASS utan fynd: helperns signature, immutability/invoker/search_path, ACL och regler bevarade; inga persondata-/RLS-/RPC-förändringar. Oberoende QA körde egen faktisk PostgreSQL-probe och pnpm check101/101 + diffcheck PASS; sex faktiska paths inom deklarerade nio. Frozen Reviewer PASS utan fynd efter faktisk diff/probe/README/kontrakt. Nästa: commit, därefter separat rutiner/träning-UX.
