# Release-log — APP-04C
Datum 2026-10-06. Bas e5327d1 + lokal APP-04B2 checkpoint. Status implementerat och lokalt verifierat, inte pushat; TestFlight-build okänd.
## Major changes
Hundprofil kan redigeras: namn, ras och födelsedatum. Bekräftad profil uppdaterar samma permanenta hund-ID, ålder samt relevant Hem/träning utan omstart. Pending profilintent överlever navigation; kontrollerad status/retry/konfliktåterhämtning.
## Minor changes
Läsbara rasalternativ, varm profilvy med befintliga ikoner/bildassets och tydlig status. Innehåll och träning laddar för ny ras/ålder; äldre urval visas inte som aktuellt efter fel eller sent svar. Profilsparningar använder atomiskt captured-preimage-villkor.
## Bug-fixes
Utvecklingsfel före leverans: SQLSTATE/PGRST-avslag skiljs korrekt från okänd nätstatus. Sparad-besked döljs vid nytt osparat utkast; pending/busy/error förblir synliga. Tidigare reviewer BLOCK löst och förnyad PASS, inte överprövat.
## Verifiering och begränsningar
Profiltester 27/27; full pnpm check 129/129; iOS-export och diffcheck PASS. Independent Reviewer och lokal Security PASS. Ingen faktisk native rendering eller deployed RLS-verifiering. Befintlig onboarding/create och historik bevarade enligt lokal regression.
## Nästa sprint/paket
P03 planerade vaccinationer/veterinärhändelser, separat från genomförd historik; datum/rättning/radering och begränsad granskad SQL-migration. Interna DATA/MIGRATION -> WORKSPACE -> UI -> QA/review. Native påminnelseleverans kommer P07.
