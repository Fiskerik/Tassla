# MOTION-02 — Bekräftad rörelse i Logga och Träning

Datum: 2026-10-10
Paket-ID: MOTION-02
Status: committad lokalt och oberoende QA/Reviewer PASS; push stoppad av pre-push-whitespacekontroll
Jämförelsebas: `4267d457` (`origin/main`)
Leveranscommit: `965cb94` på `motion-02-phone-qa` (push ej genomförd)
TestFlight-version/build: okänd; telefon-QA av tidigare main-merge är användarrapporterad
GitHub Release: skapas inte automatiskt

## Major changes

- Loggradens diskreta entré spelas en gång när en ny sparad rad är synlig. Radering behåller en enda inert snapshot tills borttagningen är bekräftad och spelar därefter en kort exit.
- Publicerad träningsrad får en kort bockanimation endast för exakt nytt steg efter lyckad read-back. Klart-status exponeras i raden som “Genomförd”.

## Minor changes

- Rörelselängder kommer från befintliga tokens och respekterar reducerad rörelse. QuickLogTile, befintlig toast, undo och dubblettskydd är oförändrade.
- Loggradens mutationsnyckel konsumeras vid entréns start. Reduced motion som slås på mitt i rörelsen avslutar den direkt; att slå av igen spelar inte om samma mutations entré.

## Bug-fixes

Ingen separat bugg rapporterad. Detta är en ny bekräftad motion-slice.

## Verifiering och kända begränsningar

Architect godkände och Critic gick vidare med plan/spec v4 och därefter korrigeringskontraktet. Efter korrigeringen passerar `TZ=Europe/Stockholm pnpm check`: typecheck, edge typecheck, lint (0 fel/35 varningar) och 399/399 tester, 0 skip. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`, riktade fyra policytestfiler, `git diff --check` och queue validation passerar. Förnyad oberoende code QA och Reviewer PASS; inga kodfynd. Commitens pre-commit passerade (398 pass, 1 skip, 0 fail). Pre-push `pnpm check` passerade, men push stoppades av full-tree whitespace-kontrollen med äldre whitespace-fynd i 45 filer utanför MOTION-02-scope. Ingen hook bypassades. Renderad skärmbild, VoiceOver/TalkBack, stor Dynamic Type och native motion är **NOT TESTABLE** här. Commit `965cb94` finns på `motion-02-phone-qa`, men är inte pushad; TestFlight/build är okända.

Lokal kod-/testdiff SHA-256 mot `origin/main`: `42e14559522f5c1fc236d857d3646b044a3a2868df512ca601976d044cbed14c`. Commiten finns; pushen inväntar hantering av äldre whitespace-fynd utan hook-bypass.

## Nästa sprint/paket

Nästa checkpoint: pusha `motion-02-phone-qa` efter att pre-push-whitespacefynden hanterats utan hook-bypass. MOTION-03 väntar tills Erik har testat MOTION-02 på telefon och valt att gå vidare.
