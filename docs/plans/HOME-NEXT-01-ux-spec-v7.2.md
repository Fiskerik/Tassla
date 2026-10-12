# HOME-NEXT-01 — v7.2 korrigeringsplan för Hem mot vision_rev02

Status: APPROVED — Architect APPROVE och Critic PROCEED mottagna 2026-10-12.
Datum: 2026-10-12.
Bas: den godkända UX-specifikationen v7.1 i docs/plans/HOME-NEXT-01-ux-spec-v7.md. Alla v7.1-krav fortsätter gälla utom de delar som uttryckligen förfinas här.

## Varför korrigeringen behövs

QA lämnade v7.1 UNDERKÄND enligt designregler §14:

- Punkt 5: avstånd mellan sektioner är 12 i stället för regelns 24.
- Punkt 6: hundplatshållaren har råa mått 82 × 92.
- Punkt 10: varje loggrad upprepar etiketten ”Ägarregistrerat”.
- Punkt 16: den långa logglistan skjuter nästa träningssteg, dagens plan och genvägarna under den fasta bottenmenyn.
- Punkt 17 och 18 godkändes.
- pnpm check hade 38 pass och ett gammalt Home-påstående i tests/planned-health.test.mjs.
- Home-verifieraren föll på aria-selected trots att manuell navigation och visuell aktiv markering fungerade.
- Hem-README:n beskriver fortfarande den äldre sexdestinationsmenyn.

Erik har godkänt att scope utökas och att Hem rättas mot vision_rev02. Den här planen ändrar bara Home-presentation, dess semantik/verifiering och dokumentation inom de angivna sökvägarna.

## Korrigerat Home-kontrakt

1. Behåll den v7.1-godkända hierarkin: vänsterställd hälsning med hundnamn och ålder, veckoremsa, ”Just nu”, dagens källgrupper och tre handlingar. Vecka och innehåll fortsätter komma från befintliga källor. Den befintliga vänliga hundsilhuetten kvarstår eftersom profilen saknar ägarfoto.
2. Matcha vertikal rytm med tokens.layout.sectionGap (24) mellan huvudsektioner. Samla de tre Idag-grupperna i en befintlig Card; använd tokens.layout.listGap internt mellan grupperna. Behåll spacing-skalan och använd inga råa mått eller färger. Hundplatshållarens storlek ska komma från ett befintligt storlekstoken.
3. Gör ”Just nu” lika kompakt som målbilden: en rubrik och relevant ingress på högst två rader i befintligt kort. Visa inte innehållstiteln som en extra rad ovanför ingressen; bevara titel i kortets tillgängliga etikett och befintliga destination. Lägg inte till en extra förklaringsrad. Träningsfallbacken behåller sanningsenlig status och reviewmarkering.
4. ”Loggat idag” visar endast poster från den befintliga valploggen, högst den senaste logghändelsen utan källetikett eller extra detaljtext. Utförd hälsohistorik ligger kvar i Hälsa och ska inte länkas till Logg. En tertiary-handling ”Visa dagens logg” ligger inline med gruppens rubrik och öppnar Logg; alla valploggsposter finns där. Dagens träningssteg och plan visas var för sig med befintliga källor. Gruppkontexten räcker: visa inte redundanta metadata ”Tillgänglig handling” eller ”Planerat”. Skapa inte completion-status eller daglig räknare.
5. För en normal dag med minst fem logghändelser, ett tillgängligt träningssteg och en plan idag ska alla tre gruppinnehåll, ”Visa dagens logg” och de tre Logga/Träna/Kunskap-handlingarna rymmas ovanför bottenmenyn på första skärmen vid 375 × 844 och 430 × 844. Full logghistorik nås via Logg.
6. Behåll femfliksmenyn och More-åtkomsten från v7.1. Den aktiva fliken ska exponeras som vald för hjälpmedel och webbrendering. Behåll React Native accessibilityState.selected; korrigera vid behov webbmappningen och verifiera den faktiska valda fliken i public och review.
7. Dokumentera den aktuella menyn i Home README: Hem, Logg, Träning, Kunskap, Mer. Hälsa, Tassla-pass, profil och inställningar ligger under Mer; swipe omfattar endast de fem huvudflikarna.
8. Uppdatera den planerade-hälsa-regressionen så den beskriver det nya Home-kontraktet: Home visar planens händelsetid och öppnar Hälsa vid hälsohistorikfel; Health behåller separat, tydligt märkt påminnelsetid. Ta bort endast statiska Home-assertioner som hör till borttagen carousel/retry-yta. Bevara kontroller av datakontrakt, tidsfält, Hälsa-vyn och komponenter som fortfarande används.
9. FAQ, checklistor, public/review-gating, datakällor, write-paths, schema och träningsprogression från v7.1 lämnas intakta.

## Acceptans

- Home matchar målbildens ordning och låter åldersremsa, ”Just nu”, ”Idag”, en gemensam Card med dess tre grupper, inline-länken ”Visa dagens logg” och de tre kompakta handlingarna synas tillsammans ovanför bottenmenyn vid 375 × 844 och 430 × 844 i angivet normalt dataläge.
- Hemmets logglista ersätts av högst en valploggrad och en inline-länk ”Visa dagens logg”; alla valploggsposter går att nå i Logg. Utförd hälsohistorik ligger kvar i Hälsa.
- Huvudsektioner använder 24-tokenen, Today-grupperna är samlade i en Card, QuickLogTile använder sin kompakta variant, hundplatshållaren använder ett befintligt storlekstoken, och Home visar inga redundanta status-/källetiketter.
- Public och review verifierar korrekt vald flik. Reviewinnehåll förblir frånvarande i public; reviewdestinationen är befintlig Träning.
- Dagens plan visar händelsetid separat från påminnelsetid. Hälsa behåller sin påminnelsetid; hälsohistorikfel i Home leder till Hälsa.
- Home README överensstämmer med den delade femfliksmenyn.
- Fullcheck, fokuserade tester, public iOS-export, diffcheck, queue validation och §14-renderad QA passerar. QA dokumenterar varje punkt 1–18 och jämför public/review-rendering med vision_rev02.jpg vid 375/430 px samt 140 % text och reducerad rörelse. Varje Nej blockerar.

## Ägarskap och skrivsökvägar

**Implementer**
- src/features/home/HomeScreen.tsx
- src/features/home/ProductWorkspace.tsx endast om aktiv Home-flikens semantik behöver mappas
- src/features/home/README.md
- src/components/ui/BottomNav.tsx
- tools/visual-check/app.tsx
- tools/visual-check/verify.py
- tools/visual-check/README.md

**QA**
- tests/home-today.test.mjs
- tests/main-navigation.test.mjs
- tests/knowledge-review-content.test.mjs
- tests/planned-health.test.mjs
- tests/README.md
- Public/review evidence under /tmp/tassla-home-next-01-v7.2/{public,review}

**Koordinator**
- this corrective plan
- docs/tasks/dev/HOME-NEXT-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HOME-NEXT-01.md
- docs/design/evidence/home-next-01/v7.2/

**Reviewer:** read-only on the frozen diff and saved evidence. FAQ/checklist screens remain protected.

## Verifiering

Focused command:
node --experimental-strip-types --test tests/home-today.test.mjs tests/main-navigation.test.mjs tests/knowledge-review-content.test.mjs tests/planned-health.test.mjs

Full check: pnpm check.

Public iOS export:
__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-home-next-01-v7.2/expo-home TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios

Also run git diff --check, python tools/dev_flow.py validate, public/review harness builds, and both Home-scoped visual verifiers. The visual verifier checks that the named groups, inline log link and compact action tiles end above the fixed bottom navigation at 375/430 px and that the active tab is selected. No phone, database, commit, push, release, or deployment check is added.

## Reviewstatus

- v7.1 Architect APPROVE and Critic PROCEED remain historical decisions for the v7.1 text only.
- v7.2 received fresh Architect APPROVE and Critic PROCEED on 2026-10-12; implementation may proceed within the assigned paths.
- No v7.2 code change may start before both decisions are recorded.


### Reviewfynd inarbetade efter Architect/Critic CHANGES

- Dagsgrupperna är uttryckligen en gemensam Card; den extra förklaringsraden tas bort, Visa dagens logg placeras inline och QuickLogTile använder befintlig kompakt variant.
- ”Loggat idag” väljer endast vanliga valploggsposter. Utförd hälsohistorik har fortsatt destination Hälsa och räknas inte som valplogg.
- Planerat idag- och träningsgruppernas egna rubriker ersätter redundanta metadata ”Planerat” och ”Tillgänglig handling”.
- QA-evidensen ägs av koordinatorn under docs/design/evidence/home-next-01/v7.2/; task och queue ska ange samma katalog.
