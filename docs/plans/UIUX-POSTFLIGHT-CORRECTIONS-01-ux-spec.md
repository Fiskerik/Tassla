# UIUX-POSTFLIGHT-CORRECTIONS-01 — UX-spec v2

Status: implementing under Architect-approved plan v4. Ägarunderlag: sex numrerade felrapporter och fem TestFlight-skärmbilder i användarvändan 2026-10-17.

## Mål och ingång

Få de rapporterade logg-, rutinhanterings- och navigationsytorna att fungera och rymmas på en fysisk telefon. Ägaren ska snabbt förstå vald loggtyp, komma åt datum/tid utan bred textknapp, kunna välja veckodagar utan vertikal layoutkollaps och navigera vidare utan att workspace fryser.

## Användarresa och tillstånd

### Logghändelse

- Öppna en befintlig händelse: dess typ visas redan vald som rund kategorisymbol med nedåtpil.
- Öppna väljaren: varje tillgänglig typ har Ionicon, synligt namn och tillgängligt valt läge.
- Välj typ: listan stängs och formuläret visar rätt typfält. Olyckans sparade subtype/checkboxflöde ändras inte utan användarval.
- Datum/tid är fortfarande redigerbara i Logg, Vikt (skapa/rätta), Hälsologg, Planerad hälsa, hundprofil och notisinställningar där respektive delat fält används. Kalender-/klockknapparna är ikoniska men har tydliga accessible labels och mål.
- Pending, failed, unsure, avbryt, radering och sparning behåller befintligt draft-/readbackkontrakt.

### Rutinhantering

- Läsrutinen visar en kort, horisontell `Redigera`-handling med fungerande tryckyta på smal skärm.
- Upprepning per vecka visar `Må Ti On To Fr Lö Sö` i en rad. Synliga etiketter är korta; accessible names förblir fullständiga svenska veckodagar.
- Validering, valda dagar, anchorDate, dirty guard och sparning är oförändrade.
- `Öppna träning` inväntar att managerbladets native-modal har stängts innan Träning visas. Sheet-instansen behålls monterad tills dismiss bekräftats; callback och plattformsfallback delar en one-shot-guard, och fallback avbryts vid bekräftat dismiss. Retur går till den ursprungliga sidan.
- Vikträttningens spara, avbryt och radera är tydligt åtskilda och kan användas på smal telefon utan överlappning eller klippning.

### Huvudnavigation

- Vänstersvep flyttar en flik framåt och högersvep en flik bakåt i ordningen Hem → Logg → Träning → Kunskap → Mer.
- Vertikala scrollgester förblir vertikala. Inbäddade horisontella kontroller behåller gesten. Dirty formulär lämnar inte sin sida utan befintligt uttryckligt val.
- Första/sista fliken blir kvar vid svep utanför gränsen.

## Visuell jämförelse och acceptans

| Referenselement / önskemål | Nuläge | Ändring / komponent | Acceptans |
|---|---|---|---|
| Loggtyp visas kompakt med ikon och öppningsaffordans | Sju stora textknappar i grid | Ikonknapp med rund yta + chevron; listalternativ med ikon och namn | Vald typ tydlig, öppning förståelig, labels tillgängliga, befintliga fält och datakontrakt kvar |
| Kalender och klocka utan bred knapptext | `Kalender`/`Välj tid` tar bredd | Alla konsumenter av delade fält: Logg, Vikt skapa/rätta, Hälsologg, Planerad hälsa, hundprofil, notisinställningar | Ikontrigger med kvarvarande labels; inga klippta värden eller överlappande träffytor vid telefonbredder/stor text |
| Rutinens ändrahandling | `Redigera` bryts en bokstav per rad | Responsiv `ActionButton`-layout | Text horisontell eller tillgängligt ikonläge; inga klippta ord |
| Vikträttningens handlingar | Spara/avbryt/radera ligger för tätt | Responsiv åtgärdsrad med tokenspacing | Alla handlingar synliga och separerade; spar-/raderingsflöden oförändrade |
| Veckodagar i en tydlig rad | Upprepningskontroller radbryts 4+3 | Sju lika stora valknappar med kortnamn | En enda rad, läsbara val och minst 44 pt mål |
| Träningsväg öppnar och återgår | Rapport om fryst app efter tryck | Opt-in BottomSheet-dismisssignal före route; one-shot-guard och fördröjd fallback på plattformar utan signal | Modal är stängd innan Träning visas, appen svarar, en vy äger touch, rätt tillbakafunktion |
| Huvudflikar kan bläddras med svep | Rapporterat att svep inte byter flik | Riktningsmedveten RN-responderförhandling | Nästa/föregående en gång, vertikal/inbäddad gest opåverkad |

Ikon-only är aldrig den enda tillgänglighetsinformationen: accessible label, state och synlig selektion ska finnas. Behåll design-tokens, befintlig Ionicons-familj, systemets reduced-motion och minsta touchmått. Inga nya färger eller animationer.

## Fel- och feedbacktillstånd

- Ogiltigt/okänt loggtypvärde får inte tyst mappas till annan kategori.
- Dropdownen stängs på val, avbryt eller modalstängning; fokus/accessible state är rimlig.
- Routine pending/failed/unknown håller kvar existerande lås/utkast och inga nya handlingar aktiveras.
- Om exakt träningssteg saknas visas den befintliga generella träningsvyn; routebytet stänger managerbladet. Fel eller loading ska aldrig ge en oändlig blockerande modal.
- Huvudnavigationen använder den befintliga dirty-form guard; avbrytvalet bevaras.

## Tillgänglighet och begränsningar

Behåll minst 44×44 pt träffytor, fullständiga svenska accessible labels, skärmläsarstate, scroll/fokus och 140 % textflöde. Denna ändringsrunda lägger inte till eller kör automatiska tester. Befintliga regressioner lämnas oförändrade; efter implementation krävs uttrycklig separat begäran för att köra dem. RN Web kan inte godkänna native touch, iOS sheet/backdrop, Android BackHandler/modalordning, fysisk VoiceOver/Dynamic Type eller installerad TestFlight. Dessa ska rapporteras som NOT TESTABLE lokalt och kan verifieras manuellt i rätt build.

Fasbaserad åldersnavigation är uttryckligen uppskjuten och ska inte blandas in i denna uppgift.
