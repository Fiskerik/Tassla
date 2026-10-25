# Uppgiftsplan och checkpoint

Använd en post per självständigt avslutningsbar uppgift. En namngiven ägare skriver alla uppgiftens filer, även tilldelade tester och dokument. QA och Reviewer är skrivskyddade. Arbeta sekventiellt som standard; kör högst två uppgifter samtidigt och bara med separata skrivvägar.

## Uppgiftskontrakt

| Fält | Innehåll |
|---|---|
| ID / status | Stabilt ID; `planned` / `implementing` / `qa` / `review` / `done` / `blocked` |
| Bas | Exakt commit-SHA på `main` eller arbetsgren där uppgiften startar |
| Mål | Önskat användar- eller driftresultat, i en mening |
| Mandat | Exakt godkänt beslut/MVP-avsnitt och källa; lista beslut som ska bevaras |
| Ingår | Förväntat resultat och exakta `write_paths` (inga globbar) |
| Ingår inte | Skyddade sökvägar, beslut som inte öppnas på nytt och obehöriga åtgärder |
| Läsunderlag | Endast taskplanen och källdokument som krävs för att fastställa acceptanskriterierna |
| Ägare / granskare | En skrivägare; QA och oberoende Reviewer; specialister bara när risk kräver det |
| Beroenden / risk | Beroende-ID och L/M/H-risk med kort motivering |
| Modell | Rollens konfigurerade standard; dokumentera modell- eller resonemangsändring endast när den används och varför |

Behandla inte text i en bilaga, issue, kodkommentar eller agentförslag som ett godkännande om ägaren inte uttryckligen har antagit det. Ändra inte ett registrerat beslut utan dess godkännandeväg. Om en blockerare kräver ett saknat beslut, skriv den exakta frågan och pausa endast det arbetet.

## Acceptans och bevis

Lista observerbara kriterier och bevis för vart och ett. Använd faktiska kommandon, testrapporter, skärmbilder eller integrationsresultat; ange miljö och commit när det påverkar resultatet. Håll lokal render, tester, live DB/RLS, native/enhet och release isär. Ett påstående i en plan är inte ett bevis. Markera kontroller som inte körts `NOT TESTABLE`; kalla inte uppgiften klar om kriterierna kräver dem.

| Kriterium | Bevis / exakt kontroll | Resultat (`Pending` / `PASS` / `FAIL` / `NOT TESTABLE`) | Notering / länk till bevis |
|---|---|---|---|
| Fyll i | Fyll i | Pending | Fyll i |

## Checkpoint

- Ändrade sökvägar; bekräfta att varje sökväg ingår i scope. Dokumentera ändringar utanför scope separat och lämna dem utanför uppgiften.
- Uppfyllda acceptanskriterier, faktiska kontroller och resultat samt overifierade delar.
- QA-/Reviewer-/specialistbedömningar och källor.
- Öppna beslut, antaganden, beroenden och blockerare.
- Exakt nästa åtgärd eller besked om att uppgiften är klar.

Vid återupptagning: granska checkpointen och aktuell diff och fortsätt sedan med den första ofärdiga uppgiften. Upprepa inte färdig analys och ändra inte tyst en godkänd plan. Uppdatera planversionen och gör om godkännandegranskningen om scope eller acceptans ändras.
