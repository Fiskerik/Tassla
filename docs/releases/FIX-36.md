# FIX-36 – påminnelsetid och loggkategorier

Datum: 2026-10-10. Status: planerad. Bas: `223b306` (`remove-ai-slop`). Leveranscommit/build okända; ingen GitHub Release skapad.

## Major changes

Inga.

## Minor changes

Planerat: korrigera validering av påminnelsetid i Hälsa.

## Bug-fixes

Planerat: giltig HH:MM-tid avvisas för närvarande av en felaktig regex. `Olycka` och `Vatten` granskas i spar-/schemaflödet.

## Verifiering och kända begränsningar

Planen granskas före kod. Lokal migration innehåller redan `accident` och `water`; verklig målmiljö är ännu inte kontrollerad. Ingen migration/deploy planeras.

## Nästa sprint/paket

Kör `pnpm check`, iOS-export, diff- och kövalidering; separat native-/databasprov endast om tillgängligt och utan skrivande deploy.
