# KNOWLEDGE-IMAGE-FOCUS-01 — granska fokus för alla artikelbilder

**Status:** done · **Planversion:** v2 · **Risk:** M

## Mål

Verifiera och vid behov korrigera beskärningen för varje artikel-/guidebild som visas i Kunskap, så att hunden eller artikelns faktiska motiv syns tydligt i kort, karusell och läsvy.

Ägarens iPhone-bilder visar äldre UI. Efter implementationen av bildfokus granskar den lokala RN Web-rendern hunden tydligt för featured-, småkort- och läsarbilder; befintlig kontroll rapporterar 10/10 på en liten syntetisk fixture. UI Critic bedömde ändå att det saknas täckning för alla publicerade `(content_id, version, slug)` och alla fallbacks. TestFlight-/native-utfall efter ändringen är **NOT TESTABLE** utan ny capture.

## Omfattning

- Inventera en sanerad katalogsnapshot över aktuella publicerade och review-guider. Ta med alla versionerade poster som matchar `KNOWLEDGE_IMAGE_BY_GUIDE_VERSION`, de tre slug-överskrivningarna och samtliga guideidentiteter som använder de tre delade editorial-fallbackbilderna.
- Dokumentera för varje identitet bildkälla, fokuspunkt/zoom och motivets position i source-asset. En katalogsnapshot innehåller inga ägar-ID:n, hundnamn eller persondata.
- Granska varje mapping i featured 16:9, små-/relaterade 4:3-kort och fullbredds 16:9-läsarbild vid 375×844 och 430×844; granska också sidflöde/klippning vid 375×667.
- Ändra bara explicita bildmappningar/fokuspunkter eller visningslayout när evidensen visar att motivet kapas eller blir en suddig bakgrund. Behåll generisk artikelcopy och rekommendationslogik.
- Spara per-mapping resultat och färska lokala skärmbilder. Efter ny build krävs separat iPhone/TestFlight-capture innan native-fix kan kallas verifierad.

## Skrivvägar

- `docs/tasks/dev/KNOWLEDGE-IMAGE-FOCUS-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `src/features/knowledge/editorial-image-assignment.ts`
- `src/features/knowledge/knowledge-image-layout.ts`
- `src/features/knowledge/KnowledgeImage.tsx`
- `src/features/knowledge/README.md`
- `tests/knowledge-image-focus.test.mjs`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `docs/design/evidence/knowledge-image-focus-2026-10-25/`

## Acceptans

| Kriterium | Kontroll |
|---|---|
| Varje tillgänglig katalogidentitet och varje direkt-/fallback-mapping finns med i inventeringen | Sanerad katalogsnapshot + mappingtabell; okända produktionsidentiteter markeras tydligt som saknade |
| Varje bild behåller motivet i alla tre cropformat och godkända viewportar | RN Web-bilder och per-mapping resultat vid 375/430×844 samt 375×667 |
| Ingen bildram reduceras till en oavsiktligt suddig bakgrund eller klipper bort huvudmotivet | UI Critic granskar alla captures; fokustest verifierar source→frame-layout |
| Innehållstext, ägarens rekommendationsregler och versionerade publiceringsstatusar är oförändrade | Riktade tester/diff review |
| Native/TestFlight-påståenden är begränsade till efterändringscapture | Rapporten märker saknad iPhone-evidens **NOT TESTABLE** |

## Verifiering

- `node --experimental-strip-types --test tests/knowledge-image-focus.test.mjs`
- RN Web render: varje inventerad identitet, alla tre cropformat, 375/430 och kort 375×667.
- `CI=1 pnpm check`
- `python -X utf8 tools/dev_flow.py validate`
- `git diff --check`

UI Critic- och QA-verdict samt öppnade bildbevis sparas i `docs/design/evidence/knowledge-image-focus-2026-10-25/review/REVIEWS.md`.
- UI Critic och oberoende QA av hela mappinglistan och skärmbilderna.

Katalogsnapshot eller TestFlight-innehåll som inte finns lokalt får inte gissas; de fallen stannar **NOT TESTABLE** tills sanerad evidens finns.

## Plan v2 — komplett lokal mappingaudit

Den lokala koden innehåller inget separat live-katalogexport. V2 använder därför en sanerad auditinventering med sex publicerade bundle-versioner, tre återställda artikel-slugs, reviewartiklar/-guider, befintliga fixtureidentiteter och explicita probes för alla tre delade fallbackbilderna. Den inventerar 24 identiteter mot sju bildassets. Okända live-ID:n för återställda Drive-artiklar och hela den driftsatta katalogen förblir uttryckligen **NOT TESTABLE**; inga produktionsposter eller hundnamn gissas.

Auditvyn ligger enbart i `tools/visual-check/vision-r02-home-panels-app.tsx`. Den renderar produktionskomponenten `KnowledgeImage` med befintlig mapping/fokuslogik för Featured 16:9, relaterad 4:3 och läsarbild 16:9. En JSON-inventering laddas som syntetiskt testunderlag. Ingen route läggs till i appen och ingen publicerad artikel, asset, rekommendation, status eller fokuspunkt ändras om den visuella evidensen inte visar ett konkret fel.

`tests/knowledge-image-focus.test.mjs` ska säkerställa att alla lokalt publicerade artikelversioner och återställda slugs finns med, varje nyckel i `KNOWLEDGE_IMAGE_BY_GUIDE_VERSION`, `GUIDE_IMAGE_FOCUS_BY_VERSION` och `REVIEW_IMAGE_BY_GUIDE_VERSION` täcks, samtliga källassets finns och varje inventerad ansiktsruta ryms inom båda beskärningarna enligt produktionslayoutfunktionen. Playwright-verifieraren ska rendera samtliga mappingar vid 375×844 och 430×844, kort viewport 375×667 samt spara en kontaktkarta och per-mapping resultat/skärmbilder. UI Critic och oberoende QA granskar faktiskt öppnade captures; Reviewer granskar därefter slutlig diff, testbevis och begränsningar.

Tekniska begränsningar: ingen ny dependency eller produktionskod krävs. TestFlight/native-beskärning och saknad live-katalog kan inte godkännas av denna RN Web-audit. De markeras **NOT TESTABLE** även om samtliga lokala kontroller passerar.
