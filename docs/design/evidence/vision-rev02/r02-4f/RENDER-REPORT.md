# R02-4F Påminnelser — renderingsrapport och §14-egenkontroll

Datum: 2026-10-13 · Branch: `design/vision-rev02` · UX-spec: `docs/plans/VISION-REV02-R02-4F-REMINDERS-UX-SPEC.md`<br>
Status: implementerad/renderad. Owner QA och oberoende Reviewer/Security för denna senare slice väntar. Ingen påminnelsepanel finns i referensbilden.

## Resultat och kontrakt

Påminnelser har vänsterställd rubrik, varm amberfärgad introyta och två separata kort: ägarens lokala appval/träningsval/tid respektive enhetens behörighet och tillstånd. Informationsmodalen förklarar att appval och enhetstillstånd är separata och att schemaläggning inte bekräftar leverans. Befintliga callbacks, tidsvalidering, SecureStore-format, default av, lokalt schemaläggnings-/avbokningsflöde, status, retry, unknown, permission och Toast är oförändrade.

## Renderad evidens

Public:

- Huvudvy: [375×844](public/reminders-375x844.png), [430×844](public/reminders-430x844.png), [375×667 utan informationsmodal](public/reminders-375x667.png), [140 % zoom](public/reminders-zoom-140-375.png).
- [Informationsmodal](public/information-modal-375.png), [träningsval](public/training-selected-375.png), [behörighet tillåten](public/permission-granted-375.png), [behörighet nekad](public/permission-denied-375.png), [sparad](public/saved-375.png), [sparar](public/saving-375.png), [fel](public/error-375.png).

Review:

- Huvudvy: [375×844 + reviewband](review/reminders-375x844.png), [430×844](review/reminders-430x844.png), [375×667 utan informationsmodal](review/reminders-375x667.png), [140 % zoom](review/reminders-zoom-140-375.png).
- [Informationsmodal](review/information-modal-375.png), [behörighet tillåten](review/permission-granted-375.png), [behörighet nekad](review/permission-denied-375.png), [sparad](review/saved-375.png), [fel](review/error-375.png).

Chromium/RN Web använde syntetiska fixtures; 18 renderingar rapporterade noll sidfel. Inga notiser schemalades och inget device permission prompt öppnades. Native notis-API, leverans, iOS/Android-inställningar, VoiceOver och Dynamic Type är **NOT TESTABLE**.

## Kontroller

- `pnpm typecheck`: PASS.
- ESLint på påminnelseskärm, gemensam rubrik och harness: PASS, 0 fel; tre befintliga unused-variable-varningar i harness kvarstår.
- `git diff --check`: PASS.
- `python3 tools/dev_flow.py validate`: PASS.
- Public/review visual-check-byggen: PASS; manuell Chromium/RN Web-rendering ovan sparad.
- Ingen testfil lades till eller testsvit kördes.

## Designregelverk §14

1. **Ja** — val av/på och tid finns i inställningsblocket; permission är separat.
2. **Ja** — val, enhetsbehörighet och status har varsin tydlig yta.
3. **Ej tillämpligt** — skärmen raderar inga ägarposter.
4. **Ej tillämpligt** — inte Hem.
5. **Ja för RN Web** — 375/430/667 och 140 % renderade; native safe area ej verifierad.
6. **Ja** — amberfärgen är opt-in påminnelseaccent; andra skärmars standardvärden ändras inte.
7. **Ja** — befintliga Ionicons och valkontroller.
8. **Ja** — varm canvas, amber opt-in, grön primärhandling; amber tokenparet har 5,38:1 kontrast.
9. **Ja** — checkbox och tid speglar befintliga preferenser.
10. **Ja** — innehållet säger lokal schemaläggning och lovar inte leverans.
11. **Ja** — ingen motivation eller notisleverans uppmuntras.
12. **Ja** — appval, permission, tidsval och infolänk beskrivs.
13. **Ja** — rubrik → kort introduktion → val → tid/spara → enhetsbehörighet.
14. **Ja för renderade tillstånd** — default, träningsval, granted/denied, saved/saving/error och info-modal renderade.
15. **Delvis / NOT TESTABLE native** — tryckytor, 44 pt tillbaka och 140 % webzoom granskade; native hjälpmedel och systemprompt ej testade.
16. **Nej för exakt panelmatch; panel saknas.**
    - **Komposition: Delvis** — tydlig amber intro och inställningskort följer rev02-kortmönster.
    - **Färger: Ja för påminnelseaccent** — varm canvas, amber och grön handling.
    - **Typografi: Ja** — vänsterställd rubrik, sektioner och hjälptext har åtskilda nivåer.
    - **Komponentformer: Delvis** — befintliga rundade valkort/inputs och modal.
    - **Objekt: Delvis** — endast befintliga val och lokal tid; ingen direkt referenspanel.
    - **Innehållstäthet: Delvis** — inställningarna kräver scroll under 844 pt tillsammans med permissionsektionen.
    - **Bildspråk: Ej tillämpligt** — skärmen använder ingen bild.
17. **Ja** — tillbaka går till Mer; spara och permission behåller sina existerande handlingar.
18. **Ja** — visade tillstånd kommer från befintliga preferenser och device permission.

Rapporten är implementerens renderingsöverlämning och inte separat QA, Reviewer eller Security.
