# Granskning — KNOWLEDGE-IMAGE-FOCUS-01 v2

Datum: 2026-10-27. Allt underlag använder syntetiska fixtures.

## UI Critic — REVIEW PASS, lokal bildfokusgranskning

Faktiskt öppnade filer:

- `/tmp/knowledge-image-focus-panel7.png` — 798×970 px, panel 7 bredvid hela mappingkontaktarket.
- `knowledge-image-focus-contact-sheet.png` — 1000×2300 px.
- Per-mapping captures vid 375 och 430 px, bland annat `published-first-week`, `published-handling`, `published-health`, `published-weight` och editorial fallback.

Panel 7 används som närmaste bildkortsmönster; kontaktarket är ett granskningsunderlag, inte en appskärm. Critic fann inga synliga fokus-/beskärningsdefekter: alla sju lokala källbilder behåller hundansiktet eller det relevanta motivet i featured 16:9, relaterat 4:3 och läsarbild 16:9. Ingen produktfokusmappning behöver ändras. Bildspråk: PASS för lokal crop-scope. Komposition, färgfördelning, typografi, komponentformer och innehållstäthet: NOT TESTABLE från kontaktarket. Livekatalog och native/TestFlight: NOT TESTABLE.

## Oberoende QA — PASS efter metadatarecheck

QA öppnade jämförelsebilden, kontaktarket samt fokuserade captures för publicerad Sheltie, veterinärbild, cockerfallback och kort viewport. Resultat:

| Kriterium | Resultat | Bevis |
|---|---|---|
| Alla lokala publicerade artikelversioner, Drive-slugs, tre bild-/fokusmappingtabeller och sju assets ingår | PASS | `tests/knowledge-image-focus.test.mjs`, inventory |
| 24 mappingar renderas i tre cropformat vid 375/430 px | PASS | `RESULTS.json`, 54/54 checks; 72 ramar per bredd |
| 375×667 kan scrolla till sista mappingen utan horisontellt overflow | PASS | `RESULTS.json`, scrollhöjd 4265; sista raden nås |
| Artikelspråk, status, rekommendationsval och produktbeteende är opåverkade | PASS | Diffen saknar produktkod/assetändringar |
| Hundens ansikte/relevant motiv syns i alla lokala cropformat | PASS | Kontaktark och fokuserade captures |
| Livekatalog-ID:n och native/TestFlight-beskärning | NOT TESTABLE | Ingen sanerad produktionssnapshot eller poständrings-capture finns |

Första QA-körningen fann två metadatafel: queue pekade på v1 i stället för v2, och `test_evidence` hade fel sökväg. Båda korrigerades. QA recheckade därefter planversion/status, den verkliga `RESULTS.json`-sökvägen och körde `python -X utf8 tools/dev_flow.py validate` med exit 0.

`CI=1 pnpm check` PASS: TypeScript, Edge TypeScript, ESLint, 828 tester PASS och 1 skip. Första försöket stoppades före checkskripten av npm-registry-`EPERM`; omkörningen med tillåten nätverksåtkomst passerade hela checken.

## Frozen Reviewer — PASS

Reviewer kontrollerade slutlig diff mot v2:s `write_paths`, plan-/kömetadata, mappingtest, RN Web-harness och sparat Critic-/QA-underlag. Alla ändrade spårade och ospårade filer ligger inom skrivvägarna. Endast test, visual-check tooling, dokumentation, kö och evidens ändrades; produktkod och bildassets är oförändrade. Inga fynd. Livekatalog och native/TestFlight förblir **NOT TESTABLE**.
