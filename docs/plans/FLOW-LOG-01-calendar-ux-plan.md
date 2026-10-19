# FLOW-LOG-01 — Logga: datumkalender, tydliga snabbval och luft

Status: föreslagen delplan, väntar på Architect och UX Critic före `ready`
Datum: 2026-10-20
Omfattning: panel 5, Logga

## Mål och användarbehov

Gör historik enkel att hitta och loggval lätta att skilja åt utan att sakta ned snabbregistreringen. Ägaren bad särskilt om att trycka på datumet för att öppna en månadskalender med markeringar på dagar med loggar, att Kiss ska skilja sig visuellt från Vatten (till exempel gult för Kiss), mindre onödig text och bättre mellanrum mellan element. UI-09:s fångst fann dessutom bara 0,42 CSS px mellan sista Logga-åtgärden och bottenfliken vid 360×844/140 %-webbstresstest med `Fler` öppet.

## Nuläge

- `LogScreen` låter datumraden gå fram/bak en dag, men datumtexten är inte tryckbar och öppnar ingen månadskalender.
- `DatePickerField` visar en kalender i händelseredigeraren, men saknar veckodagsrad och markering av dagar med loggar. Den ersätter inte historikens datumväljare.
- `tokens.colors.category.pee` och `water` använder samma blå palett. Loggknappar använder kategoripaletterna.
- Cloud-historiken laddas paginerat. Kalenderprickar får därför inte baseras enbart på redan inlästa event, eftersom en omarkerad dag då kan ha poster som ännu inte laddats.
- Gemensamma `AppScreen` har redan scrollpadding och safe-area-hantering. Logga får inte lägga på en extra botteninset utan mätning i faktisk skal-layout.

## Lösning

1. Gör det valda datumet till en tydlig, minst 44×44 pt-klickbar kontroll som öppnar en tillgänglig månadskalender. Visa svensk veckodagsrad med måndag först, föregående/nästa månad, vald dag och idag. Framtida dagar är avstängda eftersom Logga redan inte tillåter navigering efter idag. Val av dag stänger kalendern och uppdaterar historiken; snabbregistrering fortsätter att återgå till idag enligt befintligt kontrakt.
2. Lägg en diskret prick på varje dag med minst en händelse. För cloud-läge hämtas enbart `occurred_at` för aktiv hund och vald månad genom en avgränsad query (`>= lokal månadstart`, `< lokal nästa månadstart`), med befintlig RLS och abortsignal. Paginera queryn tills månaden är komplett. Om fetch laddar eller misslyckas visas detta som okänt/läsfel; tomma prickar får inte framställas som bevis för tom dag. Preview-läge härleder markeringar från sin kompletta fixture.
3. Knyt varje laddning till aktiv hund-/konto-lifetime och avbryt en äldre månadsrequest när månaden stängs, byts eller scope ändras. Hämta aktuell månad på nytt när kalendern öppnas så bekräftade add/edit/delete/undo syns utan stale cache. Queryn läser inga anteckningar eller andra privata fält.
4. Ändra Kiss till en varm gul/amber-kategorifärg med mörk textikon och behåll Vatten blå. `Olycka` behåller semantisk error-röd. Ändringen görs i delade kategoritokens så tidslinje, ikonchip och snabbval håller ihop. Behåll korta synliga etiketter; fullständiga tillgänglighetsnamn påverkas inte.
5. Mät trångt innehåll i verklig `AppScreen` med bottenflik. Vid 360×844, 140 %-webbstresstest och `Fler` öppet ska minst `tokens.spacing.sm` fri yta skilja sista åtgärden från tablisten vid scrollens botten. Kontrollera 375/430 px samt `Fler` stängt/öppet. Återanvänd befintlig `AppScreen`-padding/safe area och ändra den gemensamma padding endast om mätningen visar att den inte uppfyller målet; lägg inte en LogScreen-kompensation ovanpå en fungerande gemensam inset.
6. Använd befintlig modal-/sheet- och reduced-motion-konvention. Kalendern får inte lägga in dekorativa spring-/parallaxeffekter; vid reducerad rörelse ska övergången vara omedelbar eller använda befintlig platt övergång. Ingen schema-, reminder-, analytics- eller navigationsändring.

## Acceptans

- Det valda datumet i Logga öppnar och stänger en svensk månadskalender; vardagsetiketter börjar med måndag, månadsskifte fungerar och gårdagar kan väljas men framtida datum inte väljas.
- Alla dagar med minst en event för den aktiva hunden har prick i den laddade månaden, även när posterna inte finns i den aktuella UI-pagineringen. Empty, loading och error är åtskilda; network error ger aldrig en tyst falsk tom månad.
- Kontobyte, hundbyte, snabb month-scrub och sen request-respons kan inte visa en annan hunds markeringar eller skriva över vald månad. Add/edit/delete/undo och återöppning visar färska markeringar.
- Kiss visas i gul/amber och Vatten i blå i snabbval, tidslinje och ikonchip; kontrasten är verifierad. Olycka förblir röd och befintliga val, ordning och ett-trycksregistrering fungerar.
- Logga-huvudhandlingens fria ytmarginal mot bottenfliken är minst `tokens.spacing.sm` vid scrollbotten i faktiska AppScreen-layouten för 360×844/140 %/Fler öppet samt sanitytestad vid 375/430 och Fler öppet/stängt. Safe area dubbelkompenseras inte.
- Renderad matris vid 360/375/430 px och normal/140 %-webbstresstest täcker kalender med loggprickar, tom/loading/error, vald dag, historik, snabbval, Olycka, Vatten och bottenmarginal. Efter-val-datumet visas i rätt tidszon.
- Policy-/model-/dataquerytester, `pnpm check`, public `pnpm bundle:ios`, `git diff --check`, queue validation, oberoende QA och Reviewer PASS.
- Native Dynamic Type, fysisk 44×44 pt, VoiceOver/TalkBack, native safe area, faktisk native reduced motion och signerad build rapporteras som NOT TESTABLE om de inte kan köras på enhet.

## Risker och avgränsningar

- En månad kan ha fler än ett API-sidresultat; implementationen måste samla alla sidor innan den märker månaden komplett.
- Queryns lokala månadsgränser måste hantera sommar-/vintertid, UTC-offset och månads-/årsskifte. Datummarkering beräknas från eventets lokala datum på enheten, inte UTC-datumsträngen.
- Fel eller avbruten request får aldrig lämna kvar prickar från förra hunden/månaden.
- RN Web 140 % är bara en webbstresstestproxy och ersätter inte native Dynamic Type.
- UI-09:s toastacceptans och den separata fullskärmsavvikelsen mot rev02 Logga-panelen förblir orörda. FLOW-LOG-01 godkänner bara sitt definierade lokala flöde; inget helskärmsrev02-PASS hävdas.

## Verifieringsunderlag

Spara skärmbilder, responsmatris, kalender-querytest och §14-bedömning i `docs/design/evidence/flow-log-01/VERIFICATION.md`. Jämför Logga mot aktuell `vision_rev02.jpg`, men redovisa fokuserad funktionell acceptans och helskärmsmatchning var för sig. §14 ska fyllas i 1–18 med Ja/Nej/Ej tillämpligt/NOT TESTABLE och motivering.
