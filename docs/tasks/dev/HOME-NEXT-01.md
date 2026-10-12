# HOME-NEXT-01 — Hem kopplar ihop dagens upplevelse

Status: done — final QA passed and independent read-only Reviewer returned PASS.
Datum: 2026-10-12.
MVP-spårning: `docs/mvp.md`, Personligt Home/Today — visa relevant hjälp och leda till konkret handling.

## Ägarmandat

Erik godkände först ett avgränsat kortpaket 2026-10-12. Efter att §14 visuell QA blockerade det på befintlig Hem-layout utökade Erik omfattningen: ”Utöka hem scope och rätta mot vision_rev02”. Det nuvarande förslaget gäller första skärmen i `vision_rev02.jpg`, dess gemensamma bottenmeny och nödvändig More-åtkomst. v7.1 implementerades efter godkända grindar. v7.2 får starta inom tilldelade sökvägar efter förnyad Architect/Critic-granskning.

## Mål och användarresa

Hem ska svara på vad som är relevant för hunden nu, vad som faktiskt har hänt och vilken befintlig handling ägaren kan fortsätta med. V7 kombinerar ålder, publicerat innehåll, träning, dagens logg/hälsoplaner och direktvägar till Logg, Träning och Kunskap.

### Före

Hem visar hundkort, horisontell carousel före datumremsa, en stor ”Logga nu”-knapp och dagens loggrader. Delarna ger begränsad förklaring till varför innehåll är relevant och hur en aktivitet hänger ihop med nästa steg.

### Efter

Hem följer hierarkin i `vision_rev02.jpg`: hundspecifik hälsning och ålder, åldersremsa, relevant ”Just nu”-innehåll, en sanningsenlig sammanställning av dagens händelser/handlingar samt tre tydliga genvägar. Delad meny visar Hem, Logg, Träning, Kunskap och Mer. Hälsa och Tassla-pass förblir åtkomliga via Mer.

## UX- och datakontrakt

1. Hälsning använder hundens namn och ålder. `OwnedDog` saknar foto; återanvänd befintlig vänlig silhuett/platshållare och presentera inte en dekorativ bild som ägarens hundfoto. Profil nås från Mer.
2. Veckoremsan visar faktisk levnadsvecka och närliggande veckor, härledda från sparat `birth_date`. Den är informativ, utan ny lagring eller påhittade utvecklingsmilstolpar.
3. ”Just nu med {hund}” använder aktuellt publicerat och ålders-/rasrelevant innehåll; ett aktuellt publicerat träningssteg är en tillåten fallback. Innehållsöppning är inte läsbevis. Loading/fel/urvalsbyte får aldrig visa en annan hunds data eller reviewmaterial i public mode.
4. Sektionen ”Idag” är en gemensam befintlig Card med källriktiga grupper: ”Loggat idag” visar endast valploggens händelser, högst den senaste utan källetikett eller extra detaljtext; ”Nästa träningssteg” visar en tillgänglig handling utan bock; ”Planerat idag” visar hälsoplaner som planerade. En inline-tertiary-länk ”Visa dagens logg” öppnar Logg och täcker valploggsposterna; utförd hälsohistorik ligger kvar i Hälsa. Visa inte redundanta metadata ”Tillgänglig handling” eller ”Planerat”. Sektionen är en källöversikt, inte en fullständig checklista eller att-göra-lista.
5. Ingen daglig task-tabell, dold checklista, godtycklig progressprocent eller literal exempelräknare ”2 av 5” skapas. Saknad/okänd läsning får inte visas som 0 eller ”inget gjort”. Ett neutralt tomtillstånd visas när inga relevanta källposter finns.
6. Tre handlingar öppnar befintliga Logg-, Träning- och Kunskapssidor. FAQ och checklistor ligger kvar i Kunskapens befintliga flikar; deras skärmar, innehåll och dataflöden ändras inte.
7. Delad bottenmeny visar Hem, Logg, Träning, Kunskap, Mer; Kunskap är egen flik och tas bort som rad i Mer. Hälsa flyttas från egen flik till synlig rad i Mer; Hälsa och planerade händelser tas inte bort. Tassla-pass finns fortsatt i Mer. Endast de fem flikarna ingår i svepnavigering i samma ordning; hälsa, planerad hälsa, pass, profil och inställningar nås via Mer och ingår inte i svepordningen. Aktiv flik och tillgänglighetsnamn följer den nya menyn.
8. V6:s riktiga tränings- och checklistgating behålls där den fortfarande används. Endast exakt befintlig reviewflagga visar reviewexempel, med tillfällig markering.

## Progression: källa till sanning

- Hundens ålder: `OwnedDog.birth_date` och befintlig lokal datumlogik.
- Relevant innehåll: befintliga publicerade `HomeContent`-urval.
- Träning: befintliga publicerade träningsprogram och bekräftad `training_progress`.
- Dagens registreringar: befintliga händelser från loggen; en registrering betyder ägarens registrering, inte oberoende verifierad aktivitet.
- Hälsoplan: planeringskälla för planerade datum; den blir inte genomförd historik utan ägarens separata registrering.
- Checklistprogress: fortsatt befintlig datakälla i Kunskap, men inga reviewmallar visas som publicerade Home-uppgifter.

## Navigationseffekt

`BottomNav` delas av hela inloggade arbetsytan. För att följa målbilden byts Hälsa-fliken ut mot Kunskap globalt; Hälsa flyttas till Mer och befintliga hälsovyer/returvägar behålls. Detta påverkar navigation på samtliga inloggade sidor men ändrar inte skärmarnas innehåll. Architect/Critic ska särskilt granska att den nya placeringen är begriplig och att ingen destination eller återhämtning tappas.

## Avgränsning

- Ingår: Home-komposition, åldersremsa, relevant innehåll/handlingar från befintliga källor, tre genvägar och delad bottenmeny/More-åtkomst som krävs för målbilden.
- Ingår inte: nytt dagligt task-schema eller lagring, nya råd/innehåll, separat progressionssystem, ny fotoinsamling, schema/RLS/dependency, hälso-/tränings-/checklist-/FAQ-affärslogik, ombyggnad av övriga vyer, signerad build, TestFlight, commit, push eller publicering.
- Masterpromptens krav på att progression ska vara sanningsenlig gäller. Skärmbildens ”2 av 5” är ett visuellt exempel, inte auktoritativ produktdata.

## Acceptanskriterier v7

1. Home-hierarkin motsvarar första skärmen i `vision_rev02.jpg`: personlig hälsning/ålder, veckoremsa, kompakt ”Just nu”, ”Idag” och tre kompakta genvägar. Dagens tre källgrupper ligger i en gemensam befintlig Card; huvudsektioner använder 24-tokenen och grupper inuti Card använder listGap. I normaldata med minst fem valplogghändelser, ett tillgängligt träningssteg och en plan idag ryms samtliga tre grupper, inline-länken ”Visa dagens logg” och genvägar ovanför bottenmenyn vid 375 × 844 och 430 × 844. Den renderade verifieraren använder just denna täta fixture. Carousel, dagväljare och generisk primär ”Logga nu”-knapp är ersatta.
2. Åldersremsan är korrekt vid veckogränser och presenterar inte ålder som träningsförmåga.
3. Relevant innehåll/träning kommer från aktuellt urval; laddning, fel, tomt/färdigt och konto-/hundbyte visar aldrig gammalt eller opublicerat innehåll.
4. Dagens gemensamma Card visar ”Loggat idag” med högst den senaste vanliga valplogghändelsen och inline-länken ”Visa dagens logg” till alla valploggshändelser i Logg. Utförd hälsohistorik förblir i Hälsa och öppnas därifrån. Träningssteget saknar slutförandebock. Gruppkontexten ersätter redundanta metadata ”Ägarregistrerat”, ”Tillgänglig handling” och ”Planerat”. Sektionen påstår inte att vara en fullständig checklista. Fel/okänd status blir inte falsk nollprogress.
5. Genvägar når Logg, Träning och Kunskap. FAQ/checklistflöden är fortsatt åtkomliga via Kunskap utan ändrad FAQ-/checklistlogik.
6. Menyn visar de fem destinationerna i målbilden, aktiv destination är korrekt på alla sidor, Hälsa och Tassla-pass nås via Mer och svep går endast bland de fem huvudflikarna i ordning.
7. V6:s regressioner för träning, public/reviewflagga och checklistsynlighet kvarstår.
8. Fokuserade/fullständiga tester, `pnpm check`, public iOS-bundle, diffcheck och kövalidering passerar. Orelaterade äldre verifierarfel dokumenteras separat.
9. Public och review-rendering visar Home och navigation vid 375/430 px och 140 % text; inkluderar relevant innehåll, tom/loading/fel, dagens registreringar/planer, review-gate, navigationstapp, More-åtkomst och reducerad rörelse. Verifieraren säkerställer att grupper och genvägar ligger ovanför bottenmenyn och att aktiv flik exponeras som vald. Jämförelse med Home i `vision_rev02.jpg` och designreglernas §14 checklist dokumenteras av QA och Reviewer. Varje Nej blockerar.

## Skrivfiler och roller för korrigering v7.2

**Implementer:** `src/features/home/HomeScreen.tsx`, `src/features/home/ProductWorkspace.tsx` endast om aktiv Home-flikens semantik behöver mappas, `src/features/home/README.md`, `src/components/ui/BottomNav.tsx`, `tools/visual-check/app.tsx`, `tools/visual-check/verify.py`, `tools/visual-check/README.md`.

**QA:** `tests/home-today.test.mjs`, `tests/main-navigation.test.mjs`, `tests/knowledge-review-content.test.mjs`, `tests/planned-health.test.mjs`, `tests/README.md`. QA ändrar inte produktkod eller visualiseringsharness; renderad evidens sparas under `/tmp/tassla-home-next-01-v7.2/{public,review}` och relevanta slutunderlag kopieras till repo.

**Koordinator:** korrigeringsplanen, `docs/tasks/dev/HOME-NEXT-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HOME-NEXT-01.md`, evidens under `docs/design/evidence/home-next-01/v7.2/`.

**Reviewer:** read-only på fryst diff och sparad renderad evidens. FAQ/checklistskärmar förblir skyddade.

## Verifiering

- `node --experimental-strip-types --test tests/home-today.test.mjs tests/main-navigation.test.mjs tests/knowledge-review-content.test.mjs tests/planned-health.test.mjs`.
- `pnpm check`.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-home-next-01-v7.2/expo-home TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`.
- `git diff --check`; `python tools/dev_flow.py validate`.
- Public och review UI-byggen använder exakt `TASSLA_UI_REVIEW=false/true`, separat output och evidens. Harnessen får Home-scope så Home-kriterier kan passera/falla oberoende av den kända äldre Kunskapsassertionen.
- Ingen databas-, RLS-, telefon-, TestFlight-, commit- eller pushgrind läggs till.

## Historik från v6

V6 genomförde Home-kortens tränings-/reviewgating. Riktade tester, `pnpm check`, public iOS-bundle och renderade Home-scenarier passerade. §14-underkände den befintliga layouten mot `vision_rev01.jpg` på punkterna 16–17. QA-evidensen och den felande breda Knowledge-assertionen är sparade i `docs/design/evidence/home-next-01/`. Erik utökade därefter scope till Home i `vision_rev02.jpg`.

## Planreview v7

- Architect: APPROVE plan v7.1 efter justering av acceptanskriterium 1 till rubriken ”Idag” och dess tre källriktiga grupper.
- Critic: PROCEED plan v7.1; dagens tre källgrupper är begripliga och sanningsenliga, Health/pass har tillräcklig åtkomst via Mer och QA täcker navigationen.
- Implementera inte före båda granskningarna.


## HOME-NEXT-01 v7.1 QA-resultat och korrigering v7.2

QA UNDERKÄNDE v7.1 enligt §14 punkterna 5, 6, 10 och 16. Sektionsavståndet var 12 i stället för 24, hundplatshållaren hade råmåtten 82 × 92, varje loggrad upprepade ”Ägarregistrerat” och den långa logglistan tryckte träningssteg, plan och genvägar under bottenmenyn. QA noterade också en föråldrad statisk Home-assertion i tests/planned-health.test.mjs, aria-selected-assertion i visual verifieraren och gammal navigationscopy i Home README. v7.2 korrigerar dessa inom samma ägargodkända Home-scope.

iOS-bundle PASS med Expo-katalogen /tmp/tassla-home-next-01-v7/expo-home. Fokuskommandot passerade 3/3 filer. Full pnpm check gav 38 pass/1 fail. Public/review Home rendering och manuell navigering fungerade, men båda scoped verifierarna stoppade på aria-selected. Fullständig evidens ligger i /tmp/tassla-home-next-01-v7/ och ska kopieras efter förnyad QA.

v7.2-planen har skapats i docs/plans/HOME-NEXT-01-ux-spec-v7.2.md. Efter Architect/Critic CHANGES har planen preciserats med en gemensam Idag-Card, kompakt QuickLogTile, borttagen förklaringsrad, loggkälla begränsad till valplogghändelser, hälsohistorik kvar i Hälsa, borttagna redundanta statusetiketter och tät first-view-fixture vid 375/430. Koordinatorns task/queue/evidenssökväg ska matcha v7.2. Architect APPROVE och Critic PROCEED har nu lämnats på samma reviderade v7.2-plan och är noterade i rapporten. Implementation går vidare inom de angivna sökvägarna.


### v7.2 first-fit correction

Independent QA UNDERKÄNDE point 16: at 375/430 px the three 78px quick-action tiles start at y=754 while fixed navigation starts at y=785, leaving 47px behind navigation. All other reported checks passed. Evidence and the full §14 checklist are saved in `docs/design/evidence/home-next-01/v7.2/QA-REPORT.md`. Architect confirmed the existing v7.2 approval covers a same-scope correction in `HomeScreen.tsx`: use compact, tokenized daily summary rows with interactive targets at least 44pt, then rerun dense-fixture and §14 QA. No plan, acceptance, or write-path expansion.


### v7.2 second first-fit correction

Public/review rerun measured all three 78px tiles at y=718..796, while fixed nav starts at y=785: 11px remains covered at 375/430. The compact Home rows saved 36px but did not satisfy §14 point 16. The Home-scoped verifier also stops on a stale exact-text `Mat` locator because the compact summary button now exposes “12:05, Mat”; independent browser geometry confirms the overlap. Evidence: `docs/design/evidence/home-next-01/v7.2/QA-REPORT-rerun.md` and `rerun/{public,review}/`. Next same-scope correction: move “Idag” into the shared Today Card and fix the verifier locator; Architect confirmed the same approved scope covers both HomeScreen composition and verifier locator. No acceptance or product-scope change. Fresh QA remains mandatory.


### HOME-NEXT-01 v7.2 final QA — UNDERKÄND

Oberoende slut-QA underkände §14 punkt 16: vid 375/430 px i public och review börjar genvägskorten på y=718 och slutar y=796; den fasta menyn börjar y=785. Överlappet är 11 px och genvägarnas etiketter syns delvis bakom menyn. Alla övriga renderade funktioner och byggen passerar enligt QA. Den uppdaterade `Mat`-selektorn fungerar, men verifieraren stannar därefter på exakt `Vaccination idag`; den kompakta tillgängliga raden heter `16:30, Vaccination idag`, så geometriassertionen nås inte via den verifieraren. Oberoende QA-matris verifierade geometrin direkt.

Slutrapport: `docs/design/evidence/home-next-01/v7.2/QA-REPORT-final.md`. Slutrenderingar och JSON-resultat har kopierats till `docs/design/evidence/home-next-01/v7.2/final/{public,review}/`; tidigare felrenderingar bevaras. Queue återgår `qa → blocked → planned`. Föreslagen smal korrigering inom befintligt scope: gör den inline-tertiary-länken 44pt hög (befintlig minsta träffyta; nuvarande Button upptar 56px), vilket frigör 12px i den täta dagsvyn, och uppdatera verifierarens kvarvarande Vaccination-locator. Acceptanskriterier, data, navigation och FAQ/checklistflöden ändras inte. Architect-bekräftelse krävs innan implementation; därefter ny oberoende renderad QA.


Architect bekräftade efter slut-QA att befintligt v7.2-godkännande täcker den smala korrigeringen i redan tilldelade sökvägar: en Home-lokal inline-tertiary-logglänk med minst 44pt träffyta samt tillgänglighetsnamn för Vaccination-raden i verifieraren. Behavior, kriterier och scope förblir oförändrade. Implementer har fått uppdraget; därefter kör QA om public/review vid båda bredderna samt §14.


Implementer har gjort Architect-godkänd korrigering endast i `HomeScreen.tsx` och `tools/visual-check/verify.py`: inline CTA använder minst 44pt tryckyta, behåller etikett/roll/handling och verifieraren matchar Vaccination-radens tillgängliga namn. Typecheck, public/review-byggen, verifierarsyntax och diffcheck PASS enligt handoff. Queue → qa; ny fullständig QA återstår.


### HOME-NEXT-01 v7.2 final-correction QA — GODKÄND

Oberoende QA godkände senaste korrigeringen. Public och review Home-verifierare passerar vid 375/430; tre genvägskort slutar på y=784 och fast meny börjar på y=785. Rubriken ”Vad vill du göra nu?” slutar vid y=698. Inline-länken ”Visa dagens logg” har 44 px träffyta och öppnar Logg. Review-exemplet visas endast i reviewläge med tillfällig etikett och öppnar Träning. Valda tabbar, Mer → Hälsa, FAQ/checklistor, 140 % text/reduced motion och inga browser errors PASS. Fokuserade tester, `pnpm check` (39 pass, 38 varningar/0 fel), public iOS-bundle, public/review-byggen, båda Home-verifierarna, oberoende fixturematris, diffcheck, kövalidering och §14 1–18 PASS enligt rapporten.

Slutrapport: `docs/design/evidence/home-next-01/v7.2/QA-REPORT-final-correction.md`. Slutrenders och browserresultat kopierade till `docs/design/evidence/home-next-01/v7.2/final-correction/{public,review}/`; äldre underkända evidens bevarade. Queue → review. Oberoende read-only granskning av fryst diff och QA-bevis återstår innan done.


### HOME-NEXT-01 v7.2 final review — PASS

Separat read-only Reviewer godkände den frysta v7.2-diffen och slutbevisen. Granskningen bekräftar 44px CTA, samtliga Home-grupper och genvägar ovanför menyn vid 375/430, sanningsenliga källgrupper, femfliksnavigation/More, review-gating och destinationer, samt att FAQ/checklistvyer och dataflöden förblev orörda. §14-underlaget och tidigare felrenderingar är bevarade.

Arbetsflödet är `done`. Lokal evidens använder React Native Web med syntetiska fixturedata; native-enhet, backend/RLS och TestFlight har inte certifierats. Ingen commit, push eller publicering gjordes.
