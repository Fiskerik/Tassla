# UX-spec — ägarfeedback 2026-10-19 v6

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
