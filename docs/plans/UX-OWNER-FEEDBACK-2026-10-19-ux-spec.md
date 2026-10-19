# UX-spec — ägarfeedback 2026-10-19 v7

## A — Rasfält

I både skapa hundprofil och redigera hundprofil ersätts den långa listan med ett kompakt rasfält. Tryck öppnar en modal med sökning och rullbar raslista. Sökningen filtrerar endast serverhämtade BreedOption-objekt; etiketten är presentation, ID är sparat värde. Avbryt/back/stäng ändrar inte valet. Skapaflödet startar utan valt ID. Redigeringsflödet visar befintlig ras även när den saknas från katalogen enligt nuvarande varningskontrakt.

Pickerkomponenten återanvänds mellan båda formulären. Modalens lista är enda vertikala virtualiserade listan i modalytan. Formens övriga scroll och profilens save/readback/kennel/account-lifetime guards behålls.

## B — Övningsblad

Öppnat övningssteg visar den befintliga assets/images/puppy-training.png över innehållet, med tokens för form och spacing. Därefter kommer faktisk ordinal (index + 1), övningens titel, hela instruktionen och befintlig anpassningsnotis/åtgärd. Bilden är dekorativ och göms i tillgänglighetsträdet. Innehåll och progress ändras inte. Hemmets fortsättningskort beskär miniatyren med `cover` kant-i-kant längs kortets vänster-, över- och underkant; kortet klipper bilden inom yttre radier och högertexten behåller tokenpadding.

## C — PDF

Knappens avsedda namn är Visa PDF. Ett tryck ska öppna PDF:en, utan att direkt dela. Dela och Stäng väljs efter att dokumentet visas. Ändra inte snapshots, readiness, PDF-fält eller vilken data som väljs. Plattformarnas faktiska kontroller, extern Android-hantering, unsupported state och cachelivscykel saknar ännu godkänt kontrakt; ingen kod ändras innan de är beslutade och oberoende granskade.

## Bild 2 — hundval

Ingen hundväljarskärm finns i aktuell produktkod. Kontot kan ha en hund och profildata innehåller inte foto. Screenshot-önskemålet kräver därför ett tydligt scopebeslut om hundantal och bildkälla innan UI/data ändras.

## Visuell verifiering och status

UI-bedömning följer docs/design-rules.md §14. Syntetiska RN Web-skärmbilder styrker endast sina vyer. Den saknade vision_rev02.jpg gör exakt sida-vid-sida-panelbedömning NOT TESTABLE; webbproxy styrker inte native Dynamic Type eller VoiceOver. Ingen visuell helhetsacceptans påstås utifrån fungerande interaktion ensam.

## Ägarens efterföljande roadmap — statusbild 2026-10-19

Det här avsnittet lägger in arbetsordningen från ägarens bifogade statusbild.

- **Paket 3 — Sök i Kunskap:** visa publicerade artiklar som redan filtrerats för den aktiva hunden. Träffar, tomt resultat, laddning och fel ska ha tydliga lägen. Behåll befintlig åldersfiltrering och publiceringsregler.
- **Paket 4 — Dra för att uppdatera:** inför på Hem och Logg, samordnat med automatisk uppdatering. Skydda vyn mot gamla svar efter byte av hund eller konto.
- **Paket 5 — Tom-, laddnings- och felåterkoppling:** börja med Hem och Logg och fortsätt sedan med Kunskap och Träning. Fel ska ha ett eget synligt läge och okänd data ska inte visas som noll.
- Statusbilden anger att Paket 2a och 2b är implementerade, committade och pushade. VoiceOver, större systemtext, reducerad rörelse och tangentbord där relevant återstår som manuella iPhone-kontroller; de blockerar inte start av Paket 3.
- Övergångsanimationen mellan huvudflikarna är ett separat, blockerat arbete i lokal ocommittad ändring. Den väntar på visuell kontroll och kontroll av reducerad rörelse.

Arbetsföljd enligt statusbilden: Paket 2a/2b → Paket 3 → Paket 4 → Paket 5. Paketens exakta task- och köposter fastställs när respektive paket tas upp.
