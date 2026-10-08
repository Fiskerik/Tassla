# FIGMA-DS-02 – plan v1 och checkpoint

Datum: 2026-10-08. Status: **IMPLEMENTERAD OCH SLUTAUDITERAD – separat QA pågår**.
Mandat: den bifogade FIGMA-DS-02-beställningen och [Figma-filen](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=0-1).
Release-log: [FIGMA-DS-02](../releases/FIGMA-DS-02.md). Taskkontrakt: [figma-design-system-02](../tasks/dev/figma-design-system-02.md).

## Underlag, färg och avgränsning

Läst: AGENTS.md, kanoniska [design-rules.md](../design-rules.md), INVENTORY.md:s läsanvisning, befintliga tokens, komponent-/ikonöversikt, regelbrott och tokenförslag samt [FIGMA-DS-01 plan v3](../tasks/dev/figma-design-system-01.md) och dess release-log. Målbilden `vision_rev01.jpg` har öppnats och inspekterats; endast övre MVP-delen används som strukturreferens.

De beställda sökvägarna `docs/DESIGN_RULES.md`, `docs/design/malbild.png` och `docs/plans/FIGMA-DS-01.md` saknas. De befintliga motsvarigheterna ovan används; inga låtsaskopior eller nya godkännanden skapas. DS-01:s låsta arkitektur återfinns i dess taskplan, inte på den angivna plans-sökvägen.

Primärfärg: **#186A4D**, samma som INVENTORY.md §1/§4.1 och DS-01:s `green-700` → `Color/primary`. Ingen primärfärg, appkod, dependency eller bindande designregel ändras. Endast designsystem och uttryckligt märkt Sandbox-test ingår; inga produktionsskärmar.

Användaruppgift: välja och återanvända rätt komponent/tillstånd utan klippning eller missvisande copy. Huvudhandling i varje sammansatt exempel: högst en primary. Synlig information: komponent, tillstånd, svensk exempeltext; fördjupning i beskrivningar och Foundations.

## Budget och genomförande

Arbeta med en deluppgift åt gången. Förbered hela ändringsmängden för en komponentfamilj före dess skrivanrop, inklusive bindningar och kända fel, så att familjen skrivs en gång. Tillämpa prioriteringen nedan; kända fel i samma familj kan ingå i dess layoutskrivning för att undvika dubbla anrop. Review, Foundations och Sandbox byggs i samlade anrop per yta när familjerna är klara.

Ingen upprepad read-only-audit. Vid återupptagning behövs en minimal ID-/åtkomsthämtning för den befintliga filen och komponenterna; den ska inte bli en helhetsaudit. Gör **en sammanhållen slutlig audit**, med strukturella kontroller och skärmdumpar 360/430 samt Sandbox 390. Separat QA använder samma evidens. Högst två rättningsomgångar; eventuella ändringar och återverifiering av berörda fynd bokförs. Vid MCP-gräns: stanna direkt, spara exakta familjer/noder och återstående steg här. Ingen webbläsar-/computer-use-reservväg eller begäran om inloggningsuppgifter.

## Numrerade deluppgifter

Ägare för steg 1–7 och 9: huvudsession. Steg 8: separat read-only QA-roll; huvudsession sparar resultat och rättar. Alla Figma-steg berör enbart målfilen; lokal dokumentation berör denna plan, taskkontrakt, release-log, kontrastunderlag och RULES_PROPOSAL. Varje steg checkpointas innan nästa.

| Steg | Beroende och yta | Acceptans | Verifiering i slutlig audit |
|---|---|---|---|
| 1. Bredd/layout | Figma-MCP tillgängligt; befintliga familjer | Auto layout, fill-bredd. AppBar 56, centrerad titel, Close. Tabs minst 44, padding 12, gap 8, fet aktiv text, primary och etikettbrett understreck; fyra flikar scrollar horisontellt vid 360. ListRow har chip, två textrader, chevron, minst 44 och grön bock för Complete; exempel Mat/Promenad/Vaccination. Card/ChecklistItem/Toast/QuickLogTile fyller tilldelad bredd. | Instanser i auto-layout-föräldrar 360/430; inga klippta etiketter eller utstickande barn. Fill verifieras på instans i förälder, inte bara på fristående master. |
| 2. Komponentfel/typografi | 1; samma familjer och Typography | Button-varianter i rutnät utan överlapp; Loading endast centrerad spinner i etikettstorlek. QuickLogTile minst 104 hög, chip Large 44, etikett under/centrerad och padding 12; fyra kategorier i 2×2. Toast padding horisontellt 16/vertikalt 12, radius md, ram, minst 48; Action=None/Undo/Retry, åtgärd minst 44. Alla checked ChecklistItem visar bock; Disabled tydligt inaktivt. Hero varm gradient/tass och mörk bottengradient, vit text minst 4,5:1, tydlig Pressed. Progress track/fill med Value=0/40/60/100 och Label. Type/Display 28/36 Bold; Label Bold, Body Regular. | Variantplacering, spinner, höjder, checked/disabled/pressed, gradientens kontrast under hela textområdet. Progress dokumenterar fill = procent av tillgänglig trackbredd i kod; ingen appkod skrivs. |
| 3. Ikoner | 1–2; IconChip och konsumterande familjer | Ionicons-geometri 24-rutnät, cirka 2 linje, rundade ändar; lager namnges efter ikon. BottomNav: home/create/school/heart/grid med outline inaktiv och filled aktiv. Kategorier enligt mappningen nedan. Egen tydlig tredelad poop-vektor, ingen emoji. | Samma kategori/ikon i alla instanser; korrekt active/inactive i alla fem navvarianter. |
| 4. Saknade komponenter | 1–3; nya familjer | Field Text/Date/Time/Multiline × Default/Focus/Filled/Error/Disabled, etikett/hjälp/fel och räknare 0/500. CheckboxCard Yes/No × Default/Pressed/Disabled, titel/beskrivning, helkortstryck. Dialog Default/Destructive, två knappar och rätt destructive. BottomSheet handtag/titel/Close/slot/fullbred primary. EmptyState chip/rubrik/högst två textrader/knapp. SectionHeader rubrik/valfri tertiary Visa alla. StatusBadge Saving/Offline/Error endast vid avvikelse. Button Icon med ellipsis-horizontal för radmeny. | Auto layout/fill-bredd, variabelbindningar, properties, svensk copy, minst 44 på interaktiva ytor. `Color/borderStrong` används på kontrollkanter för Field, CheckboxCard, secondary-/icon-knappar och ChecklistItem. DayStrip/DogCard endast om budget återstår. |
| 5. Foundations | 1–4; Design system/Foundations | Visuell färgkarta med variabelnamn/hex för bas och samtliga kategoripar, Display/Title/Heading/Body/Caption/Label-exempel, spacing 4–32, radier sm/md/lg/full, storlekar inklusive touchMin 44, kontrasttabell. | Opaque färgpar beräknas enligt WCAG. Text minst 4,5:1; betydelsebärande ikoner/kontroller minst 3:1. Fel rättas i tokens och binds; ingen lokal färggenväg. |
| 6. Review | 1–5; Design system/Review | Byggs av instanser av riktiga komponenter; ingen fristående komponentkopia. Alla textproperties/nested properties har avsiktlig copy enligt nedan. | Instanskopplingar och samtliga exempel; inga överlapp/klippningar. Spara faktiska node-id-länkar till Review/Foundations. |
| 7. Sandbox | 1–6; separat sida Sandbox | 390 bred ram, märkt TEST, ej produktionsskärm. AppBar Home, Snabb logg Kiss/Bajs/Mat/Sömn 2×2, Dagens logg med ListRows, BottomNav. Följer struktur utan pixelkopiering. | Fullbredd, sektionsgap 24, rubrikgap 8–12, listgap 12, hierarki, inget innehåll bakom navigationen. |
| 8. Separat QA | 1–7 och renderad evidens | Annan roll bedömer §14:s 18 punkter, kontrast och krav 1–7, motiverar N/A; minst tre konkreta förbättringsförslag. Högst två rättningar, därefter checkpoint. | 360/430, stor text och Sandbox 390 bredvid MVP-målbilden. Saknad evidens = NOT TESTABLE. Ingen egen visuell sign-off. |
| 9. Dokumentation/leverans | 8 eller blockerat checkpoint | Plan/release-log aktuella; RULES_PROPOSAL föreslår ändringar utan att redigera policyn; alla antaganden/avvikelser listade. Rapport högst 15 rader. | Git-diff, dokumentlänkar, ärlig separation planerat/implementerat/verifierat. Figma-nodlänkar endast när kända. |

## Ändringar mot den låsta DS-01-matrisen

Behåll befintliga collections, modes, aliasprincip, scopes och WEB/Android/iOS-kodsyntax. Nya mått och semantiska roller utökar samma struktur; fasta illustrativa vektorkoordinater är tillåtna, färg/storlek binds. Ändringarna nedan är uttryckligt beställda för Figma i DS-02, inte ett mandat att bygga om appen.

- AppBar: utöka Mode med Close; högertouchyta 44 och balanserad titelplacering. Home behåller Tassla-varumärket enligt policyn; Back-exempel heter Hälsa.
- Tabs: behåll Count/Active och nested Tab-properties; scrollen ligger i instansens viewport, ingen krympning av etiketter.
- Toast: utöka Action med Retry. Error-exempel använder Retry/Försök igen. Success: Sparat; Neutral: Påminnelsen är avstängd. Övriga kombinationer får beskrivning av avsedd användning, så Error inte marknadsförs med Ångra som standard.
- Progress: ersätt Empty/Partial/Complete med numeriska 0/40/60/100, kontinuerlig stapel; uppdatera konsumerande instanser.
- Typography: `type/display/size=28`, `lineHeight=36`, Bold via befintlig font/style; lägg Type/Display. Label 16/24 Bold, Body 16/24 Regular.
- Nya semantiska mått för bland annat appbarHeight 56, quickLogMinHeight 104 och toastMinHeight 48 läggs där motsvarande token saknas; befintliga 44/56/32/44 återanvänds.

Ikonmappning: Pee=water-outline, Food=restaurant-outline, Sleep=moon-outline, Awake=eye-outline, Walk=footsteps-outline, Training=school-outline, Vaccination=bandage-outline, Deworming=bug-outline, Veterinary=medkit-outline; Poop=egen tredelad vektor i samma linjestil. Custom Poop namnges tydligt som egen ikon, inte som ett påhittat Ionicons-namn. BottomNav representerar destinationer, inte nya kategoriikoner; Träning delar school-geometrin.

Review-copy: Spara (primary), Lägg till händelse, Dela som PDF i separata exempel; Läs mer (tertiary), Radera (destructive), Hälsa (AppBar Back), Idag för Luna. Progress 0/40/60/100: 0 av 5 / 2 av 5 / 3 av 5 / 5 av 5 genomförda. Toast-texterna ovan är egna properties, inte nedkopierad standardtext. Luna är syntetiskt exempel.

## Checkpoint 2026-10-08

**Klart lokalt:** plan v1, taskkontrakt, release-log, [kontrastunderlag](../design/FIGMA-DS-02-CONTRAST.md) med reproducerbart kommando, [RULES_PROPOSAL](../design/RULES_PROPOSAL.md) och [separat QA-utlåtande](../design/FIGMA-DS-02-QA.md) för dokumentcheckpointen. Underlaget och MVP-målbilden har lästs/inspekterats. Kontrastberäkningen av de dokumenterade 15 färgparen är utförd och oberoende omräknad; detta är inte en audit av Figma-filen. `pnpm check` avslutade med exit 0 (355 testpass, 1 skip, inga testfel; befintliga lint-/Node-varningar); `git diff --check` och kontroll av nya dokuments lokala länkar/radslut/whitespace är utförda. Appkod och låsfil är oförändrade. Ingen Figma-layout eller fungerande nativeåtgärd bevisas av kodkontrollen.

**Blockerare, återupptagningsförsök 2026-10-08:** Figma-MCP:s läs- och skrivverktyg finns i sessionen, inklusive `use_figma`. Den minsta förkontrollen kördes mot filnyckeln `2UI5GtK3JjZH3ncCS9M35c`: `get_libraries` och top-level `get_metadata` avvisades båda direkt med `You've reached the Figma MCP tool call limit on the Starter plan`. Ingen filstruktur, sida eller node-id returnerades. Arbetet stoppades enligt budgetregeln; `use_figma` anropades inte, inga Figma-noder ändrades och ingen webbläsar-/computer-use-reservväg användes.

**Ej klart:** samtliga Figma-ändringar i steg 1–7, slutlig audit, renderad QA och faktiska Foundations/Review-node-id-länkar. DS-01:s tidigare rapporterade 6 collections/98 variabler/5 textstilar och komponenter är historiska uppgifter; deras nuvarande tillstånd är inte verifierat här. Inga familjer eller noder är ändrade genom DS-02, inga korrigeringsomgångar förbrukade.

**Avvikelser/antaganden:** saknade underlag ersätts med dokumenterade befintliga motsvarigheter; Inter förblir Figma-proxy för systemfont, endast Light; DS-02:s uttryckliga additionsscope gäller Figma; större text ska omflöda och får öka höjden. Layout-/fel-/ikonändringar samlas per familj av budgetskäl. Kontrastunderlaget gäller dokumenterade opaka tokens, inte verklig gradient/rendering. Ljus dekorativ border kan behållas på kort; fält/checkboxar behöver en separat token för betydelsebärande kontrollkant om ingen annan tydlig signal finns. Inget av dessa kontroll-/gradientförslag är implementerat.

**Nästa exakta steg:** återuppta steg 1 när Starter-planens MCP-kvot har återställts eller målfilen har tillgång till en plan med tillgänglig MCP-kvot. Börja med en enda minimal ID-/bibliotekshämtning; om den lyckas, samla kompletta familjändringar och börja med AppBar och Tabs. Spara avklarade familjer, faktiska node-id:n och återstående arbete efter varje batch. Följ sedan steg 2–9; ingen ny beställningsbekräftelse behövs inom scope.

### Genomförandecheckpoint 2026-10-08 – AppBar

Figma-planen är uppgraderad och MCP-förkontrollen lyckades. Lokal discovery verifierade sidan `Design system`, sex variabelcollections, 98 befintliga variabler, fem textstilar och DS-01-komponentfamiljerna. Externa communitybibliotek avviker från Tasslas låsta API och användes inte.

**AppBar klar i Figma:** komponentset [AppBar](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=13-113) har nu sex varianter: `Mode=Home|Back|Close × Action=On|Off`. Samtliga är 336×56; Back/Close har balanserade 44-punkts stödytor och centrerad titel, Home behåller vänsterställt Tassla-varumärke. Chevron, Close och klocka använder `color/textPrimary`; samtliga AppBar-varianter använder `color/background` utan kant. Ny tokenbunden [Icon/Close](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=35-787) använder 24-rutnät och 2 px linje. Första Close-renderingen visade en felaktig SVG-ramfill; riktad rättningsomgång 1 tog bort den och efterbilden visar korrekt X. [AppBar-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=38-853) innehåller riktiga instanser i 360 och 430 pt. Strukturell mätning visar att titelcentrum är exakt samma som instanscentrum i båda bredderna och att stödytorna ligger mot kanterna. Slutlig samlad QA återstår.

### Genomförandecheckpoint 2026-10-08 – Tabs

**Tabs klar i Figma:** [TabItem](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=13-120) använder Bold + primary + etikettbrett understreck för Active och Regular + textSecondary för Inactive, 12 px horisontell padding och 44 px höjd. [Tabs](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=13-239) använder 8 px gap och har en tunn semantisk bottenlinje. Tre flikar har 354–356 px innehåll och ryms i 360; fyra har 387–392 px innehåll i en 360 px klippt viewport med `overflowDirection=HORIZONTAL` och en svag högerkant som scrollindikering. Scrollbeteendet är dokumenterat i komponentbeskrivningen. [Tabs-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=40-873) visar avsiktlig klippning/scroll vid 360 och alla fyra etiketter vid 430. Renderingen visar inga överlapp; slutlig samlad QA återstår.

**Nästa exakta steg:** fortsätt steg 1 med ListRow samt bredd för Card, ChecklistItem, Toast och QuickLogTile. AppBar/Tabs återbesöks endast i den samlade slutauditen eller om beroendeändringar gör evidensen inaktuell.

### Genomförandecheckpoint 2026-10-08 – ListRow

**ListRow klar i Figma:** [ListRow](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=13-631) har sex fullbreddsvarianter på 336×72 med IconChip, Title, Meta, separat valfri `Time`-textproperty, chevron och synlig grön bock för Complete. Disabled är tydligt nedtonad. [ListRow-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=43-1010) visar Mat/Food, Promenad/Walk och Vaccination/Vaccination; sista exemplet har tom tid och Complete-bock. Renderingen visar två läsbara textrader och inga överlapp.

**Nästa exakta steg:** fullbreddsrätta Card, ChecklistItem, Toast och QuickLogTile en familj per skrivanrop; ta familjeevidens och checkpoint efter varje färdig familj.

### Genomförandecheckpoint 2026-10-08 – Card

**Card klar i Figma:** [Card](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=12-140) har tre 336 px breda auto-layoutvarianter med innehållsstyrd höjd, 16 px padding, 8 px gap och radius.lg. Default/Pressed använder semantisk `Color/border`; Selected använder `Color/primary`. Returvalideringen fångade först en felaktig primitiv border-bindning och en riktad rättning ersatte den före visuell checkpoint. [Card-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=44-988) visar Default/Pressed/Selected utan klippning eller överlapp.

### Genomförandecheckpoint 2026-10-08 – ChecklistItem

**ChecklistItem klar i Figma:** [ChecklistItem](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=12-179) har sex fullbreddsvarianter för `Checked=Yes|No × State=Default|Pressed|Disabled`, 44 px minsta höjd och tydligt nedtonat Disabled-tillstånd. Ny semantisk `Color/borderStrong` aliaserar `Primitives/muted` och används för betydelsebärande okryssade kontrollkanter; den dekorativa kortkanten är oförändrad. Samtliga tre Checked-varianter innehåller bock. Första renderingen visade att bockens ikon fortfarande ärvde grön stroke; en riktad rättning band [Icon/Check](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=12-62) till `Color/onPrimary`. [ChecklistItem-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=45-1016) visar därefter vit bock i Default, Pressed och Disabled samt synlig okryssad kontroll i alla tre tillstånd.

Primitiven `Primitives/border` är samtidigt omdöpt till `Primitives/border-200`; `Color/border` aliaserar fortsatt samma variabel-ID. `Color/borderStrong` ska återanvändas på samtliga betydelsebärande kontrollkanter, inklusive kommande Field, CheckboxCard samt secondary- och icon-knappar.

### Genomförandecheckpoint 2026-10-08 – Toast

**Toast klar i Figma:** [Toast](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=12-220) har nio varianter för `Tone=Success|Error|Neutral × Action=None|Undo|Retry`, 336 px masterbredd, 16/12 px padding, 14 px radie, semantisk ram och 44 px åtgärdsyta. Renderad [360-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=51-1122) och [430-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=51-1133) använder avsiktliga Message-overrides: Sparat, Kunde inte spara/Försök igen och Påminnelsen är avstängd.

### Genomförandecheckpoint 2026-10-08 – QuickLogTile

**QuickLogTile klar i Figma:** [QuickLogTile](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=13-650) har tre 156×112-varianter, 12 px padding, Large IconChip 44, centrerad Bold-etikett och `Color/borderStrong` på kontrollkanten. [360-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=52-1127) och [430-evidens](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=52-1164) visar Kiss, Bajs, Mat och Sömn i 2×2 utan klippning.

**Nästa exakta steg:** Button-familjens variantgrid/loading samt `borderStrong` för secondary/icon; därefter HeroCard, Progress och Typography.

### Genomförandecheckpoint 2026-10-08 – Button

**Button klar i Figma:** [Button](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=12-130) är ordnad i ett 5×4-grid utan överlapp. Samtliga Loading-varianter visar endast en centrerad 24 px spinner. Secondary och Icon använder `Color/borderStrong`; Icon använder nya [Icon/EllipsisHorizontal](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=54-1160) för radmeny. [360](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=54-1165) och [430](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=54-1186) är renderade.

### Genomförandecheckpoint 2026-10-08 – HeroCard

**HeroCard klar i Figma:** [HeroCard](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=12-151) har varm gradient, egen tassillustration och mörk bottengradient över hela textytan. Pressed är mörkare och har tydlig primary-kant. Vit titel/meta ligger mot minst 72 % svart overlay. [360](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=55-1208) och [430](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=55-1233) är renderade.

### Genomförandecheckpoint 2026-10-08 – Progress och Typography

**Progress klar i Figma:** [Progress](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=12-204) använder en kontinuerlig track/fill med `Value=0|40|60|100` och avsiktliga label-overrides. Beskrivningen dokumenterar `fill = Value/100 × tillgänglig trackbredd`. [360](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=56-1264) och [430](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=56-1281) är renderade.

**Typography klar i Figma:** `type/display/size=28` och `type/display/lineHeight=36` har lagts till i Typography-collection och bundits till nya `Type/Display` Bold. `Type/Body` är 16/24 Regular och `Type/Label` 16/24 Bold. [360](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=56-1304) och [430](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=56-1311) är renderade; höjden huggar innehållet så samtliga sex roller syns.

**Nästa exakta steg:** ikoninventering/mappning och saknade komponentfamiljer, med Field och CheckboxCard först så `borderStrong`-kravet kan verifieras.

### Genomförandecheckpoint 2026-10-08 – ikoner och saknade familjer

Ikonmappningen är verifierad och dokumenterad i [IconChip](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=11-142) och [BottomNav](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=13-564). Poop är fortsatt en egen tredelad vektor; nav beskriver Home=home, Log=create, Training=school, Health=heart och More=grid med outline/filled-tillstånd.

Nya familjer: [Field](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=57-1399) med 20 Type/State-varianter, [CheckboxCard](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=57-1502) med sex Checked/State-varianter, [Dialog](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=58-1366), [BottomSheet](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=58-1405), [EmptyState](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=59-1407), [SectionHeader](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=59-1445) och [StatusBadge](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=59-1466). Field, CheckboxCard samt secondary-/icon-knappar och okryssad ChecklistItem är strukturellt verifierade mot `Color/borderStrong`. Samtliga familjer har 360/430-evidens.

### Genomförandecheckpoint 2026-10-08 – Foundations, Review och Sandbox

[Foundations](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=61-1725) visar faktiska färgvariabler/hex, samtliga kategoripar, sex typografier, spacing 4–32, radier, storlekar och kontrasttabell. `size/appbarHeight=56`, `size/quickLogMinHeight=104` och `size/toastMinHeight=48` har lagts till. [Review](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=63-1722) innehåller 81 riktiga komponentinstanser och avsiktliga actions/copy. Separata sidan [Sandbox](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=64-2032) är 390×860, märkt `TEST · SANDBOX · EJ PRODUKTION` och använder AppBar, QuickLogTile, ListRow och BottomNav utan innehåll bakom navigationen.

### Slutaudit och korrigering 1

Slutauditen verifierade två sidor, `border-200` → `Color/border`, `borderStrong`, variantantal, komponentbeskrivningar, 360/430-par, Foundations, Review och Sandbox. Auditens enda verkliga familjefel var att QuickLogTile-setet hade tappat Pressed/Disabled; korrigering 1 återställde tre 156×112-varianter. Samma korrigering band explicit samtliga tre okryssade ChecklistItem-kontroller till `Color/borderStrong`. Riktad återverifiering passerade. StatusBadge rättades till 28 px höjd efter renderad klippning och omrenderades med alla etiketter synliga. Ingen korrigering 2 behövdes före separat QA.

## Evidensregister inför återupptagning

| Evidens | Planerat namn | Status / nodlänk |
|---|---|---|
| Familjer: ändrade properties, bindningar, masters/instanser | Genomförandecheckpoint per familj ovan | Klart; faktiska komponent- och evidenslänkar ovan |
| 360 bred auto-layout-test inklusive scrollande Tabs | FIGMA-DS-02-layout-360 / FIGMA-DS-02-tabs-360-scroll | AppBar `38:854`; Tabs `40:874`; renderade |
| 430 bred auto-layout-test | FIGMA-DS-02-layout-430 / FIGMA-DS-02-tabs-430 | AppBar `38:867`; Tabs `40:893`; renderade |
| Familjepar 360/430 | FIGMA-DS-02-family-widths | ListRow `43:1010`/`49:1051`; Card `44:988`/`49:1099`; ChecklistItem `45:1016`/`49:1109`; Toast `51:1122`/`51:1133`; QuickLogTile `52:1127`/`52:1164` |
| Ytterligare familjepar 360/430 | FIGMA-DS-02-family-widths | Button `54:1165`/`54:1186`; Hero `55:1208`/`55:1233`; Progress `56:1264`/`56:1281`; Field `57:1400`/`57:1433`; CheckboxCard `57:1503`/`57:1523`; Dialog `58:1367`/`58:1384`; BottomSheet `58:1417`/`58:1430`; EmptyState `59:1419`/`59:1429`; SectionHeader `59:1446`/`59:1453`; StatusBadge `59:1467`/`59:1474`; BottomNav `59:1481`/`59:1627` |
| Stor text vid båda bredder | FIGMA-DS-02-large-text-360/430 | Typografispecimen `56:1304`/`56:1311`; sammansatt dynamisk typeskalning bedöms separat i QA |
| Foundations och kontrast | FIGMA-DS-02-foundations | `61:1725`; renderad och strukturellt auditerad |
| Review med komponentinstanser | FIGMA-DS-02-review | `63:1722`; 81 instanser |
| Sandbox TEST 390 | FIGMA-DS-02-sandbox-390 | `64:2032`; renderad 390×860 |

Namnen ovan är planerade evidensetiketter, inte påståenden om befintliga bildfiler. Slutlig QA kopplar varje krav till faktisk bild/nod och motiverar N/A; underlags-QA ersätter inte steg 8.
