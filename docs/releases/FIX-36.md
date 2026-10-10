# FIX-36 – påminnelsetid och loggkategorier

Datum: 2026-10-10. Status: implementerad och pushad; QA och oberoende code review PASS. Bas: `3adf73d` (`remove-ai-slop`, UI-07 checkpoint). Leveranscommit: `e29a5fb`; TestFlight-build okänd. Ingen GitHub Release skapad.

## Major changes

Inga.

## Minor changes

Ny ren HH:MM-parser i Hälsa godtar giltigt lokalt klockslag och skickar minuter sedan midnatt.

## Bug-fixes

Utvecklingsfel rättat före leverans: regexen matchade bokstaven `d` i stället för siffror, så giltiga tider avvisades. Parsern returnerar 0 för 00:00 och 1439 för 23:59, och avvisar fel format/tider utanför dygnet. `Olycka`/`Vatten` stöds lokalt i appkontrakt och migrationscheckar; ingen fjärrmiljöändring gjordes.

## Verifiering och kända begränsningar

Plan v2 Architect **APPROVE**, Critic **PROCEED**, independent QA och Reviewer **PASS**. `pnpm check` PASS (389 pass, 1 skip, 0 fail), iOS-export PASS, fokuserat parserprov PASS, diff- och kövalidering PASS. `EventType`, loggtyp-unioner, insertväg och migrationsfiler 202610040001/202610090001 innehåller `accident` och `water` inklusive shape-checken. Fjärrens migrationshistorik, faktisk live-constraint och runtime/RLS är **NOT TESTABLE**: ingen Supabase CLI, `.env` eller länkad projektkontext finns. Nästa säkra steg är read-only schemaintrospektion med godkänd projektåtkomst; runtime kräver separat syntetiskt utvecklingsprov. Ingen migration/deploy utförd.

## Nästa sprint/paket

Vidare kontroll av fjärrschema/runtime kräver senare en godkänd utvecklingsmiljö och läsåtkomst. Ingen migration/deploy i denna uppgift.
