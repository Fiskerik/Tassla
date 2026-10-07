# Release-log — P08 uppfödarkod och onboarding
Datum: 2026-10-07. Status: planförberedelse; implementation inte startad. Jämförelsebas: P07 lokal slutcommit36b23d5. Ingen GitHub Release finns enligt verifiering 2026-10-07. Leveranscommit och TestFlight-build: saknas.
## Major changes
Inga implementerade i P08. Planerat: frivillig uppfödarkod, säker länkhantering genom inloggning, bekräftad källa vid hundskapning och QR-underlag med manuell kodfallback.
## Minor changes
Förberedande paketplan finns i ../tasks/dev/kennel-onboarding.md. Befintlig QR-encoder har verifierats tillgänglig utan ny appdependency; inget utdelningsunderlag eller aktiv pilotkod levereras genom detta.
## Bug-fixes
Inga. Identifierat planfynd: befintlig hund efter okänt skapanderesultat måste jämföras mot hela begäran och exakt attribution innan framgång påstås. Detta är ännu inte korrigerat i P08.
## Verifiering och begränsningar
Preliminär Architect/Critic/Security kräver planändringar. Verklig attribution väntar på Eriks databeslut och exakt förnyad review. Installationslänk och pilotuppfödare saknas. Ingen migration, pilotseed, kodinsamling eller faktisk onboardingkontroll utförd i P08.
## Nästa sprint/paket
P08 checkpunkter: ändamål och frivilligt val → exakt parser/livstid/readback-kontrakt → implementation → syntetisk QA och oberoende review → utdelningsunderlag och faktisk utvecklingsmiljökontroll. P09 bygger på det fastställda datakontraktet. Inga personuppgifter delas med uppfödare genom planen.
