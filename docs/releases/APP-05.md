# Release-log — APP-05 och innehållsinventering
Datum: 2026-10-06. Status: implementerat och pushat; TestFlight-build okänd.
GitHub Releases API gav tom lista 2026-10-06. Jämförelsebas: 4f1a649 → e5327d1 (inkluderar 1abb005 planeringsdokument). Detta är en dokumenterad kodjämförelse, inte verifierad jämförelse mot användarens senaste TestFlight-build.

## Major changes
- Komplett viktresa i Hälsa: historik, skapa, rätta och bekräftat radera datum/vikt för aktuell hund.
- Sanningsenliga saved/failed/unknown-lägen och återhämtning som kontrollerar samma post före återförsök.

## Minor changes
- Åtta redaktionella ämnesförslag med status proposed; inga publicerade råd/källor.
- Metadata-validator, innehållsguide och plan för återstående MVP-paket.
- Separat viktkontrakt, datum/kg-validering, stabil historikordning och synkron dubbeltrycksspärr.

## Bug-fixes
Inga belagda bug-fixes i tidigare publicerad release inom jämförelseintervallet.
Utvecklingsfel rättade före leverans enligt rapport: övergenerös decimalvalidering, insert-readback utan värdejämförelse samt pending-spärr som blockerade första skrivningen.

## Verifiering och begränsningar
Leveranscommit: e5327d1e85d128f8b13638a89fa22d2e2e6d1284, verifierad på GitHub och lokalt. Rapporterad QA: 64/64 tester, iOS-export och diffcheck PASS; Reviewer/Security PASS lokal kod. Inga nya appkontroller kördes vid denna dokumentationsuppgift. Fysisk viktform, verklig RLS och TestFlight-version är inte verifierade. Innehållsinventeringen är inte publicerbart innehåll.
Utloggning/tangentbordsanpassning finns före jämförelsebasen och räknas därför inte som nya ändringar i detta intervall.

## Nästa sprint/paket
1. APP-05-PHONE-DB: build/version, viktform/tangentbord, återförsök och tvåkontoprov.
2. APP-04B2: genomförda vaccinationer/veterinärhändelser, komplett CRUD; exakt planreview före kod.
3. APP-04C: rätta hundprofil och uppdatera ålder/innehåll.
GitHub: https://github.com/Fiskerik/Tassla/commit/e5327d1e85d128f8b13638a89fa22d2e2e6d1284
