# R4b — redaktionell åldersperiodresolver

Plan: `docs/tasks/dev/UIUX-REVAMP-R4B-PERIOD-01.md` v2.

## Lokal evidens

- `node --experimental-strip-types --test tests/domain.test.mjs tests/profile-edit.test.mjs` — 36/36 PASS.
- `pnpm check` — app TypeScript, Supabase edge TypeScript, ESLint och Node-tester 574/574 PASS.
- Resolvertesterna täcker kontinuitet, 8 veckor, bokstavlig 12-veckorsdag, tremånadersgräns, 6/12 kalendermånader, månadsslut, skottdag, 2/4/6/8/10 år, 10+, ogiltiga/framtida datum och oförändrade 6/24-månadersfaser.
- Befintlig profilredigeringssuit körs som regression; den verifierar inte identitetsbevarande mellan periodskiften. README för domänmodulen dokumenterar indata, kalendersemantik och begränsning.

## Avgränsningar

Detta är endast resolver/modellevidens. Ingen UI, innehållsurvalsgräns, persistens, schema eller backend ändrades. De redaktionella banden är inte veterinärmedicinska eller individuella utvecklingsbedömningar. Native app, faktisk Supabase/RLS och full MVP Scenario C (periodstyrt innehåll plus bevarande av identitet, rutiner, historik och träningsprogress) är NOT TESTABLE och förblir öppna. UI-visual-QA är inte tillämplig eftersom inga skärmar ändrades.

Oberoende QA/Reviewer är ännu inte registrerade här.
