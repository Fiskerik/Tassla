# UX-FIX-2026-10-14 — UX-kontrakt v1.1

Planförslag från Eriks sex telefonbilder 2026-10-14. Implementationsordning, basversion och tester finns i [uppgiftsplanen](../tasks/UX-FIX-2026-10-14.md). Följer `design-rules.md`, rev02 panel 1/4/5/6/7 och `tassla-consumer-ux`. Detta är inte en renderad eller visuellt godkänd leverans.

## 1. Logg: bild 1–2

Målet är att snabbt känna igen händelsen, se hela tiden och nå Spara utan att scrolla förbi dubbla knapprader.

- Behåll sheetens titel och kryss. Händelsetyper blir kompakta val med befintlig kategoriikon **och kort etikett**: Kiss, Bajs, Mat, Sömn, Promenad, Olycka, Vatten. Behåll radiosemantik/vald-markering. Enbart droppsymbol kan inte skilja Kiss från Vatten.
- Olyckans två val blir en kompakt rad med två tydliga flerval: droppe + Kiss och bajssymbol + Bajs, minst 44 pt höga. Båda kan väljas. Befintlig validering och legacy-okänd typ består; ta bort den ständiga långa instruktionen, visa hjälp/fel bara vid behov.
- Datum visar fullständigt datum med kalenderikon i egen 44×44 pt tryckyta. Tid visar alla fem tecknen `HH:mm` med klockikon i egen tryckyta. Återanvänd befintliga väljare och manuell inmatning.
- Datum/tid får varsin rad som säkert grundläge vid smal bredd eller 140 % text. Två kolumner bara där fulla värden, padding och båda ikontryckytorna ryms utan ellips. Ingen textkrympning för att få plats.
- En bottenrad: **[ Spara, flexibel bredd ] [ papperskorg, 44×44 ]**. Papperskorgen ligger längst till höger. Ta bort Avbryt-knappen och den extra Spara-raden. Förankra raden i sheetens footer med korrekt safe area/tangentbord; formuläret scrollar ovanför. Ny opt-in footer-slot får införas i `BottomSheet` om befintligt API inte kan göra detta, utan att ändra andra sheets.
- Papperskorg öppnar exakt **”Vill du verkligen radera posten?”**, med `Avbryt` och destruktiv `Radera`. Att Avbryt tas bort ur formuläret innebär inte att bekräftelsedialogen saknar avbrytväg.
- Kryss/bakåt stänger ett oförändrat formulär; osparad ändring ger `Kasta ändringar?` med `Fortsätt redigera` / `Kasta ändringar`. Pending och okänd skrivstatus följer befintlig återläsning; förlora inte skrivavsikten.
- Spara visar `Sparar…`, spärrar dubbeltryck och stänger bara vid bekräftat sparande. Fel behåller inmatning. Radera respektive Spara kan aldrig köras samtidigt.

### Olyckans ikon

Utgå från sparad `accidentKinds`, aldrig anteckning eller gissning:

| Sparat värde | Synlig symbol | Tillgängligt namn |
|---|---|---|
| `['pee']` | Olyckans droppe ensam | Kissolycka |
| `['poop']` | Olyckans bajssymbol ensam | Bajsolycka |
| `['pee','poop']` | Befintlig kombination | Kiss- och bajsolycka |
| `null` (äldre okänd post) | Befintlig generell olyckssymbol | Olycka, typ ej angiven |

Behåll olyckans färg så symbolen skiljs från vanlig kiss/bajs. Tidslinjens synliga titel kan förbli `Olycka`; detalj och skärmläsaretikett anger den sparade typen. Null får inte räknas som båda. Snabbvalet Olycka visar fortfarande generell kombination eftersom inget val ännu gjorts. Ingen ny bildgeneration behövs: återanvänd `PoopIcon` och Ionicons.

## 2. Hem och checklistors väntetid: bild 3

”Alltid renderad” betyder att samma hunds redan lästa dagslista finns kvar i workspace-minne mellan flikar. Det kräver inte att alla skärmar hålls monterade eller att alla framtida dagar laddas.

- Återgång till samma hund/dag visar senast bekräftade rader och räknare direkt; bakgrundsuppdatering tömmer inte vyn.
- Första laddning utan data visar lugn platshållare, inte tom lista/0 av 0. Ingen utlovad nätverkstid.
- Bakgrundsfel behåller tidigare data med lokalt besked `Kunde inte uppdatera` och retry. Saknade/ej verifierade delar får inte bli noll eller klara. En ofullständig dagsmängd får ingen ny totalräknare.
- Pending avmarkering/markering gäller bara berörd rad, med gammal bock tills bekräftat resultat. Vid osäker skrivning visas inte gammalt värde som om den nya avsikten var bekräftad.
- Hund-/kontobyte och utloggning rensar föregående privata data synkront. Dags-/tidszonsbyte byter dagsnyckel och får inte visa gårdagens bockar som dagens. Kunskaps faschecklistor nollställs aldrig vid midnatt.
- Hem och Träning läser samma träningssnapshot, så ett sparat/avmarkerat steg syns på båda utan extra flikresa. Återkallat innehåll tas bort när det upptäcks; stale visning får inte kringgå publiceringskontroll vid skrivning.

## 3. Rutinhantering: bild 4

Behåll Hemmets nuvarande punktlista och progress. Fördjupningen blir två tydliga lägen inom samma sheet: **rutinlista** och **en rutins editor**. Visa inte flera öppna formulär och stora åtgärdsknappar samtidigt.

Wireframe, symbolerna illustrerar layout; implementation använder verifierade Ionicons:

```text
Rutiner                         [+] [×]

Morgonrutin                    [penna] [papperskorg]
Dagligen · 3 punkter                  [Idag på/av]
------------------------------------------------
Kvällsrutin                    [penna] [papperskorg]
Mån, ons, fre · 2 punkter              [Idag på/av]

Träningssteg                                    ›
```

```text
‹  Ändra rutin                   [bock Spara] [×]

Namn
[ Morgonrutin                                  ]

Punkter                                      [+]
Kissa                         [penna] [papperskorg]
Mat                           [penna] [papperskorg]
Promenad                      [penna] [papperskorg]

Upprepning                 Dagligen             ›
```

- Rutinlistan har sammanhängande rader med diskreta separatorer, inga stora kort för varje rutin och inga permanenta hjälpparagrafer. Vid 375×844 standardskrift ska tre kortnamniga rutiner med summering/åtgärder rymmas i öppnad sheet utan att checklistorna expanderas.
- Plus i rubriken skapar rutin. Pennan eller namnet öppnar editorn. Papperskorg längst till höger raderar hela rutinen efter tydlig bekräftelse. Etiketter för skärmläsare inkluderar rutinnamnet.
- `Idag` är en märkt switch för att lägga till/ta bort dagens förekomst. Ingen papperskorg för tillfällig synlighet. `Av` på en upprepad rutin betyder hoppa över idag; nästa förfallodag påverkas inte. Påslag efter skip återställer samma dagskopia och bockar enligt befintligt kontrakt. Denna switch betyder inte genomförd och inte permanent aktivering.
- För en manuell förekomst utan upprepning innebär `Idag` av att dagens kopia och bockar tas bort; på igen skapar en ny kopia från uppdaterad mall. Visa denna konsekvens i bekräftelsen före borttagning när dagen har bockar. Upprepad förekomst behåller i stället snapshot/bockar genom skip/återläggning.
- Ingen stor `Klar`-knapp i listläget; krysset stänger. Träningsval ligger i en separat kompakt fördjupning i samma sheet, med fungerande tillbakaresor och bevarad möjlighet att lägga till/ta bort träningssteg för dagen.
- Editorn visar ett rutinutkast åt gången. Pennan vid en punkt gör just den texten redigerbar. En kort textknapp `Klar` utan bocksymbol avslutar lokal punktredigering; den sparar **inte** till servern. Bocksymbolen reserveras för toppens serverlagring. Toppens bock med kort synlig etikett `Spara` sparar hela rutinen atomiskt. Visa diskret `Osparade ändringar` när utkastet skiljer sig. Inget framgångsmeddelande när lokal punktredigering avslutas.
- Plus lägger sist till en tom punkt med nytt stabilt UUID. Papperskorg vid punkten tar bort den ur utkastet, med lokal `Ångra` tills nästa utkaständring/stängning; ingen serverradering förrän hela rutinen sparas. Minst en giltig punkt krävs; sista punkten får inte tas bort utan ersättning. Befintliga gränser 1–50 punkter och 1–160 Unicode-tecken behålls.
- Rutinnamn och punktnamn behöver inte vara samma. Dubbletter identifieras med stabila ID:n, inte text eller arrayindex. Ingen drag-sortering, nya ikoner för egen kategori eller nya notiser i denna leverans.
- Toppbock är enda primära handling. Hela utkastet med punkt-ID:n/ordning/intervall behålls vid fel; exakt samma intent används vid retry. Spara oförändrat utkast är inaktivt. Byte tillbaka/kryss med ändringar kräver kasta-bekräftelse.
- Malländringar gäller **nästa dagskopia**, enligt befintlig snapshotmodell. Visa villkorad hjälp när dagens kopia redan finns: återkommande rutin: `Dagens lista behålls. Ändringen gäller nästa schemalagda tillfälle.`; ingen upprepning: `Dagens lista behålls. Ändringen används nästa gång du lägger till rutinen på Hem.` Gör inte en dold omskrivning av dagens bockar.
- Raderingsdialogens text ska motsvara verifierad servereffekt: befintlig FK raderar även rutinens dagskopior/skip-rader. Efter verifiering mot målbranchens SQL används rubriken `Vill du radera rutinen ”{namn}”?` och texten `Rutinen och dess sparade dagslistor tas bort, även dagens markeringar. Det går inte att ångra.` Knappar: `Avbryt` och destruktiv `Radera`. Nuvarande text om att dagskopior behålls ska bort. Ingen historikbevarande funktion uppfinns.

### Upprepning

Kompakt rad öppnar valen `Ingen upprepning`, `Dagligen`, `Eget intervall`. Bara valt alternativs inställningar visas. Kort sammanfattning syns när väljaren stängts.

- Ingen upprepning: återanvänd befintligt null-kontrakt; ingen automatisk framtida förekomst.
- Dagligen: `day / 1`.
- Eget intervall: `Var [1–30] [dag/vecka/månad]`. Återanvänd befintligt intervallstöd. Textfält + minus/plus med tydliga namn; ogiltigt värde blockerar Spara.
- Vecka: visa sju flervalsknappar `Mån Tis Ons Tor Fre Lör Sön`, minst 44 pt träffyta, radbryt vid behov. Minst en veckodag. För ny veckoregel förväljs dagens veckodag. Ett veckointervall på N gäller veckor räknade från måndagen i ankardatumets vecka; inga förekomster före ankardatumet.
- Månad: samma datum som ankaret; datum 29–31 kläms till månadens sista dag och återgår till originaldatum i nästa tillräckligt lång månad. Exempel 31 jan → 28/29 feb → 31 mars. Visa `Den 31:a, annars sista dagen` när det behövs.
- Ändrat schema får nytt serverankare enligt befintlig regel. Endast namn/punktändring bevarar ankaret. Befintliga dagssnapshots och skip-tombstones består. Ingen backfill av missade dagar och inga nattjobb/notiser införs.
- Veckodagsval är den enda nya schemaförmågan. Nuvarande dag/vecka/månad ska inte byggas om eller nollställas. Detaljer om migration/RPC finns i del 7 i uppgiftsplanen.

## 4. Träning: bild 5–6

- `Fortsätt där ni var` visas som kompakt liggande kort enligt panel 6. Bildyta 76–88 pt bred, explicit inramad/beskuren bild; text får bestämma kortets höjd. Inbyggd assetstorlek får aldrig sätta hela kortets höjd.
- Vid 375×844/430×844, standardskrift och testtitlarna från bild 5 ska kortet vara högst 200 pt högt, med fullt synlig titel, nästa steg och 1 av 2-progress. Vid 140 %/långtext tillåts större höjd utan klippning. Ingen `height:100%` eller hög maxHeight som döljer felet.
- Testa 0/2 (inget fortsättkort), 1/2 (kort med nästa ej klara steg), 2/2 (inget fortsättkort för avslutat program), samt flera program. Ett program får inte försvinna ur Alla övningar när första markeringen tas bort.
- I genomförd övningsdetalj: markerad checkbox med text `Genomförd`; tryck igen avmarkerar just detta steg. Tillgängligt namn `Avmarkera {stegtitel}`, checkbox-roll och checked/busy/disabled-state. Ingen papperskorg eftersom övningen inte raderas.
- Inget krav att nollställa hela programmet. Befintligt `Börja om` är separat och behåller sin bekräftelse.
- Avmarkering påverkar exakt hund/programversion/steg. Senare redan genomförda steg behålls; nästa tillåtna steg blir det första omarkerade i positionsordning. Vanlig framåtmarkering behåller befintlig ordningsregel. 2/2 → avmarkera första → 1/2, nästa = första; 1/2 → avmarkera första → 0/2.
- Bekräftad borttagning uppdaterar detalj, Mina, fortsättkort och Hemmets dagsprojektion tillsammans. Ny markering får en ny serverstämpel; detta är progress, inte ny träningshistorik. Fel/unknown ändrar inte bock i förtid och inga framgångsanimationer spelas vid avmarkering.

## 5. Jämförelsematris och visuella bevis

| Referens/ägarbeslut | Nuvarande avvikelse | Komponent/asset | Visuell acceptans |
|---|---|---|---|
| Bild 1, panel 5:s kompakta handlingar | Textknappar tar tidens bredd, footer klipps | AppPrimitives, LogEventEditor, BottomSheet | Fullt datum/HH:mm; en Spara-rad + högerställd trash |
| Bild 2, korrekt objektsymbol | Alla olyckor har samma dubbelikon | ListRow, IconChip, PoopIcon | 4 typfall enligt tabellen, samma färg/tyngd |
| Panel 1, beständig dagsöversikt | Listan töms vid återgång | ProductWorkspace, HomeScreen | Inga tomma mellanbilder vid varm flikresa |
| Panel 4, kompakt fördjupning + Eriks ikonbeslut | Flera kort, checklistor och stora knappar samtidigt | DailyActivityManagerSheet, nya små editor-komponenter | Lista → en editor; penna/bock/trash; korta texter |
| Panel 6, liggande återupptagningskort | Bilden/ytan sträcker hela skärmen | PublishedTrainingScreen, puppy-training.png | Kompakt bild/textkort i 1/2-läget |
| Bild 6, möjlighet att göra om | Endast text när steg är klart | PublishedTrainingScreen | Synlig och fungerande avmarkeringskontroll |

QA sparar nya syntetiska screenshots vid 375×844, 430×844, 375×667, 100/140 % text samt tangentbord/safe area. Jämför varje berörd vy med motsvarande rev02-panel och detta ägarbeslut; fyll §14 med evidens per punkt, särskilt komposition, färger, typografi, former, bildspråk och täthet var för sig. Gamla skärmdumpar godkänner inte nya dataflöden. Saknad rendering/native-evidens anges NOT TESTABLE för respektive kontroll.
