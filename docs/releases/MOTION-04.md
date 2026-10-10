# MOTION-04 — Valpfigur

Datum: 2026-10-10
Status: planutkast v1; implementation väntar på MOTION-03-checkpoint
Jämförelsebas: `9012b1d` (MOTION-02 branch delivery on `motion-02-phone-qa`)
Leveranscommit: ej skapad
TestFlight-version/build: okänd

## Major changes

Planerat: en illustrerad valpfigur med kort engångsreaktion efter en bekräftad loggning eller ett bekräftat träningssteg.

## Minor changes

Inga implementerade ändringar.

## Bug-fixes

Inga.

## Verifiering och kända begränsningar

Plan v1 använder befintlig `Animated`, en genererad transparent bild eller RN-fallback, bekräftade affärshändelser och befintlig toastcopy. Ingen appkod eller bildasset är skapad. Architect APPROVE och Critic PROCEED gavs 2026-10-10 på exakt v1. Ingen renderad eller native QA har körts. Vid implementation ska befintlig tränings-resetsekvens verifieras; inget nytt persistent eller affärsrelaterat animationstillstånd ska införas.

## Nästa sprint/paket

Slutför MOTION-03:s lokala QA, oberoende Reviewer och hållbara checkpoint. Planreview är klar. Därefter byggs MOTION-04 med egen QA/Reviewer före Eriks gemensamma mobil-QA.
