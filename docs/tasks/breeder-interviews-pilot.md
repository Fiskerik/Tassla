# Arbetsplan: uppfödarintervjuer och pilotrekrytering

Status: lokalt underlag klart 2026-10-05; import till Google Sheets väntar på anslutet Google Drive. Uppdrag från Erik: ta fram en prospekteringsfunnel med 100 aktuella svenska uppfödare, prioritera offentligt belagda planerade valpkullar under Q4 2026–Q1 2027, skapa ett uppfödarnära intervjuformulär, ett komplett samtalsmanus och ett Google Sheets-underlag för uppföljning. Ingen kontakt tas med uppfödare i denna uppgift.

## Avgränsning och arbetshypoteser

- Offentliga kennel- och rasklubbsuppgifter används. Privat kontaktdata samlas inte in.
- En uppfödare tas bara med som "verifierad" när en aktuell offentlig källa uttryckligen anger planerad/väntad kull eller valpar under oktober 2026–mars 2027. Osäkra kandidater skiljs från verifierade.
- Intervjudeltagande ger inte automatiskt pilotplats eller förtur. Rekommenderad formulering är möjlighet att separat anmäla intresse, med publicerade pilotkriterier och separat tillstånd för en uppföljande kontakt.
- Intervjufrågor ska i första hand ge underlag för valpköparens produktnytta, distribution, onboarding, innehåll och retention. De ska inte smyga in funktioner utanför godkänd MVP.

| ID | Deluppgift | Ägare | Beroenden | Filer/leverans | Acceptanskriterium | Verifiering | Status |
|---|---|---|---|---|---|---|---|
| 01 | Granska hypotes, urval och juridiska/etiska ramar | Main + Product, Compliance, Dog Expert, Critic | Vision, revenue, MVP | Denna plan och intervjudesign | Relevanta specialister har granskat; risker och beslut är synliga | Specialistutlåtanden sammanvägs mot källdokument | Klar |
| 02 | Definiera urvalsmodell och hitta 100 uppfödare | Main | 01 | Kalkylblad: `Uppfödare` + källor | 100 unika poster med planhändelse, ras, källa, kontrolldatum och tydlig evidensstatus; inga privata kontaktuppgifter | 100 unika kennel-/uppfödarnamn; 27 A, 13 B, 43 C och 17 D; A–C har offentlig källa, D är tydligt reserv | Klar med redovisad evidensbegränsning |
| 03 | Skapa frågeformulär och kodningsmodell | Main + Product, Dog Expert, Compliance | 01 | Kalkylblad: `Intervjuguide` och `Svar` | Frågor är uppfödarnära, neutrala, användbara för appbeslut och möjliga att analysera | Critic: PROCEED WITH CHANGES; ändringarna införda | Klar |
| 04 | Skriva manus A–Ö och pilotbudskap | Main + Compliance, Critic | 01, 03 | Kalkylblad: `Samtalsmanus` | Introduktion, integritetsinformation, tillåtelse, intervju, skyddsfraser, separat pilotintresse, invändningar och avslut finns | Compliance- och kritikpunkter införda; inget pilotlöfte eller förtur | Klar |
| 05 | Skapa och verifiera kalkylblad samt föra över till Google Sheets | Main | 02–04 | Lokal `.xlsx` och Google Sheets | Filterbar uppföljning, datavalidering, frysta rubriker, tydliga källor och fungerande svarsmall | Sex flikar renderade och visuellt granskade; formelfelsskanning 0 träffar; Google-import blockerad av saknad Drive-anslutning | Delvis klar — Google-import väntar |
| 06 | Slutrapport och checkpoint | Main | 05 | Denna fil + kort rapport till Erik | Avvikelser, begränsningar, kontrollresultat och exakt nästa steg dokumenterade | Antal och status summeras; inga ogrundade kvalitetsanspråk | Klar |

## Checkpoint

- Vad ändrades: arbetsplan, urvalsmodell, 100-posters prospekteringsfunnel, intervjuformulär, kodningsmodell och komplett samtalsmanus skapades. Befintlig ändring i `docs/tasks/mvp-tidplan.md` lämnades orörd.
- Specialistgranskning: Product, Compliance, Dog Expert och Critic användes. Critic gav `PROCEED WITH CHANGES`; krav på evidensnivåer, separat pilotintresse, beteendebaserad frågeordning och valpköpare som separat målgruppstest infördes.
- Viktig avvikelse: offentlig research gav inte stöd för påståendet att samtliga 100 har exakt Q4 2026–Q1 2027-kull. Resultatet är 27 A (exakt periodhändelse), 13 B (stark men inte exakt), 43 C (bred överlappning) och 17 D (reserv utan belagd timing). Parning, födsel och leverans hålls isär.
- Kontroller: exakt 100 unika namn; sex arbetsbladsflikar; datavalidering och frysta rubriker; samtliga flikar renderade och visuellt granskade; formelfelsskanning gav 0 träffar; `git diff --check` gav ingen felträff i uppgiftsfilerna. Ingen uppfödare kontaktades och inga privata kontaktuppgifter samlades in.
- Juridiskt/operativt öppet före skarp ringning: dokumenterad intresseavvägning och integritetsinformation, vald kontaktmodell och invändningshantering, publicerade pilotkriterier, gallringsplan samt godkänt arbetskonto/personuppgiftsbiträdesupplägg. Jurist behöver bedöma kontaktmodellen och pilotvillkoren.
- Google Sheets: lokal `.xlsx` är klar, men Google Drive är inte anslutet i arbetsytan och filen kunde därför inte importeras eller verifieras i Google Sheets.
- Exakt nästa steg: anslut Google Drive, importera den verifierade `.xlsx`-filen som ett nytt Google Sheet och kontrollera datavalidering/filter. Därefter omkontrolleras källor och period för de 15 kandidater som väljs till våg 1 innan någon kontakt tas.
