# UPD-LOG-UI – valfria detaljer i valploggen

Datum: 2026-10-11

Planversion: v7 – Product/Critic PROCEED; Architect APPROVE; Erik godkände scopeutökningen 2026-10-12
Status: v7 implementation, oberoende QA, Security och Reviewer PASS; commit/push till `codex/repo-grounding` återstår

## Mandat och mål

Paket 3 i Eriks godkända UPD-1011-segment. Gör det möjligt att lägga till olyckstyp, mängd/enhet för mat eller vatten och fodertyp efter att snabbhändelsen redan sparats. Detaljer får hoppas över och kan redigeras senare. Snabbregistreringen får inget obligatoriskt steg eller nytt nätverks-/databasfält; UPD-LOG-DATA tillhandahåller redan datakontraktet.

Användarens uppgift är fortfarande att snabbt logga en händelse och vid behov ange mer. Målbilden `vision_rev01.jpg` visar 2×2 snabbval och en kompakt, dagsgrupperad logg. Det befintliga UI:t har redan snabbval, lokaldagsgruppering, nyast först, `Visa äldre poster`, dubblettskydd, sparstatus, ångra och redigeringsark. Dessa beteenden ska behållas; ingen omdesign eller ombyggnad av loggtyper ingår.

Efter QA-fyndet för designregel 11 omfattar v7 också den befintliga senaste-mönster-sammanfattningen: när befintlig sammanfattningsdata finns är den stängd som standard och visas först efter tryck på `Visa dina senaste mönster`. Samma handling byter då till `Dölj dina senaste mönster`. Utan mönsterdata visas ingen knapp. Innehåll, befintlig datatröskel och beräkning ändras inte. Det bevarar informationen och gör visningen uttryckligen användarstyrd; kontrollen läggs efter loggraderna och skapar inget obligatoriskt loggsteg.

## Föreslaget flöde och UX-spec

### Snabb loggning

1. Tryck på en snabbvalsruta. Samma insert och dubblettskydd som idag körs utan att vänta på detaljer.
2. Först när den nya posten är bekräftat sparad öppnas ett valfritt `BottomSheet` för `accident`, `food` eller `water`. `pee`, `poop`, `sleep`, `awake` och `walk` behåller nuvarande direktflöde.
3. Olycka: arket har rubriken `Olycka` och två hela tryckytor/checkboxar, `Kiss` och `Bajs`. En vald ruta ger `pee`/`poop`, båda ger `both`; inga val ger `null`/ospecificerat. Knapparna är `Spara` och `Hoppa över`; spara utan val är inaktivt. `Hoppa över` stänger utan skrivning.
4. Mat: arket har rubriken `Mat`; fälten heter `Mängd (valfri)`, `Enhet` och `Fodertyp (valfri)`. Mängd anges i g. Vatten har rubriken `Vatten`, `Mängd (valfri)` och `Enhet`, med ml som standard och valen `ml`/`dl`. Vid byte ml↔dl bevaras samma volym genom konvertering (t.ex. 200 ml → 2 dl), utan att värdet tyst omtolkas. Tom mängd lämnar både mängd och enhet `null`. Matens fodertypförslag har den synliga rubriken `Dina tidigare fodertyper` och hämtas från redan inlästa poster för samma aktiva hund; inga andra hundar eller fjärrsökningar används. De beskrivs aldrig som rekommendationer.
5. Arket öppnas inte vid pending, failed eller unsure insert. Före att en detaljpatch startar gör `Hoppa över`/stängning ingen skrivning och kastar utkastet. När patchen är pending blockeras vanlig stängning och skip; fälten och `Sparar…` ligger kvar, men `Ångra` kan invänta requesten och radera adden. Vid definitiv failed för en nyskapad post visas `Kunde inte spara detaljerna.` med `Försök igen` och `Hoppa över`; Hoppa över kastar utkastet och stoppar retry. Vid unsure visas `Vi kunde inte kontrollera om detaljerna sparades.` med `Försök igen` och `Ångra`; vanlig stängning/skip är spärrad, men ångra inväntar requesten och raderar samma bekräftade add-ID.

### Redigering och rader

- Det befintliga `LogEventEditor` får fält för detaljer för vald händelsetyp. Typbyte rensar typbundna värden i formulärutkastet; vatten-/matmängder förs inte mellan typer. Fälten kan rensas vid redigering.
- Valideringsfel skrivs på svenska intill relevanta fält. Förslag till exakt copy: `Ange ett tal större än 0.`, `Du kan ange högst 2 000 g per loggpost.`, `Du kan ange högst 10 000 ml per loggpost.` respektive `Du kan ange högst 100 dl per loggpost.`, och `Fodertypen får innehålla högst 60 tecken.` Tomt mängdfält är giltigt/valfritt. Mängd följer DATA-kontraktet: positivt tal, mat ≤ 2 000 g, vatten ≤ 10 000 ml eller ≤ 100 dl. Komma och punkt accepteras som decimaltecken. Fodertyp trimmas enligt befintlig normalisering och får vara högst 60 Unicode-kodpunkter. Tak nämns bara när användaren överskrider inmatningsgränsen; de är tekniska gränser för fältet per loggpost, aldrig säkra/normal/lämpliga mängder för hunden.
- Raden behåller samma datumgrupp, tid, ikon-chip och tryck för redigering. Lägg detaljer i befintlig beskrivnings-/detaljrad utan fristående statusbadge: `Olycka · kiss`, `Olycka · bajs`, `Olycka · kiss och bajs`, `Mat · 80 g · [typ]` och `Vatten · 200 ml`. Saknade värden ger inga tomma skiljetecken; anteckning och detaljtext ryms tillsammans enligt befintlig ListRow.
- ProductWorkspace läser tillbaka `accident_kind`, `amount`, `amount_unit`, `food_type` till `LogEvent`. Insert för snabbhändelsen lämnar detaljfälten utelämnade. Update skickar bara avsedda fält, skiljer utelämnat från explicit `null`, och rensar gamla typbundna detaljer vid typbyte; ospecificerade ändringar på samma typ bevarar dem.

### Sparstatus och ångra

- Detaljarket öppnas bara efter bekräftad add med rätt post-ID. Dubbla eventnycklar öppnar inte arket igen. Befintlig bekräftelse-toast med `Ångra` renderas synligt inne i arket, inte bakom modalarket, och 2,5-sekundersfönstret börjar först när arket stängts.
- Nyskapad add: pending detaljsparning visar `Sparar…`; vanlig stängning/skip är spärrad, men Ångra väntar på requesten och kan genomföra radering efteråt. Lyckad skrivning stänger arket och raden visar bekräftade värden. Definitiv failed visar `Kunde inte spara detaljerna.` med `Försök igen`/`Hoppa över`; Hoppa över kastar utkastet och stoppar retry. Unsure visar `Vi kunde inte kontrollera om detaljerna sparades.` med `Försök igen`/`Ångra`; vanlig stängning/skip är spärrad och Ångra raderar samma add efter att requesten returnerat.
- Befintlig post: pending update visar `Sparar…` och blockerar stängning. Definitiv failed visar `Kunde inte spara ändringen.` med `Försök igen`/`Avbryt`; Avbryt kastar utkastet och behåller senast bekräftade post. Unsure visar `Vi kunde inte kontrollera om ändringen sparades.` med `Försök igen`/`Stäng och fortsätt senare`. Den explicita stängningen bevarar utkast och mutationens osäkerstatus i LogScreen; raden går att öppna igen med utkastet kvar och status/toast för retry synlig. Ingen lyckad status visas före bekräftad skrivning.
- Den bekräftade snabbpostens `Ångra` finns i arket även när det innehåller en osparad detaljutkastning. Tryck på `Ångra` kastar utkastet och spärrar retry; om detaljpatch pågår väntar UI på att anropet ska bli klart och raderar sedan samma bekräftade add-ID. Det gäller även om detaljpatchen blev osäker eller misslyckades; en gammal retry får inte återuppliva raden efter undo. Om detaljer redan sparats tar undo bort samma post med detaljer. Arket pausar den befintliga 2,5-sekunders undo-tiden; efter stängning får ägaren fortfarande ångra den ursprungliga posten. Undo är aldrig kopplat till en osparad add.
- Behåll befintlig snabba dubbeltrycksspärr och dialog för nylig dubblett. Att hoppa över eller spara detaljer skapar ingen andra logghändelse.

## Avgränsning och avsiktliga avvikelser

- Följer målbildens nuvarande 2×2 snabbval, appbar, dagsgruppering och rader. Ingen ny kategori, flik, permanent formulärsektion, infobanner eller statusbadge.
- Den befintliga senaste-mönster-rutan får inte längre visas automatiskt. Den behålls bakom en sekundär visa/dölj-knapp, enligt v7-förslaget, så användaren ber om sammanfattningen innan den öppnas.
- Det valfria arket efter olycka/mat/vatten är uttryckligen beställt i UPD-1011 men saknas i målbilden. Det återanvänder den befintliga `BottomSheet`, typografi, spacing och kontroller; ingen ny sheet-komponent eller animation införs.
- Ingen hälso-, foder- eller mängdrekommendation, tolkning eller symptomlogik. Värden beskriver bara ägarens logg.
- Ingen schema-/RLS-ändring, ny dependency, dataändamål, telemetry eller delning. Ingen ändring av andra skärmar eller innehåll.

## Skrivvägar

Paketunika filer utöver denna plan, queue, rapport och releasehistorik:

- `src/features/puppy-log/LogScreen.tsx` – valfria ark, editorkontroller, validering och radtext.
- `src/features/puppy-log/log-model.ts` – endast små rena hjälp-/presentationsfunktioner om tester visar att UI behöver dem; ändra inte befintlig gruppering eller datavalidering utan konkret test.
- `src/features/home/ProductWorkspace.tsx` – uttrycklig DATA/UI-handoff för readback, update-patch, typbyte, bekräftad add och undo-identitet.
- `src/features/puppy-log/README.md` – uppdatera ansvar/dataflöde och testinstruktioner.
- `tests/log-model.test.mjs`, `tests/log-screen-policy.test.mjs`, `tests/workspace-data.test.mjs` – syntetiska modell-, UI-kontrakts- och patch-/readbackregressioner. Lägg bara till andra testfiler om det behövs och registrera dem i kö/plan först.
- `tools/visual-check/app.tsx`, `tools/visual-check/verify.py` – lokala syntetiska flöden för detaljark, redigering och senaste-mönster-knappens stängda/öppna läge.
- `docs/design/UPD-LOG-UI/checklista.md` och `docs/design/UPD-LOG-UI/evidence/` – rendererade skärmbilder, webbläsarresultat och 18-punkts visuell QA; om rendering inte går att köra sparas `NOT TESTABLE` med orsak, inte PASS.
- `docs/plans/UPD-LOG-UI-ux-spec.md` – kort UX-spec enligt Tassla Consumer UX-arbetsflödet.
- `tests/README.md` – vid behov beskrivning av ny syntetisk täckning.

Skyddat: `app/`, `supabase/`, `docs/mvp.md`, `docs/decisions/`, andra skärmar än den namngivna workspace-adaptern, delade UI-komponenter/tokens och dependency-/lockfiler. Inga schema- eller RLS-ändringar.

## Acceptanskriterier

1. Snabb add kvarstår en direkt skrivning. Valfria detaljer visas bara efter bekräftad add; hoppa över/stängning skapar ingen skrivning.
2. Olycka har valfri `Kiss`/`Bajs`-checkboxlogik inklusive båda=`both`; mat/vatten har rätt standardenhet, vatten konverterar mängden när ml/dl byts och mat visar samma hunds tidigare fodertyper under rubriken `Dina tidigare fodertyper`, aldrig som rekommendation.
3. LogEventEditor kan visa, ändra och rensa detaljer. Svenska valideringsfel följer DATA-gränserna. Failed/unsure har skild, exakt copy och åtgärder för nyskapad post respektive befintlig post; avbryt/stäng gör aldrig en osäker skrivning osynlig eller slänger ett befintligt utkast.
4. Listan visar olycksdetalj, mängd/enhet och fodertyp utan felaktiga kombinationer eller tomma skiljetecken. Samma hunds detaljer läses via ProductWorkspace och syns efter bekräftad readback.
5. ProductWorkspace update bevarar utelämnade patchfält, respekterar explicit `null` och rensar gamla fält vid typbyte. Snabb insert fortsätter utelämna detaljfälten.
6. Ångra, dubblettskydd, pending/failed/unsure/saved, lokal dagsgruppering, nyast-först och `Visa äldre poster` fungerar fortsatt. Ångra visas inne i arket, kasserar osparat utkast, väntar ut in-flight patch och tar bort samma add-ID utan att en stale retry kan återinföra posten. Pending/unsure på ny add kan inte döljas genom vanlig stängning; definite failed kan hoppas över. På befintlig post kan unsure-arket stängas explicit med utkast och global retrystatus bevarade så redigering kan återupptas.
7. Alla tryckytor är minst 44 pt; checkboxar har tillgängliga etiketter/status; arket fungerar med tangentbord, skärmläsarroller och stor text; inga emoji/hårdkodade stylingvärden eller nya rörelser.
8. Visuell QA jämför renderade vyer av snabb logg, olycksark, mat/vattenark, redigering, senaste-mönster-sammanfattningens stängda/öppna läge och relevanta save-/error-tillstånd vid 375 och 430 px samt 140 % text mot målbilden. Separat QA fyller i alla tillämpliga punkter 1–18. Saknad rendering = `NOT TESTABLE`, inte GODKÄND.
9. `pnpm check`, fokuserade logg-/workspace-tester, `python tools/dev_flow.py validate` och `git diff --check` körs och rapporteras med faktiska utfall. Renderingskommandon redovisas separat.
10. När befintlig mönsterdata finns är senaste-mönster-sammanfattningen stängd till dess att ägaren trycker `Visa dina senaste mönster`; samma knapp döljer den igen. Utan sådan data syns ingen toggle. Befintlig tröskel, antal/intervall och beräkning förblir oförändrade. Visuell QA verifierar både inget-data-, stängt- och öppet-läge.

## Gransknings- och leveransgrindar

- Product → Critic granskar denna exakta plan och all föreslagen svensk copy; ingen implementation före Architectens `APPROVE` på samma planversion.
- Dog Expert bekräftar att matcopy, mängdfält och fel inte antyder lämplig mängd, foderrekommendation eller hälsoråd.
- Security granskar den implementerade diffen före merge eftersom ProductWorkspace läser och uppdaterar ägarens lagrade loggdata, även om UI-paketet inte ändrar schema eller RLS. Compliance behövs inte enligt nuvarande avgränsning eftersom dataändamål och delning inte ändras. Om implementationen kräver ändrat ändamål, delning, auth, schema eller RLS stoppas paketet och planen omprövas.
- QA är separat från implementeraren och verifierar faktisk kod, testsvar och skärmbilder. Reviewer granskar den frysta diffen efter QA; kodgranskning ersätter inte visuell QA.
- Efter QA/Reviewer/Security PASS: commitera med normala hooks och pusha den färdiga paketbranchen enligt Eriks besked 2026-10-12. Ingen Codemagic eller TestFlight.

## Product-granskning av v1

2026-10-11, Product: **CHANGES**. Planens snabb-spara-först, valfria ark, olycksval, hundlokala fodertypförslag, radrendering och inmatning efter fel godkändes. Krävt: göra Undo synlig och definiera tap medan utkast/patch pågår/osäker; definiera ml↔dl-konvertering; lägga till exakta fältetiketter, knappar och svenska valideringsfel. V2 anger dessa beteenden och föreslagen copy. Väntar på ny Product-granskning.

2026-10-11, Product v2: **PROCEED**. Undo är synlig i arket, täcker utkast/pågående/osäker patch och spärrar stale retry; ml↔dl bevarar volym; svenska etiketter/fel är angivna. Mängdtaken ramas in som tekniska inmatningsgränser, visas endast vid överskridande och inte som råd. Product bekräftar också att köpostens ProductWorkspace-handoff och Undo-acceptans matchar planen. Detta är planreview, inte implementationstillstånd.

## Critic-granskning av v2

2026-10-11, Critic: **CHANGES**. Resterande lucka: skip/stängning kunde dölja en pending/unsure detaljpatch trots krav att bevara input/status. V3 skiljer på före request (skip utan skrivning), pending (stängning/skip spärrad; Undo serialiseras efter request), definite failed (explicit discard/skip), och unsure (status/retry kvar eller Undo endast för nyskapat event; vanlig stängning spärrad). Övriga UX-/scopepunkter bedömdes täckta. Ny Product- och Critic-review krävs.

2026-10-11, Critic v4: **PROCEED**. Bekräftade att osäker redigering av befintlig post kan stängas med utkast/retrystatus bevarade och öppnas igen, och att Undo för ny add väntar ut detaljrequesten, tar samma ID och blockerar stale retry. Kökontraktet matchar planen. Inga scopeblockerare.

## Product-granskning av v3

2026-10-11, Product: **CHANGES**. Låg friktion för snabb add godkändes och Ångra bedömdes som säker utväg för nyskapad add. Krävt: exakta fel-/statusmeddelanden och åtgärder för failed/unsure; skilja nyskapad post från befintlig redigering; säker utväg vid osäker befintlig ändring utan att tappa utkast/status. V4 definierar copy och åtgärder; befintlig post kan stängas via `Stäng och fortsätt senare` med utkast och retrystatus kvar och raden öppningsbar igen.

2026-10-11, Product v4: **PROCEED**. Bekräftade direkt snabb add, säkra arktillstånd, skild failed/unsure-copy och åtgärder för ny add respektive befintlig redigering. Osäker befintlig ändring kan stängas och återupptas med utkast/status intakta. Köposten matchar planen. Detta är planreview, inte implementationstillstånd.

2026-10-11, Product v5: **PROCEED**. Bekräftade att `Dina tidigare fodertyper` visar att förslagen är logghistorik och att `… per loggpost` gäller registreringsfältet, inte hundens intag. De valfria detaljerna påverkar inte snabbregistreringen och pending/failed/unsure har kvar säkra utvägar. Köposten matchar copy och grindar.

## Dog Expert-granskning av v4

2026-10-11, Dog Expert: **NEEDS CAVEAT**; ingen extern källa behövdes eftersom planen saknar nutritions- eller hälsopåståenden. Fältetiketter, enhetsformat, omvandling och valideringsregler bedömdes som tekniska. Krävde att fodertypförslag märks som tidigare loggat och att mängdtak tydligt gäller ett fält per loggpost, inte hundens intag. Vid v4-granskningen återstod specialistkontroll och Product/Critic-copyreview; de slutfördes i v5 (Dog Expert OK, Product/Critic PROCEED; se granskningarna nedan). **Needs human/vet review: no** så länge UI:t bara registrerar ägarens uppgifter och inte tolkar/rekommenderar mängder.

2026-10-11, Dog Expert v5: **OK**. Bekräftade att `Dina tidigare fodertyper` märker alternativen som ägarens tidigare loggar och inte råd, och att `… per loggpost` gör taket till en teknisk fältgräns. Ingen kvarstående caveat eller extern källa; ingen human/vet-review behövs så länge UI:t bara registrerar och inte tolkar/rekommenderar.

## Critic-granskning av v5

2026-10-11, Critic v5: **PROCEED**. Bekräftade att `Dina tidigare fodertyper` anger logghistorik för aktiv hund och att mängdfelens `per loggpost` beskriver tekniska fältgränser. Pending, definitivt fel och osäkert utfall har skilda åtgärder för ny post respektive redigering. Ångra för ny post behåller bekräftat add-ID, väntar på pågående detaljpatch och blockerar stale retry. Kökontraktet matchar planen; inga kvarstående blockerare.

## Product-granskning av v6

2026-10-11, Product v6: **PROCEED**. UX-specen följer ägarens avsikt: snabbregistreringen förblir direkt, detaljerna är valfria och befintliga loggvyer bevaras. Den stämmer med säkra sparflöden för ny post och befintlig redigering. Den tillagda Security-grinden före merge är rimlig för readback och uppdatering av ägarens loggdata. Ingen produktblockerare återstår; detta är planreview, inte implementationstillstånd.

## Critic-granskning av v6

2026-10-11, Critic v6: **PROCEED**. UX-specen täcker mål, startpunkt, flöden, sparfeedback/återhämtning, tillgänglighet, antaganden och avvikelsen från målbilden. Taskplanen anger exakta pending/failed/unsure- och Undo-beteenden, inklusive bevarat utkast vid befintlig redigering. UX-specen finns i både planens och köpostens skrivvägar; båda kräver Security-granskning av implementerad ProductWorkspace readback/update-diff före merge. Inga kvarstående blockerare.

## Avklarade antaganden enligt Product/Critic v6

1. Undo för snabb add visas i arket, pausar 2,5-sekundersfönstret och är skild från befintlig redigering. Status- och åtgärdscopy för pending/failed/unsure är definierad per flöde. Product v5 och Critic v5/v6 godkände dessa utvägar och add-ID-sekvenser.
2. Komma och punkt accepteras som decimaltecken. Svenska etiketter och valideringscopy står i UX-planen; Product/Critic har granskat exakt v6 och Dog Expert godkände mängdformuleringen i v5.
3. Fodertypförslag använder bara redan inlästa `events` för aktiv hund, utan extra fetch eller autocomplete-service. Detta bekräftades av Critic v5 och Dog Expert v5 samt Product v5/v6.

## Architect-granskning av v5

2026-10-11, Architect: **CHANGES**. Kräver en kort UX-spec enligt Tassla Consumer UX i `docs/plans/` och att filen deklareras i planens/queue:ens skrivvägar. Kräver Security-granskning av den implementerade diffen före merge eftersom ProductWorkspace ändrar readback/update för ägarens loggdata. Compliance kan fortsatt utelämnas om dataändamål och delning är oförändrade. Inga övriga blockerare.

## Architect-granskning av v6

2026-10-11, Architect: **CHANGES**. Efter att UX-spec och Security-grind lagts till fanns inaktuella statusrader för Product/Critic i planhuvud och köpost; dessa uppdaterades till att endast Architect-beslut återstår. En gammal lista med öppna antaganden motsade också Product/Critic v6; den har ersatts av avklarade punkter med granskningshänvisningar. Scope, UX-spec, Security-grind och kökontrakt bedömdes i övrigt samstämmiga.

2026-10-11, Architect v6: **APPROVE**. UX-spec och skrivvägar finns i planen och queue-kontraktet; Security-granskning av ProductWorkspace-diffen krävs före merge. UPD-LOG-DATA-beroendet är klart och scope, acceptanskriterier och granskningsstatus är samstämmiga.

## Implementationscheckpoint — 2026-10-11

V6-implementation inom skrivvägarna är klar, men QA gav **CHANGES** på den automatiskt visade senaste-mönster-rutan. Product/Critic gav v7 PROCEED och Architect gav APPROVE. Erik godkände scopeutökningen 2026-10-12: sammanfattningen ska vara stängd som standard med visa/dölj-handling och utan toggle när data saknas. V7-kodändringen återstår. Snabbregistreringen sparas först; olycks-, mat- och vattendetaljer hanteras i ett valfritt ark. `ProductWorkspace` läser och uppdaterar detaljfälten, behåller utelämnade patchvärden och använder samma ID när snabbregistreringen ångras. Säkerhetsgranskningens Undo-race är åtgärdad i källan; äldre vattenposter utan enhet väljer ml och små positiva mängder visas utan avrundning till noll.

Verifierat av implementeraren före QA:

- `pnpm check` — PASS; app-TypeScript, edge-TypeScript och 37/37 testfiler. ESLint: 0 fel och 38 varningar.
- `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_EVIDENCE=docs/design/UPD-LOG-UI/evidence python -u tools/visual-check/verify.py` — PASS; 42 kontroller, inga browser page errors. 140 %-vyer av detaljark och redigerare finns för 375/430 px, inklusive redigerarens efter-scroll-knappar. Renderad React Native Web-preview med syntetiska data, inte native-, backend- eller databasverifiering.
- `pnpm check` — PASS; 37/37 testfiler, lint 0 fel/38 varningar. Oberoende QA markerade punkt 11 `Nej` tills v7-förslaget eventuellt godkänns och implementeras.

## Granskningslogg

V6 hade Product/Critic `PROCEED`, Dog Expert `OK` och Architect `APPROVE`. Security fann och godkände därefter fixen för Undo-racen. Oberoende QA gav sedan `CHANGES`: senaste-mönster-rutan visas automatiskt och saknar handling, så kontroll 11 underkändes. Product gav v7 `PROCEED` för `Visa dina senaste mönster`/`Dölj dina senaste mönster`, utan tom toggle; Critic gav v7 `PROCEED` efter att plan, UX-spec och kö uttryckligen bevarar befintlig tröskel/beräkning och kräver QA av inget-data/stängt/öppet-läge. Architect gav v7 `APPROVE` och beslutade att kollapsen är ett explicit scopeskifte eftersom QA #11 gäller hela Logga-vyn. Erik godkände scopeutökningen 2026-10-12. V7-implementation och QA är dokumenterade i checkpointen nedan; Security och Reviewer återstår.

## V7 implementations- och QA-checkpoint — 2026-10-12

V7 är implementerad inom godkända skrivvägar. Den befintliga senaste-mönster-sammanfattningen visas nu först efter ägarens visa-handling, växlar till dölj-handling och syns inte när underlaget saknas. Tröskel, text och beräkning är oförändrade. Detaljflödena från v6 behåller sitt snabb-spara-först-, redigera-, retry- och undo-beteende.

Verifiering körd på aktuell arbetskopia:

- `pnpm check` — PASS: TypeScript, edge account TypeScript, lint 0 fel/38 varningar och 37/37 testfiler.
- `node --experimental-strip-types --test tests/log-model.test.mjs tests/log-screen-policy.test.mjs tests/workspace-data.test.mjs` — PASS: 3 testfiler, 0 fel.
- `python tools/dev_flow.py validate` — PASS före QA-övergången.
- `git diff --check` och `python -m py_compile tools/visual-check/verify.py` — PASS.
- `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs` — PASS. `TASSLA_UI_BASE_URL=http://127.0.0.1:4174 TASSLA_UI_EVIDENCE=docs/design/UPD-LOG-UI/evidence python -u tools/visual-check/verify.py` — PASS: 45 browserkontroller, 0 sidfel; syntetiska data, React Native Web. Skärmbilder täcker inget-data, stängt/öppet läge vid 375/430 px samt hela sammanfattningen vid 140 % text.

Oberoende QA granskade den faktiska ändringen, alla tillämpliga checklistpunkter och skärmbilderna och gav **PASS**. Security och oberoende Reviewer gav **PASS** utan blockerare. Reviewerna bekräftade hund-/postavgränsad datahantering, fältbevarande, typbytesrensning, undo-sekvensering, befintliga API-kontrakt och mönstersammanfattningens datagrind. En detaljpatch skickar även aktuell posttid, anteckning och varaktighet från den lokala ögonblicksbilden; en samtidig ändring från en annan klient kan skriva över dessa fält enligt det befintliga uppdateringskontraktet. Ingen versionskontroll/konfliktlösning ingår.

Native tangentbord/skärmläsare, enhetsrendering och backend/RLS är inte verifierade. Vid 140 % text radbryts delade bottenmenyns `Träning`-etikett i två rader utan overflow eller kontrollförlust; komponenten ligger utanför paketets skrivvägar. Commit/push till `codex/repo-grounding` återstår enligt Eriks instruktion. Ingen Codemagic/TestFlight.
