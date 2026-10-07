# BUILD-02 release-logg

Datum: 2026-10-07
Paket-ID: BUILD-02 korrigering
Status: implementerad lokalt; redo för commit/push
Jämförelsebas: commit `b2935e7` (UX-02 leveranscheckpoint)
Leveranscommit: `8e99d32`
TestFlight-version/build: okänd

## Major changes

Inga nya användarflöden. Codemagic-workflowet sparar nu kontroll- och Xcode-buildens stdout/stderr som `codemagic-logs/check-application.log` respektive `codemagic-logs/xcode-build-ipa.log`, och publicerar dem som artifacts även när steget returnerar fel.

## Minor changes

Det befintliga `/tmp/xcodebuild_logs/*.log`-mönstret och IPA-artifacten behålls. Dokumentationen beskriver nu vilken logg som ska hämtas först.

## Bug-fixes

Rättade två källbaserade regressionstester som fortfarande förväntade UX-01:s gamla inline-feedback: planned-health-testet följer den stabila `shownRef`-callbacken och profile-testet verifierar lokal framgångsfeedback i actionkortet.

## Verifiering och kända begränsningar

Direkt Node-testsvit: 350/350 PASS. ESLint på `app src tests`: PASS. `git diff --check`: PASS. YAML/artifactuppladdning och Codemagic-maskinens faktiska loggsökväg måste verifieras av nästa Codemagic-körning. `pnpm check` lokalt är fortsatt begränsat av OneDrive/pnpm-EPERM, men samma testfel från den bifogade Codemagic-loggen passerar lokalt efter korrigeringen.

## Nästa sprint/paket

Starta en ny Codemagic-körning och ladda ned `codemagic-logs/check-application.log` eller `codemagic-logs/xcode-build-ipa.log` vid nästa fel. Skapa inte GitHub Release automatiskt.
