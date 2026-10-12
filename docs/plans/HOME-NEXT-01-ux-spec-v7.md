# HOME-NEXT-01 — Hem kopplar ihop dagens upplevelse

Planversion: v7.1 — APPROVED av Architect/Critic, implementerad och inlämnad till QA. Korrigering efter QA hanteras separat i v7.2.
Datum: 2026-10-12.
Målbild: första skärmen i `vision_rev02.jpg` (Home), inklusive dess femfliksmeny.
Mandat: Erik har utökat arbetspaketet i chatten 2026-10-12: ”Utöka hem scope och rätta mot vision_rev02”. Detta v7-förslag omfattar nödvändiga Home- och delade navigationsändringar. v7.1 har granskats och implementerats. Inga v7.2-kodändringar innan separat v7.2-granskning.

## Mål

Göra Hem till den personliga, sammanhängande ingången i `vision_rev02`: hundens aktuella ålder, relevant innehåll eller träningssteg, verkliga händelser och nästa tillgängliga handling syns i lugn ordning. Användaren ska kunna gå direkt till Logg, Träning och Kunskap.

V6:s sakliga garantier behålls: inget inaktuellt träningskort vid laddning/fel eller hundbyte, reviewinnehåll hålls review-gatat, och progression får aldrig hittas på.

## Användarresa

**Före:** Hem visar hundkort, horisontell carousel före datumremsa, en stor ”Logga nu”-knapp och dagens loggrader. Träning och checklistor är genvägskort; Hem förklarar inte tydligt varför ett råd är relevant eller vad som faktiskt har hänt.

**Efter:** Hem börjar med en varm, hundspecifik hälsning och åldersmarkör, lyfter ett befintligt relevant innehåll eller nästa träningssteg, sammanfattar bekräftade aktiviteter och dagens faktiska att-göra-signaler och visar tre tydliga genvägar. Shared navigation har Hem, Logg, Träning, Kunskap och Mer. Hälsa och Tassla-pass är fortsatt nåbara från Mer.

**Progression och kontinuitet:** ålder beräknas från hundens sparade födelsedatum; träningsstatus kommer från befintliga publicerade program och `training_progress`; genomförda aktiviteter kommer från befintliga logg-/hälsohändelser; planer fortsätter vara planer tills ägaren registrerar en utförd händelse. Inget separat dagligt progressionsregister eller fiktiv completion tillkommer.

## UX-kontrakt

1. **Hälsning och hund:** ersätt centrerad Home-appbar och gamla hundkortet med hälsning, hundnamn/ålder och befintlig vänlig hundplatshållare. `OwnedDog` saknar ägarfoto; en dekorativ valpbild får inte presenteras som hundens riktiga foto. Profilen nås fortsatt från Mer.
2. **Veckoremsa:** visa ett smalt åldersspann kring hundens nuvarande hela levnadsvecka, härlett lokalt från `birth_date`. Markera aktuell ålder; remsan är informativ och introducerar ingen ny lagring eller åldersmilstolpe.
3. **”Just nu med {hund}”:** visa i första hand befintligt ålders-/rasrelevant publicerat innehåll med kort ingress och befintlig destination; om inget sådant finns men ett publicerat träningssteg är redo får det användas. Vid loading/error visas inte gammal hunds innehåll eller syntetiska råd. Öppning av innehåll innebär inte att det är läst.
4. **Dagens aktivitet:** sektionens rubrik är ”Idag” med grupperna ”Loggat idag”, ”Nästa träningssteg” och ”Planerat idag”. Loggposter betecknas som ägarregistrerade händelser; träningssteget är en tillgänglig handling utan bock; hälsoplaner är planerade, aldrig genomförda per automatik. Varje rad leder till sin befintliga källvy. Sektionen är uttryckligen en översikt av källor, inte en fullständig checklista eller att-göra-lista. Visa ingen ”2 av 5”-räknare eller dold daglig lista eftersom modellen saknar dagligt uppdragstillstånd. Om inget relevant kan styrkas visas ett neutralt tomtillstånd.
5. **”Vad vill du göra nu?”:** tre tydliga kort/tiles till befintliga Logg-, Träning- och Kunskapssidor. Loggningen behåller befintligt flöde. Kunskap öppnas på sin vanliga startvy.
6. **Delad bottenmeny:** matcha målbildens fem destinationer: Hem, Logg, Träning, Kunskap, Mer. Kunskap får egen flik och tas bort som rad i Mer. Lägg Hälsa som synlig rad i Mer; Hälsas befintliga flöden och planhistorik påverkas inte. Tassla-pass finns fortsatt i Mer. Endast dessa fem destinationer ingår i svepnavigering, i samma ordning som flikarna; hälsa, planerad hälsa, pass, profil och inställningar nås via Mer och ingår inte i svepordningen. Hälsa/pass markeras därför som Mer i bottenmenyn. Uppdatera aktiv flik och tillgänglighetsnamn.
7. **FAQ/checklistor:** FAQ- och checklistvyerna, data, innehåll och tillfälliga reviewmarkeringar ändras inte. De nås via Kunskaps befintliga flikar. Public build får inte visa reviewmaterial.

### Progressionssannhet och medvetna avvikelser från exempelbilden

- `vision_rev02.jpg` visar exempeltexter och ”2 av 5 klara”. V7 återanvänder inte dessa som literal data. Det finns ingen daglig uppgiftsmodell, och masterprompten förbjuder att saknad loggdata räknas som utebliven aktivitet eller att progress skapas med godtycklig nämnare.
- Nuvarande profil saknar hundfoto. Befintlig vänlig silhuett/platshållare används tills fotostöd får egen uppgift.
- Veckoremsan beskriver faktisk ålder, inte utvecklingsmässiga färdigheter.
- V7 ändrar delad bottenmeny i alla inloggade sidor för konsekvent navigation; Hälsa flyttas till Mer, den tas inte bort.

## Tillstånd

- Profil/birth date laddar eller saknas: appens befintliga profilflöden gäller; visa inte en fabricerad ålder.
- Relevant innehåll laddar: använd befintlig laddningskomponent; behåll andra bekräftade Home-data.
- Innehållsfel: visa ingen cache från ett tidigare hundurval; gör befintlig kunskapsvy till återhämtningsväg.
- Träning laddar/fel/tomt/färdigt: inget gammalt eller syntetiskt publikt träningssteg. Reviewfixture visas endast när flaggan är exakt `true` och märks som exempel.
- Loggar/planer laddar/fel/tomt: följ respektive befintliga statuskontrakt; okänd status får inte bli 0/5 eller ”inget gjort”.
- Stort textläge och reduced motion: layouten ska förbli läsbar och sidbyten får inte införa dekorativ animation.

## Avgränsning

- Ingår: Home-komposition, härledd åldersremsa, relevant innehåll/handlingar från befintliga källor, Home-genvägar samt delad bottenmeny/More-åtkomst som krävs för att behålla Hälsa tillgänglig.
- Ingår inte: ny tabell eller daily-task-persistens, nytt innehåll eller råd, health/training/checklist-/FAQ-affärslogik, nya notiser, analytik, fotouppladdning, ny partnerfunktion, schema/RLS/dependency, ombyggnad av övriga vyer eller publicering.
- V6-implementationen av korrekt tränings- och review-gating behålls om v7 inte ersätter komponenten; FAQ/checklistflöden och deras data påverkas inte.

## Acceptanskriterier

1. Hem följer `vision_rev02.jpg`-hierarkin: hundspecifik hälsning och ålder, veckoremsa, ”Just nu”, ”Idag” med grupperna ”Loggat idag”, ”Nästa träningssteg” och ”Planerat idag” och tre handlingar; carousel, dagväljare och generisk ”Logga nu”-huvudknapp är ersatta.
2. Veckoremsan härleds korrekt från `birth_date`, fungerar vid veckogräns/ung valp och introducerar ingen progressionsstatus.
3. ”Just nu” använder bara aktuellt, publicerat och ålders-/rasrelevant innehåll eller aktuellt träningssteg; loading/error/selection change visar inte gammalt eller review-innehåll i public mode.
4. Dagens aktivitet använder källriktiga grupper/status: loggar som ”Loggat idag”, träningssteg som ”Nästa träningssteg” utan slutförandebock och hälsoplaner som ”Planerat idag”. Sektionen påstår inte att vara en fullständig checklista. Ingen separat daglig progress lagras och okänd läsning visas inte som noll.
5. Genvägar leder korrekt till Logg, Träning och Kunskap. FAQ och Checklistor nås fortsatt genom Kunskapens befintliga flöde; FAQ-logik/content är oförändrad.
6. Delad bottenmeny visar Hem, Logg, Träning, Kunskap, Mer; Kunskap är egen flik och inte en More-rad; alla sidor markerar rätt huvudflik; Hälsa och Tassla-pass är direkt nåbara från Mer; swipe följer endast de fem huvudflikarna i ordning och inga nuvarande destinationer försvinner.
7. V6-regressioner passerar: aktuellt träningskort, laddning/fel/tomt/färdigt/stale selection, public/review-gating och reviewmarkering/destination.
8. Typkontroll, lint, relevanta/fullständiga tester, public iOS-bundle, `git diff --check` och queue validation passerar. Kända orelaterade full-UI-harnessfel rapporteras separat.
9. Oberoende renderad evidens i public och review täcker Home vid 375/430 px, 140 % text, innehålls-/tränings-/logg-/planstatus samt navigationstapp/More och reducerad rörelse. Jämförs sida vid sida med första skärmen i `vision_rev02.jpg`; designregler §14 fylls i av QA och Reviewer. Varje Nej blockerar.

## Filer och ägarskap

**Implementer:** `src/features/home/HomeScreen.tsx`, `src/features/home/HomeCarousel.tsx` (ta bort/ersätt om den blir oanvänd), `src/features/home/ProductWorkspace.tsx`, `src/features/home/home-today.ts`, `src/features/home/main-navigation.ts`, `src/components/ui/BottomNav.tsx`, `src/components/ui/ComponentGalleryScreen.tsx`, `src/features/home/README.md`, `tools/visual-check/app.tsx`, `tools/visual-check/build.cjs`, `tools/visual-check/verify.py`, `tools/visual-check/README.md`.

**QA:** `tests/home-today.test.mjs`, `tests/main-navigation.test.mjs`, `tests/knowledge-review-content.test.mjs`, `tests/README.md`. QA skriver renderad evidens till `/tmp/tassla-home-next-01-v7/{public,review}` men ändrar inte produktkod/harness.

**Koordinator:** denna plan, `docs/tasks/dev/HOME-NEXT-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HOME-NEXT-01.md`, `docs/design/evidence/home-next-01/v7/`.

**Reviewer:** read-only på fryst diff och sparad visual evidens. FAQ- och checklistskärmar är skyddade skrivytor.

## Kontroller

- `node --experimental-strip-types --test tests/home-today.test.mjs tests/main-navigation.test.mjs tests/knowledge-review-content.test.mjs`.
- `pnpm check`.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`.
- `git diff --check`; `python tools/dev_flow.py validate`.
- Public/review-byggena körs med exakta `TASSLA_UI_REVIEW=false/true`, separata output/evidenskataloger och Home-avgränsad renderad verifiering. QA ska även notera befintligt full verifierarfel på Kunskap om det kvarstår.
- Ingen databas/RLS/native/TestFlight/commit/push-grind introduceras.

## Planreview

- Architect: APPROVE plan v7.1 efter justering av acceptanskriterium 1 till rubriken ”Idag” och dess tre källriktiga grupper.
- Critic: PROCEED på HOME-NEXT-01 plan v7.1. Bedömde att åtskilda etiketter för logg, nästa träningssteg och hälsoplaner är begripliga; avsaknaden av 2/5-räknare är motiverad av datamodellen. Hälsa/Tassla-pass är tillräckligt åtkomliga via synlig More-rad och QA ska täcka vägen.
- Ägarbeslut: Erik utökade scope och valde `vision_rev02.jpg` i chatten 2026-10-12.
