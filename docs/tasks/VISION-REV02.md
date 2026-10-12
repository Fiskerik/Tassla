# VISION-REV02 — sammanhängande design- och byggunderlag

Datum: 2026-10-13. Branch: `design/vision-rev02`. Bas: `9128cdd` på `work`.

## Beställning och leverans

Erik beställer specifikation, byggprompt för Hem, komponentutvecklingsunderlag och koppling av produktobjekt, sammanställda i ett uppdaterat designregelverk mot `vision_rev02.jpg`, på ny branch.

Denna dokumentleverans konkretiserar hela förflyttningen. Komponent-API:er, nya produktobjekt och skärmar som beskrivs som föreslagna är ännu inte implementerade. Befintlig layout ligger kvar på bascommitten. Ingen backendmigrering eller innehållspublicering sker genom dokumentändringarna.

## Deluppgifter

| # | Ägare | Leverans / filer | Beroende | Acceptans / verifiering |
|---|---|---|---|---|
| 1 | Koordinator + Product/Architect, läsande | Ny branch, inventering av målbild, komponenter och datakällor | Bascommit | Aktuell implementation skiljs från förslag; verkliga sökvägar |
| 2 | Koordinator | `docs/design-rules.md`, `docs/design/vision-rev02-spec.md`, `docs/design/vision-rev02-objects.md`, `docs/prompts/build-home-rev02.md` | 1 | Alla åtta målbildsvyer, Hem-kontrakt, komponenter, tillstånd, innehåll och dataflöden beskrivna |
| 3 | Koordinator | `.agents/skills/tassla-consumer-ux/SKILL.md`, `.codex/skills/SKILLS.md`, `docs/dev/ui-and-code-standards.md`, kort aktuell hänvisning i `AGENTS.md` | 2 | Aktiva anvisningar använder samma målbild; äldre paketrapporter bevaras |
| 4 | Architect, Critic läsande; koordinator sparar | Detta dokument: granskning och checkpoint | 2–3 | Inga påhittade fungerande API:er, inga falska progress-/QA-påståenden; lokal länkkontroll och diffcheck |

Produkt- och arkitekturinventering sker parallellt utan skrivåtkomst. Koordinatorn äger dokumentändringarna.

## Föreslagen byggordning efter dokumentleveransen

| Paket | Resultat | Berörda områden | Beroende / grind |
|---|---|---|---|
| R02-1 | Hem-referens i granskningsläge med delade komponenter och galleriexempel | `src/components/ui/`, `src/theme/tokens.ts`, `HomeScreen.tsx`, `tools/visual-check/` | Exakt implementationplan, Architect + Critic; visuellt facit |
| R02-2 | Dagens aktiviteter, bekräftad markering och gemensam progress på Hem/checklista | Föreslagen daily-activity-modul, Supabase-migrering/test, workspace-integration | Datakontrakt nedan, exakt migrationsplan och säkerhetsgranskning |
| R02-3 | Samma komponenter i Träning, Kunskap och Logg | Respektive feature + innehållspresentation | R02-1; bevara sparning, FAQ/checkliståtkomst och återhämtning |
| R02-4 | Utveckling, Dagens framsteg och Insikter | Nya detaljvyer och befintliga dataläsare | R02-2 där progress används; sakgranskat innehåll, kompletta perioddata |
| R02-5 | Valfritt personligt hundfoto | Profil, filhantering, lagringspolicy/radering | Separat konkret foto- och säkerhetskontrakt; blockerar inte redaktionella bildkort |

Varje rad delas i små vertikala implementationtasks med exakta skrivfiler, tester och oberoende QA/review enligt `docs/dev/workflow.md`. Paketen ovan är ordning och mål, inte färdiga tekniska godkännanden. Befintligt mandat återanvänds; fråga endast om en faktisk obesvarad produkt-/data-/kostnadsfråga behöver avgöras.

## Checkpoint

- Inventering slutförd; branch skapad med ren bas.
- Regelverk, skärmspecifikation, objektkontrakt och byggprompt är skrivna. De två skillkopiorna och aktiva designhänvisningar är synkade till rev02.
- Dokumentgranskning slutförd: Architect APPROVE för dokumentpaketet; Critic PROCEED. Se sparade granskningsresultat nedan.
- Ingen ny appkod, rendering eller databasverifiering har utförts i dokumentpaketet.
- Lokala kontroller: diffcheck utan fel, 10 relativa dokumentlänkar har befintliga mål, skillkopiorna är identiska. Inga apptester körda för rena dokumentändringar.
- Nästa byggsteg: R02-1 med exakt implementationplan, delade komponenter och Hem-referens enligt byggprompten. Dokumentpaketet är färdigt på lokal branch; ännu inte committat eller pushat.

## Sparad dokumentgranskning

Architect: **APPROVE för dokumentpaketet**. Källor och befintliga API:er stämmer med kodbasen och skiljs från förslag. Dokumenten är samstämmiga om okänd/ofullständig data, lokalt dygn och låst tidszon för aktivitetsinstanser, konto-/hundavgränsning, radering och 16 pt marginal över navigationen. Inga blockerande dokumentfel hittades.

Detta är inte implementationsgodkännande. R02-1 behöver exakt plan och QA. R02-2 behöver fastställa uppgiftsvalets gränssnitt och, för varje valbar aktivitet, om status härleds från källa, markeras av ägaren med separat avgränsad lagring eller är informativ och inte räknas. Att öppna en artikel är inte automatiskt completion. Föreslagna datakontrakt är inte ett godkänt schema eller ett befintligt API.

Critic: **PROCEED**. Alla åtta bildpaneler kopplas till komposition, användarflöde, befintliga källor/luckor och byggmål. Hem har detaljerat kontrakt och prompt; övriga vyer ligger i tydligt ordnade senare paket. Syntetiska dagsuppgifter begränsas till granskningsläge. §14 kräver jämförelse sida vid sida av layout, komponentformer, objekt, innehållstäthet och bilder; korrekta mått kan inte upphäva synligt fel komposition. Inga blockerande motsägelser hittades. Dokumentgranskningen innebär inte visuell acceptans av appen.

## Sparad inventering

Product bekräftar att målbilden innehåller åtta vyer och att befintligt Hem är en källöversikt. Daglig completion, milstolpar, progressring och fullständiga insiktsgrafer är nya produktkontrakt. Kunskapens faschecklista får inte beskrivas som en redan fungerande dagslista. Befintliga loggtyper och FAQ/checkliståtkomst ska bevaras.

Architect bekräftar exakta källor: `dogs`, `dog_events` (vardag, vikt och utförd hälsa med olika kontrakt), `dog_health_plans`, publicerade `content_versions`/`training_steps`, `training_progress` och hundens checklistdata. Rekommendationen är separata sanningskällor och härledda vyer, inte universell completed-flagga eller kopierad progress. Ny manuell dagsrutin är ett separat föreslaget objekt som behöver lagringskontrakt; källstyrd dagsstatus härleds från befintlig källa. Befintligt MVP-språk om utvecklingshändelser motsvaras ännu inte av en implementerad observationskälla.

Underlaget inför inte en ny full implementationstillåtelse eller nya tekniska godkännanden genom dessa inventeringssvar. Exakta byggdelar följer ordinarie planreview och redan givna ägarmandat.
