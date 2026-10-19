# UI-KNOWLEDGE-SEARCH — paket 3 verifiering

Datum: 2026-10-19
Branch: codex/tassla-ui-ux-bundle-2026-10-18
Status: lokal implementation checkpoint; visuella/native kriterier är öppna och ej testbara här.

## Ändringar

- Fliken Artiklar söker lokalt i de redan inlästa guider som ProductWorkspace valt för aktiv hund och ålder/ras; ingen separat hämtning eller ändring av publiceringsurvalet.
- Sökningen täcker titel och text från guide-body-parsern, med NFC, svenska gemener och komprimerade blanksteg. Å, ä och ö hålls skilda från a och o.
- Sökfältets namn och hjälprad identifierar hunden. Queryn scope:as till session och hund; vid scopebyte rensas gammal query synkront.
- Laddning/fel/retry och öppna/tillbaka bevarar sökfrågan. Inga publicerade artiklar skiljs från noll träffar; nollträff har en rensa-åtgärd.
- Den utvalda artikeln, rubriken och previewn baseras på filtrerad displayedItems-lista.

## Kontroller

| Kontroll | Resultat |
|---|---|
| Riktade sök-/content-delivery-tester | PASS, 21/21 |
| pnpm check | PASS, 564/564; app- och edge-typecheck samt ESLint |
| TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios | PASS, content-release guard samt 1 447 JS-moduler |
| git diff --check | PASS |
| python -X utf8 tools/dev_flow.py validate | PASS |
| Arkitektuppföljning av content-delivery-testets ägarskap | APPROVE; tester/content-delivery.mjs tillagd i queue write_paths och testkommandot |
| Oberoende QA | PASS; 21/21 focused, 564/564 full suite |
| Oberoende Reviewer | PASS; no code/data-scope blocker |

## Öppet visuellt och native arbete

RN Web rendering vid 375/430 och §14 = NOT TESTABLE. Checkouten saknar react-native-web och react-dom; native iOS-rendering kräver Mac. Inga skärmbilds-, visuell layout-, VoiceOver/TalkBack-, faktisk Dynamic Type-, fokusordnings- eller target-bounds-PASS hävdas. De kvarvarande sökscenarierna är överförda till UI-NATIVE-ACCESSIBILITY-VERIFY: träff/0 träff/laddning/fel/retry, artikeldetalj/tillbaka, aktiv hunds namn och hundbyte. Detta checkpoint omfattar lokal kod och tester.

Ingen Supabase/RLS-, Codemagic- eller signerad native build-kontroll har gjorts.
