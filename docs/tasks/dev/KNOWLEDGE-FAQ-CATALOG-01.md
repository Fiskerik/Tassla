# KNOWLEDGE-FAQ-CATALOG-01 — public FAQ-katalog v1

Planversion: **v5**. Avgränsad fortsättning efter `KNOWLEDGE-PHASE-CATALOG-01`. Vid taskstart fanns befintliga FAQ-fixtures bara i granskningsläge och den publika FAQ-vyn saknade svar. D3-schemat stödjer redan FAQ-innehåll och kontext. Den här uppgiften använder det schemat utan ny tabell, kolumn eller RLS-ändring. V4 hade Architect/Critic APPROVE. Efter två exakta Dog Expert-rundor har copy inga öppna ändringar, men slutverdictet är `PASS WITH CONDITIONS`; v5 gör det accepterade verifieringsutfallet och dess gränser uttryckliga.

## Uppgiftskontrakt

| Fält | Innehåll |
|---|---|
| ID / status | `KNOWLEDGE-FAQ-CATALOG-01` / `done` efter QA och Frozen Reviewer PASS |
| Bas | `knowledge/d3-catalog-delivery@150d6bb` |
| Mål | Visa korta, källänkade FAQ-svar i rätt Kunskapssammanhang från den befintliga publicerade D3-katalogen, med granskningsinnehåll fortsatt isolerat. |
| Mandat | Ägarens beslut att fortsätta Kunskapspaketet; `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md` §2 och D3 v5; godkänt och implementerat schema i `supabase/migrations/202610240002_knowledge_catalog.sql`; `docs/tasks/dev/KNOWLEDGE-PHASE-CATALOG-01`. Detta fortsätter redan godkänd FAQ-destination och review/public-grind, utan nytt persondataändamål. |
| Bevara | D3:s publicerade-only-grind, de tre befintliga FAQ-kontexterna, FAQ-fixtures bakom explicit reviewflagga, inga FAQ som artiklar eller Hem-rekommendationer, befintliga `content_items`/`content_versions` och källformat, inga hundnamn eller könade pronomen i redaktionell copy. |
| Ingår | Fyra nuvarande FAQ-teman som källspårat utkast; Dog Expert-granskning av exakt svensk fråga/svar och källa; versionsmärkt JSON, strikt payload-validator, separat idempotent import till `reviewed` och separat publiceringsfil mot befintligt D3-schema; en separat `PublishedFaq`-typ/adapter, separat FAQ-lässtatus i `ProductWorkspace` och data till `FAQScreen`; kompakta klickbara `1)`/`2)`-källmarkörer med granskade källmetadata; verifierad Dogs Trust-källa om vuxentillsyn läggs in i befintliga `source-links.ts`-metadata; tests/renderbevis, README och checkpoint. FAQ lämnas utanför `HomeContent`, Hem och artikel-/träningsrekommendationer. Publiceringsfilen och appkoden färdigställs lokalt; ingen livekörning ingår. Copy får inte markeras ägar-/veterinärgodkänd. |
| Ingår inte | D3-schema/RLS/grants; nya eller ändrade hundägda rader; nya FAQ-teman utanför de fyra befintliga fixtures; nätbaserad AI-frågetjänst; rekommendationslogik; veterinär-, live-Supabase-, TestFlight- eller native/VoiceOver-claim; live import/publicering; externa meddelanden eller publicering. |
| Ägare / granskare | Skrivägare: Codex-koordinator. Förhandsgranskning: Critic av plan/copygräns, Architect av adapter-, versions- och källmetadataändring, Dog Expert av exakt FAQ-copy/source map; UI Critic BRIEF och REVIEW mot `docs/plans/KNOW-02-checklists-faq-ux-spec.md`; därefter oberoende QA och Reviewer, read-only. Security fokuserar statiskt på admin-only SQL och befintlig publicerad read path; inga grants ändras. |
| Beroenden / risk | `KNOWLEDGE-D3-CATALOG-SCHEMA-01` och `KNOWLEDGE-PHASE-CATALOG-01` (done). H-risk eftersom publicerat beteendeinnehåll och D3-publiceringsgrind berörs; ingen live databasoperation. |
| Läsunderlag | `AGENTS.md`, `docs/design-rules.md`, `docs/dev/workflow.md`, `docs/tasks/template.md`, `docs/content/README.md`, `docs/content/knowledge-phase-checklists-review-v1.md`, `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md` §2/D3 v5, `docs/plans/KNOW-02-checklists-faq-ux-spec.md`, `docs/tasks/dev/KNOWLEDGE-PHASE-CATALOG-01.md`, D3-migrationen, `src/data/workspace-data.ts`, `src/features/knowledge/FAQScreen.tsx` och Knowledge/Home README. |

## Innehållsgräns

Utkastet utgår från de fyra existerande temana och låser stabila D3-slugs/context: `review-v1:faq:first-night` → `faq-first-night` / `first_days`; `review-v1:faq:alone-time` → `faq-alone-time` / `first_days`; `review-v1:faq:child-contact` → `faq-child-contact` / `before_homecoming`; `review-v1:faq:course` → `faq-puppy-course` / `by_age`. Dessa slugs blir persistenta identiteter; fixture-ID:n kopieras inte in i databasen. Validatorn kräver exakt denna mängd och avvisar saknade, duplicerade eller ommappade poster.

Svaren ska vara korta, generella och icke-diagnostiska. Varje meningsbärande råd får en `claim_id` och en eller flera källreferenser i granskningsmanifestet. För barnkontakt anges tydligt att en vuxen aktivt håller uppsikt; claimen stöds av Dogs Trust-guiden som öppnades 2026-10-28. Första natten-svaret ska börja med en konkret nattförberedelse utan att utlova sömn eller ge toalett-/vårdintervall. Valpkurscopy anger inget generellt startdatum eller vaccinationsintervall. Källor visas efter expanderat svar som enbart små numrerade länkar med full granskad titel och utgivare i hjälpmedelsnamnet. Validatorn avvisar URL:er som saknar metadata i det befintliga `source-links.ts`-registret. FAQ-versionens D3-`context` anger endast vilken av de befintliga tre flikarna som visar frågan; den är inte hundens ålder eller en rekommendationssignal.

Granskningsfixtures är inte godkännande. Publiceringsfilen använder endast den exakta Dog-Expert-granskade payloaden och markerar AI-ursprung. Lokal ändring av status i SQL innebär inte att databasen har ändrats. Produktionssynlighet kräver separat godkänd publicering i målmiljön.

## Frysta skrivvägar

- `docs/tasks/dev/KNOWLEDGE-FAQ-CATALOG-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/content/README.md`
- `docs/content/knowledge-faq-v1.json`
- `docs/content/knowledge-faq-review-v1.md`
- `tools/validate_knowledge_faq.py`
- `supabase/content/knowledge-faq-v1.sql`
- `supabase/content/publish-knowledge-faq-v1.sql`
- `supabase/tests/knowledge-faq-catalog.sql`
- `src/data/workspace-data.ts`
- `src/features/knowledge/FAQScreen.tsx`
- `src/features/knowledge/source-links.ts`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/knowledge/README.md`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/README.md`
- `tests/knowledge-faq-content.test.mjs`
- `tests/workspace-data.test.mjs`
- `tests/checklist-ui.test.mjs`
- `tools/visual-check/know02-app.tsx`
- `tools/visual-check/verify-know02.py`
- `tools/visual-check/README.md`
- `docs/design/evidence/knowledge-faq-catalog-v1/VERIFICATION.md`
- `docs/design/evidence/knowledge-faq-catalog-v1/results.json`
- `docs/design/evidence/knowledge-faq-catalog-v1/panel7-faq-comparison.png`
- `docs/design/evidence/knowledge-faq-catalog-v1/postgres-probe.log`
- `docs/design/evidence/knowledge-faq-catalog-v1/public/browser-results.json`
- `docs/design/evidence/knowledge-faq-catalog-v1/review/browser-results.json`
- `docs/design/evidence/knowledge-faq-catalog-v1/public-faq-375.png`
- `docs/design/evidence/knowledge-faq-catalog-v1/public-faq-430.png`
- `docs/design/evidence/knowledge-faq-catalog-v1/public-faq-short-375x667-140.png`
- `docs/design/evidence/knowledge-faq-catalog-v1/review-faq-375.png`
- `docs/design/evidence/knowledge-faq-catalog-v1/public-faq-empty-375.png`
- `docs/design/evidence/knowledge-faq-catalog-v1/public-faq-error-375.png`

## Acceptans och verifiering

| Kriterium | Bevis / exakt kontroll | Resultat |
|---|---|---|
| Exakt fyra FAQ-poster använder nuvarande teman, korrekt D3-context, kort neutral svensk copy och full claim→source-map; barnkontakt kräver vuxentillsyn och första-natten-frågan får ett direkt svar. Dog Expert får ge PASS eller PASS WITH CONDITIONS endast när inga copy-/säkerhetsändringar återstår; villkor, bedömningsunderlag och inga-veterinärsignoff begränsningar sparas med exakt digest. | Dog Expert läser exakt JSON och granskade källutdrag; `knowledge-faq-review-v1.md` sparar verdict, villkor, begränsningar och payloaddigest. | PASS WITH CONDITIONS; digest `170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288`; ingen veterinärsignoff eller oberoende URL-hämtning påstås. |
| Importen landar exakt som `reviewed`/opublicerad med Dog Expert-reviewreferens och granskningsdatum; separat publicering kräver exakt match mellan granskad JSON och båda SQL-payloads. Ingen hundägd progress, ikon eller preferens ändras. | `validate_knowledge_faq.py`, mutations-/paritetstest och disposable PostgreSQL-probe verifierar `reviewed` metadata, retry, drift-avvisning, separat publish, published-only RLS och rollback. | PASS i disposable PostgreSQL 16 med syntetisk schemafixtur; hela körlogget finns i `postgres-probe.log`: migrationssekvens, import/retry, tamper refusal, separat publicering/retry och published-only/owner-data-prob med rollback. Ingen live-databas ändrad. |
| Public Knowledge får FAQ endast via separat `PublishedFaq`-adapter som validerar parent `content_type='faq'`, publicerad status och en av de tre `ChecklistContext`-värdena. FAQ filtreras bort från `HomeContent`, Hem och artikel-/träningsflöden. Review-fixtures visas bara med explicit reviewflagga. | Adapter- och route-tester provar alla contexts, reviewed/draft/withdrawn/empty/error, felaktig/missing context och isolerat review-läge. | PASS enligt fokuserade tester och full kodcheck; publicerad FAQ går genom egen adapter och lämnas utanför `HomeContent`. |
| Expanderat svar visar full text och kompakta, fungerande `1)`-källlänkar; alla tre sammanhangsflikar är hela vid 375/430 px och scroll når sista fliken med 140 %-text. Tillbakaflöde och 44×44 pt-träffytor fungerar. Befintligt FAQ-mönster med expanderbara, lila kort bevaras. | RN Web public/review/empty/error vid 375/430 och kort 375×667 med 140 %-text; jämför mot `KNOW-02-checklists-faq-ux-spec.md` och §14. UI Critic, QA och Reviewer. | Public 152/152 och review 62/62, 0 browserfel; samtliga kontextetiketter ryms vid 375/430 och sista fliken kan scrollas fram vid 140 % text. UI Critic REVIEW PASS, oberoende QA PASS och Frozen Reviewer PASS utan fynd efter tabfix. §14.8 kontrastmätning och §14.15 native-stöd är fortsatt NOT TESTABLE. |
| Befintliga guider, faslistor, Hem-innehåll och checklistors egna punkter/progress är oförändrade. | Berörda workspace-, Knowledge- och checklisttester samt `CI=1 pnpm check`. | PASS preliminärt enligt full check och public/review-harnessen; QA bekräftar scope och regression. |
| All status skiljer lokal kod/fixture från live Supabase/RLS, native/VoiceOver och faktisk publicering. | Queue, rapport, README, SQL-resultat och `git diff --check`; inga live-kommandon körs. | Lokal/disposable status redovisas; live Supabase/RLS, faktisk import/publicering, native VoiceOver/Dynamic Type och iPhone är NOT TESTABLE. |

## Checkpoint

- Plan v3 hade Architect/Critic APPROVE och gick till `ready`. Dog Expert-granskningen av payload SHA `74b0a80923c60683251ef63f4d5ff40802c9dccf31a959cf92183154acb49156` gav totalt CHANGES: första natten behövde direktare svar; barnkontakt krävde vuxentillsyn och källa. Ensamhetsträning PASS; valpkurs PASS WITH CONDITIONS om fast intervall undviks.
- RSPCA:s officiella valpvårdssida öppnades 2026-10-28 och bekräftar dess specifika brittiska tidsangivelser; de förs inte över som svensk rekommendation. Dogs Trusts `Getting a dog when you have children` öppnades 2026-10-28 och stöder aktiv vuxentillsyn, kort/lugnt positivt första möte, att hunden får gå undan och ostörd vila. Dog Expert kunde inte själv öppna källorna.
- Plan v4 fick **APPROVE från Architect och Critic**. Skrivvägarna matchade och Dogs Trust-metadataändringen låg kvar som planerad, inte genomförd.
- Dog Expert bedömde digest `170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288` **PASS WITH CONDITIONS**: alla fyra FAQ:er passerar; inga fler copyändringar behövs; granskningen bygger på koordinatorns källsammanfattningar och är inte oberoende URL-hämtning eller veterinärsignoff. Därefter fick plan v5 Architect och Critic APPROVE, vilket öppnade lokal implementation; ingen liveoperation godkändes.
- UI Critic BRIEF mot aktuell FAQ-render och närmaste referenspanel 7: den expanderade FAQ-rutan skulle använda lila FAQ-yta; kompakta `1)`-källlänkar skulle ha full titel/utgivare i hjälpmedelsnamn och 44×44 pt träffyta.
- Implementationen visar exakt granskat FAQ-paket via en separat publicerad-FAQ-adapter; reviewfixtures är avskilda. Källorna är kompakta `1)`-länkar med full titel/utgivare i tillgänglighetsnamnet. Den expanderade FAQ-ytan är lila. D3-import och publicerings-SQL är separata och kontrollerar exakt payload; ingen liveimport har körts.
- UI Critic REVIEW öppnade `docs/design/evidence/knowledge-faq-catalog-v1/panel7-faq-comparison.png`: den lila expanderade ytan är korrigerad och inga nya visuella avvikelser rapporterades. Touch targets och accessible names verifierades separat i Playwright.
- Public RN Web `verify-know02.py`: **146/146**, 0 browserfel. Review RN Web: **55/55**, 0 browserfel. Renderaren uppdaterades till appens aktuella träningsresa, checklistdialog och Kunskapsgenvägar; kort 375×667/140 %-text, källnavigation och tillbakaresa passerade.
- Frozen Reviewer hittade därefter att `Efter ålder`-fliken kapades i 375 px-rendern. `FAQScreen` använder nu befintlig `Tabs`-horisontalscroll och korta men tydliga UI-etiketter `Hemkomst`, `Första dagarna`, `Efter ålder`; det persistenta `ChecklistContext`-värdet och FAQ-filtreringen ändrades inte. Playwright bekräftar hela etikettgruppen vid 375/430 px och att sista fliken kan scrollas fram vid 140 % text. Uppdaterade resultat: public **152/152**, review **62/62**, 0 browserfel. UI Critic REVIEW och oberoende QA PASS efter rättningen.
- Security statisk granskning: inga blockerande fynd; publicerad adapter kräver publicerad FAQ-version/context och håller FAQ utanför `HomeContent`. Före eventuell livepublicering inventeras FAQ-katalogen i målmiljön eftersom publiceringsskriptet inte gör en global kontroll av orelaterade publicerade roots. Disposable PostgreSQL 16 med syntetiska fixturer passerade import/retry, vägran vid payloaddrift, separat publicering och published-only/owner-data-prob; körlogg finns i `postgres-probe.log`. Ingen live Supabase kördes.
- Slutlig lokal kodcheck PASS, oberoende QA PASS, scope-audit 34 ändrade paths inom 36 deklarerade och Frozen Reviewer PASS utan fynd; utfallet redovisas i `docs/design/evidence/knowledge-faq-catalog-v1/VERIFICATION.md` och `results.json`. Oberoende QA PASS: lokal FAQ-scope godkänd; syntetisk PostgreSQL-körlogg godkänd som dokumenterad körning men saknar exakta kommandon, tamperingmetod och minorversion. Live Supabase/RLS, native hjälpmedel och faktisk publicering är fortsatt NOT TESTABLE. Tasken stängs efter Frozen Reviewers slutliga PASS.
