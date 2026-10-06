# Release-log — MVP-BETA
Datum: 2026-10-06. Bas: e5327d1. Status: genomförande. P01–P06 lokalt klara; P07 pågår. Ingen offentlig release genom körningen.
## Major changes
Implementerat och lokalt granskat: utförd hälsa, profilredigering, planerad hälsa, källbelagda innehållsutkast/import, sammanhängande Hem/Kunskap och Tassla-pass PDF. Påminnelser byggs; QR, mätning, beta-konto och slutkontroll återstår.
## Minor changes
Plan och TestFlight-policy dokumenterade. Erik avgör kritiska telefonprov; inget rutinmässigt telefonstopp efter varje paket. Vikt/tangentbord användarrapporterat PASS, build okänd.
## Bug-fixes
Inga nya appfixar i planeringssteget.
## Verifiering och begränsningar
P06 final253/253 inklusive typecheck/lint, iOS-export/diff PASS; independent Reviewer/statiskSecurity PASS. P07 intern DATAQA41/41 PASS; full/native/UIreview återstår. Verklig databas/RLS, native PDF/notisleverans och signerad kandidat inte verifierade här. Innehåll sakgranskades ännu inte enligt Erik.
## Nästa sprint/paket
P07 påminnelser: DATA verifierad, NATIVE/storage och UI återstår, därefter fullQA/review. P08 uppfödar-QR följer. Se ../tasks/dev/mvp-beta-delivery.md för hela ordningen och acceptans.

## Eriks detaljbeslut — 2026-10-06, efter plan v1
- Godkänt: lokala telefonnotiser för ägarvalda datum och träningspåminnelser; PDF med namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser, förhandsgranskning och ägarinitierad delning; behövliga Expo-paket för notiser/PDF/delning. Kompatibla exakta versioner väljs i implementationplan, inga orelaterade dependencies.
- Betan använder egna konton och sparade uppgifter. Erik kommer ange ansvarig/support/gallring; detta är ännu obesvarat och hindrar endast berörd aktivering, inte oberoende lokal utveckling med syntetiska data.
- Godkänt: förbered källbelagda utkast till 3 träningsflöden och 8 guider/checklistor. Erik ordnar sakgranskare. Utkast är inte publicerat/granskat innehåll.
- Föreslagen gallring 30 dagar efter avslutad beta har skickats som fråga, är inte ett fattat beslut.

## Betabeslut från Erik — 2026-10-06
Ansvarig: EriMali AB. Angiven postadress för support: Stenvallavägen 1. Gallringstid: betakonton och hunddata raderas 30 dagar efter avslutad beta. Postnummer/ort och support-e-post efterfrågade, inte kända. Backup-/loggretention och faktisk teknisk radering dokumenteras i P10; användarens gallringsbeslut är inte bevis att leverantörens backuper redan följer det. Lokal implementation behöver inte vänta på adresskompletteringen.

Plancheckpoint: Architect APPROVE och Critic PROCEED v2. Dokumentationsdiff kontrollerad. Appimplementation startar i P01 efter exakt paketreview; inga nya appkontroller påstås i plansteget.

Kompletterad betakontakt enligt Erik: EriMali AB, Stenvallavägen 1, 18634 Vallentuna. Support: erimali.ab@gmail.com. Gallring 30 dagar efter avslutad beta. Dessa uppgifter används i P10:s information/support; inga meddelanden skickas genom detta beslut.

