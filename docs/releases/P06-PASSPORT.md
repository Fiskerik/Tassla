# Release-log — P06 Tassla-pass PDF
Datum 2026-10-06. Bas lokal commit ee4bda8. Status lokalt klar och granskad. Ingen push/release/distribution genom denna körning.
## Major changes
Tassla-pass visar en sparad förhandsgranskning av valda avsnitt: hundens namn/ras/födelsedatum, senaste vikten med datum och högst50 senast inlästa utförda vaccinations-/veterinärposter. Samma snapshot används för lokal PDF och ägarinitierad systemdelning. Planerade poster ingår inte.
## Minor changes
Valbara avsnitt, dokument-/profil-/vikt-/hälsoikoner med text, tydliga laddnings-/fel-/tomlägen och databegränsning. Expo Print57.0.2, Sharing57.0.22 och FileSystem57.0.7 inom godkänt paketmandat. Delningsdialogens avslut beskrivs utan påstående om mottagarleverans. Tillfälliga filer städas best-effort efter export och vid appstart.
## Bug-fixes
Under utvecklingen korrigerades cleanup som blockerades av in-flightflagga, SDK:s verkliga cache/Print-sökväg, appstartstädning även utan inloggning och olika datum i preview/PDF vid midnatt. Detta är utvecklingsfynd, inte påstådda fel i tidigare GitHub-release.
## Verifiering och begränsningar
Exakt v3 Architect APPROVE och Critic PROCEED sparade. Installerade native typer och Print-sökvägar kontrollerade. Oberoende QA30/30 fokuserat, fullcheck253/253 inklusive typecheck/lint PASS, iOS-export PASS efter filskrivningseskalering, diffcheck PASS. Förnyad independent Reviewer PASS och statisk Security PASS. Fysisk native PDF-rendering/delning inte utförd; Erik avgör kritiska telefonprov utan interpaketstopp. HTML-escaping, cache-only filer, avsnittsval och kontolivslängd testas lokalt. Ingen databasmigration för detta paket.
## Nästa paket
P07 frivilliga lokala hälso-/träningspåminnelser. Checkpunkter: exakt permissions-/tidskontrakt, native lifecycle/avbokning, UIstatus, QA/Review/Security och release-log. P07-kod börjar efter P06:s verifierade checkpoint; planreview pågår.

