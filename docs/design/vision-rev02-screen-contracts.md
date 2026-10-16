# Vision rev02 — byggkontrakt för samtliga skärmar

Version 1.0, 2026-10-13. Beställt av Erik som underlag för kommande Codex-implementation. Status: designmål, inte färdig UI eller godkänd produktionsfunktion. Läs [designreglerna](../design-rules.md), [objektkontraktet](vision-rev02-objects.md) och faktisk kod före implementation. Panelerna i `vision_rev02.jpg` numreras vänster–höger, övre raden 1–4, undre 5–8.

## Gemensam grund

- Varm gräddvit bakgrund och nästan vita kort enligt designreglernas färgkontrakt; färgen sitter på relevanta ytor, symboler och bilder. Återanvänd destinationsfärger för destinationer, händelsefärger för händelser och grönt för status/val. Färgerna ska inte blandas ihop för att råka ge rätt kulör.
- Föreslagna basmått: sidmarginal 24 pt, sektionsgap 12–16, kortpadding 12–16, kortradie 16, radseparator 1. Skärmtitel 24/30 med vikt 700; sektionsrubrik 16/22 med vikt 700; brödtext 14–16/20–24; metadata 13/18. Hem har sitt mer precisa kontrakt. Måtten är byggmål, inte extraherade bildpixlar, och uttrycks i gemensamma tokens/varianter.
- Segmentkontroller: ljus varmgrå sammanhängande kapsel, vald del grön med kontrasterande text, höjd minst 44. Filterchips: mjukt rundade separata ytor med vald grön variant. Nuvarande `Tabs`-understrykning är inte en visuell ersättning; bygg en opt-in variant med bevarad semantik.
- Bildkort har bilden ovanför texten enligt panel 6/7. Återanvänd rätt bildroll och definierad beskärning. Text på mörk bildoverlay är inte likvärdig med referensens bild-över-text-kort.
- Listor är grupperade ytor med diskreta separatorer, inte en serie stora kort. Rubrik, ingress, metadata och primär handling får inte alla samma feta textstil.
- Aktiva navigationssymboler/etiketter är gröna, övriga neutrala. Samma fem huvudflikar finns kvar. Detaljvyer visar tillbaka och behåller ingångens huvudflik vald.
- Bild-/färgtokens införs avgränsat; andra konsumenter ändras inte genom ett ogenomgånget globalt defaultbyte. Föreslagna komponentnamn är inte befintliga API:er.

## Panel 1 — Hem

Normativt detaljkontrakt: [HOME-REV02-visual-ux-spec](../plans/HOME-REV02-visual-ux-spec.md). Ordning: hälsning/porträtt → levnadsveckor → Just nu → Dagens att göra → tre färgade genvägar. Manuella rutiner och träningsstatus har olika interaktion men sammanhängande visuell radform. Genvägarna är blå/grön/lila och fullt synliga i standardfixturen. Fördjupning innehåller hantering.

Kodankare: `src/features/home/HomeScreen.tsx`, `ProductWorkspace.tsx`, `daily-activity-model.ts`, `src/components/ui/DailyActivityItem.tsx`, `DestinationTile.tsx`. R02-2 v10/v11-presentationen är implementerad; v11 fick Home-QA PASS och Reviewer PASS för lokal public/review-rendering. Aktuell paketstatus och verifieringsgränser finns i `docs/tasks/dev/queue.json` och `docs/tasks/dev/vision-rev02-r02-2-v11.md`. Supabase/RLS och native-runtime är inte verifierade.

## Panel 2 — Utveckling

- **Uppgift/ingång:** förstå valpens aktuella ålder och kommande faser; öppnas från Hemmets åldersområde när destinationen finns. Hem behåller vald flik.
- **Komposition:** tillbaka + `{namn}s utveckling` → stort mjukt rundat porträtt → överlagrad åldersbåge med veckokapsel och ändpunkter Valp/Unghund → glödlampa och aktuell fas → kortet `Nästa milstolpar` med grupperade rader.
- **Form/färg:** porträtt omkring 60–70 % av innehållsbredden i höjd; åldersbåge cirka 64–80 pt hög över bildens nederdel, aktuell grön markör, neutrala övriga. Gul fasikon. Milstolpssymboler på blå/gul/grön/varm orange yta efter ämne, inte identiskt gröna. Fotoassetens varma päls/gröna miljö bidrar till helheten.
- **Objekt/handling:** ålder från befintligt födelsedatum. Fas/milstolpar från publicerade, sakgranskade och versionerade källor. Rad öppnar verklig guide; åldersbåge är kronologisk ålder, inte uppnådd färdighet. Definiera bågens start/slutålder i implementationplanen, inga godtyckliga progressprocent.
- **Lucka/tillstånd:** dedikerad vy och milstolpsmodell är byggberoenden. Visa ärligt saknat innehåll/ålder, inte bildens fasta veckor eller medicinska normalitetsbedömningar. Exempelfoto för review och produktionsfallback granskas separat.
- **Acceptans:** jämför porträttets dominans, bågens placering, aktuell fas och grupperade milstolpar vid 375/430. Hela sidan får scrolla. Ingen falsk klickaffordans på Hem innan utvecklingsdestinationen är byggd.

## Panel 3 — Dagens framsteg

- **Uppgift/ingång:** se dagens bekräftat klara aktiviteter; öppnas från Hem/dagsvyn när byggd. Pushad detalj med synlig tillbaka-knapp, Hem vald. Bakåtknappen är en dokumenterad navigationsavvikelse från panelens avbildade titelrad, eftersom vyn öppnas från Hem. Den återför till samma ingång och scrollposition.
- **Komposition:** synlig tillbaka-knapp + centrerad titel → stor grön progressring med porträtt och `{klart} av {alla}` → `Det här har ni gjort idag` med tid, ikon, text och status → varm sammanfattning → veckomål endast när ett riktigt mål finns.
- **Form/färg:** ring cirka 220–248 pt vid 375 bredd, 10–12 pt linje; neutral tom båge och grön fylld båge. Små ämnesfärger i aktivitetslistan; varm ljusgul sammanfattningsyta och gul stjärna. Konfetti är valfri stilla dekor, inte en ny animationsleverans.
- **Objekt/handling:** samma hela dagsmängd/count som Hem. Varje utförd rad måste komma från exakt tillåten källa och visa faktisk tid om den finns. Logghändelser får inte räknas som dagsuppgifter bara för att referensen visar en kissrad. Aktivitet öppnar rätt källa.
- **Lucka/tillstånd:** ingen ny dubbellagrad progress. Inga aktiviteter ger tomt läge; okänt resultat ger ingen komplett ring. Tid saknas innebär ingen fabricerad klocktid. Sammanfattning får säga hur många aktiviteter som markerats, inte att hunden blivit tryggare. Veckomål kräver eget mål-/periodkontrakt; annars utelämnas det blocket och avvikelsen redovisas.
- **Acceptans:** ring och lista visar identiskt dataläge; en bockning via rätt källa ändrar Hem och denna vy konsekvent. Fotomatchning, ringgeometri och varm färgfördelning bedöms separat från datakompletthet.

## Panel 4 — Daglig Checklista/hantering

- **Uppgift/ingång:** se och hantera de dagsaktiviteter som Hem sammanfattar. Tillbaka till Hem. Detta är separat från Kunskaps faschecklistor.
- **Komposition:** tillbaka + Checklista → kapselsegment → dagskort med rubrik/count/progress → fulla uppgiftsrader → kommande aktiviteter endast där faktisk plan finns. Befintlig rutin-/träningshantering får en tydlig undersektion/åtgärd här, utan att fylla Hem.
- **Form/färg:** fyrkantig checkbox/status; här kan radens ämnessymbol och kort hjälprad finnas, till skillnad från Hem. Rad minst 56–64 pt vid två textrader och kan växa. Gröna statusmarkeringar, varierade diskreta ämnesytor. Ändra/ta bort finns i radens detalj/meny med återhämtning.
- **Objekt/handling:** samma dags-ID, datum, tidszon och källhärledda completion som Hem. Egen rutin markeras av ägaren. Träning öppnar källsteget och använder läsbar status, ingen andra checkboxskrivning. Fulla namn är tillgängliga. `Välj aktiviteter` når befintliga val av rutin och träningssteg.
- **Lucka/tillstånd:** bygg Idag-resan först och visa inga låtsasflikar. `Alla` har ägarbeslutad betydelse: varje aktiv rutinmall visas, även om den inte valts för någon dag; den kan använda den befintliga kompletta mallistan. `Denna vecka` kräver ett verkligt veckourval och kompletta dagsläsningar. `Kommande` visas endast när verkliga schemalagda aktiviteter finns. Lägg till respektive flik i en senare checkpoint när dess urval och dataflöde är verifierade. Visa datum/hjälp begripligt utan interna käll-ID:n.
- **Acceptans:** fem/sju/inga uppgifter; hantering, rätt completion-källa, fel/osäkert svar och tillbaka till samma Hem. En framtida vaccinationsplan är aldrig en utförd vaccination. Bildens filterblock kan inte rapporteras färdigt innan alla visade filter fungerar.

## Panel 5 — Logga

- **Uppgift/ingång:** snabbt registrera en vardagshändelse och se dagens tidslinje. Huvudflik Logg; ingen ny huvudnavigation.
- **Komposition:** vänstertitel `Logga` → Idag/Översikt-kapsel när båda vyerna finns → datumrad med föregående/nästa och begripligt datum → gemensam tidslista → grön `Lägg till händelse`. Befintliga primära snabbval visas direkt efter datumraden, före tidslistan, i en kompakt grupp med minst 44×44 pt per kontroll och synlig etikett. Gruppen följer sparad primärordning och kan radbrytas; Fler/layoutredigering bevaras. Ett tryck på ett vanligt primärt snabbval från Loggs landning startar samma registrering som idag; befintlig dublettbekräftelse och typer som kräver fält behåller sina regler. Den synliga snabbvalsgruppen är en dokumenterad avvikelse från referensbilden för att bevara befintlig snabbresa. `Lägg till händelse` öppnar kompletterande inmatning och ersätter inte dessa snabbval.
- **Form/färg:** tid i fast vänsterkolumn cirka 44 pt; färgad kategorisymbol omkring 32, händelsenamn i flexibel kolumn och kort metadata. Rader minst 52–60 pt, diskreta avdelare, inga stora separata radkort. Kiss/vatten blått, bajs brunt, mat varmt beige/brunt och sömn lila. Föreslagen opt-in loggvariant `log.category.food.surface #F4E5D4` / `.icon #885839` följer panelens varma matsymbol; kontrollera kontrast vid rendering. Befintlig food-eventtyp och databetydelse bevaras. Ändra inte matfärg hos andra konsumenter genom ett oavsiktligt globalt defaultbyte. Knappen är grön, omkring 48–56 pt hög, med plus och text.
- **Objekt/handling:** `dog_events` via befintlig loggmodell/dataadapter; tid och anteckning från sparad händelse. Befintliga typer, snabbval, Fler, dubbeltrycksskydd, historik och ångra bevaras. Datumfilter använder verklig händelsetid och befintligt datumkontrakt. Raden öppnar detalj, inte en ny registrering.
- **Lucka/tillstånd:** Översikt öppnar fungerande Insikter först när den finns; ingen dekorativ tom flik. Ingen påhittad sovduration eller matmängd. Tom dag är ett vänligt tomt tillstånd. Spara/fel/osäkert/ångra syns nära handlingen utan permanenta sparbadges på normala rader.
- **Kod/acceptans:** `src/features/puppy-log/LogScreen.tsx`, befintliga loggmoduler och workspace. Jämför tidskolumn, ämnesfärger och listtäthet. Verifiera särskilt att primär kissregistrering fortfarande startar med ett tryck från Loggs landning, samt datumbyte, redigering/radering/ångra och att stort textläge inte döljer knappen. Ingen omskrivning av loggpersistens för designens skull.

## Panel 6 — Träning

- **Uppgift/ingång:** hitta relevant träning och återuppta rätt steg. Huvudflik Träning.
- **Komposition:** vänstertitel → Rekommenderat/Alla övningar/Mina → `Passar just nu ({ålder})` och Visa alla → två bildkort i bredd → `Fortsätt där ni var` med liggande bild, program/steg och verklig progress.
- **Form/färg:** rekommendationskort med bild ovanför text, bildförhållande omkring 4:3, radie 14–16 och 12 pt kolumngap. Varmt valpfoto/grön utemiljö; tid/ämne som små dämpade pillrar. Återupptagningskortets bild cirka 76–88 pt, grön progress och neutral text. Bilder ska vara betydelsefulla, inte ersättas av gröna träningsikoner i båda korten.
- **Objekt/handling:** publicerade versionsbundna program/steg och `training_progress`. Fortsätt öppnar samma programversion och nästa tillåtna steg. Filtrens urval måste definieras; `Mina` kräver en uttrycklig betydelse, exempelvis program med sparad progress, inte ett påhittat sparat/favoritfält. Alla program som går att öppna måste passera publicerings-, eligibility-, redaktionell målgrupps- och ytegrindarna; för vuxenprofil krävs versionsspecifik Dog Expert-bedömning av vuxentillämpning även för användarstyrd övningslista.
- **Lucka/tillstånd:** bildroll, korttitel, ämnestaggar och duration måste ha verklig källa eller versionsbundet lokalt manifest. Ingen fabricerad 5-minutersetikett eller åldersrekommendation. Öppet åldersspann innebär inte vuxenlämplighet. Program utan erforderlig målgrupps-/vuxenbedömning får inte visas som lämpligt eller öppnas som handlingsbart vuxenprogram. Ett tillgängligt godkänt program ger ett kort, inte en dublett för att fylla raden. Ingen rekommendation ger lugnt tomt läge. Vid stor text blir korten en kolumn.
- **Kod/acceptans:** `src/features/training/PublishedTrainingScreen.tsx`, `TrainingScreen.tsx` och befintliga innehålls-/progressadaptrar inventeras för public respektive review. Jämför bildandel, tvåkolumnskomposition och fortsättkort; verifiera faktiskt programbyte/återupptagning och inga falska bockar.

## Panel 7 — Kunskap

- **Uppgift/ingång:** hitta och läsa en relevant guide, FAQ eller faschecklista. Huvudflik Kunskap.
- **Komposition:** vänstertitel → låg rundad sökyta med söksymbol → Just nu/Valp/Träning/Beteende-chips när taxonomin finns → stort rekommenderat bildkort → två mindre bildkort. FAQ och Checklistor får tydliga separata ingångar i samma flöde.
- **Form/färg:** stor liggande bild ungefär 16:9 över rubrik/ingress/metadata. Mindre kort har bild över text och 12 pt gap. Varma fotografier och ämnesrelevant miljö ger färg; grönt visar valt filter, lila bok/kunskapsaccent används där relevant. Undvik en vägg av lika gröna ikonrader.
- **Objekt/handling:** publicerade guideversioner; tryck på bild eller text öppnar samma läsvy. Sök och ämnesfilter gäller en tydligt definierad mängd som passerat publicering, eligibility och godkänd redaktionell målgrupp/visningsyta. Vuxenråd kräver versionsspecifik Dog Expert-bedömning av vuxentillämpning även i användarstyrd sökning. Om sökningen bara täcker redan laddat urval anges det begripligt. Artikelns källa/fulltext bevaras.
- **Lucka/tillstånd:** kategorier kräver verklig taxonomi. Visa inte filter som alltid ger samma lista eller en icke-fungerande sökruta. Läs-/övningstid kräver publicerad metadata eller dokumenterad beräkning. Tom sökning, innehållsfel och initial laddning är skilda. Reviewgated FAQ/checklistor och vuxenmaterial får inte exponeras som public/godkänt genom layoutändringen.
- **Kod/acceptans:** `src/features/knowledge/KnowledgeScreen.tsx`, `FAQScreen.tsx`, `PuppyChecklistScreen.tsx` och befintliga innehållsläsare. Jämför stort kontra mindre bildkort och chipformer. Verifiera sök/filter där byggda, läsning/tillbaka samt fortsatt åtkomst till FAQ och faschecklistor.

## Panel 8 — Insikter

- **Uppgift/ingång:** få en beskrivande översikt över registrerade händelser. Nåbar från Logg/Översikt när byggd; Logg förblir vald. Vyn är en pushad detalj med synlig tillbaka-knapp som återför till Loggs Idag-läge och tidigare datum/scrollposition. Knappen är en dokumenterad navigationsavvikelse från panelens titelrad; Översikt på Logg är ingången till denna detalj.
- **Komposition:** tillbaka + titel → Vecka/Månad/Sedan start-kapsel → Kiss & bajs-kort med legend, axlar och grupperade staplar → varm sammanfattning när underlag finns → Sömn-kort med tidslinje/legend och periodnavigation när intervall kan härledas.
- **Form/färg:** gröna kiss-staplar och bruna bajs-staplar, ljusa rutnät; blå sömn och ljuslila vakenperioder i separat diagram. Diagramfärger är semantiska för just den vyn, inte en global ändring av Loggs händelseikoner. Explicit legend och textvärden; färg ensam räcker inte. Diagramhöjd som startmål 160–200 pt, kortet får växa för etiketter.
- **Objekt/handling:** fullständigt inläst och periodavgränsad händelsemängd. Periodbyte läser rätt data och visar laddning/otillräckligt underlag. En numerisk eller tabellformad tillgänglig sammanfattning måste kunna återge diagrammet.
- **Lucka/tillstånd:** dedikerad vy, längre periodläsning och giltiga sömnintervall återstår. Ett enstaka sömn-event ger inte varaktighet eller vakenintervall. Luckor/överlapp i data visas som okända, inte interpolerad sömn. Inga falska nollor eller slutsatser om normal hälsa. Bygg inte månadstexter från ett begränsat Home-urval.
- **Acceptans:** ringa/tomt/ofullständigt/fullständigt underlag ska gå att skilja åt. Kontrollera periodgränser, legend, verkliga tal och tillgänglig text. Saknat sömnkontrakt blockerar sömndiagrammet, inte annan godkänd beskrivande loggöversikt; kvarstående panelavvikelse redovisas.

## Stödskärmar utan egen referenspanel

Mer, Hälsa, planerad/utförd hälsa, vikt, Tassla-pass, profil, kontoinställningar, notifieringsinställningar, inloggning och läs-/formulärvyer är fortsatt del av produkten. För dem gäller samma tokens, typografi, varma ytor, navigation och återkoppling. Lista först deras befintliga användaruppgifter och härled en dokumenterad layout från närmast relevanta referensmönster (grupperad lista, bildkort eller detalj), inte från påhittad nionde panel.

Bevara funktioner, medicinsk information, kontoradering, samtycken, behörigheter och sparflöden. Ingen automatisk migration av dessa skärmar via globala tokenändringar. Ta dem som egna avgränsade designuppgifter med skärmdump före/efter och samma §14. Ägarens önskan om sammanhållen design är mandat för byggunderlaget, inte ett nytt data-/integrationskontrakt.

## Leveransmatris för nästa Codex-pass

För varje skärm ska arbetsplanen ange: panel, användaruppgift, synliga block i ordning, token/komponent/asset, verkligt produktobjekt, öppnings-/sparhandling, datalucka och acceptansbild. Alla interaktiva exempel måste ha en verklig destination; obebyggda funktioner skiljs från dokumenterat designmål.

| Del | Beroende | Minsta avslutningsbara leverans |
|---|---|---|
| Gemensam grund + Hem-korrigering | Nya visuella kontrakt; R02-2-status | Tokens, rader, genvägar, hanteringsfördjupning och bildroller i samma riktiga presentation som review |
| R02-3 Logg / Träning / Kunskap | Stabil R02-2-checkpoint och exakt plan | Migrera en vy åt gången; bevara sparning/progress/FAQ/checklistor; bildmanifest före bildacceptans |
| Utveckling | Ålder + publicerade fas-/milstolpskällor | Ålders-/fasresa med sanningsenlig bildroll och klart avgränsade luckor |
| Dagens framsteg / daglig Checklista | Samma fungerande dagsmängd och källregler | Hem → fördjupning → handling → uppdaterat Hem; inga nya falska veckomål/filter |
| Insikter | Fullständiga periodläsningar och avgränsad diagrammodell | Beskrivande faktisk loggdata; sömn som separat del när intervalldata räcker |
| Personligt foto | Separat godkänt foto-/säkerhetskontrakt | Ägarfoto med behörighet, laddning och radering; exempelassets behöver inte vänta på detta |
| Stödskärmar | Gemensamma varianter, respektive fungerande flöde | En skärm/resa åt gången med före/efter-evidens |

Alla vyer granskas vid 375×844/430×844, 375×667, lång svensk text och 140 % text, relevanta fel/tomma lägen samt reducerad rörelse. Endast Hem har uttryckligt krav att samtliga angivna standardblock ryms utan scroll. Övriga vyer följer panelens ordning och visuella hierarki med naturlig scroll; inga godtyckliga krav att all historik ska rymmas på första skärmen.

Referensfixturer och produktvyer ska dela presentationskomponenter. Syntetisk märkning ligger permanent i granskningsramen utanför deklarerad appviewport och ingår i exporten; befintlig banner inne i appytan mäts separat. §14 kräver separat bedömning av komposition, färger, typografi, komponentformer, bildspråk och innehållstäthet. Designkontraktets granskning är inte appens visuella godkännande.
