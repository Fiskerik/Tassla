# DOG-PROFILE-SEARCH-PILOT-01 — QA-underlag

## Spårbarhet och körning

- Branch: `codex/dog-profile-search-pilot`
- Bas-HEAD: `a57e17388d380800c6a378b6368babe6877b4f1c` (arbetskopian har ännu inte committats; HEAD identifierar därför inte ensam den fångade koden).
- Bundle-SHA256 (`app.js`): public `c4d08bcc6daf2acdc86c75d565a00aa304c4734160a5954010f7554dc9b8d62f`; review `64382951bd9ee5b2aa76f2212c40fe1d2d87b121edfb5e7ae105c9c5f01984a7`.
- Test: `node --experimental-strip-types --test tests/breed-search.test.mjs tests/profile-screen-policy.test.mjs tests/profile-edit.test.mjs` — PASS, 3 testfiler.
- Full kontroll: `pnpm check` — PASS, typecheck, edge typecheck, lint och 64 tester (64 pass, 0 fail, 0 skip).
- Public build: `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-dog-profile-search/public node tools/visual-check/build.cjs` — PASS.
- Review build: `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-dog-profile-search/review node tools/visual-check/build.cjs` — PASS.
- Varje katalog serverades separat på `http://127.0.0.1:4173/` med `python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-dog-profile-search/public` respektive review-katalogen. Verifieraren kördes separat med `python tools/visual-check/verify-dog-profile-breed-search.py --base-url http://127.0.0.1:4173/ --output-dir docs/design/evidence/vision-rev02/dog-profile-breed-search/public` och motsvarande `review`-sökväg — PASS, 28/28 per bundle.
- Bildkatalogerna innehåller vardera 28 PNG-filer. Capture-viewportar är 375×844, 430×844 och 375×667; editbilderna är 375×667. Exempel: [public create utan val](public/profile-create-before-selection-375x844.png), [public match](public/profile-search-match-375x844.png), [public ingen träff](public/profile-search-no-match-375x844.png), [review saknat sparat ID](review/profile-edit-missing-id.png).

Verifieraren kördes mot de oförändrade byggda fixturerna. För stabila evidensbilder gjordes en separat QA-capture mot samma faktiskt serverade bundle och fixture-rutter, med 500 ms väntan efter övergångar. Capture-CSS döljer endast `profile-fixture-banner` och `auth-fixture-banner` (syntetiska testetiketter) så produktens `appViewport` får hela angivna höjden. App/harness-kod och byggda bundle ändrades inte. Skärmbilderna har alltså exakt målstorlek och visar appytan utan fixtureetiketter; de är inte ett rått helsidesfoto av testharnessen. Födelsedatumfältet blur:as i stillbilden före val. Sökfältets synliga mörka kant i öppna sökbilder är dess avsiktliga fokusindikator.

Samtliga rutter använder syntetiska `profileScenario`-/`state`-fixturer; ingen verklig användarprofil, Supabase eller RLS används. Skärmläsare, iOS-tangentbord, native Dynamic Type/VoiceOver och 140 % textstorlek testades inte. Capture-/verifieringsunderlaget täcker inte hela onboarding→Hem-resan eller en release-build.

## Kriterier och utfall

| Kriterium | Resultat | Reproduktion / belägg |
|---|---|---|
| Sökutil: NFC, skiftläge, yttre blanksteg, katalogordning | PASS | Riktat Node-test; normalisering ändrar inte ordningen på matchande katalogposter. |
| Endast uttryckligt verkligt katalog-ID; okänd fallback | PASS | Policytester och verifierarens match/ingen-träff-fixturer; Okänd ras visas bara när den finns i hämtad katalog och skickar dess ID. |
| Inget förval, ingen fritextpersistens, stängning utan val bevarar val | PASS | Policytest och create-captures före val, stängd utan val, vald och Okänd ras. |
| Editens sparade och saknade ID | PASS | Edit-regression bevarar sparat ID/label; saknat ID behålls med befintlig varning tills explicit val. Se `profile-edit-saved.png` och `profile-edit-missing-id.png` i båda lägena. |
| Shared picker i create/add/edit och stylingägarskap | PASS | `profile-screen-policy.test.mjs`; public/review-verifierare täcker de tre fixturrutterna. |
| Match, ingen träff, tom katalog, loading, error och retry | PASS | Public/review verifierare, 28/28 per bundle; motsvarande create-bilder i båda katalogerna. |
| Add-avbrytning och edit busy/pending | PASS | Public/review verifierare; `profile-add-cancel.png`, `profile-edit-saving.png`, `profile-edit-pending.png`. |
| Live-data, konto-/hundscope och RLS | NOT TESTABLE | Syntetiska fixturer; kräver separat live-miljötest. |
| Native tangentbord, VoiceOver och Dynamic Type | NOT TESTABLE | RN Web-granskning verifierar inte fysisk iOS. |
| Visuell capture utan harneskrom | PASS | 28 produktbilder per bundle i exakta viewportmått; testetiketter döljs endast för stabila skärmbilder. |
| Full end-to-end onboarding→Hem och release/build | NOT TESTABLE | Utanför pilotens QA-fixturer; ingen release-build utfördes. |

## Designregler §14 — visuell granskning

Granskningen gäller stödformuläret och den gemensamma väljaren, inte en huvudpanel. Jämförbara bilder ligger i `public/` och `review/`; representativa detaljer länkas i tabellen ovan.

| §14 | Resultat | Fynd |
|---|---|---|
| 1. En primär handling/nästa steg | Ja | Skapa-flödet har ett tydligt katalogval och primär sparaåtgärd; sekundära avbryt-/stänghandlingar är separerade. Spara är spärrad före rasval. |
| 2. Jämställda handlingars visuella vikt | Ej tillämpligt | Jämförda tillstånd har inte rinnande syskonhandlingar som delar samma hierarki. |
| 3. Radera-separation/bekräftelse | Ej tillämpligt | Rasväljaren och granskade tillstånd erbjuder ingen radering. |
| 4. Hem-radskontrakt | Ej tillämpligt | Detta är inte Hem. |
| 5. Avstånd, sektioner och marginal | Ja, stödskärmskontrakt | Formuläret använder grupperade kort, varm bakgrund och tydligt avstånd. Skärmen är vertikalt rullbar; 375×667 fångar den kortare viewporten. |
| 6. Delade tokens/komponenter | Ja | Väljarrad och modal använder gemensam `SearchableBreedPicker` och befintliga tokenvärden; ingen lokal breed-row-stil kvar i skärmägaren. |
| 7. Ikonfamilj | Ja, webbfångst | Befintliga Ionicons i sök/stäng/chevron; native paketrendering är inte verifierad här. |
| 8. Referensens färgfördelning/kontrast | Ej tillämpligt för panelmatchning; stödformulär bedömt separat | Profilpanelen saknas i visionbilden. Stödytan har varm neutral bakgrund, ljusa grupper och gröna handlingar; ingen påstådd huvudpanelpalettmatchning. |
| 9. Ikon, etikett, handling | Ja | Rasraden öppnar väljaren; etikettydligt sökfält filtrerar rasnamn; Stäng stänger. |
| 10. Statusbadges/bockar | Ja | Inga rutinmässiga statusbadges i profilformuläret. |
| 11. Banners och uppmuntran | Ja för produktbild | Fixtureetiketter är exkluderade från app-only-bilderna och hör inte till produktvyn. |
| 12. Vardaglig, korrekt copy | Ja | Svensk användarcopy; inga tekniska driftord i formuläret. |
| 13. Ton och hierarki | Ja, stödskärmskontrakt | Sektionstitlar och fältetiketter bildar tydlig formulärhierarki; exakt jämförelse mot saknad panel kan inte göras. |
| 14. Relevanta tillstånd | Ja | Loading, tom katalog, fel/retry, ingen träff, valt, saving och pending renderas i fixtures. |
| 15. Träffytor, semantik, stor text, reducerad rörelse | Delvis / NOT TESTABLE | Webbfångst visar radio-semantik, label och vald status samt minst 44 px rader. Native VoiceOver/Dynamic Type, 140 % text, reducerad rörelse och fysiskt tangentbord är NOT TESTABLE i denna körning. |
| 16. Exakt profilpanelmatchning mot `vision_rev02.jpg` | NOT TESTABLE / ej tillämpligt | Referensbilden innehåller ingen profilpanel. En exakt paneljämförelse kan därför inte bedömas. Stödskärmen bedöms mot `VISION-REV02-R02-4E-PROFILE-UX-SPEC.md`; varm grupperad formulärkomposition, komponentform och tät men rullbar fältlayout syns i create/edit-bilderna. Ingen exakt likhet hävdas för bildspråk eller panelens innehållstäthet. |
| 17. Rubriker, filter, flikar, tillbakaresor | Delvis | Den här stödresan använder öppna/stängda väljartillstånd och tydlig Stäng. Hela navigationskedjan tillbaka till Home/onboarding är inte E2E-testad. |
| 18. Hundnamn/bild/innehåll | Ja för tillgängliga tillstånd | Luna visas i create fixture; editens befintliga porträtt är kvar. Initial create saknar hundfoto och denna pilot introducerar inget nytt bildmaterial. |

Den tydligt fokuserade svarta ramen i `profile-search-*.png` sitter på sökfältet medan väljaren är öppen och visar fokus. Den tidigare DOB-kantavvikelsen berodde på capture-skriptets aktiva datumfält; nya idle-fångster blur:ar datumfältet och visar normal kant. De två 44 px syntetiska banneretiketterna hade tidigare tagit 88 px av 844 px create/add-vyn (44 px i edit). De finns kvar i verifieringsfixturen men är dolda endast i de dokumenterade app-only-captures; därför har bilderna korrekt 844/667 px app-viewport och fångar inte den förminskade 756 px harneskvyn.

## Exakt samlad implementationcommit — 2026-10-21

Public och review kördes på commit `c3eedd5e4da14e36789963d3fe352a28d8dca56b` med exakt bundle-SHA-256 och verifierar-SHA-256 i [checkpointens public](../../ui-checkpoint-c3eedd5/breed-picker/public/) och [review](../../ui-checkpoint-c3eedd5/breed-picker/review/) manifests. Båda syntetiska browserkörningarna passerade 28 kontroller. Ingen 140 %-grind användes. Exakt matchning mot en profilpanel i `vision_rev02.jpg` är inte tillämplig eftersom panelen saknas; live datakoppling, native och TestFlight är separata statusar.
