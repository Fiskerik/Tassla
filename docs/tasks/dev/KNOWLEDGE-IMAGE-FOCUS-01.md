# KNOWLEDGE-IMAGE-FOCUS-01 — granska fokus för alla artikelbilder

**Status:** planned · **Planversion:** v1 · **Risk:** M

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
- UI Critic och oberoende QA av hela mappinglistan och skärmbilderna.

Katalogsnapshot eller TestFlight-innehåll som inte finns lokalt får inte gissas; de fallen stannar **NOT TESTABLE** tills sanerad evidens finns.
