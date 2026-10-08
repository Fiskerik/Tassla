# LOGGA – UX-specifikation

Datum: 2026-10-08  
Task-ID: LOGGA  
Version: 3  
Status: Godkänd före implementation – Product-copy granskad, Critic GO och Architect APPROVE v3  
Mandat: Eriks uppladdade brief 2026-10-08, inklusive ägarbeslutet att Promenad och Vaken nås via en femte ruta `Fler`, och genomförandemandatet i `AGENTS.md`. Erik bekräftade därefter uttryckligen att `37bf93f feat: complete shared log UI component library` är senaste baseline och ska återanvändas för att undvika dubbelarbete. Dessa beslut sparas här som hållbar scopesource.  
Referenser: `AGENTS.md`, `docs/design-rules.md`, `.agents/skills/tassla-consumer-ux/SKILL.md`, `vision_rev01.jpg` skärm 2 och `src/theme/tokens.ts`. Ingen riktig Figma-URL angavs; Figma är därför inte använd som evidens.

## Användarmål och huvudhandling

En stressad hundägare ska kunna logga en vanlig vardagshändelse med ett tryck, förstå om den verkligen sparades och snabbt rätta eller ta bort en felaktig post. Huvudhandlingen är att trycka på en snabbloggsruta. Fördjupning sker först när användaren öppnar `Fler` eller en befintlig rad.

## Inventering av nuläget

- Loggtyperna är Kiss, Bajs, Mat, Sömn, Vaken och Promenad.
- Alla sex visas som likvärdiga snabbknappar. Ett tryck startar en befintlig `dog_events`-skrivning med ett klientskapat UUID.
- Rättning sker i ett inlineformulär för typ, datum, tid och valfri notering. Radering bekräftas i en native alert.
- Vid bekräftad skrivning återläses loggen. Vid okänt resultat behålls samma mutation och ID för kontroll eller nytt försök. En osäker post läggs inte optimistiskt i den sparade historiken.
- Status visas globalt med teknisk text/modal, hela skärmen spärras under skrivning och molnposter märks `SPARAD`.
- Historiken grupperas efter lokal kalenderdag och sorteras redan nyast först; ID används som stabil skiljare vid samma tid.
- Mönstersammanfattningen räknar Kiss och Bajs separat och använder medianen av positiva intervall mellan poster. Den visar i dag även kategorier med noll eller en post.

## Föreslaget flöde

### Snabblogg

1. Skärmen öppnas med centrerad `AppBar`-titel `Logga`, utan tillbakaåtgärd.
2. `Snabb logg` visar ett 2×2-rutnät: Kiss, Bajs, Mat och Sömn. Varje ruta använder kategorianknuten `IconChip`.
3. En diskret femte ruta `Fler` öppnar en `BottomSheet` med `QuickLogTile` för Promenad och Vaken.
4. Tryck på en kategori kontrollerar först dubbletter. Saknas dubblett startar skrivningen direkt.
5. En tillfällig rad för just den posten visas i rätt datumgrupp med `Sparar…`. Den befintliga single-flight-modellen behålls: alla andra skrivkontroller spärras medan en mutation är pending, failed eller unsure, men historik, scrollning, stängning och navigation fortsätter fungera.
6. Efter verkligt bekräftad skrivning försvinner avvikelsestatusen och en toast visar exempelvis `Kiss loggat`. `Ångra` visas först då.
7. `Ångra` raderar den nyss bekräftade posten med befintlig raderingsoperation. Misslyckad eller osäker ångring får aldrig presenteras som genomförd.

### Dubblettskydd

- Ett andra tryck medan samma inskick pågår ignoreras.
- Samma kategori med en befintlig eller nyss bekräftad tid inom de senaste två minuterna öppnar dialogen `Du har redan loggat det här. Lägga till ändå?`.
- `Lägg till ändå` fortsätter med en ny post; `Avbryt` gör ingenting.
- Kontrollen använder aktuell lokal tid och de inlästa posterna. De första 40 posterna räcker för tvåminutersfönstret i normal drift.

### Redigera och radera

1. Tryck på en `ListRow` öppnar `BottomSheet` med titeln `Ändra händelse`.
2. Arket visar ett tokeniserat typval för alla sex befintliga kategorier samt `Field` för `Datum`, `Tid` och `Anteckning (valfri)`. Typvalet behålls eftersom rättning av en felloggad kategori är godkänd funktion.
3. Sidfoten har en primär `Spara`. En `ActionMenu` (⋯) i arket innehåller `Radera`.
4. `Radera` öppnar `Dialog`: `Radera den här händelsen?` med sekundär `Avbryt` och destructive `Radera`.
5. Inmatningen finns kvar om uppdateringen misslyckas eller blir osäker. Arket stängs först efter bekräftad uppdatering eller bekräftad radering.

## Informationshierarki

1. `AppBar`: Logga.
2. `SectionHeader`: Snabb logg; 2×2 huvudrutor och den diskreta rutan Fler.
3. Ett litet `Card`: Dina senaste mönster, endast när minst en kategori har minst två poster.
4. `SectionHeader`: Dagens logg. Rader visar tid först, kategoriikon, titel med valfri detalj och chevron.
5. Äldre grupper: `Igår`, därefter lokalt datum. Nyaste post och nyaste dag visas först.

Mönstercopy beskriver medianen utan att antyda prognos, till exempel `Bajs: 2 gånger · ungefär var 33:e timme`. Bara Kiss/Bajs med minst två poster visas. Om ingen kvalificerar sig visas varken kortet eller nolltext.

## Tillstånd

### Skärmnivå

- **Laddar:** AppBar samt skeleton för snabblogg och lista. Ingen tomtext och inga aktiva skrivkontroller.
- **Tom:** Snabbloggen är aktiv. Under `Dagens logg`: `Inget loggat än idag` och `Tryck på en ruta ovan för att lägga till dagens första händelse.` Ingen extra primärknapp.
- **Fel vid första hämtning:** AppBar, texten `Loggen kunde inte hämtas.` och `Försök igen`. Snabbval visas inte eftersom befintligt flöde saknar offlinekö och ett tillförlitligt underlag för dubblettskydd. Detta är ett medvetet, internetberoende MVP-val: sanningsenlighet går före en skrivning som inte kan försonas säkert. Att kunna logga offline kräver ett separat ägarbeslut och ny arkitektur.
- **Normal:** Snabblogg, eventuellt mönsterkort och datumgrupperad logg.
- **Partiellt fel:** Redan hämtade rader ligger kvar. Fel för äldre poster visas som toast `Äldre poster kunde inte hämtas` med `Försök igen`; hela skärmen ersätts inte.
- **Offline:** Ingen separat permanent banner. En skrivning följer Failed eller Unsure beroende på befintligt skrivresultat. Ingen offlinekö införs.
- **Behörighet nekad:** Inte tillämpligt; Logga begär ingen enhetsbehörighet.

### Skrivstatus för varje tillägg, ändring, radering och ångring

| Övergång | Synligt beteende |
|---|---|
| Idle → Pending | `Sparar…` på berörd rad eller i öppet ark. Alla andra skrivhandlingar spärras av single-flight-modellen. |
| Pending → Saved | Ingen permanent statusetikett. Vid snabb logg: `{Kategori} loggat`; `Ångra` endast för den bekräftade posten. |
| Pending → Failed | Toast `Kunde inte spara` + `Försök igen` och synlig `Avbryt`. Användarens inmatning och samma intent behålls tills ett av valen görs. |
| Pending → Unsure | Toast `Vi kunde inte kontrollera om det sparades` + `Försök igen`. Ingen successcopy och ingen Ångra. |

Försök igen använder samma sparade intent. Insert återanvänder samma UUID och kontrolleras genom återläsning före nytt försök. Update/delete återspelar den oförändrade väntande operationen; de beskrivs inte som återlästa om ingen återläsning har skett. En post räknas fortsatt som sparad endast när nuvarande datalager returnerar `saved` eller insert-återläsningen hittar samma ID. UI:t får en strukturerad presentationsstatus; API-anrop, datamodell och sparbeslut ändras inte.

### Mutationskontrakt mellan workspace och skärm

Presentationslagret använder en diskriminerad status, inte fria textsträngar:

```text
LogMutationIntent = kind(add|update|delete|undo), id, eventType, occurredAt, changes/previous vid behov
LogMutationState  = idle | pending(intent) | failed(intent) | unsure(intent)
LogMutationResult = saved(id, confirmedEvent|null) | failed(intent) | unsure(intent)
```

- Workspace skapar insert-ID:t före callback och returnerar resultatet till skärmen. Samma ID äger pending-rad, toast och eventuell Ångra.
- Bekräftat add/update försonas lokalt med adaptervärdet innan bakgrundsåterläsning; bekräftad delete/undo tar bort exakt ID. Därmed är tidslinje, dubblettskydd och mönster konsekventa även om efterföljande hel återläsning misslyckas.
- Pending, failed och unsure äger alla den globala single-flight-platsen. Failed behåller alltid samma intent när UI erbjuder `Försök igen`; ingen annan write får starta före retry-success eller uttryckligt `Avbryt`. Eftersom failed är ett definitivt icke-sparat resultat får `Avbryt` rensa intent: för snabb logg/delete/undo ligger den oförändrade listan kvar och toasten stängs; i edit stängs sheet utan att ändra den sparade posten. Unsure har ingen Avbryt, eftersom utfallet inte är känt, och kan bara lösas genom säker kontroll/retry.
- Sheet stängs endast efter `saved`. Vid failed/unsure ligger inmatning, typval och sheet kvar.
- Toast och undo binds till mutations-ID. En äldre toast får aldrig radera en senare post.
- Svar tillämpas bara om komponenten är monterad och hund-/sessionslivstiden fortfarande matchar. Hund-, sessions- eller workspacebyte ogiltigförklarar UI-feedback utan att presentera stale success.

### Ångra som egen skrivning

- Ångra visas bara för `saved` insert och exakt dess ID.
- Tryck på Ångra startar en delete med `kind=undo`; alla övriga skrivkontroller spärras.
- Posten tas bort från listan först efter bekräftad delete. Failed/unsure behåller posten och visar respektive retry-toast.
- Framgång visas inte förrän delete är bekräftad. Pending/failed/unsure insert får aldrig Ångra.

### Dialoger, ark och toast

- `Fler loggtyper`: Promenad och Vaken; stängs efter valt loggförsök eller med stängknapp/back.
- `Du har redan loggat det här. Lägga till ändå?`: `Avbryt`, `Lägg till ändå` med icke-destruktiv bekräftelsevariant.
- `Ändra händelse`: datum, tid, anteckning, Spara och ActionMenu.
- `Radera den här händelsen?`: `Avbryt`, `Radera`.
- Toast kan vara success, error eller uncertain. Endast success efter bekräftad snabbregistrering erbjuder Ångra. Error erbjuder `Försök igen` och `Avbryt`; uncertain erbjuder bara `Försök igen`.

## Copy och validering

- Datum/tidsfel: `Ange ett giltigt datum och en tid som inte ligger i framtiden.`
- Anteckningsfel: `Anteckningen får innehålla högst 500 tecken.`
- Händelserad: synlig tid följd av kategori; anteckning/duration visas endast när värdet finns.
- Förbjudna tekniska ord, bannern om konto/server, `SPARAD` och stora Ändra/Radera-länkar tas bort.
- Previewmarkörerna `EXEMPEL`/`TESTPOST` är skyddad befintlig previewfunktion och tas inte bort tyst; om preview fortfarande används visas ursprunget diskret i metatext, aldrig som sparstatus.

## Tillgänglighet och responsivitet

- Snabblogg: `Logga kiss`, `Logga bajs`, `Logga mat`, `Logga sömn`; Fler: `Fler loggtyper`; sheet: `Logga promenad`, `Logga vaken`.
- Rad: exempel `Kiss 19:24, tryck för att ändra`; eventuell detalj läses efter kategori och tid.
- Alla tryckytor är minst token `touchMin`; inga hårdkodade mått, färger eller fontstorlekar i skärmfiler.
- Text får växa och radbrytas. Viktig text klipps inte för att hålla två rader.
- Modal fokus, plattforms-back, keyboard-aware scrollning och safe area ska fungera. Ingen gest är enda sättet att avsluta.
- Ingen ny rörelse, haptik eller ljud införs. Befintlig reducerad-rörelsepolicy påverkas inte.

## Avvikelser från målbilden

- `Dina senaste mönster` läggs mellan snabbval och logg på uttryckligt uppdrag; målbilden visar inte kortet.
- `Fler` och dess sheet läggs till enligt ägarbeslut för att bevara Vaken och Promenad; målbilden visar bara fyra snabbval.
- Redigeringsark, raderingsdialog, toast och avvikelsetillstånd syns inte i målbilden men krävs uttryckligen av briefen och UX-skillen.
- Äldre datumgrupper och anteckningar behålls eftersom de är godkänd funktion även om målbilden bara visar dagens kompakta lista.
- Ingen Figma-jämförelse görs eftersom briefen innehåller platshållaren `[FIGMA-URL]`, inte en åtkomlig fil/node-URL.

## Deklarerat scope

Planerade app-/testfiler:

- `src/features/puppy-log/LogScreen.tsx`
- `src/features/puppy-log/log-model.ts`
- `src/features/puppy-log/README.md`
- `src/features/home/ProductWorkspace.tsx` endast Logga-props och presentationsstatus kring befintliga mutationer
- `src/components/ui/QuickLogTile.tsx`: separat synlig etikett och `accessibilityLabel`
- `src/components/ui/BottomSheet.tsx`: valfri primary-footer för `Fler`; befintlig footer används i edit
- `src/components/ui/ListRow.tsx`: separat accessibilityLabel och layout där tid kan ligga först före kategori-chip
- `src/components/ui/ActionMenu.tsx`: optional edit-action så edit-sheet kan vara delete-only
- `src/components/ui/Dialog.tsx`: `confirmVariant` för icke-destruktiv dubblettbekräftelse respektive destructive radering
- `src/components/ui/Toast.tsx`: valfri synlig cancel-action för definitiv failed; uncertain saknar cancel
- Befintliga `QuickLogTile`, `Skeleton` och truthful `Toast` från `37bf93f` återanvänds utan parallell implementation
- `tests/log-model.test.mjs`, `tests/log-screen-policy.test.mjs`, `tests/ui-library-policy.test.mjs`
- `docs/plans/LOGGA-ux-spec.md`, `docs/releases/LOGGA.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`

Skyddade områden: Supabase-adaptrar, SQL/schema, API-anropens semantik, `DogEventRecord`, andra skärmar, navigation, globala tokens, dependencies och Figma. Om ett krav kräver ändring där stoppas arbetet för nytt beslut.

### Beroendebeslut för komponentbasen

Erik har efter att `37bf93f` publicerades uttryckligen instruerat att LOGGA ska byggas efter den commiten för att inte skriva över eller duplicera komponentarbetet. LOGGA konsumerar därför den faktiska koden i `37bf93f` som baseline utan att påstå att DS-CODE-01:s separata gallerigranskning är visuellt godkänd. LOGGA:s egen slutgrind renderar komponenterna i den verkliga konsumentskärmen. Detta stänger inte automatiskt DS-CODE-01:s galleriblockerare.

## Delar och acceptans

1. **LOGGA-QUICK, fungerande vertikal slice:** nödvändiga komponentprop-delta, AppBar, laddar/tom/fel/normal, 2×2 + Fler, mönsterkort, kompakt lista, global single-flight, add pending/saved/failed/unsure, retry med samma ID, dubblettskydd och fungerande Ångra efter bekräftad insert. Före DONE renderas liten/stor telefon, stor text, laddar/tom/fel/normal, Fler-sheet, pending, saved/undo, failed, unsure och dubblettdialog; annan roll fyller checklistorna. Saknad rendering får dokumenteras som kodcheckpoint/NOT TESTABLE men QUICK går då inte till DONE och EDIT startar inte. Slice avslutas annars med cleanup, riktade tester, `pnpm check`, `pnpm bundle:ios`, `git diff --check`, QA/Reviewer och commit innan nästa slice.
2. **LOGGA-EDIT, fungerande vertikal slice:** edit-sheet med bibehållet typval/inmatning, update/delete/retry, delete-only ActionMenu, destructive dialog, lokal försoning av lista/mönster samt hela visuella evidensmatrisen. Slice avslutas med samma kontroller, oberoende QA/Reviewer och commit.

Tester ska minst täcka lokal datumgruppering, nyaste först, dold mönstersammanfattning vid färre än två poster, frånvaro av `SPARAD`, Vaken/Promenad via Fler och rättning av kategori. Dubblettmatrisen omfattar exakt tvåminutersgräns, strax utanför, annan kategori, framtida tidsstämpel, avbryt och `Lägg till ändå`; pending dubbeltryck ger noll extra writes och override ger exakt ett nytt UUID/write. Mutationsmatrisen omfattar saved/failed/unsure och reload-fel för add/update/delete/undo, samma insert-ID vid retry, failed → retry med samma intent, failed → uttryckligt Avbryt, ingen undo före confirmed, stale svar efter hund/session/unmount, global spärr för andra writes tills retry/cancel löser failed samt bevarad input/sheet vid failed/unsure. Slutgranskning fyller alla tillämpliga punkter i `docs/design-rules.md` avsnitt 14 och behavior-checklistan i UX-skillen.

## Antaganden och öppna verifieringspunkter

- Exakt dubbeltryck spärras medan den första skrivningen pågår. Efter ett snabbt svar används en tvåsekunders monotonic/UI-tidsgrind oberoende av wall-clock och reload. Kategoridubblett gäller samma kategori när `now - 2 minuter ≤ occurredAt ≤ now`; nyss lokalt försonad bekräftad post ingår även om reload misslyckas. Framtida tider räknas inte.
- `ungefär` används för medianintervallet. Minuter under två timmar visas i minuter, därefter avrundade timmar; från 36 timmar används ungefärliga halva dygn. Detta är presentationslogik, inte ändrad beräkning.
- `Ångra` är möjlig för en bekräftad ny post genom befintlig delete-operation. Den visas inte för pending/failed/unsure eller för uppdatering/radering.
- Product har granskat copyförslagen och Critic har lämnat GO; Architect ska godkänna plan v3 före appkod.
- Expo-rendering och skärmdumpstagning är ännu inte verifierade. Fram till verklig rendering är visuell kvalitet NOT TESTABLE.
- Baseline är `37bf93f feat: complete shared log UI component library`, uttryckligen bekräftad av Erik 2026-10-08 för att undvika dubbelarbete. Dess kod återanvänds som källa; DS-CODE-01:s saknade app-rendering ärvs inte som visuellt PASS. LOGGA får checkpointas med NOT TESTABLE men får inte markeras DONE eller visuellt godkänd utan skärmdumpar av liten/stor telefon och stor text för normal/tom/fel/laddar, Fler-sheet, edit-sheet, dubblettdialog, raderingsdialog samt success/error/unsure/undo. `cb427e7` finns inte i hämtade remote-refar eller objekthistoriken; inget antas om den.

