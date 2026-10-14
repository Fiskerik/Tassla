# CHECKLIST-UI-LUNA-01 UX-spec — Faschecklista

Datum: 2026-10-13 · Version: 4 · Status: Architect APPROVE och Critic PROCEED

## Mål och ingång

En ny hundägare ska snabbt kunna se framsteg, bocka en befintlig uppgift och förstå vad som är ett tillfälligt exempel. Resan börjar i Kunskap → Checklistor → en av sex faser. Back återför till checklistöversikten med fungerande befintligt route-/tabb-beteende.

Detta gäller faschecklistorna i Kunskap. Daglig checklista, sök/filter och tidsplanerade uppgifter ligger utanför scope.

## Flöde och återkoppling

1. Öppna en fas. Detaljen visar befintlig introduktion, en synlig reviewmarkering/förklaring, en progressrad och en grupperad lista.
2. Tryck på en standardrad för att bocka av. Berörd rad visar omedelbart synlig ”Sparar…”-återkoppling och busy/disabled-semantik; checkboxens tillgängliga namn/state exponerar också att just raden sparas. Bock och progress ändras först efter bekräftat sparande. Övriga rader visar inte att de sparas.
3. Vid failed behålls gamla sparade värden och retry finns kvar. Vid unknown visas ”Kontrollera”; ingen framgångsbock visas innan exakt återläsning har bekräftat resultatet.
4. Back lämnar detaljen utan att ändra sparad fas. Egna punkters formulär stannar i sin befintliga placering tills tredje implementationen flyttar det till ett sheet.

## Skärm-/komponenttillstånd

- `reviewEnabled=false`: inga checklistläsningar eller skrivningar och ingen checklist-/reviewpresentation.
- Loading/error: lässtatus är begriplig; fel blir aldrig framsteg 0 eller sparad bock.
- Ready: total och klart antal från standard- plus egna punkter.
- Pending: endast aktuell handling visar ”Sparar…” och busy/disabled; checkboxens tillgängliga namn/state annonserar statusen; duplicerade tryck blockeras, bock/progress förblir sparat läge tills bekräftelsen.
- Saved: ändra rad/progress efter bekräftelse.
- Failed/conflict: tydlig retry eller omläsning, bevara användarens inmatning.
- Unknown: kontrollväg är synlig och intent/draft bevaras enligt befintligt session-/hundscope.
- Alla klara: visas bara vid bekräftat total > 0 och done = total.

## Visuell jämförelse

| Referens | Nuvarande skillnad | Token/komponent/asset | Acceptans |
|---|---|---|---|
| Sammanhållen lista med diskreta skiljelinjer | Progress ligger utanför; individuell mörk ram och rundning per uppgift | `Card`, namngiven `ChecklistItem`-variant, befintliga tokens | Progress och rader ligger på en ljus yta med tunna separatorer, minst 44 pt och bibehållen statussemantik. |
| Kompakt detaljheader med tillbaka | `AppBar` lägger till en separat Tassla-rad | Namngiven opt-in `AppBar`-variant | En kompakt titelrad; back fungerar; default behålls i andra anrop. |
| Tydligt antal utan överlast | Synlig procentsiffra och antal i samma etikett | Befintlig `Progress` | Ett antal, ingen dubblerad etikett, tillgänglig progress `min/max/now` bibehålls. |
| Reviewstatus en gång | Märkning upprepas i detaljen | Befintlig label och förklaring | En synlig badge/markering per vy; Läs mer utanför checklistkortets klickyta. |
| Ärlig återkoppling vid sparning | Alla rader dämpas vid `busy`; målrad saknar särskild status | Opt-in pending-state i `ChecklistItem` | Endast berörd rad visar ”Sparar…”; checkboxens tillgängliga namn/state visar pending; count/check ändras efter `saved`. |
| Egen punkt i samma listyta | Separat tung editknapp/form | Befintlig rad; add/edit-sheet kommer i separat del | Nuvarande funktion överlever; ingen nästlad tryckyta. |

Visionens panel 4 används för visuell referens till grupperade checklistuppgifter; Knowledge-fasernas innehåll och semantik kommer från befintliga källor och taskplanen. Artikelbilder eller andra tillgångar behövs inte för denna detaljvy.

## Tillgänglighet och responsivitet

Behåll 44×44 pt tryckmål, korrekt checkbox/progress-semantik, labels, färgoberoende status, full scrollning och systemets textskalning. Webbreview verifierar att checkboxens roll, namn, checked- och busy-state uppdateras under save; native VoiceOver-annonsering är fortsatt NOT TESTABLE. Granska 375×844, 430×844, 375×667, lång svensk uppgiftstitel samt 140 % text. Webbrendering godkänner inte native VoiceOver, Dynamic Type, keyboard eller reduced-motion-upplevelse.

## Antaganden och avgränsningar

- En befintlig fas och dess progress är oförändrad; en annan fas är läsning, inte ett sparat fasbyte.
- Reviewinnehåll förblir bakom `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT` och märks sanningsenligt.
- Ingen ny koppling till data, migration, tidsplan, innehållsråd, taxonomy, dependency eller permanent lokal kö.
- Planens tre slices genomförs sekventiellt. Denna första spec låser detaljvyn; overview och custom sheets får endast starta efter checkpointar enligt `docs/tasks/dev/CHECKLIST-UI-LUNA-01.md`.

## Verifieringsstatus

Före-bild finns i `docs/design/evidence/vision-rev02/r02-3c/review/checklist-detail-375.png`. Efter-bilder och §14-granskning skapas efter implementation. Public-rendering (`TASSLA_UI_REVIEW=false`) ska dessutom använda instrumenterad syntetisk klient med read-räknare för att visa noll checklistläsningar och noll skrivningar; review-rendering provar de gated checklistvyerna. V3 krävde synlig pending-feedback och fick Architect APPROVE men Critic CHANGES: hjälpmedelsstatus saknades. V4 kräver att pending även exponeras i checklistkontrollens tillgängliga namn/state. Architect APPROVE och Critic PROCEED för task/UX v4 är sparade i `docs/tasks/dev/rapport.md`. Inga tester eller builds kördes i planreviewn och inget visuellt godkännande påstås.
