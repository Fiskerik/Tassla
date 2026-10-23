# UI-R02-02 — Checklistor med samma redigeringsupplevelse

Datum: 2026-10-23. Källa: `docs/tasks/UI-UX-REV02-ACTIONPLAN-2026-10-23.md` §4, GAP G02–G07/G14/G16 och Eriks uttryckliga beställning 2026-10-23. Referens: `vision_rev02.jpg`, panel 4 och panel 7. Äldre checklistdokument före 16 oktober är endast historik.

## Användarmål och ingångar

- I Kunskap → Checklistor ska ägaren lägga till eller ändra en egen punkt, välja dess ikon direkt intill textfältet och behålla valet efter att formuläret stängts och listan lästs igen.
- På Hem → Checklistor ska ett tryck på en rutin öppna just den rutinen. Longpress fortsätter öppna redigering för den tryckta punkten. Skapa och hantera alla rutiner ska gå att nå i ett separat, tydligt läge.
- Rutinpunkter och egna faschecklistepunkter delar ikonval och visuell rad-/åtgärdsgrammatik. Daglig upprepning och fasprogress behåller skilda databetydelser.

## Jämförelse och accepterad ändring

| Referens/gap | Nuläge | Korrigering | Acceptans |
|---|---|---|---|
| G02, panel 7: ikon på egen punkt | Kunskap visar alltid neutral `list-outline`; datamodell, intent och tabell saknar ikon | Samma 20-valspicker och tonmappning som rutin; `icon` nullable, validerad och sparad på befintlig egna-punkterad | Skapa/ändra/återläsning visar valt ikon; äldre null visar neutral fallback |
| G03/G04, liten edit-sheet | Punktens checkbox, Spara, Radera och Avbryt är fyra fullhöga rader | Titel + ikon i samma rad, kompakt status, en Spara-footer, soptunna som öppnar textad bekräftelse | En permanent primär handling; radering kräver separat Avbryt/Radera-bekräftelse; touch targets minst 44 pt |
| G05, fokuserad rutin | En namngiven rutin öppnar hela hanteringscentralen och träningsvalen | Filtrera till vald rutin; skapa/hantera alla rutiner öppnas via tydlig separat ingång i Checklistor | Öppnad rutin visar inte syskonrutiner eller träningsval; tillbaka återgår till checklistan |
| G06/G07, tillstånd | Kunskaps X bevarar utkast medan Avbryt kastar; fel/unknown/conflict har olika semantik | X och övrig stängning använder en sammanhållen discard-dialog för dirty utkast; failed behåller redigerbar data, unknown återspelar exakt intent, konflikt erbjuder färsk läsning | Ingen falsk sparstatus, dubbla writes eller borttappat ikonval |
| G14/G16, rader och namn | Fas-/rutinrader och labels varierar | Återanvänd ikon-/radfamilj och svensk handlingstext, behåll separata checkbox-/öppningsmål | Samma visuell tyngd och begriplig hjälpmedelslabel utan att återinföra knappvägg |

## Flöde och tillstånd

1. Öppna en fas → välj `Lägg till egen punkt` eller pennan för en befintlig punkt.
2. Skriv titel; tryck på symbolen intill titeln och välj en ikon från den gemensamma listan. Valet uppdateras i utkastet direkt.
3. Spara. Endast bekräftad server-readback stänger formuläret och visar den sparade raden.
4. Vid definitivt fel: behåll titel/ikon och visa kort feltext samt samma Spara-åtgärd för retry. Vid okänt resultat: lås utkastet och kontrollera exakt request-ID/intent; gör inte en ny insert. Vid konflikt: visa senaste bekräftade raden och låt användaren öppna den på nytt.
5. X/backdrop/native back/Avbrytsemantik är en enda utgång. Rent formulär stängs; dirty formulär frågar om användaren vill kasta ändringen eller fortsätta. Pågående/okänd mutation blockerar stängning tills den kan kontrolleras.
6. Tryck på en daglig rutin öppnar bara den; pennan/longpress redigerar den, och skapande/hantering av alla finns i en separat ingång. Checkbox ändrar endast dagspunkten; radöppning ändrar inte status.

## Data- och kompatibilitetsbeslut

- Kolumnnamn: `icon`; tillåtna värden är exakt den redan använda 20-symbolslistan, alternativt `NULL` för äldre punkter.
- Lägg till kolumn och `CHECK` på befintliga `dog_checklist_custom_items`; ny tabell, ändrat ägarskap och nya RLS-policies ingår inte.
- Uppdatera de befintliga smala insert-/update-column-grants med enbart `icon` tillagd. `SELECT` och radering förblir oförändrade. Migrationen är framåtriktad och körs inte av UI-arbetet.
- Äldre klienter som inte skickar `icon` bevarar befintligt värde vid update. Den nya klientens vanliga bockning skickar inte en icon-nullställning. Både RPC-läsning och readback avvisar ogiltigt ikonvärde.
- Hela `checklist-data.ts` får inte börja importera rutinens skärmmodul. Ikonmodell och picker flyttas till en neutral gemensam featuremodul; gammal exportväg kan återexportera för kompatibilitet.
- Detta är en ändring av befintlig användar-/hundägd checklistmetadata, inte nytt ändamål eller insamling.

## Fel, avslutning och tillgänglighet

- Utkastet innehåller stabilt UUID, titel, ikon och eventuell klart-status. Request-ID förändras inte vid retry/unknown.
- Pending visar status på berörd formuläråtgärd. Saved visas först efter exakt confirmed row. Failed lämnar kvar utkast och gör rätt åtgärd tillgänglig. Unknown behåller intent; conflict ersätter aldrig tyst användarens värden.
- Dialogens synliga text namnger objekt och konsekvens. Ikon-trigger och symbolalternativ har namn, vald state och minst 44×44 pt tryckyta.
- Grid får radbryta vid 320–430 pt och större text. Sheetet ska scrolla med tangentbord öppet; primär Spara förblir nåbar.
- Native VoiceOver/Dynamic Type och generell Supabase/RLS är ägarbekräftade sedan tidigare; denna ändring kräver ändå specifik icon-persistens/readback/grant-kontroll innan ny metadata räknas verifierad.

## Avgränsningar

Ingen ombyggnad av Hem-panelen, panel 3-ring, publicerat fasinnehåll, kunskapstaxonomi, rutinupprepning, träningscompletion, konto-/hundmodell eller generella knappdefaults. Ingen återställning av före-16-oktober UI-förslag.

## Skills

Tillämpade: `tassla-consumer-ux`, `mobile-ios-design` (Expo/React Native-anpassningen), `docs/design-rules.md` §0–4/§14 och rev02-skärmkontrakten. De styr återkoppling, plattformsbeteende, targets och den varma/grupperade rev02-kompositionen.
