# Checklistor – kodförankrad UI-plan och LUNA 6.0-prompt

Datum: 2026-10-13. Status: planeringsunderlag; ingen appkod ändrad eller implementation beställd i denna genomgång.

Ägarens förtydligande: ”Visionen är en vision och målbild, vi är inte där än men det är dit jag vill.” Målbilden styr riktningen; befintlig kod är startpunkt, inte ett tak för designen. Nedanstående prompt är första sammanhållna etappen mot målbilden, inte ett slutligt ersättningskoncept.

## Vägen mot målbilden

1. **Nästa implementation – samma visuella struktur:** kompakt sidhuvud, samlade uppgiftskort, diskreta avdelare, tydlig progress, bättre fasöversikt och lättare egna-punkter-flöde. Detta kan göras med dagens lagring. Resultatet ska märkbart närma sig visionen; några ändrade marginaler räcker inte.
2. **Rikare uppgiftsinnehåll:** korta stödtexter, begripliga uppgiftsikoner och faktisk fördjupning. Detta är ett önskat fortsatt steg där visionen visar nyttan. Nuvarande key/title behöver kompletteras med verkligt innehåll och presentationsegenskaper; sakpåståenden ska granskas. LUNA ska redovisa luckorna konkret, inte fylla dem med påhittade råd eller låtsaslänkar.
3. **Dags- och veckoupplevelsen:** Idag/Denna vecka/Alla och Kommande kräver tydliga regler för engångsuppgifter kontra återkommande uppgifter, datum och vad genomfört betyder över tid. Planera det som en separat funktionsetapp om målet är även visionens tidsbaserade beteende. Det är inte permanent uteslutet av dagens fasmodell.

## Underlag och verifierade fynd

- Lokal checkout: `19ffb8514fdc3696de7e0bc9a071899e5ad35085`, repository `Fiskerik/Tassla`.
- `PuppyChecklistScreen.tsx` jämfördes med GitHub `main` via GitHub-anslutningen. Filens blob är identisk: `98c452ec837af480ecfe15b6b991e592bd82ede9`. Övriga filer lästes i lokal checkout; detta är inte ett påstående att hela checkouten jämförts med fjärrens senaste commit.
- Användarens tre nulägesbilder, checklistvision och samlade vision granskades. Projektets `vision_rev02.jpg` öppnades också.
- Bilderna motsvarar inte exakt läst kod. Bildöversikten har progressstaplar/dubbla antal och en samlad granskningsruta. Läst kod har inget `Progress` i översikten och upprepar granskningsinformationen i varje kort. Bildens gula globala banner kunde inte härledas till den lästa checklistimplementationen. Build/branch för användarens bilder är okänd.
- `PuppyChecklistScreen.tsx:368`: stort fasvalsblock före listan. `chooseChecklistPhase` använder tre kontextval och hundens ålder; det finns ingen manuell åldersväljare.
- `PuppyChecklistScreen.tsx:376`: varje klickbart `Card` innehåller en separat `Läs mer`-knapp. Samma `reviewInfoOpen` styr samtliga kort. Det skapar både upprepning och nästlade tryckytor.
- `PuppyChecklistScreen.tsx:381`: rekommendationen är endast text; befintlig `Card.selected` används inte och rekommenderat kort flyttas inte först.
- `ChecklistItem.tsx`: varje rad har `borderStrong`, egen rundning och ram. Detaljen renderar dessa direkt efter varandra utan ett sammanhållande kort.
- `AppBar.tsx`: alla icke-Home-lägen lägger in en separat Tassla-rad. Rätta endast checklistans anrop med en bakåtkompatibel komponentoption.
- `Progress.tsx` renderar redan sin egen synliga etikett. Lägg inte en extra identisk räknare runt den.
- `PuppyChecklistScreen.tsx:399`: stor primärknapp för egen punkt. Egenpunktsformuläret och redigering/radering finns redan.
- `checklist-model.ts`: standardpunkt innehåller endast `key` och `title`; inga beskrivningar, kategorier, datum eller detaljlänkar.
- `checklist-data.ts`: både standardpunkter och egna punkter ingår i progress. Data är hundavgränsade; översikten hämtar inte egna fritexttitlar.
- Skrivningar är avsiktligt icke-optimistiska. Bock/progress ändras efter bekräftat sparande. Okänt resultat använder Kontrollera och exakt återläsning. Detta korrigerar den tidigare bildbaserade promptens instruktion om omedelbart ändrad progress.
- Checklistorna är fortfarande granskningsinnehåll bakom `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT`; UI-ombyggnaden publicerar dem inte.

## Föreslagen struktur

Översikt: befintligt Kunskap-sidhuvud och flikar → kompakt synlig exempelmarkering → Er fas + Ändra → För er just nu → Övriga checklistor.

Detalj: ett kompakt tillbaka-sidhuvud → befintlig kort introduktion och exempelmarkering → kort med en progressetikett, standardpunkter, eventuella egna punkter och diskret Lägg till egen punkt.

Designavvikelser från visionen: livsfaser ersätter Idag/Denna vecka; inga tidsplanerade kommande uppgifter; inga nya underrader, kategorier eller uppgiftsdetaljer utan innehållsmodell. Behåll nuvarande huvudnavigation.

## Sekventiella deluppgifter vid senare implementation

| Nr | Ägare | Beroende | Filer | Acceptans och verifiering |
|---|---|---|---|---|
| 1 | Koordinator/Architect, Product/Critic | Aktuellt genomförandeuppdrag | Ny UX-spec under docs/plans, relevant taskkontrakt | Fastställt scope, faktiska nulägesskärmbilder, beslut om avvikelser; befintliga godkännanden återanvänds bara där de gäller exakt scope. |
| 2 | Implementer; QA/Reviewer separat | 1 | PuppyChecklistScreen, ChecklistItem, AppBar, KnowledgeScreen endast för avgränsat sidhuvudsanrop; berörda tester/harness | Detaljkort, radvariant och kompakt header fungerar med oförändrad lagring. Render 375/430/stor text, bock/fel/okänt resultat. Full fungerande checkpoint. |
| 3 | Implementer; QA/Reviewer separat | 2 | PuppyChecklistScreen, berörda tester/harness | Fasval i befintlig BottomSheet, rekommenderat kort först, övriga kort med en progressetikett; alla sex faser åtkomliga. Kontrollera åldersgränser och explicit kontext. Full checkpoint. |
| 4 | Implementer; QA/Reviewer separat | 3 | PuppyChecklistScreen, BottomSheet endast vid motiverad bakåtkompatibel utökning; README/tester/harness | Egenpunktsform i sheet, separata redigeringskontroller, input/UUID bevaras vid fel/unknown, radering bekräftas. pnpm check, git diff --check, visuell QA §14 och redovisade nativebegränsningar. |

Koordinator äger detta dokument. Inga parallella skrivägare. Planen ändrar inte datamodell, migrationer, innehållsversion eller publiceringsflaggor.

## Färdig implementationsprompt till LUNA 6.0

```text
Förbättra Tasslas befintliga checklistor så att översikt och detaljvy
närmar sig checklistan i vision_rev02.jpg och mina bifogade referensbilder.
Detta är en UI/UX-ombyggnad av livsfaschecklistorna i Kunskap.
Implementera i små, fungerande steg enligt nedanstående scope.

Målbilden är riktningen, inte ett påstående om vad som redan finns.
Låt inte befintlig komponentstruktur begränsa förbättringen till små
kosmetiska justeringar. Gör en sammanhållen ombyggnad inom denna etapp.

Läs först AGENTS.md, docs/design-rules.md och
.agents/skills/tassla-consumer-ux/SKILL.md. Följ tillämplig intern
planering och oberoende granskning: numrerad taskplan i docs/tasks,
UX-spec i docs/plans, exakta skrivfiler/skyddade områden och Architect
APPROVE för exakt plan före kod. Därefter Implementer → QA → Reviewer.
Återanvänd redan givna mandat där de
gäller; fabricera aldrig godkännanden eller verifieringsresultat.

BASLINJE
Tidigare genomgång gjordes på 19ffb85. Kontrollera aktuell kod innan
du börjar: mina bilder och denna checkout är inte exakt samma UI.
Rendera därför aktuell översikt och detalj som före-bilder.

Läs särskilt:
- src/features/knowledge/PuppyChecklistScreen.tsx
- src/features/knowledge/KnowledgeScreen.tsx
- src/features/knowledge/checklist-model.ts
- src/features/knowledge/checklist-data.ts
- src/features/knowledge/checklist-intent.ts
- src/features/knowledge/checklist-content.ts
- src/features/knowledge/README.md
- src/components/ui/{AppBar,Card,ChecklistItem,Progress,BottomSheet}.tsx
- src/theme/tokens.ts
- tests/checklist-{ui,model,data}.test.mjs
- tools/visual-check/README.md och know02-harnessen

1. DETALJVYN FÖRST
Samla progress och checklistpunkter i ett ljust Card. Använd tunna
avdelare mellan rader i stället för en mörk ram runt varje punkt.
Inför en bakåtkompatibel grouped-variant i ChecklistItem; behåll
befintligt standardutseende hos övriga anropare.

Visa ett enda antal, exempelvis ”1 av 3 genomförda”, genom Progress.
Progress renderar redan sin egen etikett. Visa inte samma antal igen
eller en separat synlig procentsiffra. Behåll accessibilityValue.

Behåll radordningen vid bockning och minst 44 pt tryckyta. Hela
standardraden växlar bocken. Lägg inte till navigationspilar på punkter:
nuvarande modell har inga punktdetaljer eller destinationer.

Använd endast befintliga titlar och introduktioner. Uppgiftens modell
har key/title; skapa inga nya träningsråd, underrader eller kategorier.
Visa ”Alla punkter klara” endast när bekräftat total > 0 och done = total.

Gör checklistans sidhuvud kompakt genom en opt-in i AppBar som döljer
den extra Tassla-raden. Default ska vara oförändrad. Använd optionen
bara i checklistans detalj och, vid behov, när Checklistor är aktiv
i KnowledgeScreen. Behåll korrekt tillbaka-beteende och ett sidhuvud.
Detta är en uttryckligt föreslagen ändring av det äldre UI-07-utseendet
inom checklistans scope; övriga AppBar-anrop behåller Tassla-raden.

2. ÖVERSIKTEN
Ersätt det stora fasvalsblocket med en kompakt sammanfattning och Ändra.
Visa befintlig kontext, exempelvis ”Efter ålder · 6–12 månader”.
Om inget val är sparat gäller nuvarande fallback by_age; kalla det
inte ett uttryckligt sparat ägarval.

Ändra öppnar befintlig BottomSheet med exakt dessa alternativ:
before_homecoming / first_days / by_age.
Åldersfasen beräknas med chooseChecklistPhase(ageWeeks, context).
Ingen separat åldersväljare eller ändring av hundprofilen.
Väljaren uppdaterar sammanfattningen först efter saved.

Visa rekommenderad fas först under ”För er just nu” med Card selected.
Visa resterande faser under ”Övriga checklistor”, utan att duplicera
det rekommenderade kortet. Alla sex faser ska gå att öppna.
Att läsa en annan fas ändrar aldrig sparad kontext.
Visa ingen rekommendation eller fabricerade nollframsteg under laddning/fel.

Varje kort har titel, eventuell befintlig kort intro, diskret
navigationspil och en tunn Progress med en enda antalsetikett.
Ta bort upprepad etikett ”Checklista”. Använd listGap mellan korten.

3. EXEMPELMARKERING OCH EGNA PUNKTER
Visa ”Tillfälligt exempel – innehållet är inte sakgranskat” tydligt
men kompakt en gång per synlig checklistvy. Lägg Läs mer utanför
klickbara checklistkort. Återanvänd den befintliga förklaringen.
Lös eventuell duplicering i den faktiska renderade containern utan
att ta bort märkning från andra granskningsvyer.

Ersätt den stora primärknappen med en tertiary ”Lägg till egen punkt”
nära listans slut. Visa rubriken Egna punkter bara när punkter finns.
Egna punkter använder samma radutseende som standardpunkter.
Redigering nås via en separat liten meny-/ikonknapp med 44 pt träffyta
och tydlig accessibilityLabel, inte en stor Ändra-knapp under varje rad.
Placera inte redigeringsknappen inuti checkboxens tryckyta.

Flytta befintligt tilläggs-/redigeringsformulär till BottomSheet.
Återanvänd Field, Button, titelvalidering, handlers och raderingsbekräftelse.
Behåll 160 Unicode-tecken och samma requestId över retries.
Använd befintlig Button för sparandet i sheet-innehållet så att
loading/disabled kan bindas; anta inte att BottomSheet har sådana props.

Separera sheetens synlighet från den sparoperation/formdata som måste
överleva. Stäng/backdrop/system-back får inte tappa pending/unknown
operation, UUID eller utkast. Visa pending/fel/Kontrollera inne i den
synliga sheeten så återkopplingen inte hamnar bakom modalen. Återanvänd
befintlig reconciliation vid återöppning/remount; bygg ingen ny kö.
Blockera stängning under pågående skrivning via samma guard för alla
stängvägar. Behåll sheeten öppen vid failed/unknown så input och nästa
handling syns. Om användaren därefter stänger vid unknown ska intent
och utkast bevaras och Kontrollera finnas åtkomligt i detaljvyn.

4. BEVARA DATABETEENDET
Bock, progress och framgångsrörelse får ändras först efter saved.
Ge omedelbar tryck-/pendingfeedback på berörd kontroll, inte falsk bock.
Behåll serialiserade skrivningar, dubbeletrycksskydd, avbrott/generation,
failed/unknown/conflict, Kontrollera, exakt återläsning och originalavsikt.
Behåll sessions-/hundavgränsad pending-memory i ProductWorkspace.
Ingen ny optimistisk lagring, localStorage eller permanent offlinekö.

Progress inkluderar redan egna punkter och standardpunkter. Bevara det.
Behåll stabila template-id/item-key och befintliga UUID:n.
Bevara reviewflaggan: false visar inga reviewchecklistor och utför inga
checklistläsningar eller skrivningar. En ny design publicerar inte innehåll.

5. FORMSPRÅK OCH SCOPE
Återanvänd befintliga tokens: cream-bakgrund, ljusa kort, gröna framsteg,
listGap, cardPadding, typografi och Ionicons. Ingen global krympning av
text, ändring av sidmarginaler eller nya färgskalor. Behåll textskalning,
kontrast, safe areas och minst 44 pt tryckytor.

Ingen ny dependency. Behåll befintlig motion/reduced-motion, inga nya
dekoranimationer. Eventuell check-animation måste använda bekräftat
tillstånd och får inte spela vid första inläsning.

Ändra främst PuppyChecklistScreen och avgränsade bakåtkompatibla
komponentvarianter. Dela vid behov upp renderingen i små komponenter,
men gör ingen generell omskrivning av datalagret.

Skydda databas/migrationer, checklist-data/model/intent-kontrakt,
innehållsnycklar, publiceringsflaggor, Hem/Logg/Träning/FAQ och global
bottennavigation. Läs ProductWorkspace för integration, ändra det inte
som en del av en kosmetisk ombyggnad.

Inför inte Idag/Denna vecka/Alla, kommande uppgifter, påminnelser eller
daglig återställning: detta kräver en separat produkt- och datamodell.
Detta avgränsar första etappen, inte den långsiktiga målbilden.
Redovisa efter implementationen konkreta återstående gap till visionen:
uppgiftsikoner/stödtexter/fördjupning samt tidsbaserade uppgifter, med
vilket innehåll eller vilka datakontrakt nästa etapp faktiskt behöver.

6. VERIFIERING OCH LEVERANS
Färdigställ och verifiera detaljvyn, sedan översikten, sedan formuläret.
Spara fungerande checkpoint efter varje steg och uppdatera README.

Uppdatera tests/checklist-ui.test.mjs och verify-know02.py där gamla
assertions låser just copy/layout, exempelvis synlig procent, Valt-rad
eller gamla knappar. Behåll beteendetester för gate, saved/unknown,
reconciliation, remount och scope. Ta inte bort ett test för att få grönt.

Använd tools/visual-check/know02-app.tsx och verify-know02.py med
syntetiska data. Kontrollera harnessen mot aktuell navigation: dess
BottomNav active=more representerar inte nödvändigtvis appens aktuella
Kunskap-flik. Verifiera också inträdet genom den faktiska integrationen.
Spara nya efter-bilder separat från befintlig KNOW-02-evidens.

Verifiera 375/430 pt, 140 % text i harnessen, långa titlar, laddar/fel, 0/delvis/alla
klara, egna punkters add/edit/delete, delayed/failed/unknown write,
Kontrollera, sheetstängning, remount och sessions-/hundbyte. Testa även
reviewflagga=false med noll checklistanrop. Alla sex faser ska nås.

Kör pnpm check och git diff --check. Jämför före/efter med visionen och
fyll i designreglernas 18 punkter. Oberoende QA/Reviewer ska granska.
Redovisa eventuella blockerare konkret. RN Web bevisar inte native
tangentbord, VoiceOver, Dynamic Type eller verklig Supabase/RLS.
Markera ej provade delar NOT TESTABLE. Ingen automatisk TestFlight-grind.

Leverera fungerande kod, ändrade filer, testresultat, skärmbilder och
kvarstående begränsningar. Stanna inte vid en ny designbeskrivning.
```

## Checkpoint

- Kod- och bildgenomgång klar. Ingen appkod ändrad, inga tester/builds körda; denna leverans är en plan och prompt.
- Oberoende Critic: PROCEED WITH CHANGES. Tre synpunkter: äldre UI-07-beslut om Tassla-raden behöver hanteras uttryckligt; redigering av egna punkter måste ha separat tryckyta och synlig sheet-feedback; workflow-grindar måste anges. Förslaget preciserar nu den lokala AppBar-förändringen som en designändring i det föreslagna scopet, inte ett redan fattat ägarbeslut. Separat editkontroll, stängningsguard, feedback och workflow är angivna. Inget implementationsgodkännande eller visuellt PASS påstås.
- Nästa steg efter denna planeringsleverans: användaren ger LUNA implementationsprompten och referensbilderna i projektet. Ingen publicering, commit eller push ingår här.
