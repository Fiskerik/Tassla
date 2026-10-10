# FIX-36 – påminnelsetid och loggkategorier

Datum: 2026-10-10. Status: implementerad; QA och oberoende code review PASS. Bas: `4f2b634` på `remove-ai-slop` (UI-07 checkpoint).

## Mål och avgränsning

Göra det möjligt att spara en giltig påminnelsetid i Hälsa och avvisa värden utanför ett dygn. Verifiera att loggtyperna `accident` och `water` redan finns i appens kontrakt och migrationshistorik. Ingen ny datamodell, migration eller ändring av loggflödet om lokal kod/migration redan stödjer typerna.

## Plan

1. **Implementer:** isolera ren tidsparser i `src/features/health/planned-health-time.ts`, använd den i `PlannedHealthScreen.tsx`, och lägg gränstest i `tests/planned-health-time.test.mjs`. Acceptera `00:00`, `23:59`, normalisera yttre whitespace; avvisa `24:00`, `12:60`, fel format och ensiffriga fält. Felet som motiverar rättningen är regexen `/^(d{2}):(d{2})$/`, som matchar bokstaven `d` i stället för siffror.
2. **Koordinator:** kontrollera och redovisa separat (a) lokal `EventType` och formulär-/insertväg, (b) lokala migrationsfiler, (c) fjärrens applicerade migrationshistorik, (d) faktisk `dog_events`-constraint via read-only schemaintrospektion om säker åtkomst finns. Skicka inte migration/deploy och läs/logga inga credentials. Migrationshistorik bevisar inte ensam aktuell constraint; constraint och runtime/RLS markeras separat NOT TESTABLE om de inte kan läsas/provas. Ange då nästa säkra steg som read-only schemaintrospektion med projektåtkomst; runtime kräver separat syntetiskt skrivprov i godkänd utvecklingsmiljö.
3. **QA/Reviewer:** kör `pnpm check`, iOS-export, diff- och kövalidering; verifiera parserresultat `00:00 → 0`, `23:59 → 1439`, whitespace, ogiltiga format/gränser samt sparvägen där enabled skickar minuter och disabled fortsatt `null`. Bekräfta att ingen schemaändring tillkom. Om målmiljön inte är åtkomlig, markera respektive lager NOT TESTABLE och ange konkret nästa steg.

## Ändrade filer och acceptans

Avsedda app-/testfiler: `src/features/health/PlannedHealthScreen.tsx`, `src/features/health/planned-health-time.ts`, `tests/planned-health-time.test.mjs`, eventuellt `tests/README.md`. Plan, kö, rapport och `docs/releases/FIX-36.md` dokumenterar status. Inga nya beroenden.

Acceptans: valideraren accepterar endast 00:00–23:59 i HH:MM-format och returnerar rätt minutvärde; sparvägen behåller enabled/disabled-semantik. Lokal kontrakts- och migrationssupport för `accident`/`water`, fjärrens migrationshistorik, faktisk constraint och runtime/RLS redovisas som skilda verifieringslager utan att hävda starkare bevis än vad som faktiskt körts.

## Review

Plan v1 Architect CHANGES; Critic CHANGES. Plan v2 inför bevisnivåerna, numeriska parserresultat, enabled/disabled sparväg och UI-07 checkpoint. Architect **APPROVE** och Critic **PROCEED** för exakt plan v2 2026-10-10. `python tools/dev_flow.py validate` PASS.

Implementer genomförde parser-/teständringen. Oberoende QA och Reviewer **PASS**: ingen kod-/API-avvikelse, ingen migration eller dependency. `pnpm check` PASS (389 pass, 1 skip, 0 fail), iOS-export, riktat parserprov, diff- och kövalidering PASS. Läsaren behöver känna till att vanlig sandbox blockerar notifications-testets tidszonsunderprocess med EPERM; samma fulla check passerar när befintlig underprocess tillåts.

## Release-logg

[FIX-36](../../releases/FIX-36.md)
