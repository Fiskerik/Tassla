# Hem rev02 — konkret visuellt och beteendemässigt kontrakt

Datum: 2026-10-13, uppdaterad 2026-10-14. Status: v11:s porträtt-/veckoremskomposition har separat QA/Reviewer-PASS; den senare godkända livscykeluppgiften ersätter enbart dess veckointervall och ålderstext med automatisk veckor/månader/år och ungefärlig fas. v11:s tidigare rendergranskning godkänner inte de nya gränserna. Supabase/RLS och native-runtime är NOT TESTABLE. Ägarunderlag: panel 1 i `vision_rev02.jpg`, jämförelsebilderna i chatten samt Eriks beslut om färger, runt fotoestetiskt hundporträtt och åldersremsa framför porträttet.

Detta är den preciserade Hem-specifikationen under [designregelverket](../design-rules.md). Den ersätter äldre generella Hem-mått och motstridiga presentationsråd. Produktens regler för datakällor och slutförande består. Bilderna visar olika skala och bildformat; nedanstående pt-värden är byggmål, inte påstått uppmätta originalpixlar.

## 1. Vad som faktiskt skiljer vyerna

| Del | Nuvarande implementation/bild | Krav från visionen |
|---|---|---|
| Bildspråk | Stor enfärgad grön hundsilhuett; förstoring 1,8 och opacitet 0,7 | Runt fotoestetiskt generiskt hundporträtt med varm päls och gröna bladtoner. Nuvarande asset är AI-genererad bildkonst, inte ett faktiskt fotografi eller ägarens hund |
| Färger | Mörkgrönt återkommer i nästan alla symboler; färgade genvägar hamnar under första vyn | Grön status, gul glödlampa/sol, blå Logga, grön Träna och lila Kunskap synliga samtidigt |
| Rubriker | `Idag` följt av `Dagens uppgifter`, båda stora | En enda kompakt rubrik: `Dagens att göra`; dämpad räknare på samma rad |
| Uppgiftsrad | Rund bock + ikonplatta + fet text + `Visa` + `Ta bort` | Liten fyrkantig checkbox + normalviktig text + diskret chevron där detalj finns |
| Innehåll | Programtitel och stegtitel sammanfogas; smal textkolumn bryter ord | Kort uppgiftstitel, full information i fördjupning; bred sammanhängande textkolumn |
| Administration | Rutinhantering, träningsval och teknisk källtext inne i dagskortet även när formulären är hopfällda | Hem är översikt. Hantering nås genom en gemensam fördjupning |
| Ytor | Kritvita kort med konturlinje, radie 20 | Varma nästan vita kort utan tydlig kontur; mjuk separation och radie omkring 16 |
| Genvägar | Finns i kod, men skjuts ned av listan; compact-varianten är 56 pt hög | Tre tydliga pastellkort med stora symboler, samlade på en varm yta |

Kodorsaker: `HomeScreen.tsx` visar både yttre rubrik och `DailyActivitiesSection`; `DailyActivityItem.tsx` lägger till ikon och radknappar; `daily-activity-model.ts` bygger träningsetiketten av både program och steg. `DestinationTile.tsx` återanvänder händelsefärger och använder penna för Logga. Att delarna finns är alltså inte samma sak som att deras presentation följer bilden.

## 2. Användaruppgift, struktur och fördjupning

Ägaren ska se hundens sammanhang, överblicka dagens val och enkelt markera en egen rutin eller öppna en övning. Ingen ny onboarding, automatisk dagsplan eller förändring av träningsprogress ingår.

```text
God morgon! ☀                     [varmt valpporträtt]
Milo · 12 veckor
       9   10   11  [12]  13   14   15
       ·    ·    ·    ·    ·    ·    ·

[ 💡 Just nu med Milo                            › ]
[ Kort åldersrelevant ingress, två–tre rader        ]

[ Dagens att göra                      2 av 5 klara ]
[ grön progress                                    ]
[ ☑ Morgonrast                                   › ]
[ ☑ Träna sitt                                   › ]
[ ☐ Miljöträning ute                             › ]
[ ☐ Kontrollera vaccinationsplan                 › ]
[ ☐ Kvällsrutin                                  › ]

[ Vad vill du göra nu?                             ]
[ blå Logga    | grön Träna    | lila Kunskap       ]

Hem          Logg          Träning       Kunskap   Mer
```

Namnet, antalen och exemplen är syntetiska bildreferenser. Rutiner i produktion väljs av ägaren. Chevron är tillåten endast när raden verkligen öppnar en detalj eller hantering. Befintlig träningsprogress är enda completion-källa för träningssteg. Sol och glödlampa renderas med verifierade symboler i appens ikonfamilj, inte emoji från skissen.

**Översikt:** hälsning, ålder, ett tipskort, en dagslista, tre genvägar. **Fördjupning:** fullständiga texter, alla uppgifter, lägg till/byt/ta bort och rutineditering. Flytta de befintliga hanteringsfunktionerna till en detaljyta eller sheet med befintligt presentationsmönster; tekniken preciseras i implementationsplanen. Ingen kontroll får försvinna utan en fungerande ersättningsväg.

Hantering öppnas från en synlig pennknapp med texten `Hantera` i dagskortets rubrikrad, även när listan är tom. Varje checklistepunkt kan också öppna sin rutin i hanteringen. Vid fler än fem öppnar `Visa alla` samma fördjupning. Där kan användaren hantera både valda rutiner och träningssteg. Tomt läge har synlig `Hantera dagens aktiviteter`. Inga nya huvudflikar behövs.

Rutinskapandet börjar med fältet `Namn på rutin`, följt av just den rutinens checklista och en obligatorisk första punkt. Flera rutiner har oberoende listor och kan upprepas dagligen eller med eget intervall i dagar, veckor eller månader. En sparad rutin har en enda pennknapp `Redigera` intill sitt namn. Den öppnar ett sammanhållet edit mode för namn, checklistpunkter och frekvens. Plus lägger till en rad och minus tar bort den; checklistpunkter saknar egna edit-knappar och long-press-menyer. En enda `(i)`-knapp visar kort hjälp om rutinernas dagsval och upprepning. Tillägg och borttagning från dagen använder `Lägg till på Hemskärmen` respektive `Ta bort från Hemskärmen`.

## 3. Färgkontrakt — synlig färgvariation, inte bara gröna ikoner

Värdena är specificerade startvärden för kalibrering mot bilden, inte en verifierad pixelprovtagning. Implementera namngivna semantiska tokens och opt-in komponentvarianter i `src/theme/tokens.ts`; ändra inte globalt alla befintliga skärmar. Nedanstående namn är föreslagna, ännu inte exporterade API:er.

| Föreslagen token | Startvärde | Användning |
|---|---|---|
| `home.canvas` | `#F5F0E8` | Varm ljus bakgrund; undvik mörk grön ton över hela skärmen |
| `home.card` | `#FFFCF7` | Tips, sammanhållen dagslista och genvägsgrupp |
| `home.text` | `#20262D` | Neutral mörk text, inte grönt på varje textrad |
| `home.textMuted` | `#626871` | Ålder, räknare och sekundär information |
| `home.separator` | `#E8E2DA` | Tunna radavdelare och subtil navgräns |
| `home.greenFill` | `#35875A` | Grön progress med minst 3:1 mot sin bana |
| `home.greenStrong` | `#217448` | Aktiv vecka, checkbox, aktiv nav och grön interaktiv text |
| `home.progressTrack` | `#E9E5DE` | Varm neutral tom progressdel |
| `home.sun` / `home.bulb` | `#F5B63F` | Små gula/orange accenter i hälsning och tips |
| `destination.log.surface` / `.icon` | `#E9F0FB` / `#3978D4` | Hela Logga-kortets blå yta och tassymbol |
| `destination.training.surface` / `.icon` | `#E8F2E7` / `#277A49` | Hela Träna-kortets gröna yta och träningshatt |
| `destination.knowledge.surface` / `.icon` | `#F1EAF7` / `#8061B5` | Hela Kunskap-kortets lila yta och bok |

Färglagren ska vara tydliga i normal första vy: varm bakgrund → varma kort → tre skilda pastellytor → starkare färg i symbolerna. Färgade ikonplattor inne i varje uppgiftsrad ska bort från Hem. Dessa kan finnas i full uppgiftsvy enligt referensens panel 4. Destinationsfärger ska inte bero på `pee`, `awake` eller andra loggkategorier.

Statisk sRGB-kontroll av startpaletten: progress/bana 3,51:1; vit bock på `greenStrong` 5,74:1; sekundär text på kort 5,49:1; destinationsikoner mot respektive yta blå 3,81:1, grön 4,61:1, lila 4,16:1. Detta verifierar tokenparen, inte ännu en render.

Kontrast är en leveranskontroll: minst 4,5:1 för normal text och 3:1 för nödvändiga kontrollgränser/statussymboler mot angränsande yta. Ljust grönt får inte automatiskt kombineras med liten vit text; använd `greenStrong` bakom vit veckosiffra/bock om `greenFill` inte klarar kravet. Tom checkbox får en mörkare kontrollkant än den dekorativa separatorn. Gul dekor är inte enda bärare av en handling. Justera tokenvärden dokumenterat om mätning kräver det; palettrollerna ska bestå.

## 4. Geometri och typografi

Bas: 375×844 pt, textskala 100 %, fem korta uppgifter, ingen teknisk banner i appytan. Safe area modelleras som topp 44 och botten 34; navens kontroller är 56 höga. Därmed börjar menyn vid y=754. Verkliga insets ska användas på enhet; dessa är fixturemått.

| Block | Höjdbudget | Målintervall y |
|---|---:|---:|
| Hälsning/porträtt + veckoremsa | 128 | 44–172 |
| Mellanrum | 12 | 172–184 |
| Just nu | 112 | 184–296 |
| Mellanrum | 12 | 296–308 |
| Dagens att göra, fem enradiga uppgifter | 288 | 308–596 |
| Mellanrum | 12 | 596–608 |
| Genvägsgrupp med rubrik och tre kort | 128 | 608–736 |
| Fri yta före meny | 18 | 736–754 |

Detta är en verifierbar standardbudget, inte fasta höjder som klipper innehåll. 430×844 använder samma typstorlek och vertikala mål; bredare kolumner, inte proportionellt större allt. 375×667, längre text, fler uppgifter och större text får scrolla. Längre innehåll får aldrig pressas in genom mindre skrift eller tryckyta.

- Sidmarginal 24; kortbredd 327 vid 375. Kortradie 16; kortpadding 12. Ingen tydlig grå ram runt stora kort.
- Hälsning 22/28 pt, vikt 500–600, diskret gul sol. Ålder 13/18. Rubrik i kort 16/22, vikt 700. Uppgift 14/20, vikt 400–500. Räknare 13/18, vikt 400. Ingress 14/20. Genvägsetikett 14/20, vikt 500. Allt uttrycks som semantiska tokens och stöder textskalning.
- Veckoremsa har sju jämna kolumner, liten vald kapsel omkring 32×32, prickar 7–8 och målar sig ovanpå porträttets nedre del. Den är en åldersindikator, inte ett datumfilter. Aktuell ålder kommer från hundens födelsedatum. Fadezon och exakta nivåer definieras i §5; alla veckonummer ska behålla minst 4,5:1 kontrast vid 375/430 och 140 % text. Ingen bred mörkgrön 44 pt-knapp när området inte är interaktivt.
- Tipskort: gul glödlampa omkring 22, rubrik, högst tre rader ingress vid standardskrift och chevron till verklig artikel. Kortet är en sammanhängande tryckyta. Full rådtext och säkerhetsinformation finns i läsvyn; säkerhetskritisk innebörd får inte klippas bort i ingressen.
- Dagskort: 44 pt rubrikträffyta med räknare, 8 pt progress, 8 pt sammanlagt vertikalt mellanrum, fem rader à minst 44 och 4 pt topp/bottenpadding = 288 pt. Ingen separat `Idag`-rubrik och inga ytterligare 8 pt mellan varje rad.
- Manuell rutinrad: fyrkantig checkbox 20×20 med radie 4 inom egen 44×44 träffyta; flexibel textkolumn; detaljhandling med chevron 16–18 inom minst 44 pt bredd. Ingen kategoriikon, `Visa`-text eller `Ta bort` på raden. Källstyrd träningsrad är i stället en enda öppningshandling, minst 44 pt hög, med icke-interaktiv fyrkantig statusindikator i samma visuella vänsterkolumn. Ingen checkbox-roll eller separat fokuspunkt på träningsindikatorn; skärmläsaretiketten anger titel, klart/inte klart och att träningssteget öppnas. Diskret separator mellan raderna.
- Med 327 pt kort och 12 pt sidpadding återstår 303 pt; två kontrollkolumner à 44 och två gap à 4 lämnar 207 pt för titeln. Routiner utan detaljhandling får ännu mer textutrymme. Checkbox och detaljtryck får inte överlappa.
- Genvägsgrupp: 12 pt padding, rubrik 20 hög, gap 8, tre färgade kort minst 76 höga med 12 pt radie, 10–12 pt horisontellt mellanrum. Symbol omkring 32 pt ovanför etiketten. Ingen separat cirkulär ikonplatta behövs. Fyllnadsgrad och storlek ska matcha visionens framträdande symboler.
- Fem navflikar i ordningen Hem/Logg/Träning/Kunskap/Mer. Hem aktiv i grönt, övriga neutralt grå. Safe area tillkommer under kontrollraden. Ingen extra bottenpadding från både parent och child som dubbelräknar samma yta.

## 5. Generiskt porträtt och automatisk åldersremsa

Porträttet bär färg och bildspråk i referensen. Eriks beslut är att Hem ska ha ett runt, fotoestetiskt hundporträtt och att åldersremsan syns framför porträttet. Den nuvarande asseten `home-dog-portrait-placeholder.png` är AI-genererad fotorealistisk bildkonst, inte ett faktiskt fotografi av en verklig hund och inte den namngivna ägarens hund. Den används som en generisk standardplatshållare i public och review Home, utan synlig `Standardbild`-etikett efter Eriks städningsbeslut 2026-10-24. Bildroll/proveniens finns kvar i manifest och verifieringsmetadata; inga personliga bildanspråk införs. Ingen personlig fotofunktion, uppladdning, lagring eller identitetskoppling byggs.

- Bildroll `genericDogPortraitPlaceholder`: AI-genererad bildkonst med varm päls och gröna miljötoner. Dekorativt element; skärmläsare ignorerar bilden. Copy, alttext, modell och analytics får inte hävda eller härleda att den visar hunden `{namn}` eller en viss ras. Verifieringsresultatet anger samma bild som syntetisk standardplatshållare utan en extra banner i appvyn.
- Framtida `ownerPhoto` är en separat produkt-/säkerhetsdel med ägarvalt foto, behörighet, lagring och radering; den uppgiften ligger utanför detta paket.
- Porträttet maskas runt, `cover`, cirka 112–120 pt. Behåll ansiktet i fokus, varm bildton och diskret kant. Hälsningens textkolumn och aktiva veckomarkör får inte täckas.
- Åldersremsan har högre z-index än hela porträttet och löper framför dess nedre del. Låt `L` och `R` vara porträttcirkelns vänster- respektive högerkant och `x` markörens centrum. Överlappszonen är exakt `L − 16 pt ≤ x ≤ R`; `z = (x − (L − 16)) / (R − (L − 16))`. För icke-aktuell markörs dekor gäller opacity 0,78 när `0 ≤ z < 1/3`, 0,56 när `1/3 ≤ z < 2/3`, och 0,38 när `2/3 ≤ z ≤ 1`. Markörer utanför zonen är oförändrade. Opacity gäller endast dekorativ punkt/bakgrundstvätt; ålderssiffran sänks aldrig i opacity och får en varm solid kontrastbakning över bild. Den aktuella markören behåller full färg och är visuellt starkast även om den ligger i zonen. Bakgrundstvätten tonar bildbidraget mot `home.canvas`; siffrorna ligger ovanpå tvätten. Sifferkontrast ska vara minst 4,5:1 vid 375/430 och 140 % text.
- Samma porträttstorlek, beskärning och lagerordning används i loading/empty/error. Fallback vid saknad asset är neutral och märks sanningsenligt; den får inte beskrivas som fotografisk matchning.

### 5.1 Automatisk ålder och fas (ägardecision 2026-10-14)

- Remsan använder hela veckor från födelsedagen till och med dag 140 (0–20 veckor). Från dag 141 visas hela kalendermånader till och med första årsdagens datum (0–12 månader). År visas från dagen efter den första årsdagen.
- Skottårsklippning följer befintlig kalendermånadsregel: ett födelsedatum 29 februari får 28 februari som första årsdag i ett icke-skottår; 28 februari visar 12 månader och 1 mars visar 1 år.
- Remssekvensen är 0–20 veckor, 0–12 månader eller 1 till aktuell helårsålder +3. Enhetsbyte skapar en ny lista och placerar markören med högst tre tidigare värden synliga.
- Hemidentiteten och aktiva `Just nu`-kortet visar samma hela automatiska ålder från en gemensam lokal kalenderdag. Profilens sparade åldersvisningsenhet och innehållets/träningens interna veckourval ändras inte.
- Separat text `Ungefärlig fas: VALP/UNGHUND/VUXEN` använder VALP före 6 hela kalendermånader, UNGHUND från 6 till före 24 och VUXEN från 24. Detta är en grov produktindelning, inte en universell veterinärnorm. Ingen SENIOR-gräns införs.
- Saknat, ogiltigt eller framtida födelsedatum döljer beräknad ålder, fas och remsa. Ingen vecka 0 visas som reserv.

Bildmanifestet anger fil, AI-generation, användningsrätt, bildroll, fokus/beskärning och dekorativ tillgänglighet. Ingen ny fotoinsamling, lagring eller databaskoppling följer av denna specifikation.

## 6. Innehåll och handlingar

| Objekt | Text på Hem | Fördjupning och sanningskälla |
|---|---|---|
| Hund | Verkligt namn och levnadsveckor | Befintlig hundidentitet; inget hårdkodat Milo/12 i public |
| Just nu | `Just nu med {namn}` + kort publicerad ingress | Samma tillgängliga innehållsversion som läsvyn |
| Egen rutin | Ägarens rutinnamn | Befintlig rutin/dagsinstans; separat checkbox sparar markeringen |
| Träningssteg | Enbart stegets korta titel, t.ex. `Miljöträning – nya ljud` | Befintligt steg-ID och programversion; programtitel/vecka i träningsvyn. Ingen ny completion-flagga |
| Progress | `{klart} av {alla} klara` | Hela aktiva dagsmängden, aldrig bara de fem visade raderna |
| Kontrollera vaccinationsplan | Endast ägarvalt rutinnamn i detta scope | Markering betyder ägarens rutinbekräftelse, aldrig utförd vaccination. Ingen automatisk koppling från vårdplan |
| Genomförd logghändelse/öppnad guide | Ingen automatisk dagsbock | Får inte ändra räknaren utan godkänt källkontrakt |

Långa uppgiftstitlar får högst två rader i översikten med ellips; full text måste vara åtkomlig via detalj/hantering och skärmläsaretikett. Ord bryts inte manuellt mitt i ord. Vid stor text växer rad och kort naturligt. Referensfixturen använder korta titlar; långtextfixturen visar full realistisk belastning och får scrolla.

För manuella rutiner är bock och detaljöppning separata handlingar. För träningsrader är hela raden en öppningshandling; statusindikatorn är en del av dess etikett. Hantering är gemensam fördjupning. Rutinbock ändrar endast den egna dagsinstansen efter bekräftad sparning. Träningsstatus är läsbar men inte en andra interaktiv checkbox; öppna träningssteget för ändring. Förklaring ges i detaljen och skärmläsartexten. Ta bort från dagen och radera en rutin skiljs åt i hanteringsytan, med befintlig bekräftelse/återhämtning.

## 7. Tillstånd och granskningsläge

- Loading: samma sektionsordning med lugna platshållare. Ingen fabricerad progress.
- Empty: kort besked och synlig väg att välja aktiviteter; behåll genvägarna. Ingen 0/0.
- Error/partial: lokalt besked och retry, inga låtsasvärden i räknaren. Befintliga verifierade rader kan stå kvar enligt datakontraktet.
- Pending/failed/unsure: lokal sparåterkoppling, bibehållen avsikt, ingen falsk bock, återläsning/retry enligt befintliga regler. Nätverksfel är inte tom dag.
- Konto-/hundbyte och dagsbyte: återanvänd befintlig scopehantering och dagskontrakt. Ändra inte backendsemantik för att anpassa färger eller etiketter.
- Offline: visa korrekt känt/okänt resultat och återhämtningsväg; ingen påstådd offlinekö.
- Tillgänglighet: textskalning, minst 44×44 pt för interaktioner, separata fokusmål, kontrast, etiketter, naturlig scroll och reducerad rörelse.
- Efter Eriks beslut 2026-10-24 visas inga test-/review-/Standardbild-remsor i eller över appviewporten. Dokumentera i stället fixture, bildroll, skala och commit i verifieringsresultatet. Syntetiska renders bevisar inte produktionsdata.

## 8. Acceptans som inte kan passera med fel formspråk

1. Spara panel 1 och aktuell render sida vid sida i samma bredd. Telefonram och operativsystemets statusrad ingår inte som appkomponenter. Dokumentera viewport, insets, textskala, generisk bildroll, fixture och commit; verifieringsmetadata anger asseten som AI-genererad standardplatshållare.
2. Standardfixture: fem korta uppgifter, två klara, verkligt ansluten presentationskomponent och typade syntetiska data, public-skrivningar avstängda. Färgade genvägar är fullt synliga med minst 16 pt marginal till menyn vid 375×844 och 430×844.
3. **Formkrav:** en dagsrubrik; fyrkantiga bockar; inga radikoner/`Visa`/`Ta bort`; sammanhängande listyta; tre tydligt skilda pastellkort; varm tipssymbol; runt generiskt hundporträtt och veckoremsa synlig framför dess nederdel. Varje miss är ett separat visuellt Nej även när allt går att klicka.
4. **Färgkrav:** blå/grön/lila yta och symbol ska synas i första standardvyn; progress är grön på varm neutral bana. Kontrollera kontrast med de faktiska renderade färgerna.
5. **Bildkrav:** använd den dokumenterade AI-genererade generiska hundbilden som standardplatshållare i både public och review Home; beskriv den aldrig som verklig fotografering eller som ägarens hund. Reviewexport märker bildrollen. Porträttet ska vara runt och veckoremsan ska ligga ovanpå. Spara färska renderbilder vid 375/430 och 140 % text. Verifiera att icke-aktuella markördekor tonas stegvis endast i överlappszonen, att sifferglypher behåller minst 4,5:1 kontrast och att aktiv vecka är starkast. Jämför bakgrundens fade mot `home.canvas`; fallback och eventuell framtida ägarbild är separata.
6. Sju aktiviteter: fem synliga, sann total och fungerande `Visa alla`. Långt namn/titel och 140 % text: inga sönderbrutna ord, inga krockar, allt nås via scroll. 375×667 och reducerad rörelse provas separat.
7. Genomför en rutinmarkering och en träningsresa genom rätt källa; prova fel/osäkert svar och återhämtning; öppna hantering, byt val och ta bort enligt befintligt kontrakt. Genomgång av navigation ska bevisa att varje chevron/knapp har en destination.
8. Oberoende QA/Reviewer fyller även regelverkets §14. Skärmdumpen som Erik nu visar är inte visuellt godkänd enligt detta kontrakt. Tidigare R02-1-resultat avser sin historiska version och kan inte godkänna senare R02-2-layout.

## 9. Byggordning och avgränsning

1. Namngivna Home- och destinationstokens samt kompakta kort/radvarianter; referensfixture använder **samma komponenter** som dagsvyn. Undvik en separat snygg demo som den riktiga dagsadaptern inte använder.
2. Hemkomposition, kort etikett för träningssteg och flytt av befintlig hantering till fördjupning. Bevara alla data-/sparregler. Geometri och verklig innehållsbelastning granskas tillsammans.
3. Runt generiskt hundporträtt med manifest och mask; placera veckoremsan ovanpå, tona markördekor och bildbakgrund enligt §4/§5, och verifiera kontrasten. Personligt fotostöd fortsätter som separat del.
4. Visuell kalibrering, tillstånd, interaktioner, oberoende QA/review. Referens, faktisk render och kvarstående skillnader visas för Erik.

Tänkta skrivfiler vid senare implementation: `src/theme/tokens.ts`, berörda opt-in varianter i `src/components/ui/`, `HomeScreen.tsx`, presentationsmappning i `daily-activity-model.ts`, nödvändiga callbacks i `ProductWorkspace.tsx`, bildmanifest/nya assets och `tools/visual-check/`. Befintliga API:er kontrolleras innan planen fastställs. Auth, databasschema, slutföranderegler och övriga skärmar ingår inte i denna designkorrigering. Ingen ny dependency behövs för dokumentleveransen.
