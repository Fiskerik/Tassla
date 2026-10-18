# R4a — relevans och kontextuell apphjälp

UX-spec v13 · `UIUX-REVAMP-R4A-RELEVANCE-01`

## Ytor och tomlägen

- **Hem:** följ den aktiva `HOME-REV02-visual-ux-specen`: identitet/ålder, ett `Just nu`-rådkort, dagens lista och tre genvägar. Endast `homeAdvice`-urvalet fyller rådkortet; ett separat träningssteg får inte fungera som reservrekommendation när Hem saknar grant. Det finns ingen aktiv Home-carousel i denna resa och FAQ/planerad hälsa visas via sina befintliga destinationer. Tomcopy: “Det finns inget publicerat råd för den här vyn just nu.” Handling: “Öppna dagens checklista”. Hemidentiteten och aktiva `Just nu`-kortet visar samma hela automatiska ålder när den finns. I bekräftat tomt rådsläge döljs länken “Visa dagens checklista” i dagslistan endast när den ersättande handlingen faktiskt renderas och är aktiverad; loading, error, unknown, eligible eller saknad handling får inte dölja den. “Hantera”, alla dagsrader, progress och “Visa alla” vid fler än fem rader bevaras.
- **Kunskap / För dig:** separat selector. Tomcopy: “Det finns inga publicerade råd för den här vyn just nu.” Handling: “Öppna checklistor”.
- **Kunskap / Artiklar:** separat selector. Tomcopy: “Det finns inga publicerade artiklar i den här vyn just nu.” Handling: “Öppna checklistor”. Ingen generisk förstahandsrekommendation. FAQ och Checklistor lämnas oförändrade.
- **Logg:** “Hjälp om Logg och rutiner” öppnar exakt `daily-log-routines` v1. Tillbaka bevarar datum och eventutkast.
- **Hälsa / Vikt:** “Hjälp om viktregistrering” öppnar exakt `weight-history-guide` v1. Tillbaka bevarar undertab och utkast.
- **Hälsa / Översikt / Genomfört:** “Hjälp om registrering” öppnar exakt `health-records-guide` v1. Tillbaka bevarar undertab och utkast. Inga vård-/schemapåståenden.
- **Träning / Rekommenderat och Alla övningar:** inga grants finns. Empty-copy: “Det finns inga publicerade träningsprogram att visa här just nu.” Handling: “Öppna dagens checklista”. Fel/unknown får inte se ut som bekräftat empty.
- **Unknown / saknat födelsedatum:** “Lägg till födelsedatum för åldersbaserade råd.” Handling: “Redigera hundprofil”.
- **Unknown / ofullständig context eller omappad version:** “Vi kan inte välja innehåll för den här vyn just nu.” Handling: “Öppna dagens checklista”. Bara error ger retry-copy/handling.
- **Träning / Mina:** grantad progress visas med programtext. Nekad version bär endast internt versions-ID och verifierat antal; ägarcopy visar “Tidigare program · X steg finns sparade”, utan rå UUID, titlar/instruktioner/åtgärder.
- **Hem/Checklista – spärrat dagsval:** visa att träningssteget är otillgängligt/okänt. Från Checklista kan ägaren öppna “Hantera rutiner” och välja “Ta bort idag”. Det tar bort endast dagens val; sparad progress finns kvar. Pending/fel/unknown följer bekräftad readback och retry.

## Tomt Home-rådkort: interaktion och geometri

I bekräftat `empty` ska hela `Just nu`-kortet vara en sammanhängande tryckyta (`Card` som semantic button, minst 44 pt träffyta); lägg ingen knapp inuti kortet. Visa rubriken “Just nu med {hundnamn}”, samma automatiska ålder som identiteten, den korta tområdstexten och en typografiskt betonad inline-handling “Öppna dagens checklista”. Accessibilitetslabeln nämner rubrik, ålder när den finns och handling. Vid 375 pt viewport är kortet 327 pt brett med 12 pt inre horisontell padding (303 pt textkolumn); använd befintliga kompakta rubrik-/ålders-/brödtextstilar och högst två brödtextrader i standardfixturen. 22 pt rubrik + 18 pt åldersrad + 40 pt två brödtextrader + högst 6 pt mellanrum + 24 pt vertikal padding + 2 pt kontur ryms inom 112 pt. Kontrollera samma tak vid 430 pt. Om innehållet inte ryms naturligt blir acceptansen inte uppfylld; krymp inte texten eller träffytan. Tryck går via befintlig Home-checklistnavigering; checklistans befintliga tillbakahandling går till Hem.

## Tillstånd och interaktion

`loading`, `eligible`, bekräftat `empty`, `error` och `unknown(reason)` är skilda. Query-/valideringsfel eller stale resultat visas aldrig som tomt granturval. Retry visas endast vid läsbart/retrybart fel. Okänd hundålder blockerar hundråd/träning men inte åldersoberoende funktionshjälp. Unknown-detail och råa IDs exponeras inte. Ingen hjälp öppnas inuti aktivt formulär; återgång bevarar kontext.

## Visuell verifiering

Renders: Home rådtomt och Home med standard-fixturens fem dagsrader; i standardhöjd 844 px ska tre genvägar vara fullt synliga med minst 16 pt marginal till fast meny vid 375/430 px. Kontrollera separat att inget otränat/ej grantat `nextStep` visas som råd; mät att tområdets hela innehåll ryms inom 112 pt utan klippning; tryck Home-kortet till dagens checklista och tillbaka till Hem; tryck Training-empty-knappen till samma checklista och verifiera den befintliga tillbakahandlingen till Hem. Knowledge För dig/Artiklar tomma; Training Rekommenderat/Alla/Mina; contextual help och återgång; spärrat dagsval och Ta bort idag; varje unknown reason. §14 bedöms med faktisk jämförbar render vid 375/430 px, 667 px höjd och 140 % text där renderverktyget stöder det. Alla 18 punkter får Ja/Nej/Ej tillämpligt och punkt 16 bedöms separat för komposition, färg, typografi, former, bildspråk och innehållstäthet med bildhänvisningar. Otillgängliga native/live-vyer anges NOT TESTABLE.

## Avgränsning och checkpoint

Ingen migration, innehållspublicering, ny taxonomy/behovsväljare, FAQ-ändring, sök/filter, hjulnavigering, vuxenrekommendation eller radering av träningsprogress. R3c QA-status hålls öppen. Innan R4b startar ska R4a ha check, funktionell/visuell QA, oberoende QA, Reviewer och dokumenterad lokal diff/evidens/köcheckpoint. Ingen mellancommit; samlad commit/push efter R7 enligt Eriks begäran. Live Supabase/RLS och fysisk native-beteende kräver separat faktiskt prov.
