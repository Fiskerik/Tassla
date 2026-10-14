# Hemmets åldersremsa och ungefärliga livsfas — lokal rendergranskning

Datum: 2026-10-14 · Bas: `56bf2246e9fa89613421c9304598daf46c2bf4b9` · Fixture: syntetisk hund Luna · Status: v4.3 Dog Expert QA PASS och Reviewer PASS.

## Färsk v4.3 träning med okänd ålder

Efter Reviewer-fyndet byggdes aktuell kod på nytt med `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/home-age-v43 node tools/visual-check/build.cjs`. Chromium öppnade produktionskomponenten `PublishedTrainingScreen` via harnessen med saknat födelsedatum, `today=2026-10-14` och en syntetisk ofärdig sparad progression.

- [Rekommenderat, ålder okänd](training-unknown-age-recommendations.png): neutral text säger att åldersbaserade program visas när födelsedatum finns; sparad progression hänvisas till Mina. Progressionen har en separat `FORTSÄTT DÄR NI VAR`-yta och visas inte under `Passar just nu`.
- [Mina efter knapptryck](training-unknown-age-mine.png): `Visa mina program` öppnar fliken Mina; samma ofärdiga program och markerade steg finns kvar.
- Rendern var 375×876 inklusive 32 pt syntetisk träningsbanner ovanför 844 pt appyta. Browsern rapporterade inga JavaScript-fel. Syntetisk fixture bevisar presentation/interaktion, inte backend-readback eller nativebeteende.

## Färsk v4.2 render efter Reviewer-fynd

Efter tillgänglighetskorrigeringen byggdes den aktuella produktionskomponenten på nytt med `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/home-age-v42 node tools/visual-check/build.cjs`. Chromium tog därefter om samtliga 14 datum-/viewportfixturer från bygget den 14 oktober. Alla skärmbilder här är från den ombyggda produktionsvyn och använder syntetiska hunddata.

- Datum i dessa bilder är injicerat via `today`; födelsedagar och ålderstext härleds av samma Home-/produktionshjälpare som appen använder.
- De 14 bilderna täcker dag 140 vid 375×844, 430×844, 375×667 och 140 % textproxy; dag 141; första årsdag; dagen efter årsdag; 29 februari-årsdag 2025-02-28 och dagen efter; 6 och 24 månader; ogiltigt, framtida och saknat födelsedatum.
- Browser-renderingen rapporterade inga JavaScript-fel. Jag inspekterade dessutom dag-140-rendern vid 375×844 visuellt.
- Tillgänglighetsträdet inspekterades i webbrendern efter korrigeringen: omslutande `home-week-strip` har inget `aria-label`, och cellen `home-week-20` behåller `20 veckor, aktuell ålder`. Native VoiceOver/TalkBack är inte verifierat.
- Filnamn och fixturmatris listas nedan. Native iOS/Android-beteende verifieras inte av webbrenderingen.

## Renderade datum och vyer

Produktionskomponenten `HomeScreen` byggdes med den lokala React Native Web-harnessen. Samma injicerade `today` användes av hundidentitet, åldersremsa, fas och aktiva `Just nu`-kortet. Skärmbilderna togs med Chromium vid 375×844; storleksjämförelser vid 430×844, 375×667 och 140 % CSS-zoom som webbaserad textskalningsproxy.

- [Dag 140: 20 veckor](age-week20-375x844.png), [430×844](age-week20-430x844.png), [375×667](age-week20-375x667.png), [140 % webzoom](age-week20-140pct-webzoom.png).
- [Dag 141: 4 kalendermånader i denna datumfixtur](age-day141-375x844.png).
- [Första årsdag: 12 månader](age-first-birthday-375x844.png); [dagen efter: 1 år](age-after-birthday-375x844.png).
- [29 februari-födelsedatum på klampad årsdag 28 februari](age-leap-clamped-birthday-375x844.png); [dagen efter](age-leap-day-after-375x844.png).
- [6 månader: UNGHUND](age-six-months-375x844.png); [24 månader: VUXEN](age-two-years-375x844.png).
- [Ogiltigt](age-invalid-375x844.png), [framtida](age-future-375x844.png) och [saknat](age-missing-375x844.png) födelsedatum: ingen beräknad ålder, remsa eller fas.

140 % är en CSS-zoomproxy, inte native Dynamic Type. Den gör att sidan behöver vertikal scrollning; den fasta bottenmenyn ligger kvar, och innehåll nedanför första viewporten måste nås genom scroll. Native safe area, gesture arbitration och fysisk scroll-/VoiceOver-användning är `NOT TESTABLE` här.

## Designregelverk §14

1. **Ja** — `Just nu` behåller en tydlig destinationshandling.
2. **Ja** — befintliga destinationer behåller sin inbördes vikt.
3. **Ej tillämpligt** — ingen radering.
4. **Ej tillämpligt för denna skärmändring** — Hem-kompositionsregeln gäller separat befintliga rader.
5. **Ja för renderade webviewporter** — fyra viewport-/skalningsbilder finns; native safe area är `NOT TESTABLE`.
6. **Ja** — befintliga Home-komponenter och delade design tokens används.
7. **Ja** — befintliga Ionicons används.
8. **Ja för lokal render** — varma ytor och befintliga blå/gröna/lila destinationer behålls.
9. **Ja** — värde, enhet, fasetikett och markör beskriver hundens ålder; remsan byter enhet enligt datumkontraktet.
10. **Ja** — inga nya statusbadges eller obekräftade bockar.
11. **Ja** — fasen benämns uttryckligen ungefärlig.
12. **Ja** — ålder visas som ett heltal med en svensk enhet.
13. **Ja för avgränsad ändring** — ålder/fas ligger i befintlig identitet och metadata i `Just nu`.
14. **Ja för denna datumslice** — åldersgränser, skottårsgräns samt saknat/ogiltigt/framtida datum renderades. Home loading/error-ytor ändrades inte och omrenderades inte.
15. **Ja för webbrendern / native NOT TESTABLE** — föräldern grupperar inte remsan och saknar ersättningsetikett; varje cell behåller en egen tal-/enhets-/aktuell-etikett. Browserzoom granskades. Native VoiceOver/TalkBack och Dynamic Type verifierades inte.
16. **Delvis, avsiktlig specifikationsskillnad** — rev02-referensen visar bara veckor. Denna beställning kräver dessutom månader, år och ungefärlig fas; övrig skärmkomposition ändrades inte.
17. **Ja** — Hem är aktiv huvudflik i fixturen.
18. **Ja för fixture** — hundnamn, ras och märkt standardporträtt visas; detta är syntetisk data och genererad bild, inte en verklig profilbild.

## Kontroller och gränser

- `pnpm typecheck`: PASS.
- Scoped ESLint för ändrade TypeScript-/TSX-filer: PASS.
- `git diff --check`: PASS.
- `python3 tools/dev_flow.py validate`: PASS.
- Nytt React Native Web-bygge och 14 färska Chromium-renders med injicerade datum efter a11y-korrigeringen: PASS.
- v4.3 RN Web-bygge och två manuella Chromium-renderingar av unknown-age Training/Mina, inklusive klickväg: PASS.
- Oberoende Dog Expert QA PASS 2026-10-14 för okänd-ålder-presentation, bevarad Mina-progress, datumgränser och ungefärliga faser; QA ändrade inga filer och körde inga tester eller byggen.
- Oberoende Reviewer PASS 2026-10-14 för v4.3 source, okänd-ålder-presentation, per-cell accessibility och båda renderbilderna. Reviewer verifierade att plan, queue och renderingsrapport är synkade; inga tester/builds kördes.
- Inga automatiska tester kördes eller lades till.
- Kalendergränser verifierades med production-helper-fixturer och render; inget unit-testresultat påstås.
- Native iOS/Android, fysisk Dynamic Type, safe area och VoiceOver/TalkBack är `NOT TESTABLE` här.
