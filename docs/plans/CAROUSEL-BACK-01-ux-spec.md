# CAROUSEL-BACK-01 UX- och implementationkontrakt

Version 1.1 – Architect APPROVE; Critic PROCEED. Implement only the paths in the approved task record.

## Användarflöden

**Direkt från Hem:** Hem → välj en karusellartikel → läsning visas → tryck **Tillbaka** → Hem visas direkt.

**Via Kunskap:** Hem eller Mer → Kunskap → välj en guide → läsning visas → tryck **Tillbaka till guider** → Kunskapslistan visas. Den vanliga Kunskap-backknappen tar därefter användaren till vyn som öppnade Kunskap.

## Kontrakt

- `knowledgeFocus` är source of truth för aktuellt focused content, origin och existerande `returnPage`.
- Lägg till ett explicit origin för fokusartiklar (karusell eller lista), bundet till samma `selectionKey`; räkna inte ut origin från route i efterhand.
- `KnowledgeScreen` använder origin endast för den fokuserade artikelns interna AppBar-handling. Home-origin går via `onBack`; list-origin rensar `openedId`.
- `openArticle` från listan markerar list-origin innan state lyfts genom callback.
- `ProductWorkspace` bevarar `returnPage` när artikelval ändras; origin-fältet ändras utan att sidreturen skrivs över.
- `KnowledgeScreen` får en explicit `focusScopeKey` från ProductWorkspace (`currentSelectionKey`). När den ändras rensas lokalt artikel-ID och origin till parentens nya fokusintention. En uppdatering av fokuserat content till `null` rensar lokalt öppnad artikel.
- Konto-/hund/selection-scope testas utan att remounta KnowledgeScreen, så stale `openedId` inte döljs av harness keying. Back i ny scope får inte läsa föregående scopes origin.
- Lokal checklist-/FAQ-intern navigation och artikelinnehåll ligger utanför ändringen.

## UX

- Svenska knappnamn: **Tillbaka** från karusellartikel; **Tillbaka till guider** från listöppnad artikel.
- Direkt tillbaka från karusell ska inte visa en blinkning eller mellanliggande kunskapsvy.
- Fokuserad läsning behåller samma kort, typografi, källor, scroll och layout; endast ursprung/knappens åtgärd ändras.
- Ingen ny färg, ikon eller rörelse krävs; befintlig AppBar-back affordance används.

## Testkrav

- Komponenttest för intern AppBar-action per origin.
- ProductWorkspace/harness-integrationstest verifierar side transitions och att selectionKey-byte tar bort stale origin. Harness byter scope medan samma KnowledgeScreen-instans är monterad och kontrollerar att tidigare artikel stängs och att ny backväg matchar ny intent.
- Browser QA verifierar båda flödena vid 360/430 px och fångar back destination.
- Före production-code: Architect APPROVE och Critic PROCEED.
- Inga schema-, permission-, dependency- eller navigation-stack-ändringar.

## Gränser

Renderad browserverifiering visar inte native gesture-back på fysisk iOS; testa inte fysisk scroll, VoiceOver eller live Supabase RLS som PASS utifrån webbharnessen. Övergripande MVP är fortfarande ej godkänd.
