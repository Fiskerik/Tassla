# MOTION-04 — Valpfigur

Datum: 2026-10-10
Status: implementation lokalt klar; oberoende QA och Reviewer PASS; committad lokalt men inte pushad
Jämförelsebas: `9012b1d` (MOTION-02 branch delivery on `motion-02-phone-qa`)
Leveranscommit: `ac2b940` (lokal checkpoint på `motion-03-first-use-tip`)
TestFlight-version/build: okänd

## Major changes

Implementerat lokalt: illustrerad valpfigur med kort engångsreaktion efter en bekräftad ny loggning eller ett bekräftat träningssteg. Inställningen för reducerad rörelse läses via samma prenumeration och query; reaktionsnyckeln konsumeras först när inställningen är färdigläst.

## Minor changes

Ingen ytterligare ändring.

## Bug-fixes

Inga.

## Verifiering och kända begränsningar

`pnpm check` PASS (30 testfiler, 0 fel/skip; lint 0 fel och 35 varningar), iOS-export PASS (1,418 moduler), `git diff --check` och queue validation PASS. Oberoende QA och Reviewer PASS efter rättning av en race mellan laddning av reducerad rörelse och reaktionsnyckeln. Renderad/native QA, VoiceOver/TalkBack, stor text och telefon är NOT TESTABLE här och lämnas till Eriks samlade mobil-QA. Den transparenta asseten och metadata är dokumenterade under `assets/images/README.md`. Befintlig träningssekvens verifierades; inget persistent eller affärsrelaterat animationstillstånd infördes.

## Nästa sprint/paket

Paketet är inte pushat och Codemagic/TestFlight-build är okänd. Lägg in den renderade/native kontrollen i Eriks samlade mobil-QA. Efter push flyttas releaseloggen till `HISTORY-2026.md` enligt Eriks dokumentationsregel.
