# MOTION-02 — Bekräftad rörelse i Logga och Träning

Datum: 2026-10-10
Paket-ID: MOTION-02
Status: pushad branch för telefonprov; oberoende QA/Reviewer PASS
Jämförelsebas: `4267d457` (`origin/main`)
Leveranscommits: `a020779` (MOTION-02) och `bff79b9` (whitespace-korrigering) på `motion-02-phone-qa`
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

Architect godkände och Critic gick vidare med plan/spec v4 och därefter korrigeringskontraktet. Efter korrigeringen passerar `TZ=Europe/Stockholm pnpm check`: typecheck, edge typecheck, lint (0 fel/35 varningar) och 399/399 tester, 0 skip. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`, riktade fyra policytestfiler, `git diff --check` och queue validation passerar. Förnyad oberoende code QA och Reviewer PASS; inga kodfynd. Pre-commit och pre-push-hookarna passerade efter whitespace-korrigering av 20 äldre filer; avsiktliga Markdown-radbrytningar bevarades med `<br>`. Branchen är pushad till GitHub. Renderad skärmbild, VoiceOver/TalkBack, stor Dynamic Type och native motion är **NOT TESTABLE** här; TestFlight/build är okända.

Lokal kod-/testdiff SHA-256 mot `origin/main`: `42e14559522f5c1fc236d857d3646b044a3a2868df512ca601976d044cbed14c`. Pushad branch: [motion-02-phone-qa](https://github.com/Fiskerik/Tassla/tree/motion-02-phone-qa).

## Nästa sprint/paket

Nästa steg: bygg branchen i Codemagic och låt Erik telefonprova MOTION-02. MOTION-03 väntar tills telefonprovet är klart och Erik väljer att gå vidare.
