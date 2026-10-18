# UIUX-REVAMP-R4C-PUBLISHED-FAQ-01 — public FAQ med publicerat källunderlag

Plan v7 amendment · 2026-10-18 · Architect APPROVE and Critic PROCEED received. v6 approval/evidence remains for the unchanged core FAQ scope.
Beroenden: R3c/R4a/R4b lokalt stängda.
Risk: M — ny public read-surface i Kunskap och ändrade läs-/fel-/tomtillstånd. Ingen ny datamodell, mutation, publicering eller ägar-/RLS-gräns.

## Mål och beslut

Gör FAQ-fliken användbar i public mode genom att presentera FAQ-format för två redan ägar- och Dog Expert-godkända, publicerbara versioner i `docs/content/mvp-content-bundle-v1.json`: `handling-guide` v1 (`62000000-0000-4000-8000-000000000004`) och `being-alone-guide` v1 (`62000000-0000-4000-8000-000000000006`). Svaret är exakt den befintliga publicerade versionens body och källista; inga nya sakpåståenden eller content-versioner skapas. De enda frågetexterna och mappningarna i denna slice är: “Hur kan jag göra vardaglig hantering trygg och frivillig för valpen?” → `handling-guide` v1 (`62000000-0000-4000-8000-000000000004`); “Hur kan jag hjälpa valpen att vara själv en liten stund?” → `being-alone-guide` v1 (`62000000-0000-4000-8000-000000000006`). Dog Expert PASS och Critic PROCEED krävs för exakt dessa två formuleringar före kod.

FAQ använder en separat, exact-version `knowledge_faq` selector surface och dess explicita grants. Innehåll måste komma från befintlig loader som filtrerar `status=published` och från godkänd målgrupps-/åldersgräns; äldre eller draft versioner får aldrig falla igenom. Public mode kan visa de två exemplen bara när respektive befintlig version matchar aktuell hunds nuvarande veckobaserade selector. Paketets åldersfönster (`handling-guide`: 13–16 veckor; `being-alone-guide`: 27–52 veckor) är redaktionella relevansfilter för publicerat innehåll. De är inte utvecklingsmilstolpar, färdighetskrav eller råd om när en hund förväntas klara en färdighet. Vi härleder inte att hunden nyligen flyttat hem. Kontexten `Före hemkomst` och `Första dagarna hemma` fortsätter därför vara review-exempel endast; public mode visar inte de syntetiska posterna. FAQ under `Efter ålder` är den enda public kontexten i denna slice.

Källtext och URLs kommer från `content_versions.sources` för den valda publicerade versionen och renderas i FAQ-svaret. Källor öppnas efter användartryck via befintlig säker HTTPS-hjälpare, med felåterkoppling. Public mode skiljer loading, fel med retry, saknat datum/unknown och bekräftat tomt innehåll. Review mode behåller endast sina befintliga syntetiska FAQ med sin tydliga tillfällig-exempel-granskningstext och blandar dem aldrig med publicerat material. `ProductWorkspace` fortsätter sin befintliga enda publicerade innehållskatalogläsning för de övriga publicerade ytorna i båda bygglägena; den är inte FAQ-specifik. `FAQScreen` ignorerar den valda publika FAQ-selectionen i reviewgrenen, som endast renderar `REVIEW_FAQ`; review-FAQ gör ingen egen FAQ-förfrågan, skrivning eller publicering. Ingen implicit publicering sker; befintliga versioner måste redan vara `published` i den valda Supabase-miljön.

FAQ question mapping och exact version grants ändrar inte Home/Knowledge/Training selection, content bodies, publication status, R4b-periodresolver eller de tre review-kontexternas utkast. Den delade `Tabs`-komponenten visar den initialt aktiva/fokuserade fliken helt inom sin horisontella viewport även vid stor text; normal svepning och användarens valda tabbordning bevaras. Inga SQL/migration/RPC/DB-/RLS/dependency-, content bundle, publiceringsskript eller databasändringar ingår. Live Supabase/RLS/content rows kan inte godkännas av lokala fixtures och redovisas separat.

## Användaruppgift och UI-kontrakt

- **Uppgift/ingång:** hitta en publicerad, källmärkt FAQ efter ålder, läsa svaret och kunna öppna källan; komma tillbaka till Kunskap.
- **Huvudhandling:** tryck på en fråga för att expandera/samla svaret; tryck separat på en säker källa för att öppna den.
- **Synlig information:** frågetext, full body för exakt publicerad version, källnamn/URL, säkert öppna-källan-kontroll och ärlig empty/error/loading/unknown feedback. Ingen review-banner i public mode.
- **Fördjupning:** källhänvisning visas tillsammans med svaret; inga ogrundade lästider, medicinska slutsatser eller färdighetspåståenden.
- **Komponenter/tokens:** återanvänd `Card`, `Button`, `SectionHeader`, `MessageCard`, `Skeleton`, tokenfärger/spacing och `getSafeContentSourceUrl`; undvik nya komponentbibliotek eller lokala visuella token.
- **Målbild:** panel 7 FAQ-åtkomst bevaras. Public mode visar endast exakt grantat, publicerat och åldersberättigat underlag. Review mode behåller sin märkta syntetiska prototyp. Alla andra tillstånd förblir tydligt särskilda.
- **Visual evidence:** oberoende public/review RN Web-körning vid 375×844 och 430×844, kort vy 375×667 och 140% textproxy där harness stödjer det; expanded answer, source text/link, empty, unknown, loading/error, keyboard/tab overflow, no page errors. Läs `docs/design-rules.md` §14, dokumentera varje punkt och separat de sex delpunkterna i 16. Ingen skjuten R4b hjul-/periodnavigation ingår.

## Tilldelade skrivvägar

- `src/content/select-content.ts`
- `src/data/workspace-data.ts`
- `src/features/home/ProductWorkspace.tsx`
- `src/components/ui/Tabs.tsx`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/knowledge/FAQScreen.tsx`
- `src/features/knowledge/README.md`
- `tests/content-delivery.test.mjs`
- `tests/knowledge-review-content.test.mjs`
- `tests/workspace-data.test.mjs`
- `tools/visual-check/know02-app.tsx`
- `tools/visual-check/verify.py`
- `docs/tasks/dev/UIUX-REVAMP-R4C-PUBLISHED-FAQ-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/knowledge/R4C-PUBLISHED-FAQ-01/`

## Acceptans

1. `knowledge_faq` använder exakt request `{ surface: 'knowledge_faq', context: 'dog_advice', audience: 'dog_owner', need: null, dogId: dog.id, breedId: dog.breed_id, ageWeeks }`. Exakt grants: version `62000000-0000-4000-8000-000000000004` → `{ surface: 'knowledge_faq', context: 'dog_advice', audience: 'dog_owner', need: null, priority: 1, ageAgnostic: false }`; version `62000000-0000-4000-8000-000000000006` → samma tuple med `priority: 2`. Dessa två versioner får inga andra surface-grants i denna slice; ingen annan version får `knowledge_faq`-grant. Resultatordning är därför handling-frågan före ensamhet-frågan.
2. Returstatusarna är exakta: saknad `ageWeeks` → `unknown/missing_age`; ogiltig request (t.ex. malformed `dogId`) → `unknown/invalid_request`; publicerad men okänd version utan policy → `unknown/unmapped_version`; känd men ograntad version, annan giltig surface, fel åldersintervall eller fel ras → `empty`. En nyare, känd och publicerad men ograntad version med samma `contentId` blockerar fallback till den äldre grantade versionen och ger `empty`. Loadern måste filtrera `.eq('status', 'published')`, så draft/withdrawn når aldrig selectorn. Public FAQ använder denna befintliga published-only catalog och visar bara exact grants; fråga, svar och `sources` hör till samma version. Ingen fritext/review fixture går till public mode.
3. Exakta public FAQ-frågor och mappningarna i “Mål och beslut” får Dog Expert PASS och Critic PROCEED före implementation. Innehållskropparna, age windows och `content_versions.status` ändras inte.
4. Källor renderas från samma valda version. Bara säker HTTPS öppnas via befintlig helper efter tryck; invalid/non-HTTPS source exponeras som text utan öppningsknapp; misslyckad open visar retrybar/sanningsenlig feedback.
5. Public mode states: loading skeleton, error + retry, missing age, confirmed empty med copy “Just nu finns inga publicerade frågor för den här vyn”, eligible frågekort. Endast `unknown/missing_age` får en profilväg. Andra `unknown`-orsaker, till exempel `invalid_request` eller `unmapped_version`, får inte antyda att profilen saknar uppgifter och visar ingen profil-CTA. Tomläget visas även när publicerade frågor finns men ingen matchar aktuell ålder; det får inte säga att inget FAQ-innehåll alls är publicerat. FAQ:s `Efter ålder` är enda public context; `Före hemkomst`/`Första dagarna hemma` och befintliga `REVIEW_FAQ` syns bara i tydligt markerat review mode. Workspace behåller sin gemensamma befintliga publicerade katalogläsning för övriga publika ytor; review-FAQ gör ingen egen FAQ-förfrågan, skrivning eller publicering och ignorerar katalogens publika FAQ-selection.
6. Expanderad fråga behåller source content; vald FAQ-destination öppnar rätt flik; close/back återgår till Kunskap; FAQ och Checklistor fortsätter vara nåbara i public/review.
7. `src/features/knowledge/README.md` beskriver public/review skillnad, exact content flow, sources, selection, state, testkommandon, no implicit publish och kända live limitations.
8. Public/review visual evidence uppfyller den angivna viewport-/state-matrisen och design-rules §14; expanded source-capture visar källa och åtgärd i viewport, fixture klickar safe source utan extern navigation, keyboard Tab/Enter når FAQ-fråga och källkontroll, aktiv FAQ-tab är helt synlig vid 140% textproxy, reviewkontextens tre lika viktiga val behåller samma bredd och en faktisk HomeCarousel FAQ-destination öppnar rätt flik och återgår till Hem. §14 alla 1–18 och punkt 16:s sex delbedömningar sparas som oberoende QA; ingen klippning i fråga, svar, källor eller kontroller.
9. Inga schema-/SQL-/RLS-/RPC-/content-body-/status-/dependencyändringar. Ingen FAQ-content publiceras automatiskt eller via denna kods task.

## Verifiering

- `node --experimental-strip-types --test tests/content-delivery.test.mjs tests/knowledge-review-content.test.mjs tests/workspace-data.test.mjs — include exact grant/request tuples and order, missing age, malformed request, unmapped ID, wrong surface/age/breed, newer ungranted same-content no-fallback, and published-only loader assertions`
- Public and review visual-check for `r4c-faq` at 375×844 and 430×844, 375×667 and 140% text proxy, where supported; inspect/screenshots plus page errors.
- `pnpm check`
- `python tools/visual-check/verify.py` with the focused `r4c-faq` scope (record other baseline failures without claiming them as R4c PASS).
- `python tools/dev_flow.py validate`
- `git diff --check`

## Amendment v6 efter oberoende QA

- Independent Reviewer CHANGES verification only: source screenshot reset scroll, no keyboard evidence, no §14 report, and the approved wording overstated review FAQ database isolation. No verified selector/version/body/source product-code defect. Independent QA separately BLOCKED the same three gates.
- The visual harness now preserves scroll for the expanded source capture and exercises Tab/Enter to the FAQ question and source control. Focused 33/33, full `pnpm check` 577/577, and public/review visual matrices previously passed; public visual rerun passes with the new keyboard/source checks.
- Before further code, Architect and Critic must approve this exact v6 amendment. Product change is limited to the shared `Tabs` component revealing an initially active offscreen tab at large text; review boundary wording clarifies the existing shared workspace catalog read. Dog Expert review is not renewed because question mappings, answer bodies, age framing and content sources are unchanged.

## Reviews före implementation

- Architect APPROVE of exact task plan v6 before the shared-tab correction; the earlier v5 approval remains evidence for unchanged FAQ selector/content scope.
- Critic PROCEED on exact v6 review/catalog boundary and public FAQ wording/context/trust behavior.
- Dog Expert PASS for the exact two question-to-version mappings; answer bodies are already approved and are reused verbatim. This remains applicable because v6 changes no dog-facing copy, content, age window or mapping.
- Security not required unless implementation changes a query, auth, ownership, RLS, schema, network endpoint or data purpose. Existing catalog is public published content; exact client-side editorial surface grant is not access control. Stop and request Security if the implementation crosses those boundaries.
- Risk-class M: independent QA checks both successful and error/unknown paths and rendered public/review states; independent Reviewer after QA. Native app, live publication and Supabase/RLS remain NOT TESTABLE unless separately executed against the intended environment.

## Amendment v7 review status

- Independent Critic QA v6 found two bounded closeout gaps after the public/review rerun: review-only context buttons of equal priority currently render at unequal widths when the last flex item wraps alone, and the visual harness opens `?screen=faq` directly instead of exercising the HomeCarousel destination callback and return to Home. The required independent report is also still to be saved; the report and review bounds are not implementation work.
- Proposed product correction is limited to the review context-button wrapper in `FAQScreen.tsx`: retain all existing labels and behavior, use equal fixed flex-basis with no grow for a lone wrapped choice, and confirm equal widths at 375 and 140% text. No public FAQ copy/body, selector, source, age or data behavior changes.
- Proposed fixture correction is limited to `tools/visual-check/know02-app.tsx` and `tools/visual-check/verify.py`: click the real `HomeCarousel` FAQ card, pass its `FAQ_DESTINATION_ID` callback into `KnowledgeScreen`, assert FAQ is selected, then use the fixture's Home navigation to return. Retain the direct-route state matrix and existing public source interception.
- Architect APPROVE and Critic PROCEED received for this exact amendment: equal fixed-width review-context controls; real HomeCarousel FAQ destination and return path in both harness builds; retain the direct FAQ matrix. After approval, rerun focused/full checks as needed and public/review visual evidence; complete the independent §14 report and Reviewer recheck. No scope/data/content changes are proposed.

## R4c closeout status

- Final independent Critic QA: **PASS** after the public/review Checklistor→FAQ journey and report/queue/manifests were synchronized.
- Independent Reviewer: **CHANGES, closeout records only**. No product or harness defect was found. Corrected the stale Critic-pending status/next-step text and changed the report’s public FAQ link to the expanded-source capture. Final independent Reviewer recheck: **PASS**.
- R4c is closed as a local, uncommitted checkpoint for the owner-requested R4–R7 batch; commit/push remain for the combined delivery.
- Limits remain as stated in `docs/design/evidence/vision-rev02/knowledge/R4C-PUBLISHED-FAQ-01/INDEPENDENT-QA.md`; NOT TESTABLE is not PASS.
