# Tassla – MVP

Status: godkänt av Erik 2026-10-04 i chatten: ”Jag godkänner MVP och stack (Erik)”. Godkännandet gäller den dokumenterade sexskärmsleveransen. Uttryckligt öppna detaljbeslut nedan kvarstår; godkännandet väljer inte en ospecificerad notifieringskanal eller PDF-fält och aktiverar inte datainsamling/distribution.

> **”Jag har precis fått en valp. Hjälp mig.”**
>
> MVP:n ska validera detta produktlöfte och lägga grunden för Tasslas långsiktiga princip: **En hund. En profil. En tidslinje.**
>
> All funktionalitet som inte direkt krävs för att validera **Distribution → Activation → Engagement → Retention** är utanför MVP-scope, om den inte uttryckligen godkänns.

## Syfte

Tassla ska bevisa att produkten kan nå nya valpägare genom uppfödare, ge omedelbar hjälp i valpvardagen och skapa återkommande användning över tid.

MVP-leveransen utgår från **sex användarområden: Hem, Valplogg, Träning, Hälsa, Kunskap och ett enkelt Tassla-pass**, med hundprofil/onboarding, retention, distribution och mätning som stöd. Den ska vara liten nog att pilottesta utan färdiga kommersiella partners.

Eriks leveransreferens 2026-10-04 är **övre delen ”MVP – 6 skärmar” i vision_rev01.jpg** i projektroten. Sex skärmar beskriver sex huvudsakliga användarytor, inte en gräns på exakt sex tekniska vyer; onboarding, formulär och innehållsdetaljer kan behövas. Bildens exempeltexter, data, dekorativa flikar och alla tänkbara underfunktioner är inte självständiga krav. Nedre delen ”Om tre år” ingår inte. Visuell riktning och rörelse följer docs/dev/ui-and-code-standards.md.

| Hypotes | Vad MVP:n ska validera |
|---|---|
| Distribution | Kan Tassla effektivt nå nya valpägare via uppfödare? |
| Activation – aktivering | Förstår och upplever användaren snabbt Tasslas värde? |
| Engagement – engagemang | Finns återkommande beteenden som gör Tassla relevant i valpvardagen? |
| Retention | Fortsätter användaren att komma tillbaka över tid? |

Hög aktivitet första dagen är inte samma sak som retention. Båda behöver mätas.

## Måste med: produkt-MVP

### Stöd: hundprofil och onboarding

Skapa hunden en gång. Grundinformationen driver resten av upplevelsen och följer hunden när den växer upp.

**Acceptanskriterier:**

- Användaren kan skapa en hund med namn, ras och födelsedatum.
- Hundens ålder beräknas automatiskt.
- Hunden får ett permanent hund-ID som används av övriga funktioner.
- Onboarding leder vidare till relevant hjälp i Home/Today.

### Skärm 1. Personligt Home/Today

Home är produktens hjärta och svarar på:

> **Vad behöver jag veta, göra eller tänka på med min valp idag?**

Loggning, träning och innehåll ska nås i denna kontext. Användaren ska inte behöva veta vad hen ska söka efter.

**Acceptanskriterier:**

- Startsidan visar ett dynamiskt flöde baserat på hundens ålder och, där det är relevant, ras.
- Flödet förändras över tid med hundens utveckling och visar relevanta råd, aktiviteter, träningssteg och uppmaningar.
- Användaren kan gå från relevant hjälp till konkret handling.
- Innehåll distribueras främst genom Home och relevanta flöden. Ett stort fristående artikelbibliotek krävs inte.

### Skärm 2. Snabb vardagsloggning

Hjälp ägaren att hålla koll på valpens rutiner och börja bygga hundens historik med mycket låg friktion: **Tryck → klart.**

**Acceptanskriterier:**

- Kiss, bajs, mat, sömn/vaken och promenader kan registreras med så få steg som möjligt.
- Händelser sparas med tidpunkt och koppling till hundens permanenta ID.
- Användaren kan se och förstå relevant logghistorik.
- Ägaren kan rätta och ta bort egna loggposter.
- En avancerad separat tidslinjeskärm krävs inte.

### Skärm 3. Guidande valpflöden

Ett litet antal högkvalitativa tränings- och utvecklingsflöden ska bevisa mekaniken **steg → utför → progression → nästa steg**.

**Acceptanskriterier:**

- Två till tre avgränsade flöden finns, exempelvis ensamhetsträning, hantering och miljöträning.
- Varje flöde ger konkreta instruktioner och ett tydligt nästa steg.
- Användaren kan registrera genomförda steg och återuppta sin progression.
- Relevanta steg kan lyftas i Home.

MVP:n ska bevisa guidningen, inte bygga en komplett hundskola.

Video är ett möjligt innehållsformat, inte ett krav för varje övning. Bildens övriga träningsflikar innebär inte ett större programutbud.

### Skärm 4. Hälsa – enkel ägarregistrerad översikt

Som valpägare vill jag hålla ordning på vaccinationer, veterinärhändelser och vikt utan att Tassla ställer diagnoser eller föreskriver behandling.

**Acceptanskriterier:**
- Ägaren kan lägga till, rätta och ta bort vaccinationer, veterinärhändelser och vikt med datum och koppling till hund-ID.
- Översikten visar registrerad historik och skiljer den från kommande händelser/påminnelser.
- Ägaren kan ange datum för kommande händelser och välja påminnelse; datum märks som ägarangivet, inte rekommenderat vårdschema. Appen härleder inte kliniska intervall. Leveranskanal avgörs enligt notifieringsbeslutet nedan.
- Informationen framgår som ägarregistrerad, inte verifierad journal eller officiellt vaccinationskort.

Generella avmaskningsscheman, automatiska behandlingsråd, diagnoser, läkemedelshantering och veterinärintegrationer ingår inte. Kliniska råd och eventuella föreslagna hälsoscheman kräver separat hundexpert-/veterinärgranskning innan publicering.

### Skärm 5. Kunskap – avgränsad egen vy

Som valpägare vill jag hitta relevanta artiklar, guider och checklistor för hundens ålder.

**Acceptanskriterier:**
- Ett avgränsat, granskat innehållsurval omfattar artiklar, guider och checklistor.
- Definierade åldersfaser ger olika relevanta urval.
- Samma innehåll kan nås från Hem och Kunskap utan dubblerade innehållsversioner.
- Innehåll med hälso-, tränings- eller utfodringspåståenden granskas enligt AGENTS.md före publicering.

Ett stort bibliotek, omfattande sök-/FAQ-system och partnerstyrda råd ingår inte. Exakt piloturval fastställs innan innehållsuppgifterna startar.

### Skärm 6. Tassla-pass – enkel sammanfattning

Som ägare vill jag skapa en sammanfattning av uppgifter jag själv har registrerat och själv kunna lämna den vidare.

**Acceptanskriterier:**
- Ägaren initierar och förhandsgranskar sammanfattningen för sin hund.
- En PDF kan skapas från ett uttryckligen fastställt urval av egna uppgifter; det exakta urvalet beslutas före implementation.
- PDF visar skapandedatum och att uppgifterna är ägarregistrerade. Den är inget officiellt pass, intyg eller vaccinationskort.
- Export initieras av ägaren. Ingen automatisk överföring, publik delningslänk, mottagaråtkomst eller partnerkoppling ingår.

Rekommenderat första urval är grundprofil och registrerade vaccinationer, veterinärhändelser och vikt; detta urval är ännu inte beslutat. Bildens foder-, allergi- och medicinrader är inte automatiskt krav på nya registreringsfunktioner. Compliance och Security granskar dataändamål, export och kontroller före berörd implementation. Detta dokumentbeslut godkänner inte faktisk persondatainsamling eller distribution.

## Måste med: retentionlager

En enkel notifieringsmotor med push/påminnelser ingår i MVP:n som stöd för produktloopen.

**Öppet beslut:** tidigare önskemål om senare push står i konflikt med detta krav. Bilden avgör inte leveranskanalen; Erik behöver fastställa vad som gäller före implementation. Datumstyrd visning i appen är inte samma sak som en levererad pushnotis.

**Acceptanskriterier:**

- Påminnelser kan kopplas till relevant innehåll, träning, rutiner eller hundens utvecklingsfas.
- En notifiering leder användaren till den relevanta hjälpen eller handlingen.
- Användaren kan välja om hen vill få notifieringar.
- Påminnelser ger konkret nytta; generella utskick för att enbart öka antalet öppningar ingår inte.

Återkomsten ska drivas av nytt värde och nya behov, med påminnelser som stöd.

## Måste med: distributions-MVP

Uppfödarflödet är en distributionspilot, separat från de sex huvudsakliga användarytorna.

**Kennel → unik QR/länk → Tassla → onboarding → hundprofil**

**Acceptanskriterier:**

- Varje pilotuppfödare får en unik länk och QR-kod att ge till valpköpare.
- Länken leder till onboarding.
- Kennel/distributionskälla sparas och kan kopplas till den skapade hundprofilen.
- Utfallet kan följas per kennel från inbjudan till återkommande användning.

Piloten behöver uppfödare, men ingen omfattande uppfödarportal eller integration. Distributionslösningen kan ändras utan att produkt-MVP:n omdefinieras.

## Måste med: mätning

Grundläggande instrumentering ska finnas från start. Ett avancerat analyssystem krävs inte.

Minsta händelsekedja att följa:

**QR/invite → onboarding start → dog created → Home viewed → first log / training started → return D1/D7/D30**

Loggning och valpflöden är alternativa vägar till värde, inte obligatoriska steg i en enda sekvens.

| Steg | Minsta uppföljning |
|---|---|
| Distribution | Antal utdelade inbjudningar i piloten, öppnade QR/länkar och startade onboardingar per kennel. Utdelade inbjudningar kan rapporteras manuellt. |
| Activation | Skapad hund, visat Home och första värdeskapande handling, exempelvis första logg eller påbörjat valpflöde. |
| Engagement | Aktiva dagar, återkommande loggning, användning av relevant innehåll och genomförda steg i valpflöden. |
| Retention | Återkomst D1, D7 och D30, följd per startkohort och distributionskälla. |

Inför piloten ska definitionen av aktivering, meningsfull återkomst, mätfönster och önskade målnivåer fastställas. Numeriska framgångströsklar är ännu inte beslutade.

Mätningen ska skilja på att öppna appen och att använda den. Antal installationer eller tekniskt fungerande funktioner räcker inte för att validera MVP:n.

## Tekniska krav och datamodell

**En hund. En profil. En tidslinje.**

- All hundrelaterad produktdata kopplas till hundens permanenta ID och kan återanvändas mellan funktioner.
- Loggar och utvecklingshändelser sparas kronologiskt med tidpunkt och händelsetyp, exempelvis `event_type`.
- Datamodellen omfattar MVP-händelser för loggning, vikt, vaccination och veterinärhändelser utan separata datasilos; fler händelsetyper kan tillkomma genom senare godkända krav.
- Hundprofilen ska leva vidare när valpen blir vuxen, utan att en ny profil behöver skapas.
- Fler signaler ska kunna användas för personalisering efter hand.

Tidslinjen är en dataprincip. Den kräver inte en avancerad tidslinjeprodukt i MVP:n. Den enkla hälsoöversikten ovan ingår, men en fullständig veterinärjournal gör det inte.

## Central produktloop

**Uppfödare/QR → onboarding → hundprofil → Home visar relevant hjälp → ägaren loggar, tränar eller läser råd → data och progression sparas på hunden → Tassla kan bli mer relevant → push, nytt innehåll eller nytt behov → tillbaka till Home.**

MVP:n ska validera att denna loop ger verkligt värde och upprepas över tid. Initial relevans kommer framför allt från ålder och ras; mer avancerad personalisering kan utvecklas senare.

## Utanför MVP

Följande passar den långsiktiga visionen men ingår inte i första versionen:

- Avancerad tidslinjeskärm, fullständig livshistorik och stort artikelbibliotek.
- Komplett hundskola eller brett utbud av träningsprogram.
- Läkemedels-/symptomhantering, diagnoser och fullständig hälso-/veterinärjournal.
- Officiella vaccinationskort/pass/intyg och export utöver det avgränsade ägarinitierade Tassla-passet.
- Avancerad AI-assistent, mönsterigenkänning och AI baserad på hundens samlade historik.
- Veterinärfrågor, försäkringsförmedling, foderrekommendationer med partnerkoppling och partnerintegrationer.
- Rabattkoder, affiliatelänkar, partnererbjudanden, generell e-handel och avancerade betalflöden.
- Hundvaktsmarknadsplats, hunddagis, pensionat, lokala tjänster och bokningssystem.
- Socialt nätverk, omfattande partnerportal och uppfödarens eget FAQ-system.
- Delad digital åtkomst för externa aktörer, temporära behörigheter och importer från veterinär eller andra tjänster. Ägarinitierad PDF-export enligt Tassla-pass är det avgränsade undantaget.

Kommersiella partners ska inte vara beroenden för lansering. Framtida funktioner prioriteras först när de stärker användarnyttan och den validerade produktloopen.

## Scope och lärande

Prioritera låg friktion, relevant hjälp och återkommande värde framför funktionsbredd. Nya behov från användartester kan motivera en scopeändring, men ska uttryckligen godkännas och skrivas in här innan de blir krav.

Exempelvis är delning av vardagsloggen med en partner inte beslutad MVP-funktionalitet. Den kan omprövas om piloten visar att den är avgörande för användning i hushållet.

## Definition av framgång

MVP:n är validerad när pilotdata visar att:

**Distribution fungerar → användaren skapar hunden → får omedelbart värde → använder Tassla återkommande i vardagen → återkommer över tid → hundens profil och historik växer.**

Detta lägger grunden för nästa steg: **MVP: Valpen → MID: Hunden → långsiktigt: Hundens digitala ekosystem.**
