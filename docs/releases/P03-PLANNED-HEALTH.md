# Release-log — P03 kommande hälsa
Datum 2026-10-06. Jämförelsebas lokal commit 4bbdb1b. Status: implementerat och lokalt verifierat; inte pushat eller tillgängligt i TestFlight. Leveranscommit dokumenteras i rapportens checkpoint. TestFlight-build okänd. Ingen GitHub Release finns som jämförelsebas.
## Major changes
Kommande ägarangivna vaccinationer/veterinärhändelser kan skapas, ändras och raderas med datum och anteckning. Separat datatabell och vy från genomförd historik, säkra återförsök och konfliktkontroll.
## Minor changes
Kalender-/hälsoikoner och tydliga kort visar passerat datum, idag eller kommande. Ägarangivet innehåll och gränsen 40 laddade planer anges. Anteckningar till passerade planer kan ändras med samma datum.
## Bug-fixes
Utvecklingsfel rättat före leverans: formulärets datumkontroll blockerade anteckningsändring till oförändrat passerat datum; nu tillåts det, medan nya/ersatta datum måste vara idag eller senare. Ingen tidigare publicerad release påverkas.
## Verifiering och begränsningar
Luna medium QA: fokuserat 31/31, pnpm check 160/160, iOS-export och diffcheck PASS. Oberoende Reviewer PASS och lokal statisk Security PASS. Migration och transaktionsbaserat tvåägarprov förberedda men inte körda på server; verklig RLS är ej verifierad. Ingen fysisk enhetstestning. Mindre UX-begränsning: radering av annan plan kan återställa osparat redigeringsutkast. Notiser implementeras i P07.
## Nästa paket
P04: åtta guider och tre träningsprogram som källbelagda utkast, versionsbundet draft-importunderlag och reviewgrind. Checkpunkter: utkast, validering/import, QA och granskning. Mänsklig sakgranskning före rådpublicering. P05 kopplar publicerat innehåll till Hem/Kunskap.
