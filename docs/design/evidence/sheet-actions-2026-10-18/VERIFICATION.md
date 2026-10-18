# UI-SHEET-ACTIONS-01 — lokal verifiering 2026-10-18

Checkpoint: arbetsdiff på codex/age-content-multi-dog. Befintlig CONTENT-PUBLISH-LABEL-01-diff bevaras separat. Referens: vision_rev02.jpg och ägarens uttryckliga BottomSheet-patch. Inga ändringar av databas, persondata, dependencies eller bred knappmigration.

## Körda kontroller
- `node --experimental-strip-types --test tests/sheet-dismiss.test.mjs`: PASS, 24/24. Avstånd/hastighet/dominans, guards via gemensam stängväg, latest committed callback, nekad stängning, hide/reopen, ny dragning före timer, reduced motion, avbruten dragning och animations-/timerstädning.
- `CI=1 pnpm check`: PASS, TypeScript, edge-account TypeScript, ESLint, 517/517 tester.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`: PASS, JS/Hermes-export till dist/ios. Detta är inte en Xcode/native-arkivering.
- `node tools/inventory-ui-actions.cjs`: PASS, 120 parserlästa källfiler, 0 parserfel; 416 kontroll-/actionkodplatser, varav 303 app, 48 delade renderers och 65 preview/galleri. Dynamiska värden är källuttryck; 8 system-API-platser ingår. Native systemknapparnas utseende styrs av OS.
- `git diff --check`, separat whitespacekontroll av nya filer och `python tools/dev_flow.py validate`: PASS.

## Designregler §14
| Punkt | Bedömning | Underlag och gräns |
|---|---|---|
| 1 primär handling | Ja i källkod | Befintlig footer/primaryAction oförändrad; ingen ny CTA |
| 2 jämställda handlingar | Ej tillämpligt för nya knappar | Ingen jämställd knapp tillagd |
| 3 radera | Ej tillämpligt | Inga raderingskontrakt ändrade |
| 4 Hem-rader | Ej tillämpligt | Ingen Hem-rad ändrad |
| 5 avstånd/safe area | NOT TESTABLE visuellt | Befintliga tokens/insets bevaras; nytt handtag utan render |
| 6 tokens | Ja i källkod | Handtag/grabArea använder befintliga tokens |
| 7 ikonfamilj | Ja i källkod | Befintligt Ionicons-kryss; framtida ikonförslag verifierade i installerad glyph map |
| 8 färg/kontrast | NOT TESTABLE visuellt | Befintliga färgtokens; ingen render/kontrastmätning på enhet |
| 9 symbol/handling | Ja i källkod | Kryss/gest begär samma stängning; dekorhandtaget ändrar inte sparstatus |
| 10 sparstatus | Ja i källkod | Inga statusbadges eller bekräftelser tillagda |
| 11 banners | Ej tillämpligt | Inga banners tillagda |
| 12 copy | Ja i källkod | Befintlig rubrik/knappcopy behålls |
| 13 copy/bildandel | Ej tillämpligt | Ingen artikel-/kortkomposition ändrad |
| 14 loading/empty/error-render | NOT TESTABLE visuellt | Controllerfall testade, riktiga renderade skärmtillstånd saknas |
| 15 44 pt, text, a11y, motion | Delvis kod-PASS; native NOT TESTABLE | Kryss behåller touchMin, handtag dolt för skärmläsare, reduced motion tests PASS; VoiceOver, stora textlägen, tangentbord och gest responder på enhet ej körda |
| 16 rev02 visuell matchning | NOT TESTABLE | Komposition, färger, typografi, former, bildspråk och täthet saknar aktuella jämförelsebilder |
| 17 navigation/tillbaka | Kod-PASS; native NOT TESTABLE | Android-back, backdrop/kryss/gest går via samma callback; ingen fliknavigation ändrad |
| 18 hund-/bildroll | Ej tillämpligt | Ingen hund-/bildprojektion ändrad |

Ingen aktuell RN Web-render kan startas utan react-native-web/react-dom; paketen är inte installerade och inga nya dependencies tillförs i denna slice. Inga skärmbilder finns, ingen visuell acceptans påstås. Native gest, VoiceOver, Android-back och tangentbord måste kontrolleras på enhet. Ingen live Supabase-/RLS- eller Codemagic-körning gjordes eller krävs av denna lokala gestslice.

## Kritiska manuella prov för just denna ändring
1. Dra långt/kort/snabbt från rubrik/handtag; en kort dragning ska återgå utan stängning.
2. Scrolla en lång sheet utan att innehållsscroll stänger panelen. Tryck på krysset och backdrop som tidigare.
3. Öppna/stäng/öppna och upprepa snabbt; panelen börjar på rätt plats.
4. Ändra händelse med tangentbord öppet. Ändra osparad rutin/checklistepunkt och prova neddrag samt fortsätt/avbryt i discard-flödet.
5. Prova stängning under sparning samt reducerad rörelse och VoiceOver. Android-back provas om Android-enhet finns.

Framtida ikon-, stor-text-, sök- och refreshpaket i planen är inte levererade här.

## Oberoende granskning
Architect APPROVE plan v1; Critic PROCEED efter konkretisering av ägarens ikonexempel och inventeringens täckning. QA PASS för de 24 riktade testerna, byte-identisk inventeringsregenerering och källgranskade caller-guards. Reviewer PASS utan blockerare. Controller-testet modellerar nekad stängning; hela formulärets affärsguard är källgranskad, inte körd på enhet. Native och visuellt kvarstår NOT TESTABLE. Checkpoint är arbetsdiffen; ingen commit/push är beställd här.
