# MVP-population: innehåll och återstående leverans

Datum: 2026-10-06  
Referens: lokal källsnapshot `4f1a649b2b8996c78de8eec0b8ac63befac76f8d`  
Status: planeringscheckpoint; detta dokument godkänner inte implementation, verklig databehandling eller pilot.

## Utgångsläge och avgränsning

MVP:n är de sex ytorna Hem, Valplogg, Träning, Hälsa, Kunskap och ett enkelt Tassla-pass, med hundprofil/onboarding, distribution, aktivering, engagemang och retention som stöd. Hem ska hjälpa med dagens behov; loggen fångar kiss, bajs, mat, sömn och promenader; träning använder granskade stegvisa program; Hälsa ska rymma kommande och genomförda vaccinationer, veterinärhändelser och vikt; Kunskap visar åldersrelevanta artiklar och checklistor; Tassla-pass är en enkel ägar-PDF. Treårsvyn ligger utanför.

Källkoden visar fungerande lokala/cloud-grunder och publicerat innehållsurval för Hem/träning, men tomma grunder i Hälsa och Tassla-pass. Kunskap kan visa publicerade poster men en redaktionell innehållskatalog är inte levererad. Att en komponent, lokal kontroll eller köstatus är `done` bevisar inte fysisk telefon-UX, verklig databas/RLS, release eller pilot. Denna plan lämnar dessa gränser intakta.

Köstatus i den orörda källan (`docs/tasks/dev/queue.json`) är äldre än dagens besked. Användaren bekräftade i denna session 2026-10-06 att APP-04A-PHONE har passerat. Detaljer om build/version och testutfall saknas här; registrera dem som evidens/checkpoint enligt tasken, men upprepa inte telefonprovet enbart för att köfilen ännu visar `planned`. APP-05 viktresa förblir blockerad tills dess övriga beslut enligt `docs/tasks/dev/app-05.md` är dokumenterade. Fortsätt inte APP-05 eller annan app-/cloud-hälsokod här, och ändra inte status eller mandat i källträdet.

## Numrerade vertikala slices

| # | Slice, ägare | Beroenden och berörda ytor | Acceptans och verifiering |
|---|---|---|---|
| 1 | Inventering och innehållskontrakt — Produkt/koordinator | Detta dokument; `docs/content/mvp-content-inventory.json`; endast metadata | ID unika; status och åldersfönster explicita; saknad källa/granskning kan inte se publicerad ut; JSON parsas och fältkontrolleras. Genomförbart nu. |
| 2 | APP-04A-PHONE evidenscheckpoint — taskens ägare/koordinator | Användaren har bekräftat passerad grind 2026-10-06; befintlig APP-04-task | Anteckna build/version och verifieringsdetaljer i checkpoint. Resultatet är användarrapporterat; ingen oberoende telefonkörning här. Upprepa inte provet enbart på grund av gammal köstatus. |
| 3 | APP-05 viktresa — Implementer efter grindar | APP-04A-PHONE rapporterad passerad; build/version/resultat behöver checkpointas. Därtill planens Compliance-grind och Eriks beslut om ändamål/rättslig grund; befintlig health/workspace/data/testväg | Följ befintligt `docs/tasks/dev/app-05.md` v3: skapa/läsa/ändra/radera ägarregistrerad vikt, validering och sanningsenlig sparstatus. APP-05 förblir blockerad tills övriga grindar uppfylls; ingen ny kod här. Telefon/RLS är ej verifierad av denna plan. |
| 4 | APP-04B2 vaccinations- och veterinärhistorik – Implementer | APP-05 B1 klar och checkpointad; separat exakt plan, Compliance och Security. src/features/health/HealthScreen.tsx, src/data/workspace-data.ts, ProductWorkspace.tsx och relevanta tester | Ägaren kan skapa, läsa, rätta och bekräftat radera datum/kort ägartext för vaccination och veterinärhändelse; inga kliniska intervall. Lokal check/QA/review; verklig RLS och fysisk UX redovisas separat. |
| 5 | APP-04C profilredigering – Implementer | Efter B1 och B2 enligt beslutad ordning. src/features/onboarding, src/data/app-data.ts, ProductWorkspace.tsx och relevanta tester | Namn, ras och födelsedatum kan rättas med befintlig validering; bekräftade ändringar uppdaterar ålder och innehåll. Egen exakt plan, QA/reviewer/security och telefon-/databasverifiering. |
| 6 | Hälsa: kommande ägarangivna händelser – separat slice | Efter verifierad hälsohistorik; src/features/health, src/data/workspace-data.ts och eventuellt befintliga reminders-kontrakt, först efter Architect-granskad plan | Ägarangivet framtida datum visas separat från genomförd historik och kan rättas/raderas. Ingen klinisk schemagenerering. Påminnelseleverans förblir separat och kräver kanalbeslut samt verkligt leveranstest. |
| 7 | Kunskapsurval och publiceringsgrind — Produkt/koordinator, Dog Expert för sakgranskning | Inventory; befintligt `src/content/select-content.ts`, Kunskap/Hem/träning och content-tabeller | Välj litet pilotpaket och faktiska källor. Välj 2–3 träningsflöden bland hantering, miljötrygghet och ensamhet som förslag; ingen är krav förrän prioriterad/granskad. FAQ är inte MVP-krav. Fakta/säkerhetspåståenden källbeläggs; hälso-/tränings-/beteenderåd sakkunniggranskas; ingen medicinsk text i metadatafilen. |
| 8 | Tassla-pass — Produkt/Erik beslutar om nytta och fält innan separat task | APP-04B2 + APP-04C; compliance/security på exakt urval; exportbeslut | Förhandsgranskning av enbart valda ägaruppgifter, datum och tydlig text att detta inte är officiellt pass/intyg/vaccinationskort. PDF/export och systemdelning kräver separat godkännande, beroenden och verifiering. Nuvarande skärm är endast tom grund. |
| 9 | Uppfödar-QR-attribution — Produkt/Compliance/Security, separat task | Beslut om kodformat, källa och attribueringsändamål | Går att ansluta utan kennelregistrering eller ägar-/hunddatadelning; eventuell delning kräver uttryckligt samtycke. Dokumentera källattribution och mätdefinition innan implementation. |
| 10 | Notifieringsbeslut och implementation — Produkt/Erik, därefter Compliance/Security | Olöst kanalval, behörighets-UX, ändamål och eventuell dependency | Inga pushar/påminnelser innan beslut och separat plan. Kanalen ska vara valfri, återkallelig och testad på fysisk enhet om den godkänns. |
| 11 | Mätdefinitioner och teknisk instrumentering — Produkt/Compliance/Security | Definitionsslice först; separat mandat innan eventinsamling | Definiera Distribution, Activation, Engagement och Retention med händelser/fönster/denominatorer. Därefter separat ändamåls-/dataminimeringsbeslut; inga uppfunna numeriska framgångströsklar. |
| 12 | Pilotberedskap — Erik äger beslut; Compliance/Security/QA-underlag | Föregående produktbeslut, godkända contentversioner, verklig telefon- och databasverifiering | Checklista för testkonton/data, information/radering/retention, incidentväg, build/store, innehållsägargranskning, partner-/annonsstatus. Extern pilot/release kräver uttryckligt beslut; inget är godkänt av denna plan. |

**Nästa konkreta steg:** bifoga build/version och detaljerat APP-04A-PHONE-resultat till befintlig checkpoint. Därefter kan APP-05 övervägas när dataskyddsgrind och exakt plan/mandat är dokumenterade. Inventeringen är redaktionellt arbetsunderlag; den ger inte mandat för app-/cloud-kod.

## Innehålls- och mätregler

Inventeringen är metadata, inte råd. Titlar och ämnen är förslag; ingen post får vara `published` utan källreferenser och relevanta granskningar. Källreferenser är tomma tills faktiska, aktuella källor valts. Åldersspann i veckor är målgruppsurval, inte medicinska rekommendationer. Inget sponsor-/partnerinflytande på hälsa, utfodring eller träning. Specialkost hänvisas till veterinär och ingår inte som färdigt råd.

### Överlämning till nuvarande contentmodell

JSON-filen är redaktionell metadata och kan inte importeras direkt i databasens contentmodell. `content_items` kräver unik slug och typ (`article`, `guide`, `checklist`, `training_program`). `content_versions` lagrar UUID, `content_id`, positiv `version`, `title`, `body`, åldersspann, status (`draft`, `reviewed`, `published`, `withdrawn`), `reviewed_at`, `review_reference`, `sources` och `published_at`. Rasurval går via `content_breed_targets` med `content_version_id`/`breed_id`; program behöver `training_steps` med versions-ID, nyckel, position, titel och instruktion. Inventeringens `proposed` är enbart metadata, inte databasstatus. Den saknar avsiktligt slug, body, version, databas-ID, granskningstid/referens enligt DB-kontrakt, publiceringsdatum, rasrelationer och programsteg. `review_required`/`review_evidence` är redaktionella granskningskrav och verifieras inte av databasen. En redaktör måste manuellt mappa fulltext, verkliga källor, granskningsbeslut och eventuella raser/steg till rätt rader. Validatorn bekräftar endast att fält finns och har rimlig struktur; den verifierar inte att källor/granskningar är verkliga eller korrekta. Ingen SQL/importscript eller schemaändring ingår.

Mätning börjar med entydiga definitioner, inte siffermål. Distribution: QR-landnings-/kodkälla och frivilligt genomfört onboarding. Aktivering: en produktdefinierad första värdehändelse efter profilskapande, ännu ej beslutad. Engagemang: återkommande användning av kärnflöden med definierat tidsfönster, ännu ej beslutat. Retention: återkomst i vald kohort och period, skild från första dagens aktivitet, ännu ej beslutad. Innan teknisk spårning: minimera data, dokumentera ändamål/information/lagring och invänta Compliance/Security samt Eriks beslut.

## Verifiering och evidensgräns

Den här checkpointen verifieras genom parsning och schema-/konsistenskontroll av JSON samt jämförelse med lokala dokument/källkomponenter. Det är inte ett `pnpm check`, inte en release och inte oberoende review. APP-04A-PHONE återges som användarrapporterat resultat för 2026-10-06; vi har inte verifierat build eller runtime. APP-05 förblir blockerad på återstående grindar. Inga påståenden görs om Supabase-runtime, RLS, publicerat innehåll eller faktisk pilot.


