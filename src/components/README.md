# Gemensamma UI-komponenter

`ui/` är ingången för nya gränssnitt. Importera komponenter från `src/components/ui` och använd designvärden från `src/theme/tokens.ts`. `AppPrimitives.tsx` och `theme`-aliaset är kvar för befintliga vyer tills de migreras i en separat slice.

## Entry points och dataflöde

- `ui/index.ts` exporterar knappar, AppBar/BottomNav, kort/rader, kategori-chip, formulär, återkoppling, ActionMenu, Skeleton, modaler, förstaanvändningstips och `DailyActivityItem`/`DestinationTile`.
- `IconChip` äger kategoriikonernas och kategorifärgernas gemensamma mappning. `ThemedIcon` visar en Ionicon med befintlig semantisk kategorifärg och diskret yta. Neutral checklistfallback får en mjuk grön yta. `PoopIcon` ritar bajsikonen med React Native-vyer eftersom ikonbiblioteket saknar motivet.
- Checklistornas `ThemedIcon` återanvänder Loggans tvåtonspalett: en 20 pt symbol på en 32 pt färgad rundel. Ikonknappen, de 20 valen och den sparade checklistpunkten använder samma tonmappning; den osparade listfallbacken visas diskret grönt.
- `DailyActivityItem` visar en kategori, beskrivning och två separata kontroller: valfri completion-toggle och detaljnavigation. Hem använder den bara för sin lokala syntetiska review-fixture; den skapar eller sparar ingen produktprogress.
- `DestinationTile` visar destinationsikoner för Logg, Träning eller Kunskap och skickar navigation via sin callback. Kategoriernas aktivitetsikoner används inte som genvägsikoner.
- `ComponentGalleryScreen` visar svenska exempel och tillstånd, inklusive de två nya hemkomponenterna. Den nås endast från den redan flaggade `DevelopmentPreview`; ingen produktionsroute används.
- `BottomSheet`, `TimePickerField` och `ActionMenu` visas som centrerade, fullt rundade kort över en nedtonad appvy. Sheets och menyer har separat backdrop som kan stänga kortet, säkra sidmarginaler och begränsad maxbredd; sheetens formulärinnehåll scrollar innanför kortet och en fast footer ligger kvar. `Dialog`, `InfoModal` och datumväljaren var redan centrerade och behåller sin placering. Statusfeedback (`Toast`/`ActionFeedbackModal`) är inte en dialog och förblir inline.
- `MainSwipeNavigation` ger ett dependencyfritt svepresponderlager för de fem huvudflikarna. Den fångar tydligt vågräta rörelser tidigt, lämnar lodrät scroll till sidans `ScrollView` och respekterar exkluderingar från inre horisontella kontroller. En ren regelmodul hanterar fångst- och flikbyteströsklar; komponenten äger ingen sidstate. Riktade regler och källkontrakt testas med `node --experimental-strip-types --test tests/main-swipe-rules.test.mjs tests/main-swipe-navigation-policy.test.mjs`.
- Komponentprops går direkt från den sammansättande vyn till nativekontrollerna. Biblioteket lagrar inte data.

## Setup och verifiering

Inga nya beroenden. Ionicons kommer från den redan installerade `@expo/vector-icons`. Kör `pnpm typecheck`, `pnpm lint` och `pnpm test`; det fokuserade skyddet finns i `tests/ui-library-policy.test.mjs` och `tests/preview-policy.test.mjs`.

## Begränsningar

Datum- och tidsfält behåller manuell textinmatning och har modalväljare för vanliga val. `HeroCard` använder tokeniserade överläggslager som gradientapproximation. `Display` är tills vidare alias för `Title`, och osäker toast kräver retry-callback. Gallery visas endast i lokal utvecklingspreview. Skärmbilder, riktig skärmläsare, stor text och nativeinteraktion behöver separat QA; kodkontroller innebär inte visuell PASS.

## UI-RESET, 2026-10-09

`AppScreen` lägger inte längre en extra logotyp ovanför varje sida. Sidans `AppBar` äger rubrik/navigation. Bakåt finns bara till vänster, stäng bara till höger. `MotionPressable` använder native-driven skala, och `ScreenTransition` en kort toning/förflyttning; tider finns i `tokens.motion`. Stilfunktionen utvärderas före Animated-komponenten så både native och web får layoutstilarna. Reducerad rörelse tar bort skala/förflyttning.

`HeroCard` använder befintlig lokal hundbild och mörk textyta, inte generiska färgblock. `Progress.light` har ett mörkt spår. Delade BottomSheet-, tidsväljare- och ActionMenu-ytor är centrerade kort med säkra marginaler; långt innehåll scrollas i kortet och keyboard-aware footers hålls nåbara. `BottomSheet` behåller nedåtsvep från handtaget, reducerad rörelse och ägarens `onRequestClose`-guard. Återhämtning för en mutation ska ligga i samma modal där den utförs.

## Rörelse enligt MOTION

`MotionPressable` och `ScreenTransition` är befintliga delade animationer. Nya animationer använder React Native `Animated`, durations från `tokens.motion` och `useReducedMotion`. `ScreenTransition` spelar inte vid första mount, tar valfri rörelseväg och avbryter föregående animation när nyckeln ändras. Huvudfliksbyten använder riktad `mainTabDistance` på 44pt, `mainTabEnter` på 300ms och en lätt fade från 0,9; stödskärmar behåller standardavståndet 8pt och 240ms. Reducerad rörelse byter direkt. Rörelse signalerar aldrig osparad framgång och är aldrig enda återkopplingen. Toast, Progress och ChecklistItem animerar bara ändringar efter mount; text och tillgänglighetsvärden behåller betydelsen med reducerad rörelse. Se `docs/design-rules.md` §15–17.

`Toast` har en stabil ägarplats och kräver `visible`. Dold plats returnerar ingen yta. Ägaren behåller meddelandet tills `onExitComplete`; `autoDismissMs` räknas efter entrén och `onAutoDismiss` begär utgång. Dold och utgående Toast annonseras inte. Synliga och utgående toastar har gemensamt vertikalt avstånd från `tokens.spacing.md`. `Progress` visar startvärdet direkt och animerar bara senare värdeändringar. `ChecklistItem.confirmed` måste vara sant efter sparning för att en ny bock ska få positiv rörelse; befintlig lokal förhandsvisning skickar inte prop:en.

`TimePickerField` håller ett separat utkast medan modalväljaren är öppen. Alternativ och textinmatning uppdaterar utkastet; `Bekräfta tid` lämnar över ett giltigt HH:mm eller ett tomt val. Stängning och system-back avbryter. Modalrörelsen följer reducerad rörelse.

Modalerna har en separat, visuellt diskret 44 pt handtagsremsa högst upp som kan svepas åt vänster eller höger för att stänga. Den använder samma guarded close-handler som X, backdrop och Android-back. Svepet fångas först efter tydlig horisontell rörelse och stör inte formulär, listscroll eller BottomSheetens nedåtsvep. Huvudflikarnas innehåll använder en riktad 300 ms/44 pt slide med lätt fade; stödvyer behåller den kortare standardövergången. Båda följer systemets inställning för reducerad rörelse.

Aktuella webbskärmbilder finns i `docs/design/UI-RESET`; native begränsningar kvarstår enligt verifieringsrapporten där.

`ListRow` visar `complete` med en tillgänglig etikett som slutar med “Genomförd”. `animateCompleteKey` är opt-in för en specifik bekräftad träningsrad; generella färdiga rader får ingen ny rörelse.

`FirstUseTip` är den lilla visuella presentationen och har en separat tillgänglig stängknapp. `useFirstUseTip` läser status för en explicit kontoägare/skärm, ignorerar sena svar efter ägarbyte/avmontering och avfärdar omedelbart. LogScreen markerar kontrollaktivering explicit; scroll/fokus och tom yta räknas inte. SecureStore fel döljer tipset resten av appprocessen för ägaren/skärmen, utan att påstå att status sparats. Status raderas tillsammans med kontoägarens lokala data efter bekräftad serverradering.

## Uppdatering i AppScreen

AppScreen kan ta emot en uppdateringscallback och ett refreshing-värde. Då skapas React Natives RefreshControl för dess ScrollView; utan callback visas ingen uppdateringsgest. ProductWorkspace kopplar in kontrollen bara på Hem och Logg och äger respektive laddningsstatus.

## Gemensamma åtgärder och huvudmeny (UI-R02-04)

`Button variant="icon"` ger 44×44 pt och kräver ett fullständigt `accessibilityLabel`. Radering använder `trash-outline`; den gemensamma knappen väljer automatiskt röd ikon och ram. Redigering använder `create-outline`, Ångra i `Toast` använder `arrow-undo-outline`. Bekräftelsedialoger behåller förklarande text och befintliga handlers. Minus betyder att ta bort från dagens urval, utan att radera rutinen.

`BottomNav` visar fulla namn på en rad. Kolumnernas flex fördelar mer plats till Träning och Kunskap. Endast navigationsetiketterna begränsar textförstoring till 140 %, med fulla tillgängliga namn; sidinnehåll följer fortsatt systemets textstorlek. Browserkontrollen mäter verklig textbredd vid 320/375/430 pt och direkt 140 % text, inte bara zoom.
