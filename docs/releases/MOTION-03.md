# MOTION-03 — Tips vid första användning

Datum: 2026-10-10
Paket-ID: MOTION-03
Status: lokal implementation, QA och Reviewer PASS; commitcheckpoint `117c406`
Jämförelsebas: `9012b1d` (MOTION-02 branch delivery on `motion-02-phone-qa`)
Leveranscommit: `117c406` (lokal MOTION-03 + releasehistory-checkpoint)
TestFlight-version/build: okänd
GitHub Release: skapas inte automatiskt

## Major changes

Implementerat lokalt: ett ägarbundet, avfärdbart förstaanvändningstips om `Fler` i LogScreen.

## Minor changes

Förstaanvändningsläsning, skrivning och radering serialiseras per ägarnyckel. Misslyckad skrivning stoppar remount-läsning; kontoradering sätter tombstone och en pågående skrivning kan inte återskapa nyckeln.

## Bug-fixes

Inga.

## Verifiering och kända begränsningar

Plan/spec v4 har Architect APPROVE och Critic PROCEED; Product godkände copy “Tryck på Fler för fler loggtyper.”. Compliance bedömde den begränsade SecureStore-flaggan som personuppgift men utan implementeringsblockerare vid ägarseparation, minimering och cleanup vid kontoradering. Slutlig beta-rättslig grund/integritetsinformation är fortfarande öppen.

`pnpm check` passerar: båda typkontrollerna, lint 0 fel/35 varningar och 29/29 testfiler. Fokuserad MOTION-03 QA, iOS-export (1 416 moduler), `git diff --check` och queue validation PASS. Oberoende QA och Reviewer PASS efter att deras två racefynd rättats. Hook-livstid, SecureStore-köordning, owner switch, remount och write/delete testas med isolerade harnesses; native rendering ersätts inte av dessa tester. Tassla Consumer UX-skill och designreglerna är lästa. Fysisk/native/visuell kontroll är NOT TESTABLE tills Erik gör den gemensamma mobil-QA:n enligt beslut 0005.

## Nästa sprint/paket

Skapa och kontrollera commitcheckpoint innan MOTION-04 startar. Den gemensamma telefonrundan sker efter de fortsatta MOTION-slicarna.
