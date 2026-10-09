# Release-log — P09 betamätning
Datum: 2026-10-08. Status: produktionskontrakt implementerat lokalt men inte aktiverat i målmiljö. Erik har bekräftat frivilligt samtycke och 30 dagars retention; Supabase/RLS finns. Jämförelsebas: P07 lokal slutcommit 36b23d5. Ingen TestFlight-build är verifierad ännu.
## Major changes
Frivilligt val för minimerad användningsmätning finns i Kontoinställningar, med återkallelse och radering. Server-RPC:n allowlistar händelsetyp, låser samtycke och använder server-tid. P08 attribution behandlas separat; accepterad kennelkod är inte bevis för skanning, nedladdning eller installation.
## Minor changes
Klienten använder en fail-closed RPC-adapter i `src/analytics/`; ingen händelse skickas utan aktivt samtycke. UI och servermigration finns lokalt. Ingen adminrapport eller faktisk användningsresultat finns ännu. Mätdefinitioner och QA-checkpunkter finns i ../tasks/dev/beta-metrics.md.
## Bug-fixes
Inga.
## Verifiering och begränsningar
`node --experimental-strip-types --test tests/analytics.test.mjs` passerar; `git diff --check` passerar. Migration/RLS, pg_cron-retention och SQL-test är inte körda i Eriks Supabase-projekt. Händelsetäckningen är begränsad till post-consent-observationer och kräver separat definition av adminrapport; P09 är därför inte betaredo. D1/D7/D30 kan inte valideras före en genomförd pilot med mogna tidsfönster.
## Nästa sprint/paket
P08/P09 är sista funktionella MVP-blocket före P11. Kör migrationer, pg_cron och SQL-test i utvecklingsprojektet, verifiera readback och skapa en service-/adminrapport med kennelaggregat utan ägaruppgifter. Därefter samlad P11-kandidatkontroll.
