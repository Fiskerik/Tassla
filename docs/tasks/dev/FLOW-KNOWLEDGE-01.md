# FLOW-KNOWLEDGE-01 — Kunskap från sök till källmärkt läsning

Plan v5 · 2026-10-18 · Risk M · local implementation checkpoint; exact-plan reviews, independent QA, and final Reviewer closeout recheck **PASS**. This remains uncommitted for the requested R4–R7 batch. Plan v5 supersedes v4 by aligning the search-scope summary with the exact UI helper copy.

## Mål

Gör panel 7:s publicerade guideyta användbar från sökning till källmärkt läsning. Återanvänd den befintliga published-only katalogen och R4a:s exakta versionsselector. Denna slice får ge Knowledge-ytorna `knowledge_for_you` och `knowledge_articles` till just de befintliga hundrådsversioner som redan har Dog Expert- och redaktörsgodkännande:

| Version | Innehåll | Befintligt åldersspann | Föreslagen Knowledge-yta |
|---|---|---:|---|
| `62000000-0000-4000-8000-000000000004` | Trygg hantering bygger på frivillighet | 13–16 veckor | För dig + Artiklar |
| `62000000-0000-4000-8000-000000000006` | Hjälp valpen att vara själv en liten stund | 27–52 veckor | För dig + Artiklar |

Version `...0002` (“Första veckan hemma”) exkluderas: dess text förutsätter att valpen nyligen flyttat hem, men sådan signal saknas i runtime. Ålder 8–12 veckor kan inte ersätta det kontextvillkoret. Den kan bara få separat grant efter ett korrekt recent-homecoming-kontrakt och ny granskning. Övriga svar/källor/åldersfönster/status i innehållsbundlen ändras inte. Befintliga selectorgrant är redaktionell ytelämplighet, inte åtkomstkontroll. Ålder betyder inte nylig inflyttning eller uppnådd färdighet.

Exact additiva grants (de befintliga `knowledge_faq`-grantsen på `...0004` och `...0006` bevaras oförändrade):

| Version | Ny grant | Prioritet | ageAgnostic |
|---|---|---:|---|
| `...0004` | `{ surface:'knowledge_for_you', context:'dog_advice', audience:'dog_owner', need:null }` och samma tuple med `surface:'knowledge_articles'` | 1 på båda | `false` på båda |
| `...0006` | `{ surface:'knowledge_for_you', context:'dog_advice', audience:'dog_owner', need:null }` och samma tuple med `surface:'knowledge_articles'` | 2 på båda | `false` på båda |

Varje ytval använder exakt request `{ surface, context:'dog_advice', audience:'dog_owner', need:null, dogId:dog.id, breedId:dog.breed_id, ageWeeks }`. Ålder/rasfiltrering och latest-version/no-fallback sker före UI-sökningen.

Föreslagen dekorativ bildmappning i den lokala manifestfilen (nyckel är exakt publicerad content-version, inte listposition): `...0004` → `assets/images/puppy-training.png`; `...0006` → `assets/images/puppy-resting-carousel.png`. Bilderna visar endast generiska stämningsbilder; de identifierar inte användarens hund eller bevisar ett utfall. Dog Expert och Critic ska granska denna exakta mappning före implementation.

## Produkt- och metadataavgränsning

- Sökfältet visas bara när en yta har eligible innehåll. Sökningen är en verklig filterfunktion över den redan laddade, aktuella ytans publicerade och hundrelevanta lista; den söker i titel och brödtext och gör ingen ny databasläsning. Exakt UI-helper nedan talar om att sökningen bara omfattar publicerat innehåll som redan valts för den här fliken och hundens profil.
- Exakt UI-copy: sökplaceholder **“Sök bland guider”**; helper **“Sökningen gäller bara publicerat innehåll som redan valts för den här fliken och hundens profil.”**
- Query-empty skiljs från selector-empty, unknown, loading och error. För För dig visas **“Inga guider på den här fliken matchar sökningen.”**; för Artiklar **“Inga artiklar på den här fliken matchar sökningen.”** Knappen heter **“Rensa sökning”**. Att rensa återställer samma selectorlista utan ny läsning och erbjuder ingen profil-/checklisteväg.
- Selector-empty-copy: För dig **“Det finns inga publicerade guider som passar hundens profil i den här vyn just nu.”**; Artiklar **“Det finns inga publicerade artiklar som passar hundens profil i den här vyn just nu.”** Den beskriver aktuell vy/profil och påstår inte att inget innehåll finns publicerat globalt.
- Inga ämneschips läggs till: den nuvarande innehållsmodellen/bundlen saknar godkänd ämnestaxonomi. Sökningen är den enda nuvarande filterkontrollen. Chips kräver en senare versionsbunden metadata-/taxonomiplan och ska inte baseras på fritextheuristik.
- Kunskapens bildroll bindas i en lokal, version-id-nycklad manifestfil till befintliga, lokala bildassets. Endast uttryckligen mappade versioner får bild; ingen indexbaserad rotation eller nytt asset skapas. Bilderna dokumenteras som dekorativa illustrationer och döljs för skärmläsare så de inte antyder hundidentitet eller ett faktiskt observerat beteende. Exakt bildmappning måste få Critic och Dog Expert PASS före kod.
- Hero-/kompaktkort öppnar samma valda content-version. Källa/fulltext, säker HTTPS-handling, FAQ, Checklistor och tillbaka-navigering bevaras.
- Läsningstid får bara visas som `ca N min`, beräknad med befintlig formel `max(1, ceil(ord/200))`; metoden dokumenteras. Ingen fabricerad publicerad metadata.

## Skrivvägar

- `src/content/select-content.ts`
- `src/features/knowledge/knowledge-search.ts` (ny, ren production-testbar titel-/brödtextfilterfunktion)
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/knowledge/knowledge-content-media.ts` (ny, explicit version→asset-manifest)
- `src/features/knowledge/README.md`
- `tests/content-delivery.test.mjs`
- `tests/knowledge-search.test.mjs` (ny)
- `tools/visual-check/know02-app.tsx`
- `tools/visual-check/verify.py`
- `docs/tasks/dev/FLOW-KNOWLEDGE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/knowledge/FLOW-KNOWLEDGE-01/`

Ingen `workspace-data.ts`-fråga eller loader ändras: befintlig catalog läser redan bara `status=published`, väljer exakt version och skickar samma hund-/åldersscope. Ingen schema/RPC/RLS/auth/query/dependency/content-body/status/publiceringsändring.

## Acceptans

1. Endast versionerna `...0004` och `...0006` får de fyra nya grants som exakt specificerats ovan: båda Knowledge-surfaces använder `context:'dog_advice'`, `audience:'dog_owner'`, `need:null`, `ageAgnostic:false`; `priority` är 1 för `...0004` och 2 för `...0006` på respektive surface. Per-surface request använder exakt tuple ovan. Deras befintliga `knowledge_faq`-grants och alla andra policies förblir oförändrade. `...0002` är fortsatt ograntad för Knowledge tills nylig inflyttning kan bekräftas. Checklist-, program- och help-ytor påverkas inte.
2. Ålders-/rasgränser och saknad ålder ger samma R4a selectorstatusar. Testerna täcker exakta ändpunkter 13/16 och 27/52 samt tomma åldrar 8–12, 17–26 och efter 52; selector-empty är sanningsenligt och kan inte falla tillbaka till en äldre version.
3. `knowledge-search.ts` exporterar samma rena funktion som `KnowledgeScreen` använder. Node-testet anropar produktionsfunktionen och verifierar att sökning matchar endast redan eligible `title`/`body`, normaliserar trimning/versaler och returnerar hela eligible-listan igen med tom query; UI-integrationen lägger inte till en databasläsning.
4. Loading/error/retry, unknown/missing age, selector-empty och query-empty förblir särskilda. Exact strings above are asserted in copy/UI checks; query-empty antyder inte att publicerat innehåll saknas globalt och erbjuder inte en felaktig profil-CTA.
5. Bildval är explicit per publicerad version, aldrig beroende av listindex. Okänd version får inget falskt fallbackfoto. Kortet och dess bild öppnar samma content-id/version och bildrollen är dekorativ.
6. Artikelns fulltext, källista, säkra externa källöppning/feltext och återgång finns kvar. FAQ och Checklistor fortsätter vara nåbara från Knowledge.
7. För dig visar en utvald hero följd av eventuella kompakta kort; Artiklar visar kompakt lista. Om selector ger ett enda resultat visas ett enda kort, utan dubletter för att fylla layouten. Vid stor text kortas inte titel, källa eller sökstatus.
8. Sökresultat begränsas tydligt till redan laddat eligible urval; inga låtsasämnesfilter eller kategorier utan godkänd taxonomi. README dokumenterar selector→filter→kort→artikel→källa, dekorativa bildmanifest, sökbegränsning, lästid och tillstånd.
9. Public/review visual-fixtures täcker 375×844, 430×844, 375×667 och 140% webtextproxy där harness stödjer det; eligible, query-match, query-empty/clear, selector-empty/unknown/error/loading, hero/kompaktkort, artikel/källa/tillbaka samt FAQ/Checklistor-navigation. §14 punkt 1–18 och punkt 16:s sex deldimensioner dokumenteras med bilder och ärliga NOT TESTABLE-statusar.
10. Inga nya paket, database calls, content changes, implicit grants utöver exakt tabell, schema/RLS/RPC/dependency/auth changes eller implicit publicering.

## Kontroller

- `node --experimental-strip-types --test tests/content-delivery.test.mjs tests/knowledge-search.test.mjs tests/workspace-data.test.mjs`
- `pnpm check`
- Public/review Knowledge visual matrix vid angivna storlekar; manuellt granska screenshot och browserfel.
- `python -m py_compile tools/visual-check/verify.py`
- `python tools/dev_flow.py validate`
- `git diff --check`

## Granskningsgrind före implementation

- Architect: APPROVE för exakt grantmatris, lokalt sökfilter över redan eligible set, lokalt versionsmanifest, navigationsbevarande och skrivvägar.
- Critic: PROCEED för exakt svensk copy, sökbegränsning, query-empty/selector-empty och ämneschipbeslut.
- Dog Expert: PASS för exakt version `...0004` / 13–16 veckor och version `...0006` / 27–52 veckor på Knowledge-ytan samt deras dekorativa bilder; version `...0002` måste förbli ograntad utan confirmed recent-homecoming context.
- Security behövs inte om loader/query, auth/RLS, ändamål och datakällor verkligen är oförändrade; stoppa för ny Security-review om plan/implementation ändrar något av detta.
- Efter kod: independent QA (M: lyckat/tomt/fel/unknown + render) och därefter oberoende Reviewer. Spara verdicts, faktiska tester och NOT TESTABLE-luckor i task/queue/evidence innan `done`.

## Öppna och exkluderade delar

Innehåll med vuxenråd, checklistor och träningsprogram tilldelas inte Knowledge-grant i denna slice. Det finns ingen innehållstaxonomi att filtrera med. Live Supabase/RLS, native skärmläsare/Dynamic Type, installerad app och extern länknavigering kräver separat miljö och får inte räknas som lokalt PASS.

### Exakta granskningsresultat för plan v5

- Architect: **APPROVE** — plan och kö v5 synkroniserade; scope, acceptans, skrivvägar och beroenden godkända.
- Critic: **PROCEED** — sökningen begränsas till redan publicerat och profilvalt innehåll; copy, tomtillstånd och sökgräns är konsekventa.
- Dog Expert: **PASS** — ...0004/...0006 och deras åldersfönster är redaktionella; ...0002 utesluts utan signal om nylig hemkomst; bilderna är dekorativa.
- No Security review: loader/query, auth/RLS, ändamål och datakällor är oförändrade enligt plan.

## Implementation and closeout

Implementation follows the exact v5 boundary. The two approved published versions receive only the four specified Knowledge grants. `KnowledgeScreen` filters only the loaded eligible list using the tested production helper, shows explicit per-version local images, and preserves article/source/FAQ/Checklistor navigation. The review harness has a `multi-layout` visual-only scenario that places the two exact published versions together to exercise hero plus compact card; it deliberately does not represent an age-eligible selector result or change product data.

- Focused selector/search/workspace tests: **33/33 PASS**.
- `pnpm check`: **PASS**, including app and edge typechecks, lint and **581/581 tests**.
- Public and review `r4d-knowledge` browser matrices: **4 checks each PASS**, zero page errors. The independent Reviewer ran both with the existing local visual toolchain; independent QA inspected the saved manifests and screenshots but could not rerun Playwright in its environment.
- `python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate`, and `git diff --check`: **PASS**.
- The visual fixtures use the local published content bundle and synthetic callbacks. The 140% web text proxy keeps Knowledge content and search status visible; the shared BottomNav label “Kunskap” wraps onto two lines.
- The exact `vision_rev02.jpg` reference image is not present in this checkout, so direct pixel/reference comparison is **NOT TESTABLE**. The visual review assesses current layout and behavior from the saved captures and written screen contract only.

QA and implementation review, including Design rules §14 and limitations, are recorded in [`INDEPENDENT-QA.md`](../../design/evidence/vision-rev02/knowledge/FLOW-KNOWLEDGE-01/INDEPENDENT-QA.md); public/review captures and browser manifests are in the adjacent folders. React Native Web exposes tab roles and labels but does not emit `aria-selected` from `accessibilityState={{selected}}`; the harness verifies destination content. Native screen-reader behavior remains **NOT TESTABLE**.

No package, query, schema, RLS, RPC, auth, content-body or publication change was made. Live Supabase/RLS, real external handoff, iOS/Android, VoiceOver and device Dynamic Type remain **NOT TESTABLE**. The checkpoint is local and uncommitted pending the requested combined R4–R7 delivery.
