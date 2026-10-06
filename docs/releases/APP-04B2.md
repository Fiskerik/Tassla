# Release-log — APP-04B2
Datum 2026-10-06. Bas e5327d1. Status: implementerat och lokalt verifierat; ännu inte pushat. TestFlight-build okänd. Ingen GitHub Release skapad.
## Major changes
Vaccinations- och veterinärhistorik: skapa, läsa, rätta och bekräftat radera genomförda händelser med datum/kort ägartext. Säker återhämtning efter okänd sparstatus, bevarad pending intent och explicit konfliktlösning.
## Minor changes
Separata hälsokontrakt med hund-/typ-/id-filter, 500 Unicode-teckengräns och immutabel typ vid rättning. Passande medicinska ikoner, varma kort och befintlig dekorativ hundbild i tomläget. Synligt besked att äldre poster kan saknas vid serverns svarstak; uppgifter märks ägarregistrerade.
## Bug-fixes
Utvecklingsfel före leverans: mismatched delete-ID får inte ensamt bevisa radering; redigeringsform återställs när rad försvinner via direkt radering/statuskontroll eller accepterad konflikt. Befintlig statisk authassertion accepterar sessionsfält utan att släppa signOut-kontraktet.
## Verifiering och begränsningar
QA health-history 38/38, full pnpm check 102/102, iOS-export och diffcheck PASS. Independent Reviewer och lokal Security PASS. Ingen faktisk native UX eller deployed RLS-verifiering i detta paket. Ingen ny notifiering, migration eller betaaktivering. Kommande händelser ingår i P03.
## Nästa sprint/paket
APP-04C profilredigering: namn/ras/födelsedatum, bekräftat resultat uppdaterar ålder/Hem/träning utan omstart. Interna DATA/WORKSPACE/UI/QA-checkpunkter och godkänt exakt v2-kontrakt. Inget nytt TestFlight-stopp.
