# R02-4G Konto och betainformation — renderingsrapport och §14-egenkontroll

Datum: 2026-10-13 · Branch: `design/vision-rev02` · UX-spec: `docs/plans/VISION-REV02-R02-4G-ACCOUNT-UX-SPEC.md`<br>
Status: implementerad/renderad. Owner QA och oberoende Reviewer/Security för denna senare slice väntar. Ingen konto-/betainformationspanel finns i referensbilden.

## Resultat och kontrakt

Konto och betainformation har vänsterställd blå kontoaccent, varm canvas och tydlig separation mellan navigering, frivillig användningsmätning och den destruktiva kontoraderingsytan. Betainformationen har fått rubriker för skumning; befintliga upplysningar om vad som sparas, betans begränsning och gallringens ej verifierade status är oförändrade. Supportlänk, consent, marker, tvåstegsbekräftelse, raderingsutfall, lokal cleanup och signout följer samma callbacks och regler som före ändringen.

## Renderad evidens

Public:

- Konto: [375×844](public/account-375x844.png), [430×844](public/account-430x844.png), [375×667](public/account-375x667.png), [140 % zoom](public/account-zoom-140-375.png).
- Beta: [375×844](public/beta-info-375x844.png), [430×844](public/beta-info-430x844.png), [375×667](public/beta-info-375x667.png), [140 % zoom](public/beta-info-zoom-140-375.png).
- Konto: [analytics loading](public/analytics-loading-375.png), [samtycke på](public/analytics-on-375.png), [analyticsfel](public/analytics-error-375.png), [sparar samtycke](public/saving-analytics-375.png), [radering failed](public/failed-375.png), [unknown](public/unknown-375.png), [unavailable](public/unavailable-375.png), [confirmed](public/confirmed-375.png), [blocked](public/blocked-375.png), [cleanupfel](public/cleanup-failed-375.png), [signoutfel](public/signout-failed-375.png).

Review:

- Konto: [375×844 + reviewband](review/account-375x844.png), [430×844](review/account-430x844.png), [375×667](review/account-375x667.png), [140 % zoom](review/account-zoom-140-375.png).
- Beta: [375×844](review/beta-info-375x844.png), [430×844](review/beta-info-430x844.png), [375×667](review/beta-info-375x667.png), [140 % zoom](review/beta-info-zoom-140-375.png).
- Statusrenderingar inkluderar [analyticsfel](review/analytics-error-375.png), [samtycke på](review/analytics-on-375.png), [sparar samtycke](review/saving-analytics-375.png) och [radering failed](review/failed-375.png).

Fixtures är syntetiska. Webrendern verifierar inte supportmejl, SecureStore-lifetime, serverradering, lokal data-cleanup, OS-native tvåstegs-Alert eller verklig analyticslagring; dessa är **NOT TESTABLE** här.

## Kontroller

- `pnpm typecheck`: PASS.
- ESLint på konto-/betaskärmar och harness: PASS, 0 fel; tre befintliga unused-variable-varningar i harness kvarstår.
- `git diff --check`: PASS.
- `python3 tools/dev_flow.py validate`: PASS.
- Public/review visual-check-byggen: PASS; renderbilder sparade ovan.
- Ingen testfil lades till eller testsvit kördes.

## Designregelverk §14

1. **Ja** — navigering, analytics och kontoradering har åtskilda grupper.
2. **Ja** — destructive status och åtgärder ligger samlade.
3. **Delvis / NOT TESTABLE native** — radering kräver befintlig tvåstegs-Alert; native bekräftelse visades inte i browser.
4. **Ej tillämpligt** — inte Hem.
5. **Ja för RN Web** — 375/430/667 och 140 % renderade; native safe area ej verifierad.
6. **Ja** — blå kontoaccent är opt-in och destructive använder befintliga danger tokens.
7. **Ja** — befintliga Ionicons och native Switch-komponent.
8. **Ja** — varm canvas, blå kontoaccent och röd destruktiv yta; tokenparen följer befintlig kontrastpalett.
9. **Ja** — analytics-switchens state och tillgänglighet speglar consent-värdet.
10. **Ja** — beta- och raderingstextens sakliga begränsningar behålls.
11. **Ja** — ingen marknadsföring eller otillbörlig uppmaning till samtycke tillagd.
12. **Ja** — support, betainformation, frivilligt samtycke och radering är synliga.
13. **Ja** — konto → hjälp → mätning → kontoradering; betavyn grupperar disclosure.
14. **Ja för renderade tillstånd** — public visar analytics loading/on/error/saving och raderingens failed/unknown/unavailable/confirmed/blocked/cleanup/signout; review innehåller huvudlägen plus analytics- och ett raderingsfel.
15. **Delvis / NOT TESTABLE native** — switch/knappar och 140 % webzoom granskade; VoiceOver, native Switch och Alert ej verifierade.
16. **Nej för exakt panelmatch; panel saknas.**
    - **Komposition: Delvis** — referensens kortmönster används för konto-/betaresor.
    - **Färger: Ja för konto-/dangerroller** — blå stödaccent och befintlig destructive-röd.
    - **Typografi: Ja** — vänsterställd rubrik och gruppnivåer skiljs åt.
    - **Komponentformer: Delvis** — rundade kort, korta rader och switch.
    - **Objekt: Ej direkt jämförbart** — konto-/privacyobjekt saknas i hemvisionen.
    - **Innehållstäthet: Delvis** — flera kontoutfall finns under scroll; disclosure är avsiktligt lång.
    - **Bildspråk: Ej tillämpligt** — ingen bild används.
17. **Ja visuellt** — tillbakaåtgärd går till Mer respektive Konto; raderingens tvåstegskontrakt är kvar.
18. **Ja** — betatexten anger uttryckligen att den inte ersätter fullständig integritetspolicy och att gallring ej verifierats.

Rapporten är implementerens renderingsöverlämning och inte separat QA, Reviewer eller Security.
