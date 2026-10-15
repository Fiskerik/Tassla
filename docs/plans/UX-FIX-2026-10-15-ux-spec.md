# UX-FIX 2026-10-15 — omarbetat UX-kontrakt

Version 2.1 · Status: förnyad Architect/Critic-review · Beställning: Erik 2026-10-15

## Status och visuell auktoritet

Erik har underkänt de visuella underlagen i UX-FIX v1.1 för punkterna 2–7. Wireframes och skärmbilder i [UX-FIX-2026-10-14-ux-spec](UX-FIX-2026-10-14-ux-spec.md) är därför historiska och får inte användas som visuell acceptans eller facit för implementationen. De uttryckliga beteende-, data- och sparreglerna i v1.1 gäller bara där de inte motsäger detta kontrakt och där de fortfarande stämmer med koden.

Faktisk målbild är `vision_rev02.jpg`, [designreglerna](../design-rules.md) §0–10 och §14, samt panel 4–7 i [skärmkontrakten](../design/vision-rev02-screen-contracts.md). Den länkade grenen `codex/ux-fix-2026-10-15` pekar på `fde8997`, som redan ingår i aktuell bas `e4759e6`; där finns ingen ny omritad bildserie eller ny visuell evidens. Saknad personlig skiss ersätts inte med ytterligare låtsaswireframes. Varje slice ska använda sin rev02-panel som jämförelse och ta ny skärmbild av den riktiga produktkomponenten.

## Gemensamt kontrakt

- Varm gräddvit bas, nästan vita sammanhängande ytor, diskreta listavdelare och tydlig typografisk hierarki. Använd namngivna befintliga tokens och opt-in komponentvarianter; inga råa lokala färger eller globalt tema-byte.
- Panelernas komposition styr. Träning och Kunskap använder bild ovanför text i innehållskort. Loggen är en kompakt tidslinje med semantiska kategorifärger. Checklistor är grupperade listor; rutinredigering går in i en tydlig fördjupning. Undvik fristående kort runt varje rad och stora permanenta hjälptexter.
- Bara verkliga objekt, progress och handlingar visas. Inget filter, intervall eller innehåll får se fungerande ut utan fungerande datakälla.
- Bekräftad status ändras efter bekräftad skrivning. Failed/unknown behåller avsikten och återhämtningsvägen. Varmt läst innehåll kan ligga kvar under uppdatering, men konto-/hundbyte rensar gammal privat data före render.
- 44×44 pt träffytor, svenska tillgängliga etiketter, naturlig scrollning och 140 % text. Gör inga text-/ytkrympningar för att få en vy att rymmas.
- Varje skärmdump jämförs separat på komposition, färgfördelning, typografi, komponentformer, bildspråk och innehållstäthet. Fyll i designreglernas §14. Ingen gammal render förs över som PASS.

## Omarbetat leveransflöde

| Slice | Rev02-mål | Avsedd ändring | Avgränsning |
|---|---|---|---|
| 2 — Träningens fortsättkort | Panel 6 | Kompakt liggande återupptagningsrad med begränsad bildram, program/steg och verklig progress. Rekommendationsbilder ligger ovanför korttext. | Ingen ändring av progress, innehåll eller programval. |
| 3 — Logga | Panel 5 | Grupperad tidslinje, färgade kategorisymboler och redigerare med tydlig inmatningsyta och förankrad primärhandling. Datum/tid får växa till två rader vid smal bredd eller större text. | Befintliga typer, snabbval, save/delete/undo och accidentKinds behålls. |
| 4 — Hem/Träning mellan flikar | Panel 1 och 6 | Senast bekräftad sammanhängande snapshot står kvar vid vanlig flikresa medan en förfallen refresh körs. Ingen skeleton/empty-blink på varm återkomst. | Workspace-minne, ingen persistent cache, ingen ny backend eller telemetri. |
| 5 — Kunskapens checklistor | Panel 7 och checklistans panel 4 | Återöppnad redan läst översikt/detalj återanvänder scoped läsdata. Checklistpunkter, sök och filter behåller nuvarande mening och public/review-gate. | Checklistscope är konto/hund/mall/version/läge, aldrig Hemmets lokala dag. Skrivavsikt hålls separat. |
| 6 — Avmarkera träningssteg | Panel 6 | Bekräftat steg får en tillgänglig avmarkering i samma träningsdetalj. Samma progresskälla driver Mina, fortsättkort och Hem. | Återanvänd `deleteTrainingProgress`; inga nya tabeller eller completion-flaggor. |
| 7 — Veckodagar för rutin | Panel 4 | Veckointervall kan välja en eller flera veckodagar i samma samlade rutineditor. Valda dagar får grön status; övriga dagar neutral yta. Kontrollerna radbryts och behåller 44 pt träffyta. | Separat granskad schema-/RPC-utökning. Migration skapas lokalt men körs inte mot en databas. |
| HOME — rutinhantering | Panel 4, Hemöversikt panel 1 | Återuppta `HOME-ROUTINE-CHECKLIST-01` med kompakt grupperad rutinlista, en rutin i editor åt gången och tydlig väg tillbaka till dagsvyn. Dag-/Alla/Vecka-flikar visas endast när urvalen är kompletta och riktiga. | Bevara v5:s stabila ID:n, snapshot, CAS, retry/readback och träningsvalslås. Ingen ny huvudflik. |

## Visuella och funktionella kontroller per slice

### 2 — Fortsätt där ni var

Panel 6:s bildkort och horisontella fortsättdel är separata kompositioner. Återupptagningen visar en liten liggande bildyta, kompakt program-/stegtext och bekräftad progress; bildens intrinsic-mått får inte styra hela kortets höjd. När nästa steg saknas visas inget påhittat fortsättkort. Granska 0/2, 1/2, 2/2, flera program, lång titel och 140 %.

### 3 — Logga

Tidslinjen använder en fast tidskolumn, kategorisymbol och flexibel innehållskolumn på gemensamma grupperade ytor. Snabbregistreringens befintliga en-trycksresa finns kvar. Editorn håller datum/tid läsbara, visar olyckstyp från sparade `accidentKinds` och håller Spara samt eventuell radering inom safe area och tangentbordsflöde. Spara och Radera kan inte ske samtidigt. Granska olycka pee/poop/båda/legacy-okänd och långa värden.

### 4 — Varmt workspace-innehåll

En bekräftad Home-/Training-snapshot ska ligga kvar vid flikbyte inom samma konto, hund och dag/läge. En refreshindikator hör bara till uppdateringen, inte varje normal rad. Underlag från flera completion-källor kombineras inte till en komplett räknare när någon källa är okänd. Stale reads får inte skriva över nyare bekräftade writes. Hund-/kontobyte och dags-/zonbyte byter scope synkront.

### 5 — Checklistcache

Kunskapsvyernas varma data är separata från Home-cache. En läst mall öppnas direkt efter flikresa; en oläst mall får normal initial laddning. En bekräftad punktwrite uppdaterar detalj och översikt från samma resultat. Pending/unknown behåller exakt intent och kontrollhandling. Kall/fel/tomt/review-läge ska kunna skiljas i fixture.

### 6 — Avmarkera

Checkboxen är en status/handling på steget, inte en papperskorg eller reset för hela programmet. Den ska säga `Avmarkera {stegtitel}`, vara markerad endast vid bekräftad progress och blockera dubbeltryck under mutation. Avmarkning påverkar valt hund-ID, programversion och steg; efter bekräftad återläsning uppdateras alla berörda vyer.

### 7 — Veckodagar

För ett eget veckointervall visas Mån–Sön som tydliga flervalskontroller i editorn; minst en dag krävs. Nya veckoregler förväljer ankardagens veckodag. Veckor räknas måndagsankrat från ankardatumets vecka, utan förekomster före ankardatum. En ändring av valda veckodagar är en schemaändring och får nytt ankare på den sparade lokala dagen, enligt befintlig regel för ändrad upprepning. Namn-/checkliständringar och samma veckodagsmängd bevarar ankaret.

Exempel: en rutin sparas onsdag 14 oktober 2026 med varannan vecka och måndag/fredag valda. Veckan börjar måndag 12 oktober; måndag 12 oktober ligger före ankaret och skapas inte. Första förekomsten blir fredag 16 oktober. Nästa förfallovecka börjar måndag 26 oktober och innehåller måndag 26 och fredag 30 oktober.

Befintliga dags-/månadsregler, ankare, snapshots, skip-tombstones, retry och äldre klienter bevaras. För befintliga veckoregler med `repeat_weekdays IS NULL` behålls exakt dagens förfallologik: samma veckodag som ankaret och samma modulo på antal veckor. Visningen kan härleda ankardagens veckodag, men namn-/checklistredigering får inte fylla arrayen eller ändra regeln. Uppdatera `docs/mvp.md` före schemaändringen så nuvarande formulering om att rutiner aldrig upprepas inte motsäger ägarens godkända omfattning.

Veckodagsslicens lokala acceptans är statisk: kontrollera källkodens TS- och SQL-formler mot samma daterade handvektorer och legacy-gräns. Påstå inte runtime-paritet. Utför SQL/TS-runtime-vektorer och gammal-klient/RPC/RLS-kontroller endast i separat `HOME-ROUTINE-CHECKLIST-RUNTIME-VERIFY-01`, efter att godkänd migration har applicerats i godkänd isolerad utvecklingsdatabas.

### HOME — rutinhantering

Panel 4:s dagsvy är fördjupning från Hem och är skild från Kunskapens checklistor. Håll rutiner/träningssteg i tydliga grupper på varma sammanhängande ytor. Visa rutinens namn och kort återkommande summering; checklisttext och edit-/delete-åtgärder visas i rätt läge, inte som flera öppna stora kort. En pencil-åtgärd öppnar hela rutinens editor. Hjälp finns bakom en `(i)`-knapp. Hemmets kompakta uppgiftskort följer panel 1. Inga tomma `Vecka`/`Alla`-lägen eller nya filter skapas.

## Verifieringsgräns

Kör endast typkontroll, avgränsad lint, RN Web-fixture/rendering, manuell funktionell granskning, statisk formelgranskning och `git diff --check`/kövalidering. Kör inga testsviter enligt aktuell arbetsbeställning. Riktig native Dynamic Type/VoiceOver och Supabase/RLS/runtime-paritet är separata gränser; saknade bevis markeras `NOT TESTABLE`. Migrationer appliceras inte här. Ny data-/nätverks-/skrivkod kräver oberoende QA/Reviewer och där relevant Security- och Compliance-review innan respektive queue-task blir `done`. Compliance bekräftar att weekday-fältet bara utökar befintliga rutinmetadata och inte inför nytt personuppgiftsändamål eller insamlingssyfte.
