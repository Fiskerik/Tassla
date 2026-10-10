# BUILD-35 – Codemagic-korrigering

Datum: 2026-10-09. Status: lokalt verifierad och kod pushad till `remove-ai-slop`. Jämförelsebas: `0bc15bc` (remote vid start); lokal dokumentationscheckpoint `383f003`. Kodcommit: `94686aaa8e717aaca069fde8ae5cc960d2fbc287`, verifierad på remote. TestFlight-version/build: okänd. Ingen GitHub Release har skapats för detta paket.

## Major changes

Inga.

## Minor changes

Inga.

## Bug-fixes

Rättat TS2305 i `MainSwipeNavigation.tsx`: `ReactNode` importeras från `react`. Svepresponder och sidnavigering har stabila callbacks och atomiskt state för aktuell/föregående sida. De tre därefter blottlagda lintfelen är rättade, med ett lokalt dokumenterat lintundantag där kennelkopplingen måste döljas synkront vid hundbyte. Två föråldrade testassertioner har uppdaterats efter befintlig `attributionBusy`-spärr respektive notifieringshandlerns nya dependency-lista. Ingen avsedd ändring av gest eller navigationsbeteende.

## Verifiering och kända begränsningar

Låst installation passerade. Oberoende QA: `pnpm check` **PASS**, inklusive två TypeScript-kontroller, lint och 387 godkända tester, ett överhoppat och noll fel. Riktade notifieringstester 42/42 och kontoraderingstester 39/39 passerade. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`, `git diff --check` och kövalidering passerade. Testernas underprocess behövde extra sandbox-behörighet lokalt; utan den gav miljön `EPERM`. Expo-telemetri stängdes av för att undvika skrivning utanför arbetsytan. Oberoende Reviewer gav **PASS** för kod/API:er och förnyad dokumentationscheckpoint. Renderad/native visuell QA, signerad Codemagic-build och TestFlight är **NOT TESTABLE** i denna lokala kontroll.

## Nästa sprint/paket

Nästa steg: kör en ny Codemagic-byggning på kodcommit `94686aaa8e717aaca069fde8ae5cc960d2fbc287` och granska dess artefakter. Ingen automatisk publicering genom detta dokument.
