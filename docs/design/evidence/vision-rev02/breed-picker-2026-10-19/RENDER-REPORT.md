# Rasväljare — renderings- och kontrollrapport

**Status:** A implementerad lokalt; ägarens visuella uppföljning verifierad i public/review RN Web med fokuserad QA PASS och oberoende Reviewer PASS. Native iOS/Android-rendering återstår.
**Datum:** 2026-10-19
**Avgränsning:** UX-BREED-PICKER-2026-10-19, plan/spec v12; den separata visuella uppföljningen är beskriven i shared plan/spec v14.
**Visuell referens:** ägarens Bild 1 i konversationen, där rasnamnen visas som en lång lista. Den nya renderingen använder ett enda sökbart rasfält och visar en begränsad dropdown direkt under samma fält.

## Resultat

- Skapa hundprofil och redigera hundprofil återanvänder `SearchableBreedPicker`.
- Stängt fält visar vald ras eller platshållaren. Fokus öppnar dropdownen och tömmer endast sökutkastet; befintligt ras-ID hålls kvar tills ett nytt katalogalternativ väljs.
- Skrivning i samma fält filtrerar lokalt. Rensa-knappen ligger i samma fält. Stängning med Escape eller tryck utanför återställer den sparade rasen och kastar bort sökutkastet.
- Dropdownen är begränsad i höjd och kan bläddras. Alternativ har minst 44 pt träffhöjd och långa namn radbryts.
- Valt alternativ sparar bara befintligt `BreedOption.id`. Nyregistrering startar utan förvalt ras och fortsätt-knappen kräver ett giltigt katalog-ID.
- Inga nya tester eller testsviter lades till eller kördes. Två befintliga assertioner uppdaterades för den nya interaktionen och det explicita rasvalet.

## Renderbevis

Chromium/Playwright public- och review-renderingar gjordes vid 375×844, 430×844 och 375×667. Reviewbildernas skärmhöjd inkluderar 32 px granskningsbanner. Totalt dokumentbreddsmått matchade viewportbredden för alla sex storlekar; inga browser page errors uppstod. Dropdownens övre kant låg direkt mot rasfältet. Största uppmätta dropdownhöjd var 263 px. En alternativrad mätte 283×44 px vid 375 px bredd.

Interaktionslägen täcker tomt/stängt, öppet, sökning med accentokänslig träff, ingen träff, rensa sökning, val, sökning från förvalt ras, Escape och utanförtryck. Onboardingens skapavy och profilredigering renderades separat med den produktionsdelade komponenten. En 140 % textproxy renderades. Reduced motion var aktiverat i webbläsaren.

- Public onboarding: [öppet rasfält](public/profile-create-open-375x844.png), [valt ras](public/profile-create-selected-375x844.png)
- Public profilredigering: [öppet rasfält](public/profile-edit-open-375x844.png), [stängt efter sökning](public/profile-edit-dismissed-375x844.png)
- Dropdown och textproxy: [375×667](public/open-375x667.png), [140 % text](public/open-375x844-text-140.png), [ingen träff](public/no-match-375x844.png), [sökning från sparat ras](public/prefilled-search-375x844.png)
- Motsvarande skärmar och tillstånd finns i `review/`.
- Full mätning per render finns i [RENDER-REPORT.json](RENDER-REPORT.json).

### Visuell korrigering efter feedback

Efter ägarens visuella avslag renderas sökfältet som enradig TextInput i stället för en multiline-textarea. Texten har transparent bakgrund och ingen egen kant; den yttre gröna ramen äger kontrollens yta, kant och klippning. Androids standardunderstrykning är uttryckligen avstängd. Public/review-bilder av det öppna fältet fångades om vid 375×844, 430×844 och 375×667; skapa- och redigeringsvyer fångades vid 375×844. 140 % textproxy och 375×420 kortvy fångades också om. I kortvyn scrollades formuläret så fältet och de tre fixturealternativen syns samtidigt; detta är webblayout, inte ett prov med enhetens tangentbord. Dropdownen börjar direkt under kontrollen. Pilen är en tillgänglig 44×44-knapp som fokuserar samma sökfält, öppnar/stänger listan och har uppdaterad etikett för läget. RN Web-bilderna verifierar inte native iOS/Android-rendering eller beteende med enhetens tangentbord.

I produktionsvyn hämtar `ProfileScreen` och `EditDogProfileScreen` raser via `fetchBreeds`, som läser `id,name` från Supabase-tabellen `breeds`. Denna syntetiska RN Web-rendering använder fixturealternativ och läser ingen databas.

## Kontroller

| Kontroll | Resultat |
|---|---|
| `pnpm typecheck` | PASS |
| ESLint på `SearchableBreedPicker.tsx`, `ProfileScreen.tsx`, `EditDogProfileScreen.tsx` | PASS |
| Planens ESLint-kommando inklusive `tools/visual-check/app.tsx` | 6 befintliga React Hooks-fel och 5 varningar i fixturefilen; produktionskomponenterna passerar |
| Public RN Web build | PASS |
| Review RN Web build | PASS |
| Chromium/Playwright: 28 renderlägen, inga page errors, ingen horisontell overflow | PASS |
| `git diff --check` | PASS; Git rapporterade endast LF→CRLF-normalisering för `ProfileScreen.tsx` |
| `python tools/dev_flow.py validate` | PASS |
| Testsvit | EJ KÖRD enligt plan |
| Native VoiceOver, Dynamic Type, Android-back och skärmtangentbord | NOT TESTABLE i RN Web |

## Designregler §14 — komponentavgränsad bedömning

| # | Bedömning | Notering |
|---|---|---|
| 1 | Ja | Fältet har tydlig nästa handling: välj i dropdownen eller sök. |
| 2 | Ej tillämpligt | Inga jämställda primärhandlingar i pickern. |
| 3 | Ej tillämpligt | Ingen destruktiv handling. |
| 4 | Ej tillämpligt | Inte Hem-rad eller Hem-hantering. |
| 5 | Ja | Tokenavstånd, kort vy och begränsad dropdown kontrollerades i webbrender. |
| 6 | Ja | Komponent och avstånd använder projektets tokens. |
| 7 | Ja | Ikoner använder Ionicons som i övriga appen. |
| 8 | Ej fullskärmsgranskad | Full skärms färgfördelning och kontrast ingår inte i isolerad pickergranskning. |
| 9 | Ja | Chevron öppnar listan; textfältet både söker och visar aktuellt val. |
| 10 | Ja | Endast valt ras får markerad bock. |
| 11 | Ej tillämpligt | Pickern har inga banners eller uppmuntringar. |
| 12 | Ja | Svensk och vardaglig copy. |
| 13 | Ej fullskärmsgranskad | Hundbild, metadatahierarki och helskärmsbildspråk ligger utanför denna komponent. |
| 14 | Delvis | Stängt, öppet, valt, sökträff, tomt sökresultat och återställning renderades. Katalogens nätverksladdning/fel visas av föräldraformuläret och verifieras inte i den här picker-fixturen. |
| 15 | Delvis | 44 pt träffyta, roller och selected/expanded-semantik finns; 140 % webbtextproxy kontrollerad. Native VoiceOver/Dynamic Type och tangentbord är NOT TESTABLE. |
| 16 | Ej fullskärmsgranskad | Picker och båda formulärens integrering renderades; detta är inte ett godkännande av full rev02-panelens visuella likhet. |
| 17 | Ej tillämpligt | Navigation och tillbakaresor ändras inte. |
| 18 | Ej tillämpligt | Personligt hundporträtt eller hundnamn ingår inte i rasväljaren. |

**Kvar:** native iOS/Android-rendering och tangentbordsbeteende är NOT TESTABLE i RN Web. Fokuserad QA och oberoende Reviewer PASS. Inga ändringar är committade eller pushade.
