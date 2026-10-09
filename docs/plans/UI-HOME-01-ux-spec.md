# UI-HOME-01 – UX-plan för Hem

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål

Hem ska snabbt visa hundens identitet, dagens relevanta nästa steg och publicerat innehåll. Skärmen ska vara ärlig när innehåll laddas, saknas eller inte kan hämtas, utan stockfoto eller förklarande beige banner.

## Flöde

- Entré: autentiserad hundägare öppnar Hem som tab-root.
- AppBar Home visar Tassla till vänster och notiser till höger när destinationen finns.
- DogCard visar hundens riktiga namn, ras och ålder samt PhotoPlaceholder.
- Sektionen `Idag` visar senaste loggpost, nästa publicerade träningssteg och kommande hälsohändelse som ListRow med IconChip och chevron. Befintliga callbacks används; ingen data- eller save-logik ändras.
- Publicerat innehåll visas som Card/HeroCard och öppnas i befintlig Kunskap-route. Om urvalet är tomt visas en EmptyState.

## Tillstånd

- Loading: Skeleton för hund-/dagens innehåll och publicerat innehåll där respektive loader fortfarande arbetar.
- Empty: en EmptyState för ett tomt publicerat innehållsurval; inga draft- eller exempeldata visas.
- Error: befintlig återförsöksåtgärd för publicerat innehåll, med högst en InfoBanner/notice om användaren måste agera.
- Normal: DogCard, `Idag`-rader och publicerade innehållskort. Inga uppercase-eyebrows eller normala statusetiketter.

## Tillgänglighet och beteende

- Alla rader behåller minst 44 pt tryckyta och befintliga route-callbacks.
- Text använder tokens och ska flöda med stor text; inga hårdkodade hex-/fontSize-värden i den migrerade Hem-layouten.
- Ingen ny animation, dependency, datafråga eller innehållskälla.
- Veckoremsa ingår inte i denna slice (owner question default no).

## Avgränsade filer

Ändras endast:

- `src/features/home/ProductWorkspace.tsx` – koppling till HomeScreen och befintliga data/callbacks.
- `src/features/home/HomeScreen.tsx` – Hem-specifik presentation och states.
- `tests/home-screen.test.mjs` – kontrakttester för komponentval, states och inga förbjudna eyebrows/stockdata.
- `docs/design-rules.md` – section 14 för UI-HOME-01 och NOT TESTABLE screenshot-matris.
- `docs/plans/UI-HOME-01-ux-spec.md` – denna godkännandeplan.

Skyddat: data-, sync-, save- och content-selektionslogik, andra skärmar, globala UI-komponenter/tokens och navigation.

## QA

Kör typecheck, lint och relevanta tester. Rendering/fysisk device verifieras inte lokalt; Erik tar Hem normal, Hem tomt, Hem fel och Hem stor text.
