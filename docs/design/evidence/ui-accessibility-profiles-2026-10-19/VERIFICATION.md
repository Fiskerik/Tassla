# UI-ACCESSIBILITY-PROFILES — 2b.3 verifiering

Datum: 2026-10-19
Branch: `codex/tassla-ui-ux-bundle-2026-10-18`
Status: lokal implementation checkpoint committed och pushad; visuellt/native acceptansarbete är fortsatt öppet.

## Ändringar

- Profilregistreringens introduktionskort staplas vid bredd under 360 pt eller fontScale ≥ 1,25; text kan radbrytas inom kortet.
- Profilredigeringens introduktionskort staplas vid samma brytpunkt.
- I hundväljaren placeras markeringen “Aktiv” under namn och ålder vid smal vy/stor text; standardlayouten behåller markeringen till höger.
- Rasnamn och kennelvalstext kan flexa och radbrytas utan att minska befintliga valytor.
- Hund-/kontogeneration, hundbyte, spara/fel/unknown/conflict, create-request-ID, createDog, readback/recovery och profilcallbacks är oförändrade.

## Lokala kontroller

| Kontroll | Resultat |
|---|---|
| `node --experimental-strip-types --test tests/profile-screen-policy.test.mjs tests/profile-edit.test.mjs` | PASS, 31/31 |
| `CI=1 pnpm check` | PASS, 554/554; app-/edge-typecheck och ESLint |
| `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` | PASS, 1 446 JS-moduler |
| `git diff --check` | PASS |
| `python -X utf8 tools/dev_flow.py validate` | PASS efter fasplan-/köändring |
| Oberoende statisk QA mot lokala v5-kriterier | PASS |
| Oberoende kodgranskning av implementation | PASS; ingen profil-/säkerhetslogik ändrad |
| Security pre-review / fryst källdiff | APPROVE / APPROVE |
| UX Critic av v5-avgränsningen | PROCEED WITH AMENDMENT |
| Reviewer av slutlig dokumentationsdiff | PASS; checkpoint commit/push PASS |

## Öppet visuellt och native arbete

`RN Web render 375×667/140% = NOT TESTABLE`. Checkouten saknar `react-native-web` och `react-dom`; native iOS-rendering kräver Mac. Därför påstås ingen renderad layout-, skärmbilds-, §14-, VoiceOver/TalkBack-, fysisk Dynamic Type-, tangentbords-/safe-area- eller target-bounds-PASS. De här scenarierna är tillagda i `UI-NATIVE-ACCESSIBILITY-VERIFY`: hundlista/val, redigering och spara/avbryt, lägga till hund med bekräftad respektive unknown/recovery-status, fel/återförsök och återväg; kör med tangentbordet synligt och dokumentera verklig enhet, OS, textstorlek, fokus/etiketter och målgränser. Allt som inte körs ska stå NOT TESTABLE.

Ingen Supabase/RLS-, Codemagic- eller signerad native build-kontroll har gjorts. Security återbekräftade APPROVE efter v5-dokumentändringen; källdiffen var oförändrad. Oberoende Reviewer PASS för den fullständiga v5-diffen. Lokal checkpoint: commit `3094b6a` (`fix: improve dog profile responsive layout`), pushad till `origin/codex/tassla-ui-ux-bundle-2026-10-18`; commit- och push-hook körde fulla kontroller med 554/554 PASS. Köstatusen avser endast lokal implementation, inte full native/visuell acceptans.
