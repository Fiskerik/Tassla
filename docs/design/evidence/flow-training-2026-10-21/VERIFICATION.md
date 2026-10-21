# FLOW-TRAINING-01 — verifiering

Datum: 2026-10-21. Plan v2; Architect **APPROVE**, Critic **PROCEED**, oberoende QA **PASS**, Reviewer **PASS** efter korrigering av kömetadata. Alla vyer och träningsdata nedan är syntetiska. En senare ägarstyrning (2026-10-21) skjuter upp breda tillgänglighetsgrindar för alla MVP-checkpoints; befintliga 140 %-bilder här är informativa historiska artefakter.

## Krav → implementation → regression

MVP rev02 §4.4 och panel 6 kräver att hundägaren kan hitta och återuppta rätt träningssteg. Den lokala avvikelsen som rättades var att Träning använde `pickNextExercise` med statusprioritet medan Hem tog första ofärdiga programmet i rå källordning. Publicerat innehåll saknar uttrycklig ordning, så de två ytorna kunde visa olika nästa steg.

`src/features/home/ProductWorkspace.tsx` använder nu samma `pickNextExercise(training.programs)` som Träning och slår därefter upp valt program/steg. `tests/training-overview.test.mjs` placerar ett opåbörjat program före ett pågående i källordningen och skyddar urvalsregeln och Home-kopplingen. `tests/training-tab-roundtrip.test.mjs` samt den riktiga Home-/Training-renderingen i visual-check-harnessen verifierar samma nästa steg efter bekräftad markering, flikresa och bekräftad avmarkering.

Den syntetiska public-resan gick igenom: Träning visar det pågående programmet trots att ett nytt program står först; markering bekräftas innan nästa steg visas; Hem → Logg → Träning återkommer med rätt steg; avmarkering bekräftas; en ny flikresa visar det återställda steget. Review-fixturen märker träningsutkast som lokala för den aktuella visningen och visar inte de borttagna filtren. Review-progress efter avmontering verifierades inte och påstås inte.

## Kontroller och resultat

Miljö: Node v24.19.0, pnpm 11.19.0, Python 3.12.14, Chromium 151.0.7922.173, RN Web från `/tmp/tassla-ui-tools`. Public och review byggdes separat från aktuell arbetskopia; Playwright kördes mot respektive lokalt serverad bundle.

| Kontroll | Resultat |
|---|---|
| `node --experimental-strip-types --test tests/training-overview.test.mjs tests/training-tab-roundtrip.test.mjs` | PASS; 17/17 på implementerarens riktade körning, 2/2 filer i oberoende QA:s körning |
| `pnpm check` | Oberoende QA PASS; typecheck, edge-account typecheck, ESLint och 65/65 Node-tester |
| `TASSLA_UI_REVIEW=false ... node tools/visual-check/build.cjs` | PASS; separat public-bundle |
| `TASSLA_UI_REVIEW=true ... node tools/visual-check/build.cjs` | PASS; separat review-bundle |
| `python tools/visual-check/verify-training-flow.py ...` | PASS; public 13/13 och review 5/5, reproducerat av QA mot egna bundles |
| Python-syntaxkontroll, `git diff --check`, `python tools/dev_flow.py validate` | PASS |

Implementerens capture-bundles: public `app.js` SHA-256 `c07d2959db9c28c253f3892afa072576b0bd4ca37d04a18d975728bba280ada3`.

Review `app.js` SHA-256 `38e61f76ec19314a7d1b91ce485f47f987622f606c3f88b9619186551c93bdd0`.

Oberoende QA byggde om samma källsnapshot till separata bundle-mappar: public `app.js` SHA-256 `6974cda754e377deb188ea0655735d84410eafeb13c5ee5540df8ea94db2fdd9`; review `app.js` SHA-256 `25cc89d0016412f249468fa664cd4ad8866393d16210efaf2592b2c2f8959384`. De 16 PNG-filerna i implementerens och QA:s capture-mappar är byte-identiska. Buildvägarnas `app.js` skiljer sig i hash, därför sparas båda identifierarna; QA:s browserresa kördes mot dess egna builds.

Aktuell kod-/harnessunderlag: branch `codex/dog-profile-search-pilot`, HEAD/bascommit `a57e17388d380800c6c378b6368babe6877b4f1c`, SHA-256 för den stabila sammanslagna snapshotten av de sex implementerägda filerna ovan: `e7362a077ebb96a1a0068251557780578e90b4215780ff2296f0b806c2dac1e7`. Det finns ingen separat commit för denna task. Arbetskatalogen innehåller även den tidigare avslutade men ocommittade `DOG-PROFILE-SEARCH-PILOT-01`-checkpointen; ändringsområdena genomfördes sekventiellt, inte parallellt. Ingen push, iOS-arkivering, signering eller release gjordes. Bundle-hasharna gäller endast den lokala RN Web-harnessen.

## Bildbevis

Referens: [`vision_rev02.jpg`](../../../../vision_rev02.jpg), panel 6 (nedre raden, andra panelen). Renderade träningsvyer togs i samma verifieringspass. Current Training visar vald nästa övning och statusordnade programrader; Home visar nästa steg efter bekräftad ändring.

| Public | Bild |
|---|---|
| Training före markering, 375×844 | [training-before-mark-375x844.png](public/training-before-mark-375x844.png) |
| Training efter markering, 375×844 | [training-after-mark-375x844.png](public/training-after-mark-375x844.png) |
| Home efter markering, 375×844 | [home-after-mark-375x844.png](public/home-after-mark-375x844.png) |
| Home efter markering, 430×844 | [home-after-mark-430x844.png](public/home-after-mark-430x844.png) |
| Home efter markering, 375×667 | [home-after-mark-375x667.png](public/home-after-mark-375x667.png) |
| Home efter markering, 140 % webbläsarzoom | [home-after-mark-140-percent.png](public/home-after-mark-140-percent.png) |
| Training efter markering, 430×844 | [training-after-mark-430x844.png](public/training-after-mark-430x844.png) |
| Training efter markering, 375×667 | [training-after-mark-375x667.png](public/training-after-mark-375x667.png) |
| Training efter markering, 140 % webbläsarzoom | [training-after-mark-140-percent.png](public/training-after-mark-140-percent.png) |
| Home och Training efter bekräftad avmarkering, 375×844 | [home-after-unmark-375x844.png](public/home-after-unmark-375x844.png), [training-after-unmark-375x844.png](public/training-after-unmark-375x844.png) |
| Review Training, 375×844 | [review-training-375x844.png](review/review-training-375x844.png) |

Reviewens övriga storlekar: [430×844](review/review-training-430x844.png), [375×667](review/review-training-375x667.png), [140 % webbläsarzoom](review/review-training-140-percent.png). Review-bilder visar syntetiskt utkast och den lokala spargränsen.

QA granskade bilderna vid 375×844, 430×844, 375×667 och 140 % browser zoom. Tränings- och Home-innehåll går att läsa och scrollar vertikalt utan horisontellt överflöde. 140 % är endast ett webblayoutprov, inte native Dynamic Type, och efter ägarbeslutet är bilderna informativa snarare än en framtida acceptansgrind.

## Design-regler §14 — avgränsad bedömning

Bedömningen gäller den här selektor-/resecheckpointen. Den innebär inte att full panel 6 visuellt godkänns.

| # | Svar | Bedömning |
|---|---|---|
| 1 | Ja | `Nästa övning` och dess `Öva nu`-handling är tydliga; Home visar ett valt nästa steg. |
| 2 | Ja | Programraderna har enhetlig form och statusvikt. |
| 3 | Ej tillämpligt | Ingen raderingshandling ändras i denna resa. |
| 4 | Ej tillämpligt | Hemmets dagliga aktivitetsrader ändras inte. |
| 5 | Ja / NOT TESTABLE | Webblayouter provades vid tre storlekar och 140 % zoom; native safe area är ej testad. |
| 6 | Ja | Ändringen återanvänder befintlig träningsselektor och befintliga skärm-/radkomponenter; inga lokala designundantag tillkom. |
| 7 | Ej tillämpligt | Inga ikoner eller ikonfamiljer ändrades. |
| 8 | NOT TESTABLE | Denna kodändring ändrar inte färgtokens; kontrastmätning ingick inte. Panelens avvikande färgfördelning bedöms separat i punkt 16. |
| 9 | Ja | Nästa-stegtext, `Öva nu`, markering och avmarkering motsvarar verifierad handling. |
| 10 | Ja | Framgång visas först efter bekräftad callback; liststatus bygger på bekräftad progress. |
| 11 | Ja | Review-markering är tydligt lokal och public-resan visar ingen obekräftad framgång. |
| 12 | Ja | Copy är vardaglig; review-fixturen skiljer utkast från granskat innehåll. |
| 13 | Ja, inom godkänd redesign | Nästa steg står före dämpad programmetadata; detta godkänner inte panelens helhet. |
| 14 | Delvis / NOT TESTABLE | Markering, avmarkering, review, före-/efterprogress och flikretur renderades. Laddnings-, fel- och tomlägen ingick inte i denna resa. |
| 15 | Uppskjuten | Bred audit av 44×44 pt, VoiceOver/TalkBack, reducerad rörelse, Dynamic Type och 140 % webzoom är utanför MVP-checkpointens acceptans enligt ägarbeslut 2026-10-21. Befintliga bilder är endast informativa. |
| 16 | Nej — ägarundantag; full panelacceptans öppen | **Komposition:** panelens filter, två bildkort och Fortsättkort saknas enligt godkänd UX-redesign. **Färgfördelning:** panelens fotoytor och ämnespiller saknas. **Typografi:** lokala rubriker går att läsa, men pixelmatchning mot panelens täthet/skalning godkänns inte. **Komponentformer:** stora bildkort ersattes av CTA- och statusrader enligt godkänt undantag. **Bildspråk:** träningsbilder visas inte i den godkända omarbetade översikten. **Innehållstäthet:** en statusordnad lista ersätter kortgrid plus Fortsättkort. Se godkända `UI-TRAINING-OVERVIEW-01`-beslut; ingen full rev02-panelmatch hävdas. |
| 17 | Nej — ägarundantag | `Mina`, `Rekommenderat` och `Alla` är avsiktligt borttagna i den godkända redesignen. Huvudfliksresan Hem → Logg → Träning verifierades lokalt. |
| 18 | Nej — ägarundantag | Panelens träningsbilder saknas i den godkända översikten; denna selektorändring återinför inte bildkort. |

## Separata acceptansstatusar

| Område | Status | Gräns |
|---|---|---|
| Kod | PASS lokalt | Hem återanvänder Träningens statusprioriterade val; testet täcker opåbörjat program före pågående. |
| Lokal QA | PASS | Oberoende QA körde full kontroll och hela syntetiska public-/review-resan. |
| Live Supabase/RLS | NOT TESTABLE | Ingen live backend användes. |
| Verkligt publicerat innehåll | NOT TESTABLE | Programmen i fixturen är syntetiska. |
| Funktionell native/telefon | NOT TESTABLE | RN Web bevisar inte native beteende; funktionella enhetsprov hanteras separat där MVP-resan kräver det. |
| Systematisk tillgänglighetsanpassning | Uppskjuten efter MVP | 140 %, stor text/Dynamic Type, VoiceOver/TalkBack, reducerad rörelse och träffyteaudit är inte grind i denna eller framtida MVP-checkpoints före släppt och godkänd MVP. |
| Visuell panel 6 | NOT ACCEPTED | Godkänd redesign avviker från referensens komposition; separat panelacceptans kvarstår. |
| Native build, signering och release | NOT TESTABLE / ej skapad | Endast lokala visual-check-bundles byggdes; ingen iOS-arkivering, signering, push eller release. |

Oberoende Reviewer gav först **CHANGES** för inaktuella `next_step`, `implementation_state` och `evidence_status` i köposten. Fälten rättades; uppföljningsreview gav **PASS** utan kvarstående blockerare.
