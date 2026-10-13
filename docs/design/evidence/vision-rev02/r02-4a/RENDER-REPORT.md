# R02-4A Mer — renderingsrapport och §14-egenkontroll

Datum: 2026-10-13 · Branch: `design/vision-rev02` · UX-spec: `docs/plans/VISION-REV02-R02-4A-MER-UX-SPEC.md`<br>
Status: Implementerad och renderad. Begränsad oberoende re-QA gav PASS för alla fem fixturedestinationer; helskärms-ägar-QA, Reviewer och Security väntar.

## Resultat

Mer är uppdelad i `Din hund` och `App och konto`. Hälsa, Tassla-pass, Hundprofil, Påminnelser och Konto/support behåller sina befintliga callbacks. Ikonbrickorna använder nya opt-in `tokens.colors.support.*` roller i blått, lila, grönt och bärnsten. Utloggning är fortsatt en separat sekundär handling; dess bekräftelse och faktiska sessionbeteende förblir i `ProductWorkspace`.

## Renderad evidens

Public:

- [375×844](public/more-375x844.png), [430×844](public/more-430x844.png), [375×667](public/more-375x667.png), [140 % browserzoom](public/more-zoom-140-375.png)
- [Utloggningsfel](public/signout-error-375.png), [utloggning pågår](public/signout-busy-375.png)
- Destinationsvägar efter korrigering: [Hälsa](public/destinations/health-375x844.png), [Tassla-pass](public/destinations/passport-375x844.png), [Hundprofil](public/destinations/profile-375x844.png), [Påminnelser](public/destinations/reminders-375x844.png), [Konto och support](public/destinations/account-375x844.png).

Review:

- [375×844](review/more-375x844.png), [430×844](review/more-430x844.png), [375×667](review/more-375x667.png), [140 % browserzoom](review/more-zoom-140-375.png)
- Destinations: [Hälsa](review/destinations/health-375x844.png), [Tassla-pass](review/destinations/passport-375x844.png), [Hundprofil](review/destinations/profile-375x844.png), [Påminnelser](review/destinations/reminders-375x844.png), [Konto och support](review/destinations/account-375x844.png).

Samtliga skärmbilder kommer från samma `MoreScreen` i RN Web-harnessen. Inga JavaScript-sidfel uppstod. Vid 140 % browserzoom radbryts etiketten `Kunskap` i den befintliga bottennavigationen; detta är en känd native-/webbskillnad utanför 4A. Inloggningssession, faktisk signout, native safe area, VoiceOver/TalkBack och Dynamic Type är **NOT TESTABLE**.

## Kontroller

- `pnpm typecheck`: PASS.
- ESLint på 4A-skärmkod och harness: PASS med tre befintliga oanvänd-variabel-varningar i `tools/visual-check/app.tsx`; 0 fel.
- `git diff --check`: PASS.
- `python3 tools/dev_flow.py validate`: PASS.
- Separata public/review RN Web-byggen: PASS.
- Chromium renderade 375×844, 430×844, 375×667, 140 % zoom och signout error/busy; 0 browser exceptions.
- Ingen testfil lades till eller kördes.

## Designregelverk §14

1. **Ja** — två tydliga grupper och en underordnad utloggningshandling.
2. **Ja** — fem rader har enhetlig höjd, ikonplacering och informationshierarki.
3. **Ej tillämpligt** — inga destructive handlingar i menyn.
4. **Ej tillämpligt** — inte Hem.
5. **Ja för RN Web** — 375/430/667 renderade; innehåll går att skrolla vid större zoom. Native safe area är inte verifierad.
6. **Ja** — semantiska supportaccenter är opt-in; befintliga standarder ändrades inte.
7. **Ja** — befintlig Ionicons-familj används konsekvent.
8. **Ja för färgkontrast i tokenpar** — kontrast mellan ikonfärg och badgeyta: hälsa 4,97:1; pass 5,19:1; profil 5,59:1; påminnelser 5,38:1. Brödtext mot canvas: 5,69:1. Separata accenter hjälper skilja destinationerna.
9. **Ja** — varje ikon/etikett beskriver den befintliga destinationen.
10. **Ej tillämpligt** — inga statusbockar eller resultat visas.
11. **Ja** — inget nytt banner- eller uppmuntringsinnehåll har lagts till; signoutfel visas intill signout.
12. **Ja** — befintliga beskrivningar behålls; introduktionen beskriver menyn utan driftpåståenden.
13. **Ja** — rubrik, gruppnamn, destination och förklaring följer tydlig nivåordning.
14. **Delvis** — normalvy, signout busy och signout error renderades. Destinationsläsfel hanteras på respektive route och ingår i senare slices.
15. **Delvis / NOT TESTABLE native** — destinationstryckytor är 60 pt; web zoom renderades. Native hjälpmedel och Dynamic Type ej verifierade. Den befintliga bottennavigationen radbryter `Kunskap` vid 140 %.
16. **Nej för exakt panelmatch; panel saknas för Mer.**
    - **Komposition: Delvis** — vänster rubrik, grupperade kortytor och separerad signout följer de varma UI-mönstren; ingen panel 8–9 ger exakt ordning att jämföra mot.
    - **Färger: Ja för avsedd stödvy** — varm neutral grund och fem semantiska, kontrastmätta accentroller skiljer befintliga destinationer.
    - **Typografi: Ja** — hierarki mellan rubrik, grupper, destinationsnamn och metadata.
    - **Komponentformer: Delvis** — rundade grupper, separatorer och cirkulära ikonbadges följer rev02:s komponentfamilj men saknar direkt panelreferens.
    - **Objekt: Ja** — exakt de fem befintliga destinationsobjekten visas; ingen funktion tillkom.
    - **Innehållstäthet: Delvis** — alla destinationer och en signout syns vid standardviewport; liten höjd visar mindre marginal och använder scroll vid textskalning.
    - **Bildspråk: Ej tillämpligt** — Mer-panelen innehåller inga bilder.
17. **Ja för fixture och produktkällkod** — alla fem rader klickades i RN Web-fixturen och öppnade rätt befintlig vy; skärmbilderna ovan dokumenterar respektive destination. Produktionsroutningen är fortsatt oförändrad.
18. **Ej tillämpligt** — sidan visar inte en hundprofil eller hundbild.

Oberoende read-only re-QA klickade alla fem fixturvalen och bekräftade att rätt vy öppnas. Detta är en begränsad korrigeringsgranskning, inte ägar-QA, Reviewer eller Security. Backend, native routing/safe area och sessionbeteende kvarstår NOT TESTABLE. §14 punkt 16 är dokumenterad som närmaste match eftersom målbilden saknar en dedikerad Mer-panel.
