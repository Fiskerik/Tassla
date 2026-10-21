# Vision rev02 — skärmar, komponenter och Hem

Version 1.2, 2026-10-13. Normativ design under [regelverket](../design-rules.md); API-namn märkta föreslagna är inte implementerade. Baseline: `9128cdd`.

**Hem-precisering:** [HOME-REV02-visual-ux-spec](../plans/HOME-REV02-visual-ux-spec.md) definierar bindande färgroller, måttbudget, uppgiftsrader, bildroller och gränsen mellan översikt/hantering. Det gäller framför generella Hem-råd nedan. Övriga panelers kontrakt kvarstår. R02-2 v11 är `done` för godkänd lokal implementation och Home-rendering enligt kö/checkpoint; Supabase/RLS-runtime och nativebeteende är inte verifierade. Äldre inventeringar beskriver kodens startläge.

**Alla skärmar:** [Detaljerade skärmkontrakt](vision-rev02-screen-contracts.md) preciserar panel 1–8 och stödskärmar. De styr genomförandet framför denna äldre översikt. Använd [Codex-bygginstruktionen](../prompts/build-rev02-screens.md) för vald vy.

## Panelkarta och resor

Panelerna numreras vänster till höger, övre raden 1–4, undre 5–8. Bilden saknar exakt px-specifikation; proportioner bedöms mot beskuren appyta, utan telefonram/systemstatus. De numeriska målen nedan är föreslagna implementationkrav, inte uppmätta originalvärden.

| Panel | Komposition och primär resa | Källa / nuläge | Mål att bygga |
|---|---|---|---|
| 1 Hem | Hälsning + hundporträtt; automatisk ålder och ungefärlig livsfas; Just nu; Dagens att göra + progress; Logga/Träna/Kunskap | Hund/innehåll/träningssteg/logg/plan finns. Hem har idag tre källgrupper | Enhetsväxlande åldersremsa, separat ungefärlig fas, kompakt grupplista och tonade destinationskort |
| 2 Utveckling | Bakåt + {namn}s utveckling; stort hundporträtt; åldersbåge; aktuell fas; kommande milstolpar | Födelsedatum och innehållsurval finns; ingen milstolpsmodell | Hemmets ålder öppnar åldersguide. Bågen visar kronologisk ålder, inte uppnådd färdighet. Milstolpar är sakgranskade ungefärliga faser |
| 3 Dagens framsteg | Ring med hundbild och dagsantal; utförda aktiviteter med tid; saklig uppmuntran; veckomål | Loggar/träningsmarkeringar finns separat; gemensamma dag-/veckomål saknas | Hemmets dagsantal öppnar samma uppgiftsmängd som dagslistan. Veckomål visas först när definierade |
| 4 Checklista | Idag/Denna vecka/Alla; progress + aktivitetsrader; kommande aktiviteter | Befintliga checklistor är fasbaserade, delvis review-gated | Föreslagen daglig aktivitetsvy, separat från faschecklistor. Bock och detaljlänk är separata handlingar |
| 5 Logga | Vänstertitel; Idag/Översikt; datumväxlare; tid-först-lista; Lägg till händelse | Produktions-CRUD, fyra snabbval, Fler, ångra och historik finns | Matcha listytan; behåll snabb logg åtkomlig med ett tryck. Översikt öppnar Insikter när byggd |
| 6 Träning | Rekommenderat/Alla övningar/Mina; två bildkort; Fortsätt där ni var med progress | Publicerade versionsbundna program/steg finns | Bild-över-text-kort, verkliga rekommendationer och återupptagning; inget påhittat program vid tomt urval |
| 7 Kunskap | Titel; sök; Just nu/Valp/Träning/Beteende; stort rekommenderat bildkort; mindre kort | Publicerade guider, faschecklistor och FAQ finns; sök/taxonomi behöver preciseras | Lokal sök/filter över laddat publicerat urval med tydlig omfattning; behåll Checklistor/FAQ som synliga ingångar |
| 8 Insikter | Vecka/Månad/Sedan start; Kiss & bajs-staplar; sömn/vaken-tidslinje | Deskriptiv kiss/bajs-sammanfattning finns, ingen komplett diagramvy | Periodavgränsade grafer med täckningsinformation; inga sömnintervall utan tillräckliga tid-/durationdata |

Detaljvyer under Hem håller Hem vald, Insikter håller Logg vald. Daglig Checklista nås från Hem, faschecklistor från Kunskap och behåller respektive förälder. Hälsa/Tassla-pass ligger kvar under Mer. Tillbaka återför användaren till sin ingång och tidigare scrollposition där möjligt.

## Hem: användaruppgift och struktur

Ägaren ska snabbt se hundens aktuella sammanhang, dagens aktiviteter och en tydlig nästa handling. Huvudresan: öppna Hem → välj en verklig aktivitet → öppna rätt befintligt flöde → registrera där → återvänd till uppdaterat Hem.

```text
Hälsning + namn/ålder             Hundporträtt
           Automatisk ålder · ungefärlig fas
┌ Just nu med {namn}                          ┐
│ Kort publicerad ingress                 ›  │
└────────────────────────────────────────────┘
┌ Dagens att göra              {klart}/{alla} ┐
│ Progress                                   │
│ [ ] Aktivitet 1                         ›  │
│ [✓] Aktivitet 2                         ›  │
│ ... upp till fem synliga rader              │
│ Visa alla (endast om fler)                  │
└────────────────────────────────────────────┘
Vad vill du göra nu?
[ Logga ]        [ Träna ]       [ Kunskap ]
Fri marginal över meny + safe area
Hem       Logg       Träning       Kunskap       Mer
```

### H1. Hälsning, identitet och automatisk ålder

- Verkligt namn och levnadsålder; ras kan ligga i profil om metaraden annars blir för lång.
- Hundporträttet har tydlig visuell vikt och konsekvent beskärning. Fallback har samma layoututrymme.
- Hem visar hela veckor till och med 20 veckor, hela kalendermånader till och med första födelsedagen och hela år därefter. Identitetsrad, remsa och `Just nu` använder samma automatiska ålder.
- En separat, ungefärlig livsfas visas som VALP före 6 hela kalendermånader, UNGHUND från 6 till före 24 månader och VUXEN från 24 månader. Faserna är inte universella veterinärklassificeringar.
- Remsan visar veckor 0–20, månader 0–12 eller år 1 till aktuell ålder +3; aktuell markör är vald. Framtida markörer innebär inte uppnådd färdighet.
- Saknat/ogiltigt/framtida födelsedatum ger neutral ålderspresentation; ingen falsk vecka 0, remsa eller fas.
- Åldersområdet öppnar Utveckling först när den vyn finns. Före det är remsan informativ utan falsk tryckaffordans.

### H2. Just nu

- Ett kort med ikon, titel, ingress och tydlig öppningshandling. Inget carouselblock före veckoremsan.
- Aktuell publicerad innehållsversion delas med Kunskap. Titel och full text nås i läsvyn även om kortet visar kort ingress.
- Träningsfallback får användas när ett faktiskt tillgängligt publicerat steg finns. Fel ersätts inte med reviewexempel.
- Loading: skeleton med liknande yta. Empty: kort neutralt besked och Kunskapsväg. Error: lokal retry. Kortet öppnar inget saknat objekt.

### H3. Dagens att göra och progress

- Full rev02 använder dagliga aktivitetsinstanser enligt [objektkontraktet](vision-rev02-objects.md). Fem rader är presentationsgräns, inte hårdkodat antal uppgifter.
- Antal gäller hela kända aktiva mängden för vald dag. Vid fler än fem: Visa alla öppnar full uppgifts-/hanteringsyta enligt det preciserade Hem-kontraktet; aldrig dölj nämnaren. Inlineexpansion i nuvarande R02-2 är en implementationsavvikelse från detta nya designmål.
- Noll uppgifter: ”Inga aktiviteter planerade idag”, utan 0/0 eller fylld progressring.
- Källa otillgänglig/partiell: visa tillgängliga rader och ett lokalt besked, dölj totalprogress som inte kan beräknas tillförlitligt.
- Checkrutan kan bara ändra status om raden har definierad manuell slutförandehandling. Källstyrda rader leder till källflödet; ingen parallell träningsbock.
- Pending bock räknas inte; sparat/återläst resultat uppdaterar Hem, full lista och framsteg tillsammans. Retry/unsure behåller avsikten.
- Nuvarande källöversikt är ett separat kompatibilitetsläge tills dagsfunktionen finns. Den får inte få en godtycklig ”2 av 5”-räknare eller godkännas som full målbild.

### H4. Genvägar

Tre lika breda tonade destinationskort med symbol och etikett. Logga = tass/logg, Träna = träningssymbol, Kunskap = bok. De öppnar sidor, inte snabbregistrering av kiss/träning/läsning. Återanvänd befintliga kontrollkomponenter och läsbara standardetiketter; stor-text- och träffyteaudit görs efter MVP.

## Komponentkontrakt

Kontrollera faktiska exporter i `src/components/ui/index.ts` före implementation. Föreslagna namn är avsikt, inte färdiga imports.

| Befintligt | Föreslagen utveckling | Kontrakt / verifiering |
|---|---|---|
| `Card` | Namngivna neutral/tonad/list-varianter | Gemensam radie/padding, inga lokala färgkopior; innehållsstyrd höjd |
| `Tabs(items, active, onChange)` | Opt-in segmented/chips-varianter | Nuvarande underline-default bibehålls tills berörd vy migreras; vald vy är tydlig, stor-text-audit efter MVP |
| `HeroCard(title, meta, image, ...)` | Bild över text för guide-/träningskort, valfri kompakt variant | Befintlig overlayvariant bevaras; foto och text får inte få olika tryckdestinationer |
| `Button(variant, label, ...)` | Gemensam kompakt tertiary-variant | Återanvänd etablerad kontroll och synlig label; separat träffytemätning efter MVP |
| `ListRow`, `ChecklistItem` | Kompakt grupprad med separator och tydligt separerade toggle/detail-handlingar | Tydlig status, ingen dubbeltryckning; befintlig kontrollkomponent återanvänds |
| `QuickLogTile` | Behåll snabbloggsbeteende; föreslagen separat `DestinationTile` | Destination har destinationsikon/färg; ingen kopppling till eventkategori för att få rätt kulör |
| `Progress(value, label)` | Gemensam progresspresentation med explicit unavailable/empty-status före rendering | Befintlig Progress tolkar ogiltigt värde som 0; adaptern måste stoppa okänd data från att se ut som noll |
| Ingen ringkomponent | Föreslagen `ProgressRing` för panel 3 | Samma count/total som listan; åtkomlig text; bedöm befintlig teknik före eventuellt nytt bibliotek |
| `DogCard`, `PhotoPlaceholder` | Föreslaget delat porträttformat för Hem/Utveckling | Foto/illustration explicit; belastning/läsfel ger samma reservformat |
| Hemmets automatiska åldersremsa | Delad åldersremsa när Utveckling byggs | Födelsedatumets kalendergränser återanvänds; ålder är inte datumfilter |
| `BottomNav`, `main-navigation.ts` | Behåll fem huvudflikar, lägg till explicit detalj→förälder | Fungerande tryck, tillbaka, vald-semantik och svep endast mellan huvudflikar |

Presentationskomponenter tar data/status/callbacks. Featurekompositionen väljer innehåll; dataadaptrar hanterar sparning. Skapa inget generellt sidbyggarramverk.

## Innehåll och bildproduktion

För varje synligt kort behövs innehålls-ID/version, korttitel, ingress, bildroll, läsdestination, publiceringsstatus och relevant ålders-/rasurval. Övningstid/lästid visas bara från redaktionellt värde eller dokumenterad beräkning. Taggar kräver verklig taxonomi; inga tomma filterflikar.

Bildmanifest och beskärningar ingår i respektive leverans. Befintliga `assets/images/dog-welcome.png` och `dog-resting.png` kan vara redaktionella exempel, inte personliga profilfoton. Sakgranskning av nya hundråd sker före publicering. Granskningsdata markeras i separat tydlig vyetikett som inte kan döljas av scroll eller maskeras som produktionsdata.

## Fixture- och acceptansmatris

| Scenario | Förväntat |
|---|---|
| Standard 375×844 och 430×844, fem korta uppgifter, två bekräftade | H1–H4 i ordning; riktig 2/5 i fixture; minst 16pt mellan hela genvägskort och meny |
| Inga uppgifter / alla klara / fler än fem | Ingen 0/0; full count; Visa alla när listan är begränsad |
| Långt hundnamn och långa svenska titlar i standardskala | Ingen dold kritisk copy, naturlig scroll och fungerande kontroller; stor-text-audit efter MVP |
| 375×667 med normal text | Scroll till samtliga handlingar; korrekt meny-/safe-area-utrymme |
| Spara → fel / osäkert / kontroll → sparat / ångra | Ingen falsk bock/räknare, bibehållen avsikt, samma resultat i alla konsumenter |
| Midnatt / app-resume / sommartid / ändrad tidszon | Ny dag härleds enligt objektkontrakt; ingen dubbelgenerering eller flyttad äldre dagsmarkering |
| Konto-/hundbyte med långsam läsning/skrivning | Inga gamla kort, foton, bockar eller sena svar i nya scopet |
| Public / explicit review / innehållsfel | Inga reviewobjekt eller reviewskrivningar i public; verkligt fel kvarstår som fel |
| Genväg, uppgift, ålder, progress, tillbaka | Verklig destination, korrekt föräldraflik; inga dekorativa klick utan funktion |

QA jämför panel 1 och faktisk Hem-render sida vid sida samt relevanta komponentdetaljer. Dokumentera standardvy och relevant viewport; webbsimulering är lokal layoutverifiering. Stor-text-/a11y-matris görs efter MVP. Ingen numerisk likhetspoäng får överrösta synligt felaktig komposition eller falskt innehåll.

## Avvikelser och beroenden vid start

| ID | Avvikelse / orsak | Hantering |
|---|---|---|
| R02-A1 | Personligt foto saknas i hundmodellen | Samma porträttutrymme med illustration; personlig bild kräver fotopaket |
| R02-A2 | Dagsuppgifter/räknare saknas i produktionsdata | Full referens kan byggas i explicit review; produktionskoppling är egen del, full funktion ej klar innan dess |
| R02-A3 | FAQ/faschecklista och snabbval finns men inte i exakt samma bildkomposition | Bevara åtkomst, dokumentera deras placering; ta inte bort dem för skärmbildslikhet |
| R02-A4 | Bildens milstolpsråd/beröm saknar verifierad källa | Ersätt med publicerat innehåll och sakliga aktivitetsbesked |
| R02-A5 | Globala nuvarande komponenter/typografi avviker | Opt-in varianter och målmedveten migration, granska påverkan på alla konsumenter |

Dessa är startluckor och rekommendationer, inte påstådda ägargodkända permanenta undantag.
