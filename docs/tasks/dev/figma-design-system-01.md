# FIGMA-DS-01 – Tasslas designsystem i Figma

Datum: 2026-10-07  
Planversion: v3  
Status: Pågår – QA UNDERKÄND; korrigering blockerad av Figmas Starter-gräns  
Mandat: Eriks uttryckliga beställning 2026-10-07 att bygga designsystemet i angiven Figma-fil, utan skärmar.  
Release-log: [docs/releases/FIGMA-DS-01.md](../../releases/FIGMA-DS-01.md)

## Scope och användaruppgift

Skapa en återanvändbar, varm och lugn designgrund som gör att kommande Tassla-skärmar kan sättas samman konsekvent. Ingen appskärm eller appkod ingår.

Huvudhandling i komponentexempel: en primär handling åt gången. Synlig information: tokens, komponentnamn, varianter och representativa tillstånd. Fördjupning: kort användningsbeskrivning på komponent-/komponentsetnivå. Visuell riktning: `vision_rev01.jpg` och `docs/design-rules.md`, inte pixelkopiering.

## Numrerade deluppgifter

1. **Inventering och planlåsning**  
   Ägare: huvudsession.  
   Beroenden: `docs/design/INVENTORY.md`, `docs/design-rules.md`, befintlig Figma-fil och tillgängliga bibliotek.  
   Påverkade ytor: endast Figma-filen samt denna plan/release-log.  
   Acceptans: befintliga variabler, stilar, komponenter och bibliotek är inventerade; gap och antaganden är dokumenterade.  
   Verifiering: read-only Figma-inspektion samt bibliotekssökning.

2. **Foundations**  
   Ägare: huvudsession.  
   Beroenden: deluppgift 1 och arkitektens godkännande av exakt plan.  
   Påverkade ytor: Figma-sidan `Design system`.  
   Acceptans: variablerna i den låsta arkitekturen nedan finns; semantiska färger aliasar primitiver; scopes och kodsyntax är satta; textstilar finns.  
   Verifiering: strukturell audit av collections, modes, värden, alias, scopes, kodsyntax och stilar.

3. **Komponentbibliotek**  
   Ägare: huvudsession.  
   Beroenden: verifierad deluppgift 2.  
   Påverkade ytor: Figma-sidan `Design system`.  
   Acceptans: Button (primary/secondary/tertiary/icon/destructive), AppBar, Tabs, BottomNav, ListRow, Card, HeroCard, QuickLogTile, ChecklistItem, Progress, Toast och kategoribundna IconChip-komponenter finns med den låsta variantmatrisen nedan och variabelbindningar. Inga skärmar byggs.  
   Verifiering: variant-/property-audit och kontroll att representativa noder använder variabler.

4. **Visuell QA och checkpoint**  
   Ägare: separat QA/reviewer för bedömning; huvudsession rättar högst två gånger.  
   Beroenden: deluppgift 3.  
   Påverkade ytor: Figma-sidan `Design system`, denna plan och release-loggen.  
   Acceptans: komponentöversikten är läsbar utan klippning/överlapp; målbildens hierarki, färgton, ikonprincip och tryckytor följs; relevanta punkter i designchecklistan är Ja och övriga motiveras som ej tillämpliga.  
   Verifiering: renderad Figma-skärmdump, strukturell audit och separat granskning.

## Låsta avgränsningar och antaganden

- Endast sidan `Design system`; inga produktionsskärmar, prototypflöden eller appkod.
- Systemfont representeras med tillgänglig Figma-systemnära sans-serif; ingen ny fontdependency.
- Endast ljust tema eftersom källförslaget inte definierar mörkt tema.
- Ionicons-riktningen representeras med enhetliga vektorikoner; inget emoji-innehåll.
- Kategori `awake` representeras med en enhetlig ögonikon (`eye-outline`) som tydligt designantagande; den ersätter inte ett senare produktbeslut om appens slutliga Ionicons-namn.
- Komponentdimensioner som 56 px knapphöjd och 32 px ikon-chip följer inventeringens förslag och ska visuellt verifieras, inte behandlas som ny appimplementering.

## Låst variabelarkitektur

Samtliga collections har ett läge: `Light` för färg och `Default` för övriga. Varje variabel får WEB-, Android- och iOS-kodsyntax. Primitiver har tom scope; semantiska variabler har snäv scope.

- `Primitives` (`COLOR`): white `#FFFFFF`, cream `#F7F1E7`, ink `#1C3027`, muted `#536257`, green-700 `#186A4D`, green-800 `#12543D`, border `#D9DFD7`, green-100 `#E8EFE8`, success-surface `#EAF3EC`, amber-700 `#785716`, amber-100 `#F5E7BF`, red-700 `#A32929`, red-100 `#F7EAE7`, red-200 `#D5A5A0`, blue-700 `#246A98`, blue-100 `#E4EEF4`, brown-700 `#885839`, brown-100 `#F5E9DF`, purple-700 `#72558E`, purple-100 `#F0E9F5`, food-100 `#E5EFE8`, black-53 `#00000088`.
- `Color` (`COLOR`, aliases till `Primitives`): `background`, `surface`, `primary`, `primaryPressed`, `onPrimary`, `textPrimary`, `textSecondary`, `border`, `selectedSurface`, `success`, `successSurface`, `warning`, `warningSurface`, `danger`, `dangerSurface`, `dangerBorder`, `overlay`; samt `category/{pee,poop,food,sleep,awake,walk,training,vaccination,deworming,veterinary}/{fg,bg}`. Fill-, text- och stroke-scope delas upp efter roll.
- `Spacing` (`FLOAT`, scope `GAP`): `spacing/{xs,sm,md,lg,xl,xxl}` = `4/8/12/16/24/32`; aliasroller `layout/{headingGap,listGap,cardPadding,pageInset,sectionGap}`.
- `Radius` (`FLOAT`, scope `CORNER_RADIUS`): `radius/{sm,md,lg,full}` = `8/14/20/999`.
- `Sizing` (`FLOAT`, scope `WIDTH_HEIGHT` eller `STROKE_FLOAT`): `size/{touchMin,buttonHeight,navHeight,iconSm,iconMd,chipMd,chipLg,stroke,progress,heroHeight}` = `44/56/56/20/24/32/44/1/4/200`.
- `Typography` (`STRING`/`FLOAT`): `font/family=Inter`; `font/style/{regular,bold,extraBold}` = `Regular/Bold/Extra Bold`; `type/{title,heading,body,caption,label}/size` = `24/20/16/14/16`; motsvarande `lineHeight` = `32/28/24/20/24`. Scope är `FONT_FAMILY`, `FONT_STYLE`, `FONT_SIZE` respektive `LINE_HEIGHT`. Inter används uttryckligen som Figma-proxy för appens native systemfont; detta inför inte Inter som appdependency.
- Textstilar: `Type/Title`, `Type/Heading`, `Type/Body`, `Type/Caption`, `Type/Label`, med ovanstående Inter-vikter och mått. Representativa textnoder binds dessutom till typografivariabler så variabelanvändningen kan auditeras.

Bindings: alla fills/strokes, padding/gap, radius, kontrollmått, stroke/progressmått och representativa textfält binds till ovanstående variabler. Ikonernas vektorgeometri är den enda fasta geometrin; färg och ikonramens mått binds.

## Låst komponentmatris

| Familj | Variantaxlar / properties | Minimikrav |
|---|---|---|
| Button | `Style=Primary|Secondary|Tertiary|Icon|Destructive`, `State=Default|Pressed|Disabled|Loading` (20); textproperty `Label` | 56 hög, min 44×44, label omflödar, destructive aldrig fylld som primary |
| AppBar | `Mode=Home|Back`, `Action=On|Off` (4); `Title` | centrerad titel; home-brand/backikon och stödhandling |
| TabItem (intern) | `State=Active|Inactive` (2); `Label` | aktiv primary + understreck; inaktiv textSecondary; minst 44 hög |
| Tabs (publik) | `Count=3, Active=1|2|3` samt `Count=4, Active=1|2|3|4` (7); `Tab 1…4` via nested TabItem-properties | sammansatt horisontell kontroll med 3 eller 4 synliga textflikar och exakt en aktiv flik |
| BottomNavItem (intern) | `State=Active|Inactive` (2); `Label` | ikon + text, 56 hög, aktiv/inaktiv ikonstil |
| BottomNav (publik) | `Active=Home|Log|Training|Health|More` (5) | fem fasta, lika breda destinationer med labels Hem/Logg/Träning/Hälsa/Mer och motsvarande nested item-state |
| ListRow | `Status=Default|Complete`, `State=Default|Pressed|Disabled` (6); `Title`, `Meta` | IconChip, två textnivåer, chevron; innehållsstyrd höjd och minst 44 |
| Card | `State=Default|Pressed|Selected` (3) | surface + border + radius.lg + padding 16; innehållsstyrd höjd |
| HeroCard | `State=Default|Pressed` (2); `Title`, `Meta` | 200 hög, tonad mediayta och kontrasterande overlaytext; ingen produktionsbild/skärm |
| QuickLogTile | `State=Default|Pressed|Disabled` (3); `Label`, nested IconChip-instance | tydlig textetikett, minst 44, kategori byts via nested chip-variant |
| ChecklistItem | `Checked=Yes|No`, `State=Default|Pressed|Disabled` (6); `Label` | hel rad tryckbar, minst 44, bock + text och ej enbart färg |
| Progress | `Value=Empty|Partial|Complete` (3); `Label` | 4 hög stapel + textetikett, färg inte enda signal |
| Toast | `Tone=Success|Error|Neutral`, `Action=None|Undo` (6); `Message` | kort vardaglig text, ångra synlig endast i Action=Undo |
| IconChip | `Category=Pee|Poop|Food|Sleep|Awake|Walk|Training|Vaccination|Deworming|Veterinary`, `Size=Medium|Large` (20) | fg/bg per kategori, 32/44, 20/24 ikon, samma vektorstil och ingen emoji |

Alla textproperties ska visa kort svensk exempelcopy. Normal text får omflöde; viktig text klipps inte. Variantseten och en separat review-frame med instanser ska vara läsliga i 100 % zoom.

## Mappning till visuell checklista

- Punkt 1–4: Button-matrisen demonstrerar en hierarki; ingen skärm byggs, därför är skärmantal primärknappar i övrigt ej tillämpligt.
- Punkt 5–9: strukturell audit ska visa variabelbindningar och enhetliga kategoriikoner utan emoji.
- Punkt 10–13: komponentexemplen använder ingen normalstatusbadge, teknisk copy eller informationsbanner.
- Punkt 14–15: state-varianter täcker relevant disabled/loading/pressed/checked; alla interaktiva komponenter är minst 44×44 och review-frame granskas för omflöde.
- Punkt 16: renderad Figma-skärmdump jämförs med målbildens visuella språk, inte med en exakt skärmlayout.
- Punkt 17–18: endast komponentdelarna AppBar/Tabs/BottomNav bedöms; foto och hundnamn är ej tillämpligt eftersom inga skärmar byggs.

## Checkpoint

Deluppgift 1–3 är genomförda i Figma-filen på sidan `Design system`. Arkitekt gav APPROVE för plan v3. Foundations består av 6 collections, 98 variabler och 5 textstilar. Samtliga efterfrågade komponentfamiljer finns som variantset; review-ytan `Design system / Review` innehåller representativa instanser och inga appskärmar.

Strukturell audit verifierade collections, modes, scopes, kodsyntax, 37 semantiska färgalias, variantantal och minst 44 px på auditerade interaktiva komponentrötter. Sex kvarvarande obundna, transparenta ListRow-behållare rättades därefter. En sista omläsning kunde inte köras eftersom Figmas Starter-gräns för MCP-anrop nåddes; den sista rättningen är därför inte återverifierad och får inte rapporteras som strukturellt PASS.

Separat visuell QA 2026-10-07 gav **UNDERKÄND**. Konkreta avvikelser:

1. fyrfliksvarianten av Tabs klipper den sista etiketten `Vikt`;
2. QA rapporterade Checklist- och Toast-exempel utanför sina review-kolumner; review-bredden justerades senare men är inte oberoende återgranskad;
3. Toast-handlingen `Ångra` har för liten tryckyta (116×26 i granskad instans);
4. Error- och Neutral-Toast använder missvisande standardcopy `Sparat`;
5. kategorin Walk använder en tassikon som inte tillräckligt tydligt betyder promenad.

Första ofärdiga deluppgift är 4. Nästa exakta steg är att, när Figma-åtkomst finns igen, rätta dessa fem punkter, köra om strukturell audit och skärmdumps-QA och därefter låta oberoende reviewer bedöma resultatet. Webbläsarreservvägen stannade vid Figmas inloggning och användes inte för att kringgå autentisering.
