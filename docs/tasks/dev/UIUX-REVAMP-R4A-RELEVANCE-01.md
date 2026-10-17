# UIUX-REVAMP-R4A-RELEVANCE-01 — Gemensam relevansgrind

Plan v7 · 2026-10-17 · Status: `planned`, ingen appkod ännu.

## Mandat och risk

Erik har godkänt stegvis implementation inom MVP v2 och har nu bett oss fortsätta R4/R5. Denna checkpoint omsätter V2-01 i en fail-closed runtimegrind före bredare innehållsresor. Den lägger inte till vuxenråd eller nya innehållsytor.

Riskklass **M**: val av innehållsyta, navigering och träningshandlingars behörighet ändras. Ingen auth, konto-/hundscope, beständig datamodell, skrivväg, klinisk vägledning eller vuxengrant ändras. Befintliga ägar-/hundscopeade läsningar och träningsprogress ska bevaras. Architect- och Critic-planreview krävs; Product och Dog Expert har lämnat underlag. Security är inte separat grind för denna avgränsade plan eftersom auth, scope och skrivkontrakt inte ändras.

**Beroende:** `FLOW-HOME-CHECKLIST-UPCOMING-01` är fortfarande i QA. R4a delar `ProductWorkspace.tsx`, `workspace-data.ts` och `daily-activity-model.ts` med R3c. R4a får därför inte gå till `ready`/`implementing` förrän R3c QA är stängd; det hindrar att den pågående checkpointens diff/review ändras under QA.

## Granskningsbeslut

- Product: CHANGES för positiva ytmappningar; godkänner fail-closed grund, tomma automatiska rekommendationer och endast tre kontextuella funktionshjälpsytor.
- Dog Expert: versioner och åldersfönster stämmer med V2-01. Ålder är eligibility, inte relevans; ett hundråd/program kräver dessutom valt behov eller sammanhang. Öppen maxålder ger inte vuxengodkännande. Okänd ålder är varken valp, unghund eller vuxen.
- Architect: APPROVE för plan v7 med preciseringen att endast hundrådsrekommendationsslotten i Hem/Just nu blir tom när saknad grantad kandidat; FAQ, planerade hälsohändelser och annat opåverkat innehåll bevaras.
- Critic: PROCEED för den exakta plan v7 efter samma Home-scopeförtydligande.

## Versions- och ytkontrakt

Selector måste använda publicerad status, exakt aktuell publicerad version, ålder, ras, målgrupp, behov/sammanhang och visningsyta. Ett yttre grant gäller endast exakt `content_version.id`; slug, tidigare version, innehållstyp eller databasordning ger inget implicit grant. En äldre tillåten version får inte visas om en nyare publicerad version för samma innehåll saknar grant. Okända framtida versioner nekas.

| Innehåll / version | Tillåten yta i R4a | Grind och uttryckligt nekande |
|---|---|---|
| `before-homecoming` v1 `62000000-0000-4000-8000-000000000001` | Ingen | Draft/onboarding-only; nekas vanlig feed och alla normala ytor. |
| `first-week` v1 `...0002` | Ingen i nuläget | 8–12 veckor räcker inte; nylig hemkomst saknar runtime-signal. Även senare användning behöver separat godkänd yta/prioritet. |
| `daily-log-routines` v1 `...0003` | Endast Logg/rutiner: funktionshjälp | Neutral apphjälp, inte hundråd; döljs från Hem, För dig, Artiklar och rekommendationer. |
| `handling-guide` v1 `...0004` | Ingen | 13–16 veckor är oförändrat eligibility-fönster men ger inte ett skärmgrant. |
| `environment-checklist` v1 `...0005` | Ingen | 17–26 veckor; detta är inte checklistkällan i befintliga `PuppyChecklistScreen`. |
| `being-alone-guide` v1 `...0006` | Ingen | 27–52 veckor; yta/kontext saknar uttryckligt grant. |
| `weight-history-guide` v1 `...0007` | Endast Hälsa > Vikt: funktionshjälp | Appinstruktion; ingen lämplig-vikt- eller hälsobedömning. |
| `health-records-guide` v1 `...0008` | Endast Hälsa > Genomfört/lägg till: funktionshjälp | Appinstruktion för registrering; inget schema- eller kliniskt påstående. |
| `handling-program` v1 `...0009` | Ingen | Valt behov/kontext saknas; `Alla övningar` är inte i sig ett valt behov. Ingen Home-rekommendation. |
| `environment-program` v1 `...0010` | Ingen | Samma behovs-/ytgrind; ingen Home-rekommendation. |
| `being-alone-program` v1 `...0011` | Ingen | Samma grind; vuxentillämpning kräver dessutom exakt versionsgranskning av målgrupp, progression, begränsningar och hänvisning. |

För versionerna `...0004`–`...0006` och `...0009`–`...0011` gäller dessutom: ingen vuxenanvändning utan versionsspecifikt Dog Expert-godkännande. R4a skapar inte en behovsväljare och ger inte nya ytmappningar. De tre funktionshjälpsversionerna `...0003`, `...0007`, `...0008` är åldersoberoende apphjälp och får visas även när hundens ålder är okänd; detta betyder aldrig att hunden är valp eller vuxen.

## Beteende och acceptans

1. **Hem:** ingen hundrådsrekommendation får välja `content[0]` eller rå databasordning. Hundrådsrekommendationsslotten i “Just nu”/`HomeCarousel` visar ett sant tomläge om den saknar uttryckligt grantad kandidat. FAQ, planerade hälsohändelser och annat opåverkat innehåll i karusellen bevaras. Ingen feature-help blir en hundrekommendation.
2. **Kunskap:** “För dig” visar ett sant tomläge utan automatisk kandidat. “Artiklar” visar endast explicita ytmappningar; tills sådana finns visas ett ärligt tomläge. Feature help är dold från allmän katalog. FAQ och `Checklistor` (separat `PuppyChecklistScreen`-källa) lämnas oförändrade.
3. **Funktionshjälp:** tre uttryckliga knappar öppnar rätt fulltext från befintlig publicerad version i kunskapsdetaljen: Logg/rutiner, Hälsa > Vikt och Hälsa > Genomfört/lägg till. Kontrollerna ligger utanför aktiva formulär/sheets. Tillbaka till Logg återställer valt datum; tillbaka till Hälsa återställer ursprunglig undertab (Vikt eller Översikt). Utkast får inte tappas.
4. **Träning:** “Rekommenderat” och “Alla övningar” får bara visa aktuellt grantade kandidater; nu finns inget valt behov/surface-grant, så inget av versionerna `...0009`–`...0011` visas som valbar träning. Fel, tomt och okänt hålls åtskilda.
5. **Progress och dagliga val:** kandidatprogram delas från sparad progress. Progress är fortsatt knuten till exakt hund, programversion och steg. För nekad version visas endast skrivskyddad historik/status; inga stegtexter, öppna/fortsätt, markera/avmarkera eller reset. Inga poster raderas/remappas och markering betyder inte att hunden kan en färdighet.
6. Ett befintligt dagligt träningsval med exakt version utan grant visas i Hem och Checklista som **otillgängligt/okänt**, aldrig som avklarat och aldrig som ett vanligt tomt urval. Raden och sparad progress bevaras; inga steg-, completion-, unmark- eller delete-handlingar exponeras från den raden.
7. En äldre versions grant kan inte kringgå den senaste publicerade versionens saknade grant. Publiceringsfel visas inte som tomt urval. Unknown age kan inte kvalificera hundråd eller träningsprogram.
8. Ingen migration, RLS/RPC/grant, dependency, datainsamling, innehållspublicering, phase/calendar wheel UI, FAQ, sök/filter eller bildmetadata ingår. Inga vuxenresor kallas klara genom tomläget.

## Exakt skrivomfång

- `docs/tasks/dev/UIUX-REVAMP-R4A-RELEVANCE-01.md`
- `docs/plans/UIUX-REVAMP-R4A-RELEVANCE-01-ux-spec.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `src/content/select-content.ts`
- `src/data/workspace-data.ts`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/HomeCarousel.tsx`
- `src/features/home/daily-activity-model.ts`
- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/health/HealthScreen.tsx`
- `src/features/health/WeightScreen.tsx`
- `src/features/home/README.md`
- `src/features/knowledge/README.md`
- `src/features/training/README.md`
- `src/features/puppy-log/README.md`
- `src/features/health/README.md`
- `docs/design/evidence/vision-rev02/content/relevance/R4A-RELEVANCE-01/`
- `docs/decisions/MASTER-LOG.md` (endast vid verifierad closeout)

Utanför scope: allt annat, särskilt `HealthHistoryScreen.tsx`, server/database-migrations, andra dagliga källor, feature-schema och releasefiler. Hjälpknappar placeras utanför editorn; ingen editorstate behöver flyttas eller återskapas.

## Kontroller och öppna bevis

Efter implementation: riktad typkontroll/lint för ändrade filer, `python tools/dev_flow.py validate`, `git diff --check`, statisk granskning av varje konsument mot granttabellen samt QA för ready/empty/error/unknown, senaste version, gammalt dagligt val och exakt read-only progress. `pnpm check`/automatiska tester körs först efter uttrycklig test-/verifieringsbeställning. Visuell/native/live DB/RLS bevisas separat och får inte rapporteras PASS utan faktisk kontroll.

## Nästa steg

Architect och Critic har godkänt exakt plan v7. Köposten stannar `planned` och beror på `FLOW-HOME-CHECKLIST-UPCOMING-01`; ingen R4a-kod ändras förrän R3c QA är stängd.