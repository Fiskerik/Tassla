# HOME-NEXT-01 — Hem visar tillgängliga nästa steg

Status: plan v6 — Architect APPROVE och Critic PROCEED; implementation godkänd
Datum: 2026-10-12
Mandat: Erik godkände arbetspaketet i chatten 2026-10-12: Hem ska endast föreslå tränings- och checklistflöden som faktiskt är tillgängliga. Ingen annan backlogg eller generell roadmap är godkänd.

## Användaruppgift

Hundägaren ska kunna öppna Hem och lita på att ett tränings- eller checklistkort leder till ett flöde som går att fortsätta just nu.

## Nuvarande beteende

- `ProductWorkspace` hämtar träningsinnehåll asynkront och väljer första ofärdiga steg.
- `HomeCarousel` visar alltid ett träningskort. Utan steg står det ”Fortsätt träna”, även när inget publicerat program finns.
- `HomeCarousel` visar alltid ett checklistkort, även när granskningsflaggan är av och checklistvyn säger att inga checklistor är publicerade.
- Ett ändrat konto/hundurval kan tillfälligt göra träningsurvalet inaktuellt; workspace har redan en synlig urvalsnyckel och laddningsstatus som ska styra kortet.

## Föreslaget beteende

1. Visa träningskortet endast när `visibleTrainingState === 'ready'` för aktuellt konto/hundurval och ett ej genomfört steg finns. Visa det befintliga stegets namn och destination. Vid laddning, fel, saknat program eller färdigt program visas inget träningskort.
2. Visa checklistkortet endast när `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true`, den befintliga flaggan som gör granskningsflödena synliga. Behåll befintlig tillfällig märkning. Ändra inte innehåll, sparning, migration eller releasepolicy.
3. Behåll befintliga guide- och hälsoplanekort, ordning, layout, komponenter och navigationsdestinationer oförändrade.
4. Lägg inte till nytt tomtillstånd eller ny CTA. När ett kort saknar tillgängligt innehåll återstår övriga befintliga Hemkort.

## UX-tillstånd och feedback

- Träning laddar: inget träningskort; undvik att visa gamla hundens steg.
- Träning redo med nästa steg: befintligt kort med stegtitel och befintlig destination.
- Träning redo utan program/med alla steg genomförda: inget träningskort.
- Träning fel: inget träningskort; befintliga träningsvyn behåller fel och återförsök.
- Reviewflagga av: inget checklistkort; FAQ-kortet behåller nuvarande beteende.
- Reviewflagga på: checklistkortet finns kvar med befintlig ärlig exempelmarkering. Checklistvyns egna laddnings-/felstatus gäller fortsatt.
- Inga skrivningar eller nya sparstatusar tillkommer.

## Tillgänglighet och målbild

Återanvänd befintliga `Card`, etiketter, tillgänglighetsnamn, spacing och foton. Inga nya färger, komponenter, animationer, haptik eller copy introduceras. Kort som inte är tillgängliga tas bort ur listan och därmed även dess fokusordning. Renderad QA jämför Hem vid liten/stor mobilbredd och stor text; saknad rendering markeras NOT TESTABLE.

## Avgränsning

- Endast Home-carouselens tränings- och checklistkort samt skydd mot gammalt träningsurval. FAQ-beteende ingår inte.
- Ingen ändring av träningsprogression, checklist-/FAQ-innehåll eller skärmarna för guider, checklistor, FAQ och hälsoplaner; ingen tidslinje, navigering, datamodell, schema, RLS, notifieringar, analytics eller dependency.
- Ingen live-databas, RLS-prob, TestFlight-build, push, commit eller publicering ingår.

## Acceptanskriterier

1. Ett aktuellt publicerat ofärdigt träningssteg ger ett träningskort med korrekt stegtitel.
2. Laddning, fel, tomt program och helt genomfört program ger inget träningskort.
3. Mismatched konto-/hundurval och byte av hund visar aldrig föregående urvals träningskort medan nytt urval laddas.
4. Ett review-träningsprogram visas fortsatt endast i reviewläge och behåller sin tillfälliga innehållsmarkering.
5. Checklistkort saknas när reviewflaggan är av och visas med befintlig tillfällig markering när flaggan är på. FAQ-kortets beteende är oförändrat.
6. Guide- och planerade hälsokort behåller befintligt beteende och destinations-ID:n.
7. Typkontroll, lint, riktade/fullständiga tester, public iOS-bundle, diffcheck och kövalidering passerar.
8. Renderad Home-evidens omfattar träningskort synligt/dolt och checklist av/på vid 375/430 px och 140 % text. Skärmbilder jämförs med `vision_rev01.jpg` och designreglernas §14-checklista dokumenteras. Native/telefonbeteende påstås inte verifierat.

## Arbetssätt och skrivägarskap

1. Koordinator: äger plan, task, kö, rapport, release-note och sparad evidens i `docs/design/evidence/home-next-01/`.
2. Implementer: äger produkt- och visual-check-filerna `src/features/home/ProductWorkspace.tsx`, `src/features/home/HomeCarousel.tsx`, `src/features/home/README.md`, `tools/visual-check/app.tsx`, `tools/visual-check/build.cjs`, `tools/visual-check/verify.py` och `tools/visual-check/README.md`. Rör inte FAQ-skärmen eller FAQ-innehållet; endast Hemkortens synlighet ändras.
3. QA: äger `tests/knowledge-review-content.test.mjs` och `tests/README.md`, kör testerna och den renderade verifieringen. Renderad QA-evidens skapas i `/tmp/tassla-home-next-01/`; QA rapporterar utfallet men skriver inte produktkod, visual-check-harness eller repo-evidens.
4. Koordinatorn granskar QA-resultatet och kopierar de verifierade skärmbilderna/rapporterna från `/tmp` till taskens repo-evidensmapp.
5. Reviewer: read-only granskning av fryst diff och sparad evidens, separat från Implementer.

## Renderad QA — körbara kommandon

Installera UI-verktygen en gång enligt `tools/visual-check/README.md`. Bygg och verifiera ett läge i taget. Starta servern i en separat terminal och stoppa den innan nästa läge.

Publicläge (flaggan sätts uttryckligen av):

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/home-next-public node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/home-next-public
TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01/public python tools/visual-check/verify.py
```

Reviewläge:

```sh
TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/home-next-review node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/home-next-review
TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01/review python tools/visual-check/verify.py
```

Harnessen uppdateras i paketet så att verifieringen provar träningskort redo/laddar/fel/tomt/färdigt och byte till nytt konto/hundurval, samt checklistkort av/på. Den skriver evidens till `TASSLA_UI_EVIDENCE`. QA granskar skärmbilderna mot `vision_rev01.jpg` och dokumenterar §14-punkterna; 375/430 px och 140 % text ingår. Koordinatorn sparar verifierat resultat i `docs/design/evidence/home-next-01/` efter QA.

## Planreview

- Architect: CHANGES v1 och v2; APPROVE v3–v6. v6:s explicita public- och reviewkommandon samt exakt flaggvillkor godkända.
- Critic: PROCEED WITH CHANGES v1; PROCEED v2–v4; PROCEED WITH CHANGES v5; PROCEED v6. Publicläget är deterministiskt; inga blockerande UX-fynd.
