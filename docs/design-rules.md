# Tassla — designregelverk för vision_rev02

Version 2.0, 2026-10-13. Kanonisk instruktion för nya och reviderade UI-uppgifter, på Eriks beställning av ett sammanhängande regelverk och byggunderlag mot [vision_rev02.jpg](../vision_rev02.jpg).

## 0. Auktoritet och leveransstatus

`vision_rev02.jpg` är aktuell visuell målbild. Dess åtta paneler är designmål, inte åtta redan implementerade funktioner. `vision_rev01.jpg` och äldre paketspecifikationer är historik. Detta regelverk ersätter motstridiga äldre visuella anvisningar för kommande arbete; tidigare leveranser skrivs inte om retroaktivt.

Rangordning: aktuella ägarbeslut → sanningsenlighet, säkerhet och tillgänglighet → detta regelverk och rev02-specifikationen → UX-skillens beteenderegler → befintlig kod. Bilden styr komposition, objekt, komponentformer, bildspråk och innehållshierarki. Namn, räknetal och råd i bilden är exempel, inte datakällor. Olösta faktiska konflikter dokumenteras; redan fattade beslut frågas inte om igen.

Läs tillsammans:

- [Skärmar, komponenter och Hem-specifikation](design/vision-rev02-spec.md).
- [Produktobjekt, datakopplingar och innehåll](design/vision-rev02-objects.md).
- [Bygginstruktion för Hem](prompts/build-home-rev02.md).
- [Byggordning, mandat och granskningar](tasks/VISION-REV02.md).

Statusord: **befintligt** = kod finns; **föreslaget** = kontrakt att implementera; **granskningsläge** = syntetisk interaktion; **produktionskopplat** = verklig läsning/skrivning verifierad; **visuellt godkänt** = jämfört med målbilden. Ingen status ersätter en annan.

## 1. Arbetsordning

1. Läs regelverk, UX-skill, aktuell skärmspecifikation och exakt taskmandat.
2. Öppna rev02 och aktuell render. Identifiera motsvarande panel, synliga objekt och resan från tryck till resultat.
3. Ange skrivfiler, befintliga API:er, beroenden och avvikelser. Följ planreview i `docs/dev/workflow.md`.
4. Implementera en vertikal del med gemensamma komponenter. Föreslagna API:er får inte beskrivas som befintliga.
5. Rendera jämförbara skärmar med samma data/viewport. Kör beteendekontroll och §14.
6. Separat QA och Reviewer bedömer helheten. Spara bilder, resultat, luckor och nästa steg.

## 2. Visuellt språk

Varm gräddvit bakgrund, ljusa mjukt rundade kort, gröna markeringar och mjuka kategorifärger. Bilder är bärande delar av kompositionen. Rubriker har tydlig hierarki; metadata är dämpad och relevant. Följ målbildens visuella vikt: hundporträtt, kort relevant text, sammanhängande uppgiftslista och tre tonade genvägar.

Undvik ett kort runt varje rad. Grupperade rader ligger på gemensam yta med diskreta avdelare. Välj färre synliga uppgifter och tydlig fördjupning framför ett fullt första skärmfält.

## 3. Tokens och proportioner

`src/theme/tokens.ts` är kodens gemensamma källa. Befintliga värden är utgångspunkt, inte ett hinder för att matcha rev02. Kalibrera gemensamt i en granskad komponentdel.

| Område | Regel |
|---|---|
| Avstånd | Skala 4/8/12/16/24/32; huvudsektion normalt 24, rubrik–innehåll 8, kortpadding 16 |
| Sidmarginal | Gemensam token, utgångspunkt 24; ändringar bedöms på hela berörda kompositionen |
| Typografi | Semantiska title/heading/body/caption/label; ingen lokal textkrympning för att pressa in innehåll |
| Ytor | Gemensam kortbas med namngivna neutral/tonad/bild/list-varianter |
| Färger | Semantiska tokens; normal text har minst 4,5:1 kontrast |
| Träffytor | Minst 44×44 pt; visuell ikon kan vara mindre |
| Bilder | Gemensamma porträtt-/kortformat, radier och definierad beskärning |

Inga råa hexvärden eller ad hoc-mått i skärmfiler. Nya komponentbehov får dokumenterade tokens. Telefonram, systemklocka och statusikoner i målbilden är inte appkomponenter.

## 4. Komponentfamiljer

Utveckla befintliga `Card`, `Tabs`, `Button`, `ListRow`, `ChecklistItem`, `Progress`, `HeroCard`, `IconChip` och `BottomNav` med avgränsade varianter. [Komponentmatrisen](design/vision-rev02-spec.md#komponentkontrakt) skiljer nuvarande API från föreslaget.

Rev02 behöver segmenterade flikar, filterchips, bild över text, kompakt checklistrad, tonat destinationskort och progress med definierad uppgiftsmängd. Visa varianterna i komponentgalleriet med stor text och relevanta tillstånd.

Hem har personlig hälsning som huvudrubrik. Lägg inte till extra Tassla-appbar/notisknapp från rev01. Logga/Träning/Kunskap har vänsterställda titlar; detaljvyer kan ha centrerad titel och bakåtknapp enligt motsvarande panel.

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

En ikonfamilj: destinationskort kan använda tass/logg, träningshatt och bok. Händelser använder kategorisymboler: droppe, matskål, måne. Vaken/ögat får inte återanvändas som Kunskapsikon. Verifiera att symbolen finns i installerat ikonpaket eller befintlig vektorkomponent. Solen i hälsningen kan återges med samma ikonstil; inga emoji som interaktiva kategoriikoner.

## 8. Status och återkoppling

Pending visar Sparar…; först bekräftat sparande ändrar bock och räknare. Failed ger retry med kvarvarande inmatning. Unsure ger ”Vi kunde inte kontrollera om det sparades” och kontrollhandling. Inga rutinmässiga SPARAD-/ÄGARREGISTRERAD-badges.

Tillgängligt träningssteg, öppnad artikel och planerad vaccination betyder inte utförd aktivitet. Ingen global progress beräknas av blandade källor utan definierad uppgiftsmängd.

Högst en handlingskrävande banner per vy. Målbildens uppmuntrande kort är en separat valfri sammanfattning, bara vid verifierat resultat. Det får inte tolka hundens känslor, hälsa eller färdighet.

## 9. Innehåll och svensk copy

Kort, varmt, konkret: ”Dagens att göra”, ”Fortsätt där ni var”, ”Just nu med {namn}”. Verkligt hundnamn; hälsning följer lokal tid eller använder neutrala ”Hej!”. Hårdkoda inte God morgon hela dygnet.

Förklarande korttext är normalt högst två rader vid standardskrift. Läsvyer visar hela innehållet och källorna. Viktig information får växa med större text.

Publicerat, versionsmärkt och ålders-/rasrelevant innehåll driver råd och övningar. ”Tandbyte 20 veckor” i bilden är inte sakgranskat innehåll. Skriv inte ”Milo har blivit tryggare” från loggantal. Återkoppling beskriver registreringen: ”Ni har markerat två aktiviteter idag”.

Tekniska driftord hör hemma i rapporter. Medicinsk säkerhetsinformation och sanningsenlig osäker sparstatus får aldrig döljas för att passa målbilden.

## 10. Tillstånd och tillgänglighet

Varje del har ready/loading/empty/error och relevanta partial/pending/failed/unsure-lägen. Läsfel är inte noll aktiviteter. Konto-/hundbyte tömmer gamla data och ignorerar sena svar. Publicerings- och reviewgränser gäller vid både läsning och skrivning.

Skärmläsare ska skilja ålder, vald flik, bock, destination och progress. Färg/bild/rörelse är aldrig enda information. Prova standardskrift, 140 %, lång svensk copy, reducerad rörelse och tangentbord. Webbsimulering är inte verklig Dynamic Type/VoiceOver.

## 11. Skärmar och produktresor

[Skärmspecifikationen](design/vision-rev02-spec.md) täcker Hem, Utveckling, Dagens framsteg, daglig Checklista, Logga, Träning, Kunskap och Insikter. Hälsa, Tassla-pass, profil, inställningar och FAQ bevaras som stödresor.

Dagliga uppgifter är ett föreslaget nytt kontrakt. Kunskapens faschecklista ska inte byta innebörd eller nollställas varje morgon. ”2 av 5” är bara ett granskningsscenario tills fem verkliga uppgifter och två bekräftade slutföranden finns.

## 12. Referens och avvikelser

En kommande godkänd R02-1 Hem-render och komponentgalleri blir kodreferens. Fram till dess är rev02 bilden referens; `HomeScreen.tsx` är implementationsbas, inte fullt visuellt facit.

Avvikelser får ID, panel/objekt, orsak, påverkan, ansvarig, beslut och åtgärd. Dokumenterad betyder inte accepterad. Permanenta undantag behöver verkligt ägarbeslut. Tillfälliga dataluckor kan ha godkända fallbacklägen men får inte beskrivas som full målbildsleverans.

## 13. Produktobjekt och byggordning

[Objektkontraktet](design/vision-rev02-objects.md) beskriver befintliga källor, föreslagna objekt, skrivning, datum, progress och innehåll. Presentationskomponenter läser inte databasen; återanvänd workspace/data-gränsen.

Byggordning: Hem-referens och komponenter → dagliga uppgifter med persistens → övriga huvudvyer → utveckling/framsteg/insikter. Foto är en separat vertikal del. Dokumenterat mål skiljs från färdig kod och miljöaktivering.

## 14. Obligatorisk visuell och funktionell granskning

Numreringen 1–18 behålls. Svara Ja, Nej eller Ej tillämpligt med motivering. Saknade bevis = NOT TESTABLE. Nej blockerar berörd acceptans; inget medelvärde kan dölja det.

1. Högst en primär handling och tydlig nästa handling?
2. Jämställda handlingar har samma visuella vikt, format och storlek?
3. Radera skiljs från normal handling och har rätt bekräftelse/ångra?
4. Rader saknar stora repetitiva Ändra/Radera-länkar?
5. Avstånd, sektioner, safe area och fri marginal följer specifikationen?
6. Delade tokens/komponenter används utan lokala stylingundantag?
7. Ikoner använder samma familj och verifierade symboler?
8. Kategori-/destinationsfärger är konsekventa och kontrast kontrollerad?
9. Symbol, etikett och faktisk handling betyder samma sak?
10. Normala poster saknar onödiga statusbadges; bockar är bekräftade?
11. Banners/uppmuntran följer §8 utan brus eller falska slutsatser?
12. Copy är vardaglig och korrekt utan interna driftbeskrivningar?
13. Copy, metadata och bildandel har målbildens ton och hierarki?
14. Relevanta loading/empty/error/partial/sparlägen har renderats?
15. Minst 44×44 pt, skärmläsarsemantik, större text och reducerad rörelse fungerar?
16. **Matchar layout, komponentformer, objekt, innehållstäthet och bildspråk rev02-panelen?** Jämförelse sida vid sida krävs. Överlappstest ensamt räcker inte.
17. Rubriker, segment/filter, huvudflikar, aktiv förälder och tillbakaresor stämmer?
18. Hundnamn, bildroll och relevant innehåll används där målbilden visar dem?

Spara referenspanel och aktuell skärmbild i jämförbar skala, komponentdetaljer, viewport/safe-area-antagande, textskala, fixture, public/reviewläge, diff/commit och datum. Bedöm separat **visuell likhet**, **fungerande resa**, **produktionsdata**. Alla tre behöver verifierad status innan full rev02-funktion rapporteras levererad.

## 15. Rörelse

Befintlig React Native Animated och `tokens.motion`, 120–350 ms, avbrytbar, ingen initial eller loopande dekoranimation. Reducerad rörelse ger direkt tillståndsbyte. Framgångsrörelse följer bekräftat sparande. Bildens konfetti kräver ingen animation eller nytt bibliotek. Nya dependencies kräver konkret behov och gällande mandat.

## 16. Första användning

Befintliga avfärdbara tips kan stödja huvudhandlingen. Högst ett per skärm, ingen kritisk funktion bakom tipset, ingen påtvingad ny onboarding. Behåll ägarspecifik seen-status och radering enligt befintlig implementation.

## 17. Illustrationer och valpfigur

Illustration är dekorativ och kan ersätta saknat foto. Reaktioner beskriver bekräftad appaktivitet, aldrig hundens känsla, hälsa eller lydnad. Inga ledsna/skuldbeläggande lägen. Porträtt på Hem innebär inte att en animerad maskot ska återinföras.

## 18. Leveransgränser

Regelverket är inte bevis på implementerade vyer. Bilden godkänner inte externa tjänster, nya kostnader, fotoinsamling eller produktionsmigreringar. Hantera konkreta frågor i respektive vertikal del och fortsätt med oberoende arbete.

Commit/push, signerad build, distribution och verklig databasverifiering redovisas var för sig. Ingen automatisk telefon-/TestFlight-grind införs. Källor, säkerhet och tillgänglighet gäller även där målbilden förenklar dem.
