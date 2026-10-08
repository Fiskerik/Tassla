# Gemensamma UI-komponenter

`ui/` är ingången för nya gränssnitt. Importera komponenter från `src/components/ui` och använd designvärden från `src/theme/tokens.ts`. `AppPrimitives.tsx` och `theme`-aliaset är kvar för befintliga vyer tills de migreras i en separat slice.

## Entry points och dataflöde

- `ui/index.ts` exporterar knappar, AppBar/BottomNav, kort/rader, kategori-chip, formulär, återkoppling, ActionMenu, Skeleton och modaler.
- `IconChip` äger kategoriikonernas och kategorifärgernas gemensamma mappning. `PoopIcon` ritar bajsikonen med React Native-vyer eftersom ikonbiblioteket saknar motivet.
- `ComponentGalleryScreen` visar svenska exempel och tillstånd. Den nås endast från den redan flaggade `DevelopmentPreview`; ingen produktionsroute används.
- Komponentprops går direkt från den sammansättande vyn till nativekontrollerna. Biblioteket lagrar inte data.

## Setup och verifiering

Inga nya beroenden. Ionicons kommer från den redan installerade `@expo/vector-icons`. Kör `pnpm typecheck`, `pnpm lint` och `pnpm test`; det fokuserade skyddet finns i `tests/ui-library-policy.test.mjs` och `tests/preview-policy.test.mjs`.

## Begränsningar

Datum- och tidsfält är textinmatning med formatledtråd, inte datum-/tidsväljare. `HeroCard` använder tokeniserade överläggslager som gradientapproximation. `Display` är tills vidare alias för `Title`, och osäker toast kräver retry-callback. Gallery visas endast i lokal utvecklingspreview. Skärmbilder, riktig skärmläsare, stor text och nativeinteraktion behöver separat QA; kodkontroller innebär inte visuell PASS.
