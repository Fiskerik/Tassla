# FLOW-HOME-CHECKLIST-FILTERS-01 — status och granskningsunderlag

Datum: 2026-10-20
Status: `planned` — plan v1 väntar på Product-, Architect-, Critic- och Security-review. Ingen implementation påbörjad.

## Omfattning

Planen täcker Checklistans Idag, Denna vecka, Alla och Kommande; sparad dagsaktivitet; read-only projektion av kommande återkommande rutiner och planerad hälsa; källnavigation och retur; samt fullständiga laddnings-, tom-, partial- och fellägen. Den bindande UX-/dataplanen är [plan v1](../../plans/FLOW-HOME-CHECKLIST-FILTERS-01-ux-spec.md).

## Källfynd som planen bygger på

- Befintlig dagsladdare förbereder aktuell dag via `ensure_due_daily_routine_days`; den ska inte användas för historiska eller framtida datum. Historiska dagar får endast komma från redan sparade dagsrader.
- Rutinregler kan projiceras med befintlig `isRoutineDueOnDate`-semantik, men framtida förekomster är presentationer och måste märkas Planerad.
- Träningsurval sparar datum och versionsbundna steg-ID:n; okända steg får inte tyst försvinna eller räknas som komplett data. Ingen framtida träningsrad får hittas på.
- Befintlig `fetchPlannedHealth` har en begränsad sida; den räcker inte som komplett date-range-läsare. Planen kräver hundscope, datumgräns och full pagination för Kommande.
- `DailyActivityManagerSheet` visar idag-kopplade hemskärmsåtgärder. Från en framtida rutinrad behöver fokuserad rutinhantering kunna öppnas utan att ändra dagens urval.
- `PlannedHealthScreen` har ett hälsospecifikt bakåtnamn. Checklistans Kommande-kontext behöver kunna ge tillgänglig returtext och bevara valt filter.

## Granskningsgrind

- Product: bekräfta datumsemantik, rader/status, destinationer och copy.
- Architect: verifiera query-/SQL-/RLS-kontrakt, paginering, livstid/abort, recurrence-paritet och exakta skrivvägar.
- Critic: utmana kritiska användarresor och tomt/partial/fel, totalsiffror samt Planerad-status.
- Security: bekräfta ändamålsbegränsning, samma konto/hund, RLS-förutsättningar, stale-scope-skydd och avsaknad av nya writes/RPC-anrop.

**Beslut:** alla fyra granskningar är ännu öppna. Köstatus förblir `planned`; inga appfiler har ändrats. Ändringar av produktbetydelse eller skrivvägar kräver en ny planversion och förnyad review.
