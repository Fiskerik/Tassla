# DS-CODE-01 – Tokens och komponentbibliotek i appkoden

Datum: 2026-10-07  
Planversion: v4.1 – korrigeringsförsök 1  
Status: BLOCK – kod QA/reviewer PASS; visuell QA NOT TESTABLE utan renderade skärmdumpar  
Mandat: Eriks beställning 2026-10-07 att skapa kodens UI-källa utan att ändra befintliga skärmar.  
Release-log: [docs/releases/DS-CODE-01.md](../../releases/DS-CODE-01.md)

## Användaruppgift och avgränsning

Ge kommande Tassla-vyer en enda återanvändbar, varm och tillgänglig UI-grund. Paketet ändrar inga befintliga produktskärmar. Huvudhandling i galleriavsnitt är högst en primary-knapp; svensk exempelcopy visar komponenternas avsedda ton. Fördjupning ligger i komponentguiden. Målbild är `vision_rev01.jpg`; den begärda `docs/design/malbild.png` saknas i repot.

MVP-/problemspår: Eriks direkta mandat är taskens scopesource. Biblioteket stöder de sex godkända ytorna i `docs/mvp.md` § ”Måste med: produkt-MVP” (skärm 1–6) och löser designpolicyns belagda problem med splittrade färger, komponentfamiljer, ikonbetydelser och tryckytor. Det tillför ingen ny produktfunktion eller skärm.

”Enda källan” betyder obligatorisk källa för all ny UI och för befintlig UI när den senare migreras i separat godkänd slice. Paketet migrerar inte dagens skärmar; deras inventerade lokala värden är uttryckligen legacy-skuld. Policystestet bevisar noll nya brott i komponentbiblioteket, inte att hela appen redan följer systemet.

## Deluppgifter

1. **Tokens och kontrakt** – ägare: implementer. Beroenden: underlagen ovan. Filer: `src/theme/tokens.ts`, `src/theme/README.md`, `tests/ui-library-policy.test.mjs`. Acceptans: primitiver, semantik, kategorier, spacing, radius, sizing och systemfontbaserad typografi; exakt legacy-yta och värden bevaras. Verifiering: TypeScript, fokuserat test och bounded cleanup.
2. **Grundkomponenter** – ägare: implementer. Beroende: 1. Filer: `src/components/ui/Button.tsx`, `AppBar.tsx`, `Tabs.tsx`, `Card.tsx`, `IconChip.tsx`, `PoopIcon.tsx`, `ListRow.tsx`, `SectionHeader.tsx`, `StatusBadge.tsx`, `index.ts`, `src/components/README.md`, `tests/ui-library-policy.test.mjs`. Acceptans: kontrakten nedan, central ikonmappning och svensk copy; inga fasta bredder utom IconChip/iconknappens motiverade kvadratiska kontrollmått. Verifiering: TypeScript, lint, fokuserat test och bounded cleanup före steg 3.
3. **Innehålls- och feedbackkomponenter** – ägare: implementer. Beroende: 2. Filer: `src/components/ui/HeroCard.tsx`, `QuickLogTile.tsx`, `ChecklistItem.tsx`, `Progress.tsx`, `Toast.tsx`, `EmptyState.tsx`, `src/components/ui/index.ts`, `tests/ui-library-policy.test.mjs`. Acceptans: responsiva komponenter, värde-/callbackkontrakt nedan och inga hårdkodade designvärden. Verifiering: TypeScript, lint, fokuserat test och bounded cleanup före steg 4.
4. **Form och modal** – ägare: implementer. Beroende: 3. Filer: `src/components/ui/Field.tsx`, `CheckboxCard.tsx`, `Dialog.tsx`, `BottomSheet.tsx`, `src/components/ui/index.ts`, `tests/ui-library-policy.test.mjs`. Acceptans: etikett/hjälp/fel, fyra fälttyper utan falskt picker-löfte, modal tillgänglighet, stängning och stor-textflöde. Verifiering: TypeScript, lint, fokuserat test och bounded cleanup.
5. **Utvecklingsgalleri och lintgrind** – ägare: implementer. Beroende: 4. Filer: `src/components/ui/ComponentGalleryScreen.tsx`, `src/features/home/DevelopmentPreview.tsx`, `eslint.config.js`, `tests/ui-library-policy.test.mjs`, `tests/preview-policy.test.mjs`, `src/components/README.md`. Acceptans: endast import, state och menyval i befintlig preview; ingen Router-route eller ändring i `AppFlow`, root-layout eller `ProductWorkspace`. Befintlig `DEV_PREVIEW_ENABLED` förblir enda porten och test bevisar false i release trots satt env-flagga. Legacybrott ger lint-varningar; nya UI-filer har nolltoleransfel. Verifiering: `pnpm check`, varningsinventering och bounded cleanup.
6. **Copy, visuell QA och review** – ägare: product/critic för svensk exempelcopy, sedan qa och reviewer. Beroende: 5. Filer: `docs/tasks/dev/ds-code-01.md`, `docs/releases/DS-CODE-01.md`, `docs/tasks/dev/rapport.md`; skärmdumpar sparas under `docs/design/evidence/ds-code-01/` om rendering är tillgänglig. Acceptans: renderat galleri på liten/stor bredd och stor text bredvid målbilden, checklistan §14 ifylld. Saknad evidens är NOT TESTABLE och paketet får inte markeras klart.

## Låsta beslut och antaganden

- Primary är `#186A4D`: samma värde i dagens app, inventeringen och Figma-planen och visuellt förenligt med målbilden.
- Appen använder systemfont. Figma-planens Inter är endast proxy och införs inte som appdependency. `Display` saknar källvärde och är ett öppet designägarbeslut. För att leverera det beställda API:t utan en ny typstorlek exporteras Display tills vidare som uttryckligt alias av Title 24/32, vikt 800; avvikelsen visas i galleriet och får inte kallas slutligt visuellt godkänd.
- Legacykontraktet bevaras exakt: `theme.colors.{background,surface,text,mutedText,accent,onAccent,border,error}`, `theme.spacing.{small:8,medium:16,large:24}`, `theme.radius.{card:20,button:14}` och `theme.type.{body:16,heading:28,label:14}`. Nya tokens ligger i separata strukturer; särskilt får nya `typography.heading` 20/28 inte ersätta legacy `theme.type.heading` 28.
- Inga nya paket. `@expo/vector-icons` 15.0.2 är installerat och glyphmap har verifierats. Central mappning: pee `water-outline`, food `restaurant-outline`, sleep `moon-outline`, awake `eye-outline`, walk `walk-outline`, training `fitness-outline`, vaccination `bandage-outline`, veterinary `medkit-outline`; poop är egen ikon. Ionicons saknar begriplig kapselikon: deworming använder tillfälligt `medical-outline`, märks som avvikelse i galleri/rapport och är ett öppet designägarbeslut, inte visuellt PASS.
- Ingen SVG-infrastruktur eller direkt `react-native-svg`-dependency finns. PoopIcon använder tokeniserade React Native-linjeformer, samma optiska 20/24-storlek och stroke som Ionicons, döljer interna former från skärmläsare och låter märkt IconChip bära semantiken. Visuell QA är obligatorisk.
- `HeroCard` använder flera tokeniserade halvtransparenta overlaylager som dokumenterad gradientapproximation. Den beskrivs inte som äkta gradient; äkta gradient kräver separat dependencygodkännande.
- Befintliga skärmar migreras inte. Dialog och BottomSheet använder React Natives `Modal`. Datum/tid-fält är märkta textinmatningar med keyboard-/format-hints, inte native pickers.
- Lintregler för `app/**/*.tsx` och samtliga `src/features/**/*.tsx` rapporterar legacy-hex och hårdkodad numerisk `fontSize` som varningar så `pnpm check` kan passera; tokenreferenser som `fontSize: tokens.typography.body.fontSize` är tillåtna. Hexkontrollen omfattar 3/4/6/8 siffror. Det bredare feature-TSX-scopet inkluderar bland annat `ProductWorkspace.tsx` och `DevelopmentPreview.tsx` och ger en sanningsenlig legacyinventering. `src/components/ui/**/*.{ts,tsx}` har samma regler som fel. `src/theme/tokens.ts` undantas. Befintliga varningar listas separat och rättas inte.
- Avmaskning visas endast som neutral gallerikategori utan schema, dos, rekommendation eller vårdråd. Ikonvalet förblir avvikelse/NOT TESTABLE tills designägaren beslutat.

## Låst svensk exempelcopy

| Komponent/tillstånd | Exempel | Krav |
|---|---|---|
| Toast success + undo | `Loggat` / `Ångra` | Visas först efter verkligt lyckad handling; ångra kräver callback. |
| Toast error + retry | `Kunde inte spara` / `Försök igen` | Ingen teknisk förklaring; retry kräver callback. |
| Toast neutral | `Påminnelsen är avstängd` | Saklig status, ingen falsk leveransgaranti och ingen åtgärd utan callback. |
| EmptyState | `Inget här än` / `Lägg till den första händelsen` | Vänlig förklaring och tydlig nästa handling. |
| Field error | `Kontrollera datumet` | Intill fältet och beskriver vad användaren kan göra. |
| Dialog | `Radera händelsen?` / `Det går inte att ångra.` | Explicit konsekvens; knappar `Avbryt` och `Radera`. |
| BottomSheet | `Tassla-pass` / `Dela som PDF` | Kort rubrik och en huvudhandling. |

Fokuserat test förbjuder UI-orden server, synk/synkronisera, backend, databas, request, cache, token, endpoint, underlag och registreringar i gallericopy. Manuell Product/Critic-kontroll bedömer sanningsenlighet, varm vardagston och högst två rader för förklarande block utan att klippa viktig text.

## Komponentkontrakt

- `Button`: primary/secondary/tertiary/icon/destructive och default/pressed/disabled/loading. Full bredd utom `icon`, som är tokeniserat kvadratisk med 44×44 tryckyta.
- `AppBar`: Home/Back/Close med centrerad titel och valfri märkt stödhandling.
- `Tabs`: godtyckligt antal flikar i horisontell `ScrollView`; aktiv = fet, primary och understreck.
- `Progress`: numeriskt värde clampas till 0–100 och har synlig textetikett, så färg är inte enda signal.
- `Toast`: success/error/neutral; valfri `onUndo` eller `onRetry` styr verklig märkt åtgärd och minst 44 hög tryckyta.
- `Field`: text/date/time/multiline; label, hjälp, fel och `TextInput`-kontrakt utan pickeranspråk.
- `StatusBadge`: endast avvikande `saving`, `offline`, `error`; ingen normal/sparad/ägarregistrerad variant.
- `Dialog`/`BottomSheet`: `onRequestClose`, `accessibilityViewIsModal`, märkt 44×44-stängning, scrollbart innehåll och innehållsstyrd höjd för stor text.
- `IconChip` och Button `icon` är uttryckliga undantag från full föräldrabredd eftersom de är tokeniserade ikonbehållare. Alla övriga publika komponenter fyller tillgänglig bredd utan fast bredd.

## Kontroller

- `pnpm typecheck`
- fokuserade komponent-/policytester
- `pnpm lint` (PASS med befintliga fynd som varningar, nya UI-fynd som fel)
- `pnpm test`
- `git diff --check`
- renderat galleri på liten/stor mobilbredd och stor text när lokal previewmiljö med skärmdump är tillgänglig

## Exakt nästa steg

Architect omgranskar den Critic-justerade plan v4. Vid APPROVE registreras paketet i kön och implementer får ensam skriväganderätt till kodfilerna.

## Implementationscheckpoint 2026-10-07

- Architect APPROVE plan v4; Critic PROCEED WITH CHANGES tillämpade före kod.
- Implementerat: tokens med exakt legacyalias, 18 beställda komponentfamiljer, stödikonen `PoopIcon`, barrel-export, utvecklingsgalleri, previewport, lintpolicy och policytester. Inga produktskärmar, routes eller produktionsnavigation har ändrats.
- Cleanup: komponentgrupperna använder gemensamma tokens, central kategoriikonmappning och korta propkontrakt; inga oanvända imports eller lokala hex/fontSize finns i nya UI-filer.
- Verifierat: `pnpm install --frozen-lockfile` återställde exakt låst `expo-notifications` 57.0.21 utan lockfileändring. `pnpm check` PASS med 355/355 tester och 238 legacyvarningar (62 hex, 176 numeriska fontSize) i 18 befintliga featurefiler. Nya UI-filer: 0 lintfel. `git diff --check` PASS.
- Rendering: ingen Android-enhet/emulator (`adb` saknas), ingen iOS-simulator på Windows och inga installerade `react-dom`/`react-native-web`. Ingen dependency har lagts till. Galleriskärmdumpar på liten/stor bredd och stor text är därför NOT TESTABLE; paketet får inte markeras visuellt klart.
- Oberoende QA: PASS för kodacceptans efter fokuserat 8/8, `pnpm check` 355/355 och `git diff --check`; visuell status separat NOT TESTABLE.

## Designchecklista §14 – komponentbibliotek

1. Ej tillämplig: galleriet visar avsiktligt variantmatris, inte en produktvy med huvudhandling.
2. Ja i kod: Button-varianterna delar höjd, radie och typografi.
3. Ja i kod: destructive är röd kontur/text och dialogen har uttrycklig bekräftelse.
4. Ja: inga Ändra/Radera-länkar på listrader i biblioteket.
5. Ja i kod: spacing och sektionsmarginaler kommer från tokens. Visuell rytm NOT TESTABLE.
6. Ja för nya UI-filer: inga lokala hex eller numeriska fontSize; övriga mått är tokeniserade.
7. Ja med dokumenterat undantag: Ionicons används; bajs är egen linjeikon, ingen emoji.
8. Ja strukturellt: central kategoriikon/färg. Avmaskningsikonens begriplighet är NOT TESTABLE/öppen avvikelse.
9. NOT TESTABLE visuellt: särskilt egen bajsikon och tillfällig avmaskningsikon kräver rendering.
10. Ja: StatusBadge erbjuder endast avvikande lägen.
11. Ej tillämplig: komponentgalleriet har ingen informationsbanner.
12. Ja: policytest kontrollerar faktisk gallericopy mot förbjudna ord.
13. Ja i copy; faktisk tvåradersomflödning med stor text är NOT TESTABLE.
14. Ja för relevanta komponenttillstånd; skärmens fyra datalägen är ej tillämpliga för ett statiskt komponentgalleri.
15. Ja i kod för minsta 44×44; stor text och skärmläsare är NOT TESTABLE utan native-rendering.
16. NOT TESTABLE: ingen renderad galleriskärmdump finns.
17. Ej tillämplig som skärmkrav; AppBar och Tabs visas, BottomNav ingick inte i beställningen.
18. Ej tillämplig: galleriet representerar inga hunddata eller produktskärmar.

## Korrigeringsplan v4.1 – reviewerfynd 1

Reviewer BLOCK: den publika `Button.fullWidth` kan låta icke-ikonknappar bryta kravet att fylla föräldrabredden. Propen saknar anrop och är spekulativ.

Ägare: implementer. Fil: `src/components/ui/Button.tsx`. Ändring: ta bort `fullWidth` ur publikt propskontrakt och renderingslogik; alla icke-ikonvarianter får alltid `alignSelf: 'stretch'`, medan `icon` fortsatt är tokeniserat 44×44-undantag. Ingen annan komponent, skärm eller plan ändras. Verifiering: fokuserat policytest, `pnpm check`, iOS-export och `git diff --check`, sedan oberoende QA och renewed reviewer. Visuell evidens förblir en separat blockerare.

Implementerat: `fullWidth` borttaget; bas-Button stretchar och icon överskriver med 44×44. Förnyad QA PASS: fokuserat 9/9, `pnpm check` 356/356 och `git diff --check` PASS. iOS-export PASS från implementer.

Förnyad reviewer: kod-PASS efter korrigering v4.1. Total leverans BLOCK eftersom inga renderade galleriskärmdumpar finns. Exakt nästa steg är att köra befintligt `pnpm start:preview` på en native-enhet/emulator eller en separat godkänd webbruntime, fånga liten/stor bredd och stor text, spara evidens och låta oberoende visuell QA fylla om §14 innan renewed reviewer.
