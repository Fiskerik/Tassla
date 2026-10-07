# Release-log — MVP-BETA
Datum: 2026-10-07. Bas: e5327d1. Status: genomförande. P01–P07 lokalt klara; P10 lokal undeployed kandidat klar. Ingen offentlig release genom körningen.
## Major changes
Implementerat och lokalt granskat: utförd hälsa, profilredigering, planerad hälsa, källbelagda innehållsutkast/import, sammanhängande Hem/Kunskap och Tassla-pass PDF. Påminnelser också lokalt granskade; QR och mätning väntar på databeslut, beta-konto är lokalt klart och samlad beta-/driftkontroll återstår.
## Minor changes
Plan och TestFlight-policy dokumenterade. Erik avgör kritiska telefonprov; inget rutinmässigt telefonstopp efter varje paket. Vikt/tangentbord användarrapporterat PASS, build okänd.
## Bug-fixes
Inga nya appfixar i planeringssteget.
## Verifiering och begränsningar
P10 final339/339 inklusive app-/edge-typecheck och lint, iOS-export/diff PASS; independent Reviewer/statiskSecurity PASS. P01–P07 tidigare lokalt klara. Verklig databas/RLS, native PDF/notisleverans och signerad kandidat inte verifierade här. Innehåll sakgranskades ännu inte enligt Erik.
## Nästa sprint/paket
P10 oberoende lokal/undeployed konto-raderingskandidat levererad enligt exaktreview; se P10-ACCOUNT.md. P08/P09 realdata väntar på Eriks beslut, P11 samlad testmatris förberedd. Se ../tasks/dev/mvp-beta-delivery.md för hela ordningen och acceptans.

## Eriks detaljbeslut — 2026-10-06, efter plan v1
- Godkänt: lokala telefonnotiser för ägarvalda datum och träningspåminnelser; PDF med namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser, förhandsgranskning och ägarinitierad delning; behövliga Expo-paket för notiser/PDF/delning. Kompatibla exakta versioner väljs i implementationplan, inga orelaterade dependencies.
- Betan använder egna konton och sparade uppgifter. Erik kommer ange ansvarig/support/gallring; detta är ännu obesvarat och hindrar endast berörd aktivering, inte oberoende lokal utveckling med syntetiska data.
- Godkänt: förbered källbelagda utkast till 3 träningsflöden och 8 guider/checklistor. Erik ordnar sakgranskare. Utkast är inte publicerat/granskat innehåll.
- Föreslagen gallring 30 dagar efter avslutad beta har skickats som fråga, är inte ett fattat beslut.

## Betabeslut från Erik — 2026-10-06
Ansvarig: EriMali AB. Angiven postadress för support: Stenvallavägen 1. Gallringstid: betakonton och hunddata raderas 30 dagar efter avslutad beta. Postnummer/ort och support-e-post efterfrågade, inte kända. Backup-/loggretention och faktisk teknisk radering dokumenteras i P10; användarens gallringsbeslut är inte bevis att leverantörens backuper redan följer det. Lokal implementation behöver inte vänta på adresskompletteringen.

Plancheckpoint: Architect APPROVE och Critic PROCEED v2. Dokumentationsdiff kontrollerad. Appimplementation startar i P01 efter exakt paketreview; inga nya appkontroller påstås i plansteget.

Kompletterad betakontakt enligt Erik: EriMali AB, Stenvallavägen 1, 18634 Vallentuna. Support: erimali.ab@gmail.com. Gallring 30 dagar efter avslutad beta. Dessa uppgifter används i P10:s information/support; inga meddelanden skickas genom detta beslut.
