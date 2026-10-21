# Samlad UI-checkpoint — `c3eedd5`

Verifieringen gäller `codex/dog-profile-search-pilot` på implementationcommit `c3eedd5e4da14e36789963d3fe352a28d8dca56b`. Public och review byggdes separat från exakt samma commit. Varje mapp innehåller screenshots och `build-manifest.json`; webbläsarflödena har även `browser-results.json` med branch, commit, verifierarhash och bundlehash. Träningens och rasväljarens verifierare rapporterar sina PASS i terminalen och deras manifests binder respektive bundle.

| Flöde | Public | Review | Bundlefiler |
|---|---:|---:|---|
| Hem och Checklistor | 22 PASS, 0 browserfel | 23 PASS, 0 browserfel | [public](home-checklist/public/build-manifest.json), [review](home-checklist/review/build-manifest.json) |
| Logga | 15 PASS, 0 browserfel | 15 PASS, 0 browserfel | [public](logga/public/build-manifest.json), [review](logga/review/build-manifest.json) |
| Insikter och Logga-retur | 15 PASS, 0 browserfel | 15 PASS, 0 browserfel | [public](insights/public/build-manifest.json), [review](insights/review/build-manifest.json) |
| Kunskap, FAQ och Checklistor | 31 PASS, 0 browserfel | 90 PASS, 0 browserfel | [public](knowledge/public/build-manifest.json), [review](knowledge/review/build-manifest.json) |
| Träning | 11 PASS | 4 PASS | [public](training/public/build-manifest.json), [review](training/review/build-manifest.json) |
| Sökbar rasväljare | 28 PASS | 28 PASS | [public](breed-picker/public/build-manifest.json), [review](breed-picker/review/build-manifest.json) |

Exakta RN Web `app.js`/`know02-app.js` bundle-SHA-256:

| Flöde | Public | Review |
|---|---|---|
| Hem och Checklistor | `6754555d57fb73e457428504624b0b458af8e3a3b465f20fb31fe4c6dfd3676e` | `cfb8c2f5918cee1c5045c25603ab84c74499954ddc10661e8162d73825ac35fc` |
| Logga | `7cf2df3d13e46b2f5023af6372ee6976d7707fa6d5e554b25368de80e1292999` | `0bd28b3a56f093013ec508dd4c9dde97a3b1569f44c26fb6240f8bf2bd685b71` |
| Insikter | `16a03ee0409e139cef4458d5ce097d23b3e8b6230bdd511317601d82e2adf7b7` | `b7bbcbf6cca6fe7d4039af76867b331f2526fe150df483fba0f436a11020bbd0` |
| Kunskap | `9c8385c1e4ae26809ec882fd8ea1e7b28ffbaa941a871d2e9936da3fc9226203` | `5baf2690212ea6068caeed29d189b066d1225710cb8403917f40b2210934d7ec` |
| Träning | `2694d93e816e4799d0613478ea0f56a28b04cd4e3278ebd0497d6f96cacb211d` | `d7a0a23c7f960e46b4c448abcf276ab8cad50c489358ed06901cb206ccf2e753` |
| Rasväljare | `246c9ded718faae2a06484b469967d2c7e1b81b88a4f1d2389d35855d0a34e8a` | `51b6920306e774d8a521883425fbaa2e0fbeee26a650dcaea3c16d979134cc99` |

Alla flöden använder produktionskomponenter i React Native Web med syntetiska fixtures. Checklist-/Hem, Logga och Insikter har manifestförda captures för standardbredderna och kort viewport. Se varje `browser-results.json` för vilka routes/states varje bild visar. TestFlight, native runtime, produktionsdata och live RLS verifierades inte av dessa körningar.

## Kod, QA och visuell status

- `pnpm check` passerade på den frysta implementationen: TypeScript, edge-typecheck, lint och 71/71 tester.
- Public iOS JavaScript-export passerade: 1 456 moduler; `.hbc`-filens SHA-256 är `32afa6f070bf5c43371d173e72e6d575a0e25a78fb170c2c29667df15ae72e06`. Detta är inte en signerad iOS-app eller TestFlight-build.
- Kod och lokal QA: **PASS** för de redovisade lokala kontrollerna.
- Visuell acceptans mot `vision_rev02.jpg`: **PARTIAL/OPEN**. Captures och kvarvarande avvikelser är dokumenterade i respektive flödes render-rapport. Insikter visar ingen sömngraf eftersom intervalldata saknas; ingen längd uppskattas. Profilväljaren har ingen motsvarande panel i målbilden.
- Live konto-/hunddata och RLS, native, fysisk iPhone och signerad release: **NOT TESTABLE** i denna checkpoint.
- Oberoende slutreview av den samlade MVP:n: **uppskjuten** enligt produktägarens GO; ingen ny Reviewer-körning ingår här.

## Testinvalidering och städning

Ägarbeslutet gäller alla MVP-checkpoints: systematisk tillgänglighetsverifiering tas efter att MVP:n släppts och godkänts. Därför togs isolerade acceptansassertions för 140 %/större text, generell 44 pt-geometri, numerisk kontrastmatris samt systematisk reduced-motion-/skärmläsar-audit bort eller skrevs om. Ändringarna finns i de befintliga testerna och verifierarna; inga relevanta produktflödestester togs bort. Funktionella labels, state, retry, scope, navigation och användarhandlingar testas fortsatt. [Testguiden](../../../tests/README.md) och [FLOW-LOG-planens testinvalidering](../../plans/FLOW-LOG-01-calendar-ux-plan.md) beskriver gränsen.

Död kod som identifierats i samma implementationstädning, bland annat den oanvända datumdistanshjälparen/konstanten och redundant browser-stängning, är borttagen. Historiska 140 %-captures och äldre QA-resultat behålls som historik, inte som framtida MVP-grindar.

## Manuell TestFlight-snabbkontroll

Kör detta på den signerade TestFlight-versionen när den skapats och ange dess version/buildnummer i testanteckningen. Den lokala iOS-exporten ovan är inte installerbar via TestFlight.

1. Logga in med ett testkonto, välj aktiv hund och verifiera att Hem och befintliga uppgifter laddas. Om två testkonton/hundar finns, byt konto/hund och bekräfta att tidigare hunds data inte följer med.
2. Skapa en profil och lägg till en hund: rasfältet ska sakna förval, sök ska filtrera utan att välja, Stäng/Avbryt ska bevara tillståndet och bara ett tryck på en katalogpost ska välja ras. Öppna redigering och verifiera sparad ras, uttryckligt byte och bevarad ändring efter omstart.
3. Hem → Checklistor: kontrollera att Hem ger kompakt överblick och Checklistan visar fullare rader. Prova Idag/Denna vecka/Alla/Kommande, markera och ångra en punkt, öppna en detaljrad, long-pressa för redigering och verifiera ikon per checklistrad samt titel/förklaring. Gå ur och tillbaka; kontrollera att filter, scroll och bekräftad progress beter sig enligt källresan.
4. Kunskap → FAQ och faschecklistor: öppna fråga/svar, byt eventuell kontext och gå tillbaka. Öppna fasöversikt och detalj, markera en punkt och bekräfta progress efter återkomst. Kontrollera att endast sakgranskat publicerat innehåll presenteras som publicerat.
5. Träning: markera och avmarkera ett steg. Gå Hem → Logg → Träning och verifiera att samma bekräftade nästa steg visas efter flikresan.
6. Logga: registrera Kiss och Bajs, ångra en registrering, öppna kalendern och välj ett datum. Öppna Översikt/Insikter och prova Vecka, Månad och Sedan start; gå tillbaka och kontrollera exakt datum, Loggflik och position. Flera händelser samma dag ska räknas som separata händelser.
7. Prova relevant tomt läge samt nätverksfel/återförsök där det går att framkalla. Insikter får aldrig visa påhittad sömnlängd. Notera faktisk kontohund, tidzon, datumintervall och resultat.
8. Jämför vanliga iPhone-skärmbilderna av Hem, Checklistor, Logga och Insikter med motsvarande `vision_rev02.jpg`-panel. Skriv konkreta skillnader; denna checkpoint har inte visuell PASS och kräver inte 140 %- eller systematisk a11y-matris.

Registrera manuella resultat som **PASS/FAIL/NOT TESTED** per resa tillsammans med TestFlight-version/build, iOS-version, testkonto/hund, datum och eventuell återgivningsbar avvikelse. Native-, datakopplings- och visuella resultat uppdateras separat från lokal kodstatus.
