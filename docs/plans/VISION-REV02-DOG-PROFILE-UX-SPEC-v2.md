# UX-spec — hundras, Mix och åldersvisning

> **Ägarbeslut 2026-10-21 gäller alla MVP-checkpoints:** ras-/profilflöden verifieras funktionellt och visuellt vid relevanta standardvyer. 140 %/stor text, Dynamic Type, VoiceOver/TalkBack, reduced motion och generell träffyte-/kontrastaudit görs efter att MVP:n är släppt och godkänd. Behåll befintliga labels/semantik; äldre a11y-kriterier här är inte MVP-grindar. Se [AGENTS.md](../../AGENTS.md) och [arbetsflödet](../dev/workflow.md).

> **Statusnotis 2026-10-20:** v8 är historisk plan för ålder, katalogimport, Mix och Home-identitet. Godkänd MVP rev02 har brutit ut sökbar rasväljare över befintlig katalog till [`DOG-PROFILE-SEARCH-PILOT-01`](DOG-PROFILE-SEARCH-PILOT-UX-SPEC.md). Den delen är inte blockerad av Wikidata-snapshot. Snapshotkravet gäller fortsatt katalogutökning och Mix. Historiska acceptanskriterier och v8-review ändras inte retroaktivt; aktuell avgränsning finns i kön och nya pilotplanen.

Datum: 2026-10-13 · Version: 8 · Status: Wikidata CC0 valt; åldersdelen kan gå först medan katalogsnapshoten inväntar åtkomst.

## Användaruppgift och omfång

Ägaren ska kunna välja en ras från en sökbar katalog, ange två kända raser när hunden är Mix, och välja om åldern visas i veckor, månader eller år. Hem visar hundens namn och ras på en identitetsrad och vald ålder under den. Home, Hundprofil, Tassla-pass preview och exporterad PDF använder samma valda åldersenhet.

Detta beslut utökar den tidigare begränsade raslistan. Erik valde 2026-10-13 **Wikidatas strukturerade data under CC0**. Källomfånget definieras som Wikidata-poster som är instanser av `dog breed (Q39367)` eller dess underklasser och har en svensk eller engelsk etikett. Urvalet ska ha stabila QID:n; svensk etikett används när den finns, annars engelsk. Detta är Wikidatas dokumenterade datamängd, inte ett löfte om att den innehåller varje hundras i världen. SKK-listan används inte utan skriftligt medgivande enligt deras återanvändningsvillkor.

Exakt snapshot, antal, etiketter och QID:n har ännu inte hämtats. Försök att läsa WDQS och den dokumenterade QLever-spegeln misslyckades i den här exekveringsmiljön (nätverkstunneln svarar 403 och webbläsarverktyget nekar API-endpoints). En importerbar katalogfil saknas. **Historisk v8-avgränsning:** katalogutökning och Mix kunde inte börja utan snapshot. **Aktuell avgränsning enligt statusnotisen ovan:** den sökbara väljaren över redan tillgängliga katalogposter levereras separat och väntar inte på snapshot; resterande katalog-/Mix-del behöver fortsatt ett daterat verifierat exportresultat och ny review.

Planerad SPARQL-fråga för snapshoten:

```sparql
SELECT DISTINCT ?item ?sv ?en WHERE {
  ?item wdt:P31/wdt:P279* wd:Q39367.
  OPTIONAL { ?item rdfs:label ?sv FILTER(LANG(?sv) = "sv") }
  OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
  FILTER(BOUND(?sv) || BOUND(?en))
}
```

## Produkt- och datakontrakt

- Söktext filtrerar endast katalogposter; godtycklig fritext går inte att spara. `Okänd ras` är tillgänglig när katalogen saknar ett alternativ. `Mix` ligger först. Övriga visningsnamn sorteras med svensk lokalisering.
- Källvalet är Wikidata CC0. Katalogens omfattning följer frågan ovan; använd svensk etikett när den finns och annars engelsk etikett, med QID som stabilt ID. Den slutliga snapshoten ska dokumentera exporttid, fråga, antal, valda etiketter och licens utan att påstå att Wikidata täcker bokstavligen alla hundraser globalt.
- `Mix` visar checkboxen **Jag vet vilka raser som ingår**. Avmarkerad Mix får sparas utan delraser. Markerad Mix kräver två skilda katalograser; `Mix` och `Okänd ras` får inte vara delraser. Båda väljare visar när ett val saknas och Spara är inaktiverad tills två olika tillåtna raser valts. Delraser påverkar inte befintligt innehållsurval.
- Hem visar `Hundnamn | Ras`; blandras visas som `Hundnamn | Mix`. Delraserna visas i Hundprofilen, inte på Hem. Identitetsraden radbryts vid naturliga ordgränser och visar hela hundnamnet och rasnamnet; den kapas eller ersätts inte med ellips. Vid behov växer blocket vertikalt och flyttar innehållet under nedåt.
- Hundprofilen erbjuder **Visa ålder som** med veckor, månader och år. Standard är `weeks` tills ägaren väljer annat.
- Åldern beräknas från ISO-kalenderdatum utan tidszon. `today` tas från samma `localDate()` som befintlig ålderslogik. Beräkningen får aldrig ändra `ageInWeeks` eller åldersbaserat innehållsurval.
- Beräkna `n` som största antal månader där `addMonthsClamped(birthDate,n) <= today`; `addMonthsClamped` räknar direkt från ursprungsdatumet och använder `min(födelsedag, sista kalenderdagen i mål-månaden)`. Beräkna `y` analogt med klämd årsdag, direkt från ursprungsdatumet. Dagar efter senaste månadsdag delas i fulla sjudagarsperioder. Exempel: 31 jan → 28/29 feb → 31 mars; 29 feb → 28 feb följande år. Det ger aldrig iterativ klämning (31 jan → 28 feb → 28 mars).
- Veckor är avslutade sjudagarsperioder. Månadsval visar `n` fulla kalendermånader plus fulla veckor efter `addMonthsClamped(birthDate,n)`; innan första månad visas fulla veckor. Årsval visar fulla år `y` plus fulla residualmånader från `addMonthsClamped(birthDate,12*y+m)`; om `y=0` visas fulla månader, och innan första månad fulla veckor.
- Nollkomponenter utelämnas i sammansatta format. Under en månad visar månads-/årsval avslutade veckor; exakt noll visas `0 veckor`. Singular/plural används för vecka/månad/år. Exempel: `16 veckor`, `16 månader 1 vecka`, `1 år 4 mån`, `1 månad`.

## Flöden och tillstånd

1. Onboarding och profilredigering öppnar samma etiketterade sökbara rasväljare. Sökningen sker lokalt i den hämtade katalogen. Tomt resultat visar **Ingen ras hittades**, en åtgärd för att rensa sökningen och, när det är huvudrasväljaren, en direkt åtgärd **Välj Okänd ras**. `Okänd ras` erbjuds inte som delras i Mix.
2. Väljs `Mix` visas checkboxen. När den markeras visas två obligatoriska rasväljare. Den ena väljarens val är inte valbart i den andra. Om inget eller bara ett delrasval gjorts visar båda väljare sin status; Spara är inaktiverad tills båda olika valen finns.
3. Profilskrivning är en operation i taget. Befintlig intent, preimage, retry, konflikt- och unknown-policy bevaras. Svar verifieras mot hela önskade profilen efter serveråterläsning. Nullable Mix-ID:n jämförs null-säkert.
4. Åldersvalet sparas tillsammans med övriga profilfält och verifieras genom samma villkorade skrivning och readback. Den immutabla `PassportSnapshot.dog.ageLabel` beräknas en gång från hundens sparade `age_display_unit`, `birth_date` och samma fångade datum som `createdOn`; preview och HTML/PDF använder exakt detta värde. När profilavsnittet är av valt utelämnas både hundobjekt och åldersetikett från snapshoten. Manuell icke-testsvitkontroll: skapa snapshot och HTML för veckor, månader och år; kontrollera att snapshotens `ageLabel` exakt matchar HTML-texten och beräknas mot samma `createdOn`, samt att profil-av saknar hund/ålder.
5. Rasdata använder befintlig retry/load-felväg. Inga nätverksfrågor görs per tangenttryckning.

## Visuell riktning och tillgänglighet

- Följ `docs/design-rules.md` och profilkontraktet i `docs/plans/VISION-REV02-R02-4E-PROFILE-UX-SPEC.md`: varm canvas, ljusa rundade grupper, profilaccent, kompakt rubrik, grupperade rader och fulla träffytor.
- Väljaren är en native-/webbmodal med en enda vertikal `FlatList`; använd inte en virtualiserad lista inuti den befintliga `BottomSheet`-scrollviewen. Sökfältet och stängningsknappen är tillgängliga med skärmläsare.
- Behåll befintliga synliga labels och valda states; långa rasnamn radbryts och färg är inte enda urvalssignal. Ingen ny mål-/skärmläsargranskning krävs före MVP.
- Hemmets identitet är två vänsterställda rader. Porträtt och vecko-karusell ändras inte.

## Dataskydd och innehåll

Ras och Mix-delraser lagras på samma hundprofil och följer befintlig ägar-RLS, konto-/hundradering och rättighetsinventering. Åldersenheten är en presentationsinställning med samma livscykel. Inga nya delningar, foton, telemetri eller persondatakategorier införs. Uppdatera projektets data-/privacyinventering före leverans. Den här uppgiften godkänner inte betaaktivering eller publicering av privacyutkast.

## Visuell och funktionell acceptans

Renderad React Native Web-evidens vid 375×844, 430×844 och 375×667 ska täcka vanliga/långa rasetiketter, Mix utan delraser, Mix med noll/ett/två olika val, sökträff/ingen träff, profil- och katalogens loading/error, konfliktläge samt Hem med varje åldersenhet. Slice A verifierar den sparade ålderspreferensen på Hundprofil, Hem och Tassla-pass; Slice B verifierar Wikidata-katalog, picker, Mix och `Namn | Ras/Mix`. Spara syntetiska public/review-captures, jämför Hem med vision_rev02 och dokumentera §14:s relevanta visuella avvikelser. 140 %/Dynamic Type/skärmläsare/native tillgänglighetsmatris ingår inte i MVP-acceptansen. Funktionell native-/RLS-runtime redovisas separat och är NOT TESTABLE om den inte körs.

## Källor och avgränsningar

- SKK:s villkor, kontrollerade 2026-10-13: https://www.skk.se/sidfot-bottenlankar/anvandarvillkor/ (avsnittet om SKK-innehåll begränsar återanvändning utan medgivande).
- Wikidata: strukturerade data i huvudnamnrymden är CC0: https://www.wikidata.org/wiki/Wikidata:Licensing och https://www.wikidata.org/wiki/Help:Data_access. Dataklassen är [dog breed (Q39367)](https://www.wikidata.org/wiki/Q39367); frågetjänstens officiella endpoint är https://query.wikidata.org/sparql. Ägarens källval är klart, men snapshot och etiketter återstår att hämta och verifiera.
- SKK:s webbkatalog uppger 376 hundraser, men dess namnimport är blockerad utan skriftligt medgivande: https://www.skk.se/hundraser/?pagenumber=1&pagesize=24&sortorder=0.
