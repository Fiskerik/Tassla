# UI-ACTIONS-COMMON — verifiering

Datum: 2026-10-18. Lokal kodcheckpoint; ingen commit/push.

## Ändrat
- Bekräftad lyckad logg-add använder en ikonknapp med `return-up-back-outline` och tillgängligt namn `Ångra: {toastmeddelande}`. Alertrollen/live announcement sitter på meddelande-Texten; knappen ligger som separat fokuserbart syskon. Retry och Avbryt har fortsatt text och befintliga callbacks.
- Datum- och tidsfält visar kalender-/klockikon med fältbundet svenskt tillgänglighetsnamn och bibehållen värde-/manuell inmatning.
- Föregående/nästa månad är ikonknappar med månad och riktning i a11y-namn. Ren månadsförflyttningshjälpare hanterar årsskiften.
- Datumdialogen använder 8pt sidoinset och 8pt kortpadding. Vid 375pt viewport blir kalendern 343pt bred; dagcellerna är 44×44pt.

## Verifiering
- Riktade tester: 12/12 PASS (`toast-compact-policy`, `planned-health-time`, `calendar-month`).
- `CI=1 pnpm check`: typecheck, edge typecheck, lint och 521/521 tester PASS.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`: public guard och iOS JS bundle-export PASS.
- `node tools/inventory-ui-actions.cjs`: 121 filer, 0 parsefel, 416 actions; Markdown/CSV regenererade.
- `git diff --check` PASS; Windows LF/CRLF-normaliseringsvarningar gäller tidigare ändrade contentfiler, ingen whitespace-felrad rapporterades.
- `python tools/dev_flow.py validate` PASS med `PYTHONUTF8=1` (utan UTF-8-läge misslyckas Windows utskrift på äldre svenska tecken, inte valideringen).

## Oberoende QA
- QA PASS efter separat källgranskning och ny riktad körning (12/12); ingen blockerare.

## Oberoende Reviewer
- Reviewer PASS, inga blockerande fynd; installerade icon names, Button API, gating, accessibility, callbackbevarande och testunderlag verifierade. Native rendering, VoiceOver och faktisk enhetslayout är fortsatt NOT TESTABLE.

## Kvarstående
- Ingen lokal native UI-renderer/enhet användes; visuell pixeljämförelse, iOS VoiceOver, Dynamic Type, fysisk träffyta och layout på 375pt är **NOT TESTABLE**. Gridbredden verifierades genom styles/token-test (343pt mot 308pt minimum) och cellmåtten genom källtest.
- Codemagic/native archive/signering ingår inte i denna lokala UI-checkpoint.
- Full funktion av caller-flöden är inte native-testad.
