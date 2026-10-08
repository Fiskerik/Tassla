# FIGMA-LOGGA-MIGRATION – UX-specifikation

Datum: 2026-10-08  
Status: planerad, före implementation  
Baseline: `37bf93f feat: complete shared log UI component library` plus befintlig Logga-implementation  
Underlag: `tassla-consumer-ux`, `docs/design-rules.md`, Figma `Design system` (`64:2032`, `95:3507`, `95:3378`), `src/features/puppy-log/LogScreen.tsx`, `src/components/ui/`.

## Användarmål

En hundägare ska kunna logga Kiss, Bajs, Mat eller Sömn på ett tryck, hitta Promenad/Vaken utan modalavbrott, se dagens historik och rätta/radera en post utan att tappa sitt utkast.

## Flöde

1. Öppna Logg via den fasta bottennavigeringen.
2. Välj en av fyra primära QuickLogTile-rutor.
3. Tryck Fler för inline-expansion i samma sektion; Promenad och Vaken visas med en lugn, avbrytbar layout-animation.
4. Se dagens logg i TimeFirst/ListRow-format; tryck en rad för redigering.
5. Redigera i Figma-underlagets edit-sheet; bekräfta sparande eller radera via destruktiv bekräftelse.

## Tillstånd och återkoppling

- Laddar: Skeleton för snabbval och lista; inga falska poster.
- Tomt: tydligt första-händelsebudskap och primärt snabbval.
- Fel vid hämtning: lokal feltext och Försök igen; ingen skrivning utan underlag.
- Normal: 2×2 snabbval, Fler inline, mönster först efter minst två poster, datumgrupperad lista.
- Skrivning: berörd rad visar `Sparar…`; dubbeltryck blockeras.
- Sparad: bekräftad toast, exempelvis `Kiss loggat`; Ångra endast efter faktisk persistence.
- Definitivt fel: `Kunde inte spara` + `Försök igen`; utkast/input bevaras.
- Osäkert utfall: `Vi kunde inte kontrollera om det sparades` + retry; aldrig `Sparat`.
- Offline/timeout: samma osäkra eller felaktiga status som datalagret kan bevisa; ingen teknisk banner på normalvy.

## Visuell målbild

- AppBar 56 px med centrerad `Logga`.
- Page inset 24 px, section gap 24 px, list gap 12 px.
- QuickLogTile 2×2, 112 px hög, 12 px padding, 44 px IconChip; Fler är diskret neutral och använder samma grid-outline som Mer.
- Bajs använder Figma `Icon/Poop` som tredelad outline på 24-rutnät och 2 px stroke; avmaskning använder en tokeniserad lokal pill-outline eftersom Ionicons saknar Figma-namnet `pill-outline`.
- ListRow använder tid först, kategori-chip, title/meta och chevron.
- Edit-flödet använder Figma BottomSheet; fel/destruktiv handling använder Dialog.

## Tillgänglighet och rörelse

Alla rutor har textetikett och tillräcklig tryckyta; färg och ikon är inte enda statusbärare. Fler-expansionen är avbrytbar och ska respektera reduced motion. Fokus/keyboard/safe-area och VoiceOver måste verifieras i native rendering; annars `NOT TESTABLE`.

## Antaganden och gränser

- SQL-migrationen är nu körd av ägaren; denna slice ändrar inte schema eller dataadapter.
- Figma-filen ger verifierat underlag för Logga, inte för övriga produktvyer. Hem, Träning, Hälsa, Kunskap och Tassla-pass migreras först när motsvarande node-/screen-underlag och scope finns.
- Befintliga truthful save-kontrakt, update/delete-callbacks, hund-/sessionsisolering och retry-ID bevaras.
- Ingen ny dependency, SVG-runtime eller Figma-skrivning införs i denna slice.

## Avvikelse och verifieringsgrind

Den befintliga implementationen har nyligen flyttat Fler inline; den ska nu visuellt mappas mot Figma Sandbox och edit-sheet. Kodgrind: typecheck, lint, riktade tester, full check och iOS-export. Visuell grind: native screenshots i 390 px och större bredd för normal/tom/laddar/fel, Fler-expansion, edit-sheet, dialog och alla save states. Utan rendering är status `NOT TESTABLE`, inte godkänd.

## Avsedda filer

`src/features/puppy-log/LogScreen.tsx`, relevanta `src/components/ui/`-komponenter och fokuserade tester. Skyddat: `src/data/`, Supabase-migrationer, andra produktvyer, navigation, tokens och Figma-filen.
