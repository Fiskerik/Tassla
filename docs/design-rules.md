# Tassla — designregelverk för vision_rev02

Version 2.2, 2026-10-13. Kanonisk instruktion för nya och reviderade UI-uppgifter, på Eriks beställning av ett sammanhängande regelverk och byggunderlag mot [vision_rev02.jpg](../vision_rev02.jpg).

## 0. Auktoritet och leveransstatus

`vision_rev02.jpg` är aktuell visuell målbild. Dess åtta paneler är designmål, inte åtta redan implementerade funktioner. `vision_rev01.jpg` och äldre paketspecifikationer är historik. Detta regelverk ersätter motstridiga äldre visuella anvisningar för kommande arbete; tidigare leveranser skrivs inte om retroaktivt.

Rangordning: aktuella ägarbeslut → sanningsenlighet, säkerhet och tillgänglighet → detta regelverk och rev02-specifikationen → UX-skillens beteenderegler → befintlig kod. Bilden styr komposition, objekt, komponentformer, bildspråk och innehållshierarki. Namn, räknetal och råd i bilden är exempel, inte datakällor. Olösta faktiska konflikter dokumenteras; redan fattade beslut frågas inte om igen.

Läs tillsammans:

- [Preciserat Hem-kontrakt: färger, mått, bilder, rader och hantering](plans/HOME-REV02-visual-ux-spec.md). För Hem gäller detta framför tidigare generella mått.
- [Detaljerade byggkontrakt för alla åtta skärmar och stödskärmar](design/vision-rev02-screen-contracts.md).
- [Gemensam Codex-bygginstruktion för skärmarna](prompts/build-rev02-screens.md).
- [Skärmar, komponenter och Hem-specifikation](design/vision-rev02-spec.md).
- [Produktobjekt, datakopplingar och innehåll](design/vision-rev02-objects.md).
- [Bygginstruktion för Hem](prompts/build-home-rev02.md).
- [Byggordning, mandat och granskningar](tasks/VISION-REV02.md).

Statusord: **befintligt** = kod finns; **föreslaget** = kontrakt att implementera; **granskningsläge** = syntetisk interaktion; **produktionskopplat** = verklig läsning/skrivning verifierad; **visuellt godkänt** = jämfört med målbilden. Ingen status ersätter en annan.

### Bindande mål: bygg mot referensen

Varje berörd skärm ska aktivt närma sig sin panel i `vision_rev02.jpg` i **komposition, färgfördelning, typografi, komponentform, bildspråk och innehållstäthet**. Att rätt funktioner finns på sidan uppfyller inte designmålet. Befintliga komponenter, en tidigare skärmdump eller ett historiskt QA-PASS får inte ersätta visionen som visuell auktoritet.

Återanvändning betyder att utveckla gemensamma komponenter så att de klarar referensen. Behåll inte fel radform, stora rubriker, monokroma ytor eller saknade bilder bara för att de redan finns i kod. Inför avgränsade namngivna varianter; migrera inom godkänt scope. Ingen generell ombyggnad av andra skärmar krävs för att rätta den aktuella.

Funktion, tillgänglighet och sanningsenlighet ska fungera tillsammans med designen. En nödvändig avvikelse ska avgränsas till det berörda elementet och redovisas enligt §12. Den får inte bli skäl att förenkla bort resten av bildens formspråk eller ett nytt rutinmässigt tillståndskrav för redan beställt arbete.

## 1. Arbetsordning

1. Läs regelverk, UX-skill, aktuell skärmspecifikation och exakt taskmandat.
2. Öppna rev02 och aktuell render. Identifiera motsvarande panel, synliga objekt och resan från tryck till resultat.
3. Skriv en jämförelsematris: referenselement → nuvarande skillnad → komponent/token/bildasset → avsedd korrigering → visuell acceptans. Ange skrivfiler, verkliga API:er och beroenden. Saknad bild eller innehållsmetadata blir en konkret leveranspunkt, inte en tyst ersättning. Följ planreview i `docs/dev/workflow.md`.
4. Implementera en vertikal del med gemensamma komponenter. Föreslagna API:er får inte beskrivas som befintliga.
5. Rendera jämförbara skärmar med matchande innehållslängd, tillstånd och dokumenterad viewport. Jämför sida vid sida och rätta de största synliga avvikelserna i berörd del. Kör beteendekontroll och §14. Använd samma presentationskomponenter i referensfixture och verkligt dataflöde; en separat demo godkänner inte produktvyn.
6. Separat QA och Reviewer bedömer helheten. Spara bilder, resultat, luckor och nästa steg.

## 2. Visuellt språk

Varm gräddvit bakgrund, ljusa mjukt rundade kort, gröna markeringar och mjuka kategorifärger. Bilder är bärande delar av kompositionen. Rubriker har tydlig hierarki; metadata är dämpad och relevant. Följ målbildens visuella vikt: hundporträtt, kort relevant text, sammanhängande uppgiftslista och tre tonade genvägar.

Undvik ett kort runt varje rad. Grupperade rader ligger på gemensam yta med diskreta avdelare. Välj färre synliga uppgifter och tydlig fördjupning framför ett fullt första skärmfält.

Hem ska uttryckligen visa blå Logga-, gröna Träna- och lila Kunskap-ytor i standardvyn, varm gul tips-/solaccent och ljusare grön progress. Färgroller och startvärden finns i Hem-kontraktets §3. En enfärgad hundsilhuett och gröna ikoner överallt uppfyller inte visionens färg- och bildmål.

### Färger ska finnas på ytorna

| Visuell roll | Föreslagen Home-token / färg | Regel |
|---|---|---|
| Bakgrund / kort | `home.canvas #F5F0E8` / `home.card #FFFCF7` | Varm gräddvit helhet; ingen hård grå ram runt varje kort |
| Text / sekundär text | `home.text #20262D` / `home.textMuted #626871` | Neutral mörk text; grönt reserveras för betydelsebärande accenter |
| Progress / bana | `home.greenFill #35875A` / `home.progressTrack #E9E5DE` | Grön fyllning på varm neutral bana |
| Aktiv vecka, bock, aktiv nav | `home.greenStrong #217448` | Kontrasterande grön status; inte grönt på alla objekt |
| Tips och sol | `home.bulb`, `home.sun #F5B63F` | Varm gul accent, kompletterad med text |
| Logga-yta / tass | `destination.log.surface #E9F0FB` / `.icon #3978D4` | Tydligt blått destinationskort |
| Träna-yta / träningshatt | `destination.training.surface #E8F2E7` / `.icon #277A49` | Tydligt grönt destinationskort |
| Kunskap-yta / bok | `destination.knowledge.surface #F1EAF7` / `.icon #8061B5` | Tydligt lila destinationskort |

Tabellen återger Hem-kontraktets §3. Vid ändring ska båda uppdateras tillsammans; motsägande värden rättas före implementation. Detta är färgmål för namngivna tokens, inte redan införda kodvärden. Kalibrering ska bevara färgroller och uppmätt kontrast. Ingen monokrom standardvariant får godkännas som full färgmatchning när referensen visar flera färgade ytor.

För övriga skärmar styr respektive panel färgernas placering och visuella vikt. Tvinga inte in Hemmets tre destinationsfärger där panelen använder foto, segmenterade flikar eller händelsekategorier. Normal text kräver minst 4,5:1, nödvändiga kontrollgränser/statussymboler minst 3:1 mot angränsande ytor.

## 3. Tokens och proportioner

`src/theme/tokens.ts` är kodens gemensamma källa. Befintliga värden är utgångspunkt, inte ett hinder för att matcha rev02. Kalibrera gemensamt i en granskad komponentdel.

| Område | Regel |
|---|---|
| Avstånd | Skala 4/8/12/16/24/32; skärmens kontrakt bestämmer sektion och padding; Hem använder 12, rubrik–innehåll normalt 8 |
| Sidmarginal | Gemensam token, utgångspunkt 24; ändringar bedöms på hela berörda kompositionen |
| Typografi | Semantiska title/heading/body/caption/label; ingen lokal textkrympning för att pressa in innehåll |
| Ytor | Gemensam kortbas med namngivna neutral/tonad/bild/list-varianter |
| Färger | Semantiska tokens; normal text har minst 4,5:1 kontrast |
| Träffytor | Minst 44×44 pt; visuell ikon kan vara mindre |
| Bilder | Gemensamma porträtt-/kortformat, radier och definierad beskärning |

Inga råa hexvärden eller ad hoc-mått i skärmfiler. Nya komponentbehov får dokumenterade tokens. Telefonram, systemklocka och statusikoner i målbilden är inte appkomponenter.

För Hem preciseras ovanstående standardvärden i [Hem-kontraktets §4](plans/HOME-REV02-visual-ux-spec.md#4-geometri-och-typografi): 12 pt sektionsgap/kortpadding, radie 16, kompakta textroller, 44 pt listrader och namngivna färgvarianter. Dessa ska införas i gemensamma tokens/opt-in komponentvarianter, inte som skärmlokala råvärden.

## 4. Komponentfamiljer

Utveckla befintliga `Card`, `Tabs`, `Button`, `ListRow`, `ChecklistItem`, `Progress`, `HeroCard`, `IconChip` och `BottomNav` med avgränsade varianter. [Komponentmatrisen](design/vision-rev02-spec.md#komponentkontrakt) skiljer nuvarande API från föreslaget.

Rev02 behöver segmenterade flikar, filterchips, bild över text, kompakt checklistrad, tonat destinationskort och progress med definierad uppgiftsmängd. Visa varianterna i komponentgalleriet med stor text och relevanta tillstånd.

Hem har personlig hälsning som huvudrubrik. Lägg inte till extra Tassla-appbar/notisknapp från rev01. Logga/Träning/Kunskap har vänsterställda titlar; detaljvyer kan ha centrerad titel och bakåtknapp enligt motsvarande panel.

### Hem: former som ska följas

- Exakt en dagsrubrik: **Dagens att göra**. Räknare och synlig chevron till hantering på samma rubrikrad; progress under.
- Sammanhållen listyta med diskreta separatorer. Manuella rutiner har fyrkantig visuell checkbox inom separat 44×44 pt träffyta. Träningsrad har icke-interaktiv fyrkantig status och en öppningshandling till rätt träningssteg.
- Hem-rader har kort titel och fungerande detaljväg. Kategoriikon, separat `Visa`-text, `Ta bort` och extra program-/veckorubriker ingår inte i översiktsraden.
- Rutinredigering, träningsval och borttagning finns i fungerande fördjupning enligt Hem-kontraktet. Enbart att fälla ihop formulär räcker inte om hanteringsrubriker och teknisk text fortfarande fyller översikten.
- Tre jämställda pastellkort med stora tass-/träningshatt-/boksymboler. De ska vara synliga i standardfixturens första vy. En färgad liten ikon på vit bakgrund ersätter inte ett färgat destinationskort.
- Kortpadding 12, radie 16, kompakta textroller och normalviktig uppgiftstext enligt Hem-kontraktets §4. Träffytor och stor text får inte krympas för att få plats.

## 5. Layout, scrollning och safe area

Bottenmenyn respekterar safe area. Scrollinnehållet får utrymme för meny och safe area utan dubbel kompensation. Allt innehåll ska gå att nå.

Normal Hem-fixture vid 375×844 och 430×844 med standardskrift och korta titlar: hälsning, åldersremsa, Just nu, upp till fem dagsrader och tre genvägar ska rymmas med **minst 16 pt fri marginal** ovanför menyn. Detta är nytt rev02-mål; den gamla leveransens 1 px marginal är ingen kvalitetsreferens.

Långa titlar, reviewmarkering, fler uppgifter eller större text får ge naturlig scrollning. Krymp aldrig text/tryckytor och dölj aldrig innehåll bakom menyn. Mindre skärmhöjder och stora textlägen bedöms separat från standardskärmens första vy. Visningsgräns och total progressmängd får inte blandas ihop.

## 6. Handlingar och navigation

- Högst en primär handling per vy; Hemmets tre destinationskort är jämställda genvägar.
- Logga öppnar Logg, Träna öppnar Träning, Kunskap öppnar Kunskap. Dessa kort loggar ingen händelse.
- Fem huvudflikar: **Hem, Logg, Träning, Kunskap, Mer**. Hälsa och Tassla-pass ligger under Mer.
- Föreslagna detaljvyer: Utveckling och Dagens framsteg tillhör Hem, Insikter tillhör Logg. Nuvarande navigator mappar ännu alla undersidor till Mer; föräldramappningen måste utökas när dessa vyer byggs.
- Kunskaps Checklistor och FAQ ska vara lätta att hitta även med nya filterchips.
- Radtext öppnar detalj; separat checkbox ändrar status där funktionen finns. Undvik nästlade tryckytor med dubbla handlingar.
- Radera ligger i detalj/åtgärdsmeny med bekräftelse eller fungerande ångra. Bevara återhämtning och inmatning.

## 7. Bilder och ikoner

Skilj **personligt foto**, **redaktionellt foto** och **illustration**. Redaktionella hundbilder kan användas i guider och träningskort utan att föreställa ägarens hund. Saknat profilfoto blockerar inte dessa bildkort.

Hem/Utveckling visar ägarens foto när stödet finns; annars tydligt illustrerad platshållare med motsvarande visuella utrymme. Syntetiskt granskningsläge kan ha exempelhund/exempelfoto, avgränsat från produktionsdata. Bildmanifest anger fil, källa/generation, användningsrätt, roll, alt-text och beskärning. Ingen skärmbild från visionen används som fungerande UI.

En ikonfamilj: Hemmets destinationskort använder tass, träningshatt och bok med samma visuella tyngd som referensen. Händelser använder kategorisymboler: droppe, matskål, måne. Vaken/ögat får inte återanvändas som Kunskapsikon. Verifiera att symbolen finns i installerat ikonpaket eller befintlig vektorkomponent. Solen i hälsningen kan återges med samma ikonstil; inga emoji som interaktiva kategoriikoner.

En godkänd fallback verifierar fallbackbeteendet. Den verifierar inte fotografisk likhet. Foto-/illustrationsasset, färgvariation, fokus och mask/beskärning är egna leveranspunkter; en förstorad grön platshållare får inte godkännas som visionens varma valpporträtt. Jämför referensrender med spårbart exempelfoto i märkt granskningsläge och prova produktionsfallback separat.

## 8. Status och återkoppling

Pending visar Sparar…; först bekräftat sparande ändrar bock och räknare. Failed ger retry med kvarvarande inmatning. Unsure ger ”Vi kunde inte kontrollera om det sparades” och kontrollhandling. Inga rutinmässiga SPARAD-/ÄGARREGISTRERAD-badges.

Tillgängligt träningssteg, öppnad artikel och planerad vaccination betyder inte utförd aktivitet. Ingen global progress beräknas av blandade källor utan definierad uppgiftsmängd.

Högst en handlingskrävande banner per vy. Målbildens uppmuntrande kort är en separat valfri sammanfattning, bara vid verifierat resultat. Det får inte tolka hundens känslor, hälsa eller färdighet.

## 9. Innehåll och svensk copy

Kort, varmt, konkret: ”Dagens att göra”, ”Fortsätt där ni var”, ”Just nu med {namn}”. Verkligt hundnamn; hälsning följer lokal tid eller använder neutrala ”Hej!”. Hårdkoda inte God morgon hela dygnet.

Förklarande korttext är normalt högst två rader vid standardskrift; Hemmets Just nu tillåter två–tre enligt det preciserade kontraktet. Läsvyer visar hela innehållet och källorna. Viktig information får växa med större text.

Publicerat, versionsmärkt och ålders-/rasrelevant innehåll driver råd och övningar. ”Tandbyte 20 veckor” i bilden är inte sakgranskat innehåll. Skriv inte ”Milo har blivit tryggare” från loggantal. Återkoppling beskriver registreringen: ”Ni har markerat två aktiviteter idag”.

Tekniska driftord hör hemma i rapporter. Medicinsk säkerhetsinformation och sanningsenlig osäker sparstatus får aldrig döljas för att passa målbilden.

## 10. Tillstånd och tillgänglighet

Varje del har ready/loading/empty/error och relevanta partial/pending/failed/unsure-lägen. Läsfel är inte noll aktiviteter. Konto-/hundbyte tömmer gamla data och ignorerar sena svar. Publicerings- och reviewgränser gäller vid både läsning och skrivning.

Skärmläsare ska skilja ålder, vald flik, bock, destination och progress. Färg/bild/rörelse är aldrig enda information. Prova standardskrift, 140 %, lång svensk copy, reducerad rörelse och tangentbord. Webbsimulering är inte verklig Dynamic Type/VoiceOver.

## 11. Skärmar och produktresor

[Skärmkontrakten](design/vision-rev02-screen-contracts.md) preciserar varje panels blockordning, färgroller, bildandel, komponentformer, handlingar, datakällor och acceptans. De gäller före den äldre översiktens generella råd. Stödskärmar får samma formspråk med bevarade användarresor.

[Skärmspecifikationen](design/vision-rev02-spec.md) täcker Hem, Utveckling, Dagens framsteg, daglig Checklista, Logga, Träning, Kunskap och Insikter. Hälsa, Tassla-pass, profil, inställningar och FAQ bevaras som stödresor.

R02-2:s dagliga uppgifter finns i kod och står i QA; detta är inte bevis på verifierad databasaktivering. Kunskapens faschecklista ska inte byta innebörd eller nollställas varje morgon. ”2 av 5” är bara ett granskningsscenario tills fem verkliga uppgifter och två bekräftade slutföranden finns.

## 12. Referens och avvikelser

Rev02-bilden och det preciserade Hem-kontraktet är referens. Tidigare R02-1-granskning avser sin dåvarande render och kan inte godkänna den senare R02-2-vyn. Eriks jämförelse 2026-10-13 visar kvarstående fel i färg, bildspråk, radkomposition och synliga genvägar; `HomeScreen.tsx` är inte visuellt facit.

Avvikelser får ID, panel/objekt, orsak, påverkan, ansvarig, beslut och åtgärd. Dokumenterad betyder inte accepterad. Permanenta undantag behöver verkligt ägarbeslut. Tillfälliga dataluckor kan ha godkända fallbacklägen men får inte beskrivas som full målbildsleverans.

## 13. Produktobjekt och byggordning

[Objektkontraktet](design/vision-rev02-objects.md) beskriver befintliga källor, föreslagna objekt, skrivning, datum, progress och innehåll. Presentationskomponenter läser inte databasen; återanvänd workspace/data-gränsen.

Byggordning: Hem-referens och komponenter → dagliga uppgifter med persistens → övriga huvudvyer → utveckling/framsteg/insikter. Foto är en separat vertikal del. Dokumenterat mål skiljs från färdig kod och miljöaktivering.

## 14. Obligatorisk visuell och funktionell granskning

Numreringen 1–18 behålls. Svara Ja, Nej eller Ej tillämpligt med motivering. Saknade bevis = NOT TESTABLE. Nej blockerar berörd acceptans; inget medelvärde kan dölja det.

1. Högst en primär handling och tydlig nästa handling?
2. Jämställda handlingar har samma visuella vikt, format och storlek?
3. Radera skiljs från normal handling och har rätt bekräftelse/ångra?
4. Hem-rader saknar kategoriikon och repetitiva Visa-/Ändra-/Ta bort-länkar; hantering har en tydlig fördjupningsväg?
5. Avstånd, sektioner, safe area och fri marginal följer specifikationen?
6. Delade tokens/komponenter används utan lokala stylingundantag?
7. Ikoner använder samma familj och verifierade symboler?
8. Referensens färgfördelning syns på ytor och symboler; Hem visar blå/grön/lila genvägar samt varm tipsaccent; kontrast är kontrollerad?
9. Symbol, etikett och faktisk handling betyder samma sak?
10. Normala poster saknar onödiga statusbadges; bockar är bekräftade?
11. Banners/uppmuntran följer §8 utan brus eller falska slutsatser?
12. Copy är vardaglig och korrekt utan interna driftbeskrivningar?
13. Copy, metadata och bildandel har målbildens ton och hierarki?
14. Relevanta loading/empty/error/partial/sparlägen har renderats?
15. Minst 44×44 pt, skärmläsarsemantik, större text och reducerad rörelse fungerar?
16. **Matchar layout, färgfördelning, typografi, komponentformer, objekt, innehållstäthet och bildspråk rev02-panelen?** Jämförelse sida vid sida krävs. Överlappstest ensamt räcker inte.
17. Rubriker, segment/filter, huvudflikar, aktiv förälder och tillbakaresor stämmer?
18. Hundnamn, bildroll och relevant innehåll används där målbilden visar dem?

Spara referenspanel och aktuell skärmbild i jämförbar skala, komponentdetaljer, viewport/safe-area-antagande, textskala, fixture, public/reviewläge, diff/commit och datum. Bedöm separat **visuell likhet**, **fungerande resa**, **produktionsdata**. Alla tre behöver verifierad status innan full rev02-funktion rapporteras levererad.

### Godkännande kräver en synligt matchande leverans

Bedöm punkt 16 separat för **komposition, färger, typografi, komponentformer, bildspråk och innehållstäthet** med Ja/Nej/NOT TESTABLE och bildhänvisning för varje del. Ett samlat Ja kräver att alla tillämpliga delar är verifierade. Godkänt fallbackbeteende får egen status; det ersätter inte saknat fotobevis.

Synliga fel mot kontraktet, exempelvis monokroma destinationsytor, runda bockar, upprepade radknappar, fel bildroll eller dolda genvägar i standardfixturen, ger **Nej** för den berörda delen. Ett godkänt överlappstest, en fungerande klickresa eller gröna kodtester upphäver inte detta. Ingen procentsats eller genomsnittspoäng får maskera felet.

Granska om kompositionen efter inkoppling av verkliga produktobjekt och efter förändringar i token, radkontroller, rubriker eller textmängd. Äldre skärmdumpar gäller bara sin dokumenterade version. Rendering saknas = NOT TESTABLE; synlig avvikelse = Nej. Rapportera kvarstående avvikelser och rätta inom mandatet, med projektets befintliga gräns för korrigeringsförsök. Rapportera inte full visuell leverans innan kraven är uppfyllda eller ett uttryckligt, dokumenterat ägarundantag avgränsar målet.

## 15. Rörelse

Befintlig React Native Animated och `tokens.motion`, 120–350 ms, avbrytbar, ingen initial eller loopande dekoranimation. Reducerad rörelse ger direkt tillståndsbyte. Framgångsrörelse följer bekräftat sparande. Bildens konfetti kräver ingen animation eller nytt bibliotek. Nya dependencies kräver konkret behov och gällande mandat.

## 16. Första användning

Befintliga avfärdbara tips kan stödja huvudhandlingen. Högst ett per skärm, ingen kritisk funktion bakom tipset, ingen påtvingad ny onboarding. Behåll ägarspecifik seen-status och radering enligt befintlig implementation.

## 17. Illustrationer och valpfigur

Illustration är dekorativ och kan ersätta saknat foto. Reaktioner beskriver bekräftad appaktivitet, aldrig hundens känsla, hälsa eller lydnad. Inga ledsna/skuldbeläggande lägen. Porträtt på Hem innebär inte att en animerad maskot ska återinföras.

## 18. Leveransgränser

Regelverket är inte bevis på implementerade vyer. Bilden godkänner inte externa tjänster, nya kostnader, fotoinsamling eller produktionsmigreringar. Hantera konkreta frågor i respektive vertikal del och fortsätt med oberoende arbete.

Commit/push, signerad build, distribution och verklig databasverifiering redovisas var för sig. Ingen automatisk telefon-/TestFlight-grind införs. Källor, säkerhet och tillgänglighet gäller även där målbilden förenklar dem.
