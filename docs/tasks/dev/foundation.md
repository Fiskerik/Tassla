# FOUNDATION – projektgrund och Supabase-SQL, plan v1

Eriks mandat 2026-10-04: Architecture.md godkänd; skapa projektfiler och SQL att köra i ny Supabase. Scope: lokal grund och arkitekturens nödvändiga tabeller, inga externa tjänster/data eller release. Inga dependencies installeras. Körbar Expo-app är en separat del när paketversioner och installation har bestämts; denna leverans är en konkret startgrund med schema, dokumenterade kontrakt och anvisningar.

## Deluppgifter (en aktiv åt gången)
1. SQL: schema för arkitekturens relationer, constraints, ägarisolering via RLS, atomärt hundskapande, publicerat innehåll och begränsade rättigheter. Ingen automatisk hälsovägledning. Berör supabase/migrations/ och supabase/README.md. Auth-metodneutral, framtida notiskanaler/CMS ej valda.
2. Projektgrund: .env.example, README.md, rena TypeScript-kontrakt/funktioner för hundålder och innehållsurval, design tokens, module guides. Inga tomma skärmar som utges för app. Behåll befintligt SDK. Berör src/, .env.example, README.md, .gitignore.
3. Verifiering/överlämning: SQL-test med syntetiska tvåkontodata i rollback-transaktion, installationsordning, säkra publika nycklar, verifieringsstatus och nästa steg. Berör supabase/tests/, docs/dev/supabase-setup.md, docs/tasks/dev/rapport.md.

Acceptans: tabeller motsvarar godkänd arkitektur; inga klienträttigheter till ägarövertagande/publicering/analysläsning; syntetiska test visar cross-owner isolering när Postgres finns. Alla manuella steg tydliga. Lokal parse/statisk kontroll är inte integration PASS. Om ingen Postgres finns markeras SQL-exekvering NOT TESTABLE och appstart ej levererad.

Kontroller: git diff --check; SQL-parser om befintlig tillgänglig, lokal Postgres/test om tillgänglig; TypeScript-check endast om verktyg finns utan ny dependency. Säkerhetsgranskning och oberoende QA/reviewer före överlämning, faktisk ej verifierad integration redovisas.

Arkitektfråga: APPROVE/CHANGES/BLOCK för denna exakta plan v1; särskilt relationella constraints, ägarskap/publicering, versionering och icke installerad projektgrund.

## Faktiska granskningsresultat
- Architect: APPROVE för FOUNDATION plan v1. Bevarar skillnaden mellan förberedelse och fungerande integration. Granskning sparad som sammanfattning i rapport.md.
- Statisk säkerhetsgenomgång: inga konkreta åtkomstblockerare, komplettera negativa tester. Samma agent som planreview; detta ska inte beskrivas som en oberoende Security-gate.
- Oberoende QA/Reviewer hittade typbyte av content_items efter versionering; rättat med trigger och negativt test. Efter omgranskning: PASS endast för förberedelseleveransen. Node-domäntester 3/3, även självständigt körda av granskaren. SQL-runtime NOT TESTABLE. Ingen pilot-/integrationsacceptans.
