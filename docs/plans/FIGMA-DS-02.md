# FIGMA-DS-02 – plan v1 och checkpoint

Datum: 2026-10-08. Status: **BLOCKERAD före Figma-implementation**.
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
| 4. Saknade komponenter | 1–3; nya familjer | Field Text/Date/Time/Multiline × Default/Focus/Filled/Error/Disabled, etikett/hjälp/fel och räknare 0/500. CheckboxCard Yes/No × Default/Pressed/Disabled, titel/beskrivning, helkortstryck. Dialog Default/Destructive, två knappar och rätt destructive. BottomSheet handtag/titel/Close/slot/fullbred primary. EmptyState chip/rubrik/högst två textrader/knapp. SectionHeader rubrik/valfri tertiary Visa alla. StatusBadge Saving/Offline/Error endast vid avvikelse. Button Icon med ellipsis-horizontal för radmeny. | Auto layout/fill-bredd, variabelbindningar, properties, svensk copy, minst 44 på interaktiva ytor. DayStrip/DogCard endast om budget återstår. |
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

**Blockerare:** inga Figma-MCP-verktyg eller verktygssökfunktion är tillgängliga i denna session. Inga Figma-anrop har gjorts, ingen ny MCP-kvotöverträdelse har observerats och länken har inte kunnat läsas/redigeras. DS-01:s tidigare Starter-gräns är historik, inte en verifierad aktuell kvotstatus. Ingen webbläsarreservväg har använts.

**Ej klart:** samtliga Figma-ändringar i steg 1–7, slutlig audit, renderad QA och faktiska Foundations/Review-node-id-länkar. DS-01:s tidigare rapporterade 6 collections/98 variabler/5 textstilar och komponenter är historiska uppgifter; deras nuvarande tillstånd är inte verifierat här. Inga familjer eller noder är ändrade genom DS-02, inga korrigeringsomgångar förbrukade.

**Avvikelser/antaganden:** saknade underlag ersätts med dokumenterade befintliga motsvarigheter; Inter förblir Figma-proxy för systemfont, endast Light; DS-02:s uttryckliga additionsscope gäller Figma; större text ska omflöda och får öka höjden. Layout-/fel-/ikonändringar samlas per familj av budgetskäl. Kontrastunderlaget gäller dokumenterade opaka tokens, inte verklig gradient/rendering. Ljus dekorativ border kan behållas på kort; fält/checkboxar behöver en separat token för betydelsebärande kontrollkant om ingen annan tydlig signal finns. Inget av dessa kontroll-/gradientförslag är implementerat.

**Nästa exakta steg:** återuppta steg 1 när en Figma-MCP-anslutning med läs- och skrivstöd är tillgänglig för filnyckeln `2UI5GtK3JjZH3ncCS9M35c`. Gör minsta nödvändiga ID-hämtning, samla kompletta familjändringar och börja med AppBar och Tabs. Spara avklarade familjer, faktiska node-id:n och återstående arbete efter varje batch. Följ sedan steg 2–9; ingen ny beställningsbekräftelse behövs inom scope.

## Evidensregister inför återupptagning

| Evidens | Planerat namn | Status / nodlänk |
|---|---|---|
| Familjer: ändrade properties, bindningar, masters/instanser | En rad per genomförd familj efter batch | Saknas; inga familjer ändrade |
| 360 bred auto-layout-test inklusive scrollande Tabs | FIGMA-DS-02-layout-360 | Ej renderad; node-id okänd |
| 430 bred auto-layout-test | FIGMA-DS-02-layout-430 | Ej renderad; node-id okänd |
| Stor text vid båda bredder | FIGMA-DS-02-large-text-360/430 | Ej renderad; node-id okänd |
| Foundations och kontrast | FIGMA-DS-02-foundations | Ej skapad/verifierad; node-id okänd |
| Review med komponentinstanser | FIGMA-DS-02-review | Ej ombyggd/verifierad; node-id okänd |
| Sandbox TEST 390 | FIGMA-DS-02-sandbox-390 | Ej skapad; node-id okänd |

Namnen ovan är planerade evidensetiketter, inte påståenden om befintliga bildfiler. Slutlig QA kopplar varje krav till faktisk bild/nod och motiverar N/A; underlags-QA ersätter inte steg 8.
