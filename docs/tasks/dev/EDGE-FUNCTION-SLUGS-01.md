# EDGE-FUNCTION-SLUGS-01 — anropa faktiskt driftsatta URL-namn

Status done (lokal routing/config) · Plan v1 · Bas 52961e5 på fix/mvp-build-feedback · root ensam skrivägare · Risk H (befintligt raderings-/nätverksanrop).

## Mandat och bevarade beslut

Erik korrigerade sitt besked 2026-10-29: funktionsnamnen i dashboarden är delete-account och sync_drive, men faktiska URL:er slutar fortfarande på swift-api och bright-task. Varje funktion har index.ts och handler.ts från motsvarande källmapp. Föregående UI-checkpoint 81cbfc1, senaste etikettjustering 52961e5, buildkonfiguration 601f17d. Endast lokal koppling till dessa exakta befintliga URL-namn ingår.

Fångad Bearer/bodyless POST, online getUser, serverbehörighet, JWT-inställningar, stark separat sync-token, service-roll endast på servern, hårt projekt/url-lås, kvittensvalidering och alla unknown-/retry-/SecureStore-skydd bevaras. Inga nya datafält, persondataändamål, dependencies, migrationer, innehållsregler eller UI. Ingen livekonfiguration, deployment, radering, riktig token, miljöhemlighet eller körning av synken. Konto-runtimeposten förblir blocked.

## Konkret ändring

- Appens enda functions.invoke använder swift-api.
- Runnern accepterar endast exakt https://<godkänt-projekt>.supabase.co/functions/v1/bright-task. Förra sluggen och alla alternativa värdar/protokoll/query/fragment/port/userinfo nekas.
- config.toml ersätter gamla sections med functions.swift-api(verify_jwt=true, entrypoint=./functions/delete-account/index.ts) och functions.bright-task(verify_jwt=false, entrypoint=./functions/sync-drive-article/index.ts). Originalmappar/index/handler behålls utan wrapper eller flytt.
- Aktiva guider visar skillnaden mellan visningsnamn, URL och källmapp; framtida CLI-deployment använder exakt URL-slug och CLI>=1.215. GitHub-variabeln ARTICLE_SYNC_URL behöver motsvara bright-task, befintligt separat projectref-lås behålls. Ingen miljövariabel ändras av oss.

## Relevant underlag och granskning

AGENTS.md, docs/dev/workflow.md, befintlig account-delete och dess README/test, runnerns validate_endpoint/test samt config.toml. Officiell API-källa läst via ansluten GitHub: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/function-configuration.mdx, blob59b4fd82c8e7d496fd2a12c2164e0dea0c2da940. entrypoint är relativ till config.toml och stöds från CLI1.215.0. CLI är inte installerad här; ingen CLIintegration påstås.

Architect gav initialt inga konkreta problem: befintliga handlers är oberoende av rutten, explicit entrypoint undviker onödig mappflytt. Security initial PASS för avgränsad plan, utan nytt persondataändamål; kräver slutdiff/kontroller och kvarstående unknownblockering. Konfigurerad architect/securitymodell gpt-5.6-sol saknas i runtime; gpt-6.1-solmedium används som närmast tillgängliga efterföljare. Ingen Compliance-runda behövs för oförändrat ändamål/lagring/delning; Security granskar konkreta tekniska risker.

## Acceptans och verkliga bevis

1. Installerad SupabaseSDK med syntetisk fetch visar exakt swift-api, POST, fångadBearer och ingen body/selector; befintliga fel/kvittens/pending/ägarbytestester passerar. Tidigare okänd markör skickar ingen ny begäran, även efter namnändring.
2. Python unittest accepterar exakt bright-task på separat pinnat projekt och nekar gammalt namn och URL-varianter. Riktig TOMLparsning verifierar distinkta entries, JWTflaggor och att båda sourcefiler finns.
3. Befintliga handlers oförändrade; serverns syntetiska faktisk-entry-tester kvarstår. RiktadNode/Python, full pnpm check/diff/path-/köaudit, oberoende QA/Reviewer och slutlig Security krävs.
4. Checkpoint gäller lokal routing/config. Verklig gatewayJWT, deployad kodparitet, synkpublicering, tidigare raderingsutfall, native och livekonto är NOT TESTABLE utan avsedd miljö/särskild testidentitet. Den öppna runtimeposten får inte markeras löst.

## Skrivvägar
- `src/features/account/account-delete.ts`
- `tools/sync_drive_articles.py`
- `supabase/config.toml`
- `tests/account-delete.test.mjs`
- `tests/test_drive_articles.py`
- `supabase/functions/delete-account/README.md`
- `supabase/functions/README.md`
- `src/features/account/README.md`
- `docs/content/artiklar/README.md`
- `docs/tasks/dev/ACCOUNT-DELETE-STATUS-01.md`
- `docs/tasks/dev/EDGE-FUNCTION-SLUGS-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`
- `docs/decisions/MASTER-LOG.md`

Nästa: formell planreview, ändra routing/config, riktad säkerhetsregression och checkpoint.

### Implementationscheckpoint

Architect APPROVE v1 och Security initial PASS finns. Endast invoke-sträng, exakt runner-URL och två configsektioner ändrades i produktkod. Befintliga index/handler/auth/storage är oförändrade. Dokumentationen skiljer ägarens uppladdningsbesked från självständigt verifierad runtime. Kvarstående gammal kontoraderingspost är blocked. Två riktade Node-testfiler och åtta Python-tester passerade; full check pågår. 404 läggs uttryckligen till befintlig okänd-statusregression, utan ny retryregel.

### Slutkontroller före Reviewer

`node --experimental-strip-types --test tests/account-delete.test.mjs tests/article-delivery.test.mjs` PASS2/2 filer; `python -m unittest discover -s tests -p test_drive_articles.py` PASS8/8. `CI=1 pnpm check` PASS101/101 och oberoende QA körde egen fullcheck/diff med samma resultat. Deklarerad pathaudit PASS12/12 före loggcloseout. Public iOS-export från slutlig produktkod PASS med `EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false TASSLA_BUILD_CHANNEL=public CI=1 pnpm bundle:ios`; ingen signering/distribution.

Security final PASS utan fynd: exakt routing/projektpinning, bevarad gateway-JWT/egen sync-token, ingen inventory-/ändamålsändring och oförändrade pending-/handlerguards. Oberoende QA PASS för lokal acceptans: installerad SDK, verklig TOMLparsning/entrypointfiler och negativa URLtester, inga paths utanför scope. CLI/Deno-gateway, livekodparitet, gamla begärans utfall och kontoradering/synk i rätt miljö är fortsatt NOT TESTABLE; ACCOUNT-DELETE-STATUS-01 är blocked.

Avgränsad cleanup: originalmappar och handlers behålls; inget wrapper-/konfigurationsramverk behövs. Endast aktiva driftanvisningar får nya slugs; historiska namn står kvar som historik. Frozen Reviewer PASS utan fynd på faktisk slutdiff, API-stöd, guards, scope och bevis. Nästa steg: commit och push till befintlig branch; ingen merge eller deployment gjord.
