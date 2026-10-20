# UI-ACCESSIBILITY-PASSPORT — 2b.4 verifiering

Datum: 2026-10-19
Branch: `codex/tassla-ui-ux-bundle-2026-10-18`
Status: responsiv layout implementerad; fryst diff inväntar QA/Reviewer/Security final.

## Ändringar

- Vid bredd under 360 pt eller fontScale ≥1,25 staplas rubrik-/stängområdet; stängknappen behåller minst 44 pt mål och är högerställd när rubriken staplas.
- Urvalstext och förhandsvisningsvärden kan krympa och radbrytas; ikoner och kryssrutor krymper inte.
- Varje urval exponeras som checkbox med explicit namn samt befintligt checked/disabled-state.
- Ändringarna är presentation och tillgänglighetsnamn. Ägarinitierat exportflöde, sektionernas urval, snapshot, hund-/kontoskydd, PDF, native share, filägande/städning och fel-/unknown-/dialog-stängd semantics är oförändrade.

## Kontroller

| Kontroll | Resultat |
|---|---|
| `node --experimental-strip-types --test tests/passport.test.mjs` | PASS, 32/32 |
| `pnpm check` efter slutlig kodändring | PASS, 555/555 tester |
| Offentlig `pnpm bundle:ios` efter slutlig kodändring | PASS, 1 446 JS-moduler |
| `git diff --check` | PASS |
| `python -X utf8 tools/dev_flow.py validate` | PASS |
| Security pre-implementation review | APPROVE för responsiv layout med explicita exportgränser |
| Frozen-diff Security final | Väntar |
| Oberoende QA / Reviewer | Väntar |

## Render/native begränsning

`RN Web render 375×667/140% = NOT TESTABLE`. Miljön saknar `react-native-web` och `react-dom`; native iOS-rendering kräver Mac. Inga screenshot-, render-, §14-visuella, native share-sheet, VoiceOver/TalkBack, Dynamic Type, focus-order, target-bounds eller faktisk share-result PASS hävdas. Dessa scenarier ligger i `UI-NATIVE-ACCESSIBILITY-VERIFY`, inklusive att togglade sektioner bevaras och att preview/PDF innehåller endast valda sektioner. Dela inte dokumentet med någon mottagare i device-verifieringen; stäng share sheet efter att den öppnats.

Ingen Supabase/RLS-, Codemagic- eller signerad native build-kontroll har gjorts.
