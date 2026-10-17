# FLOW-HOME-CHECKLIST-UPCOMING-01 — UX-spec v3

Status 2026-10-17: plan v3 reviewed before coding; implementation checkpoint is local and functional/visual QA is still open. See `docs/design/evidence/vision-rev02/checklist/UPCOMING-01/README.md`.

## Användarmål och ingång

I Checklista öppnar användaren Kommande för att se verkliga framtidsplaner för vald hund. Fliken är en skrivskyddad översikt med tydliga vägar till befintlig hantering.

## Källa och interaktion

- Planerade vaccinationer/veterinärbesök: läs dog_health_plans för aktuell hund med due_on > dailyDateKey före sidgränsen, sortera datum/id och visa upp till 40 närmaste poster. Tryck hämtar vald full post med befintlig dog-scopead fetchPlannedHealthById, öppnar dess id direkt i redigeringsläge och återgår till Kommande.
- Checklista-entry sätter visible back text och accessibilityLabel till “Checklista” och returnerar till samma Kommande-tab. Hälsa-entry behåller “Hälsa” och sin nuvarande destination.
- Upprepande rutin: läs sparad rutinmall för aktuell hund utan dagsmaterialisering; beräkna en nästa förekomst efter idag med befintlig recurrence-regel. Visa högst en förekomst per mall.
- Rutiner utan repeatregel och framtida träningspass saknar konkret framtidsplan och visas inte.
- Rutinhändelsens Hantera öppnar just mallen. Ändring av repeatregel flyttar bara beräknat datum. Dagsspecifika val som Välj för idag gäller idag och skapar ingen framtida status.
- Ingen handling skapar, väljer, slutför eller hoppar över en framtida dagsrad.

## Hierarki och återkoppling

Återanvänd Checklistas segmentflik och listrader. Varje rad visar namn, datum och eventuell sparad tid. Framtida rutin saknar checkbox/completion-status.

- Ready med rader: datumstigande lista.
- Ready utan rader på redan öppen flik: Inga kommande aktiviteter. Vid ny inresa saknas fliken när båda källor är klara och tomma.
- Loading eller fel: fliken är åtkomlig med källspecifik laddning eller Retry.
- En källa ready och den andra loading/error: visa bekräftade rader med tydlig varning att listan är ofullständig.
- Retry läser endast den felande källan. Kommande källstatus är separat från sammansatt dag-/träningsläsning.
- Owner/account-generation, hund-, lokal dag- eller tidszonbyte döljer gamla resultat direkt; svar från äldre scope ignoreras.

## Datum, tid och tillgänglighet

Datum-only värden behåller kalenderdatum och konverteras inte via UTC. Dagens gräns använder Checklistas validerade IANA dailyTimeZone och dailyDateKey. Due_time visas som sparad lokal tid. Datum, åtgärd och tillbaka-knapp har åtkomliga etiketter; stor text får radbryta och sidan kan scrolla.

## Referensjämförelse

| Rev02-referens | Nuvarande skillnad | Återbruk | Acceptans |
|---|---|---|---|
| Panel 4 har kompakt segmentflik över en sammanhängande lista; innehåll är inte datakälla | Kommande saknas eftersom den saknar verifierat urval | Tabs, ListRow och befintliga tokens | Kommande syns under laddning/fel och vid verkliga framtidsplaner; ingen referenscopy eller rekommendation blir data |
| Rutiner har dagsstatus i befintliga vyer | En framtida förekomst är en härledd tidpunkt | Befintlig rutinmanager med fokuserad mall | Ingen completionindikator eller framtida mutation; åtgärder gäller mallen eller uttryckligen idag |
| Hälsosida har tillbaka till Hälsa | En plan kan öppnas från Kommande | Befintlig planned-health screen med entry-id | Rätt plan öppnas i redigering; tillbaka-label och destination följer startskärmen |

## Skyddat

Ingen ny backendfunktion, RPC, notifiering, kalenderkoppling, schema, dependency eller data-purpose. R3c läser befintliga ägarplaner och rutinmallar med befintliga dog-scope/RLS-gränser. Idag/Denna vecka/Alla och tidigare planerade hälsoresor behåller beteende.
