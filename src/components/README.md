# Gemensamma UI-komponenter

`ui/` är ingången för nya gränssnitt. Importera komponenter från `src/components/ui` och använd designvärden från `src/theme/tokens.ts`. `AppPrimitives.tsx` och `theme`-aliaset är kvar för befintliga vyer tills de migreras i en separat slice.

## Entry points och dataflöde

- `ui/index.ts` exporterar knappar, AppBar/BottomNav, kort/rader, kategori-chip, formulär, återkoppling, ActionMenu, Skeleton, modaler och förstaanvändningstips.
- `IconChip` äger kategoriikonernas och kategorifärgernas gemensamma mappning. `PoopIcon` ritar bajsikonen med React Native-vyer eftersom ikonbiblioteket saknar motivet.
- `ComponentGalleryScreen` visar svenska exempel och tillstånd. Den nås endast från den redan flaggade `DevelopmentPreview`; ingen produktionsroute används.
- `MainSwipeNavigation` ger ett dependencyfritt horisontellt svepresponderlager för produktens sex MVP-ytor. Den aktiveras bara av arbetsytan, använder stora touchmål som tröskel och äger ingen sidstate.
- Komponentprops går direkt från den sammansättande vyn till nativekontrollerna. Biblioteket lagrar inte data.

## Setup och verifiering

Inga nya beroenden. Ionicons kommer från den redan installerade `@expo/vector-icons`. Kör `pnpm typecheck`, `pnpm lint` och `pnpm test`; det fokuserade skyddet finns i `tests/ui-library-policy.test.mjs` och `tests/preview-policy.test.mjs`.

## Begränsningar

Datum- och tidsfält behåller manuell textinmatning och har modalväljare för vanliga val. `HeroCard` använder tokeniserade överläggslager som gradientapproximation. `Display` är tills vidare alias för `Title`, och osäker toast kräver retry-callback. Gallery visas endast i lokal utvecklingspreview. Skärmbilder, riktig skärmläsare, stor text och nativeinteraktion behöver separat QA; kodkontroller innebär inte visuell PASS.

## UI-RESET, 2026-10-09

`AppScreen` lägger inte längre en extra logotyp ovanför varje sida. Sidans `AppBar` äger rubrik/navigation. Bakåt finns bara till vänster, stäng bara till höger. `MotionPressable` använder native-driven skala, och `ScreenTransition` en kort toning/förflyttning; tider finns i `tokens.motion`. Stilfunktionen utvärderas före Animated-komponenten så både native och web får layoutstilarna. Reducerad rörelse tar bort skala/förflyttning.

`HeroCard` använder befintlig lokal hundbild och mörk textyta, inte generiska färgblock. `Progress.light` har ett mörkt spår. `BottomSheet` tar hänsyn till reducerad rörelse, tangentbord och safe-area. Återhämtning för en mutation ska ligga inne i sheeten där den utförs.

## Rörelse enligt MOTION

`MotionPressable` och `ScreenTransition` är befintliga delade animationer. Nya animationer använder React Native `Animated`, durations från `tokens.motion` och `useReducedMotion`. De spelas inte på första rendering, får aldrig signalera osparad framgång och är aldrig enda feedbackkanal. Toast, Progress och ChecklistItem animerar bara ändringar efter mount; text och tillgänglighetsvärden behåller betydelsen med reducerad rörelse. Se `docs/design-rules.md` §15–17.

`Toast` har en stabil ägarplats och kräver `visible`. Dold plats returnerar ingen yta. Ägaren behåller meddelandet tills `onExitComplete`; `autoDismissMs` räknas efter entrén och `onAutoDismiss` begär utgång. Dold och utgående Toast annonseras inte. Synliga och utgående toastar har gemensamt vertikalt avstånd från `tokens.spacing.md`. `Progress` visar startvärdet direkt och animerar bara senare värdeändringar. `ChecklistItem.confirmed` måste vara sant efter sparning för att en ny bock ska få positiv rörelse; befintlig lokal förhandsvisning skickar inte prop:en.

`TimePickerField` håller ett separat utkast medan modalväljaren är öppen. Alternativ och textinmatning uppdaterar utkastet; `Bekräfta tid` lämnar över ett giltigt HH:mm eller ett tomt val. Stängning och system-back avbryter. Modalrörelsen följer reducerad rörelse.

Aktuella webbskärmbilder finns i `docs/design/UI-RESET`; native begränsningar kvarstår enligt verifieringsrapporten där.

`ListRow` visar `complete` med en tillgänglig etikett som slutar med “Genomförd”. `animateCompleteKey` är opt-in för en specifik bekräftad träningsrad; generella färdiga rader får ingen ny rörelse.

`FirstUseTip` är den lilla visuella presentationen och har en separat tillgänglig stängknapp. `useFirstUseTip` läser status för en explicit kontoägare/skärm, ignorerar sena svar efter ägarbyte/avmontering och avfärdar omedelbart. LogScreen markerar kontrollaktivering explicit; scroll/fokus och tom yta räknas inte. SecureStore fel döljer tipset resten av appprocessen för ägaren/skärmen, utan att påstå att status sparats. Status raderas tillsammans med kontoägarens lokala data efter bekräftad serverradering.
