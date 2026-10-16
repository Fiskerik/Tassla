# MVP-V2-ADOPT-01 — MVP v2 som styrande scope och V2-01 relevanskontrakt

Version: 1.8<br>
Status: lokalt genomfört; dokument-QA, planreviews och oberoende Reviewer PASS; ej committat eller pushat<br>
Bas: `main` @ `00d4d4a3e38c08a6bb7d4c541cc509457126276f`<br>
Risk: L — dokumentation och kö; ingen användardata eller körande produkt ändras.

## Ägarbeslut och mandat

Erik har godkänt de tidigare föreslagna styrdokumentändringarna och sagt 2026-10-16: ”Hämta den senaste commiten från Main och utgå från MVP v2 framöver.” Detta gör MVP v2 till styrande produktdefinition. Eriks tidigare beslut att samtliga åtta vision_rev02-paneler är obligatoriska funktionella användarresor, leveransmodellen flows och riskbaserad QA gäller fortsatt. Panel 4-svaret är: **Alla visar alla aktiva rutinmallar, även när en rutin inte är vald för en dag.**

Arbetet sker endast lokalt i den rena Main-klonen. Inga GitHub-skrivningar, pushes, publiceringar, migrationer eller ändringar av app-/databasbeteende ingår.

## Mål

Gör den godkända MVP v2 lätt att hitta som enda aktuell MVP-definition och skapa V2-01:s konservativa relevanskontrakt för det befintliga publicerade innehållet. Bevara äldre godkända beslut och historik, skilj eligibility från redaktionell relevans och gör inte antaganden om vuxenrelevans från ett öppet åldersspann.

## Omfattning och skrivfiler

- `docs/mvp.md`: aktuell MVP v2 i fulltext och tydlig godkännandestatus.
- `docs/MVP v2 - 2026-10-16.md`: kort pekare till den kanoniska specifikationen.
- `docs/history/mvp-v1-2026-10-15.md`: arkivkopia av den tidigare v1-definitionen.
- `docs/history/mvp-v2-source-proposal-2026-10-15.md`: spårbar, tydligt historisk källtext.
- `AGENTS.md`, `docs/dev/workflow.md`: länka styrande scope och aktuell Main-bas; behåll befintliga säkerhets-, sanningsenlighets- och godkännandekrav.
- `docs/MVP-EXPERIENCE-CONTRACT.md`: status och bas uppdateras; crosswalk mellan åtta panelresor och v2:s sex områden; Panel 4:s Alla-definition.
- `docs/content/mvp-v2-relevance-matrix.md`: slug + publicerad version, status/ålder/ras-eligibility, redaktionell roll/målgrupp, kontext/ytor, vuxenrelevans och sakgranskningsgrindar.
- `docs/design/vision-rev02-screen-contracts.md`: synka tränings- och kunskapsvyerna med publicerings-, eligibility-, målgrupps-, visningsyte- och adult-applicability-grindarna.
- `docs/decisions/MASTER-LOG.md`: sammanfatta antagandet av v2 och behåll den som enda aktuella besluts-/paketöversikt; äldre nummerfiler förblir historiska källor.
- Berörda roller: `.codex/agents/product.toml`, `critic.toml`, `architect.toml`, `dog_expert.toml`, `implementer.toml`, `qa.toml`, `reviewer.toml`, `security.toml`; håll mandat, livslöften och specialistgrindar synkade med v2 och länka till kanoniska filer.
- `docs/GAP_analys_Tassla 2026-10-16.md`: lägg till daterad status att ägaren adopterat v2 och att implementationens bas är Main; behåll äldre branchjämförelser som historisk evidens.
- `docs/tasks/dev/queue.json`: lägg in MVP-V2-ADOPT-01, uppdatera FLOW-HOME-CHECKLIST-01 med exakt Panel 4-definition och skapa små, beroende Panel 4-checkpoints.
- `docs/tasks/dev/FLOW-HOME-CHECKLIST-IDAG-01.md`: den exakta första Panel 4-planen ska ingå i detta dokumentpakets write scope, synkas mot sin queue-post och vara planerad innan adoption-paketet stängs; den innehåller ännu ingen appkod.
- `AGENTS.md` och `.codex/agents/implementer.toml`: uttryck att befintligt MVP v2-mandat täcker stegvis implementation inom scope och att publicerat/relevant innehåll bara visas efter innehållsgrindarna, annars ärligt tomläge.

Ingen ändring i `docs/design-rules.md` planeras om granskningen inte hittar en faktisk motsägelse; filen styr visuellt arbete och hänvisar redan till upplevelsekontraktet.

## V2-01 relevansregler

Inventeringen ska använda följande konservativa skillnad:

1. **Eligibility**: publicerad version samt dess gällande ålders-/rasvillkor. Opublicerade utkast visas aldrig som publicerat innehåll.
2. **Redaktionell relevans**: avsedd hund-/ägargrupp, situation/behov, sakgranskning och tillåten visningsyta. Eligibility bevisar inte relevans eller prioritet.
3. **Valordning**: Main har ingen dokumenterad redaktionell prioritet/tie-break för automatiska personliga rekommendationer. V2-01 fastställer därför inte vilken av flera relevanta kandidater som ska rekommenderas först; sådan implementation kräver separat ägargranskad prioriteringsregel. Användarstyrd katalog, sökning och filter får visa publicerat innehåll först när eligibility och godkänd redaktionell målgrupp/visningsyta matchar; vuxenråd och vuxenträning kräver även versionsspecifik Dog Expert-bedömning av vuxentillämpning. Godkända resultat har neutral svensk titelordning stigande med stabil slug som tie-break. Detta är inte personlig ranking, och databasens indataordning är inte en godkänd urvalsregel.
4. **Sanningsenligt tomläge**: om inget godkänt hundrelevant innehåll passar visar Hem inget personligt råd som om det vore relevant. Separera saknat innehåll från läsfel/okänd källa.
5. **Ingen tyst ändring**: V2-01 ändrar inte publicerad text, version, schema, profilfält, datainsamling, analys eller kod.

Inventeringen ska minst pröva:
- 11 veckor, utan signal om nylig hemkomst: `first-week` kan inte väljas som personlig rekommendation enbart från ålder. `before-homecoming` är draft/onboarding-only.
- 11 veckor, uttryckligen angiven hemkomstkontext: redovisa `first-week` som kandidat endast om befintlig publicering/ålder matchar; det finns inget sådant runtime-profilfält på Main.
- 5 år, tom historik: valptexter och allålders appmanualer är inte vuxenhundsråd. Visa vuxenrelevant innehåll endast när det är dokumenterat och sakgranskat; annars ärligt tomläge.
- Träningsprogram med öppet åldersspann: får inte förklaras vuxenlämpliga utan Dog Expert-bekräftelse av granskningens målgrupp och begränsningar.
- Samma kandidater i olika indataordning: automatrekommendationens val är blockerat tills ägargranskad prioriteringsregel finns. Användarstyrd katalog/sökning/filter fortsätter bara med resultat som klarat eligibility-, målgrupps- och ytegrindarna; vuxenråd/träning kräver också versionsspecifik Dog Expert-bedömning. Godkända resultat använder neutral svensk titelordning stigande och slug som tie-break, aldrig personlig ranking.

Det här arbetet avgör inte om vuxeninnehåll ska ha tre publicerade objekt som releasegrind eller om ett objekt räcker för det minsta vuxen-Hemmet. MVP v2 innehåller båda formuleringarna; registrera skillnaden som öppet beslut inför berörd innehålls-/pilotgate. Inget vuxeninnehåll publiceras i detta paket.

## Panelcrosswalk

| Rev02-panel | v2-område | Avgränsad innebörd |
|---|---|---|
| 1 Hem | Hem | Hundidentitet, dagsläge, relevant innehåll och riktiga genvägar |
| 2 Utveckling | Hem + Kunskap | Ålder/publicerade milstolpar; ingen utveckling påstås utan observation |
| 3 Dagens framsteg | Hem + befintlig progression | Bara bekräftade dags- och träningsdata |
| 4 Daglig Checklista | Hem + rutinhantering | Idag = vald dags fulla population; Alla = samtliga aktiva rutinmallar oavsett dagsval; inga låtsasfilter. Vecka/Kommande visas först när verkliga urval och datakällor är byggda. |
| 5 Logga | Logg | Befintliga snabbval, historik och redigering |
| 6 Träning | Träning | Publicerat program, bekräftad stegstatus, återuppta |
| 7 Kunskap | Kunskap | Publicerade källmärkta guider och checklistor |
| 8 Insikter | Logg | Beskrivande sammanställning av sparade logghändelser, utan ny analys/datakälla |

Hälsa och Tassla-pass kvarstår som två av v2:s sex områden trots att de saknar egen vision_rev02-panel. Panelerna blir separata acceptanser; de skapar inte åtta produktområden eller extra huvudnavigation.

## Inte i denna uppgift

- Ingen appkod, ny skärm, urvalsregel i runtime, publicerat innehåll eller content-versionsändring.
- Ingen ny profil-/hemkomstsignal, datamodell, migration, RLS-, analytics- eller consentändring.
- Ingen ny dependency, kostnad, partnerintegration, rekrytering av pilotdeltagare eller release.
- Ingen portning från `codex/life-periods`. Basen är latest Main; dess saknade livsperiodskod dokumenteras som gap för separat plan.

## Acceptans och bevis

- `docs/mvp.md` är otvetydigt styrande v2; den tidigare MVP v1 finns kvar läsbar i arkivet.
- MVP v2, de åtta panelerna, de sex v2-områdena, flowmodellen, riskbaserad QA och användarens säkerhets-/godkännandegränser motsäger inte varandra.
- Styrinstruktionerna lovar inte nytt eller personligt innehåll vid varje inloggning; de tillåter endast publicerat innehåll som klarat eligibility-, redaktionella målgrupps- och ytgrindar, med ärligt tomläge när inget passar.
- Panel 4-kontraktet definierar Alla som samtliga aktiva rutinmallar, även utan dagsval, och skiljer detta från senare Vecka-/Kommande-urval.
- Relevansmatrisen och skärmkontraktet skiljer dokumenterade fakta, försiktiga urval och öppna frågor; automatisk rekommendationsprioritet/tie-break återstår, och vuxenråd/träning kräver versionsspecifik Dog Expert-bedömning även i användarstyrda listor/sökningar.
- Main-basens saknade periodresolver och saknad hemkomstsignal anges sanningsenligt.
- Queue JSON innehåller MVP-V2-ADOPT-01 med detta paket som första V2-grind, och FLOW-HOME-CHECKLIST-01 anger att Alla omfattar samtliga aktiva rutinmallar även när de inte valts för en dag. Panel 4 delas sedan upp i oberoende granskade checkpoints med verkliga datakällor; den första är Idag.
- Queue JSON parse och `python tools/dev_flow.py validate` passerar; relevanta interna länkar/statusar och `git diff --check` passerar.
- Den första Idag-checkpointens detaljerade plan och queue `write_paths` täcker varandra exakt; plan v3 innehåller kalender-/resume-livstid, alltid synlig entrypoint, exakt träningskälla och en avgränsad vuxentillämplighetsgrind för checklistans träningslänk, returtillstånd samt körbara Windows-kommandon för både public och review-rendering. Dessa planvillkor är granskade före runtime-arbete.
- Inget app-/database-test krävs, eftersom ingen runtime ändras. Nya test-/reviewkrav får inte påstås.
- Först efter oberoende QA, Architect APPROVE, Critic PROCEED, Reviewer PASS och verkliga kontroller sammanfattas paketet i MASTER-LOG och stängs.

## Nästa steg efter denna del

Efter V2-01: ta fram en separat, källbelagd och Dog Expert-granskad minsta vuxenrelevant innehållsplan innan kod som kan visa sådant innehåll. FLOW-HOME-CHECKLIST-01 kan planeras separat eftersom den inte ändrar innehållsurvalet; dess första checkpoint ska bevara användarens Panel 4-beslut. Adult training eligibility, hemkomstsignal, tioperiodsmodell och vuxenpilotens kvalitetsgate förblir spårade frågor inför sina respektive kod-/pilotuppgifter.


## Granskningsunderlag och inarbetade villkor — 2026-10-16

- Product bedömde V2-01 som lämplig dokumentcheckpoint och rekommenderade att skilja publicering/ålder/ras-eligibility från redaktionell relevans, användarkontext, stabil prioritet och tillåten yta.
- Critic bedömde den första matrisidén som CHANGES: `first-week` är publicerad 8–12 veckor men villkorad av nylig hemkomst; `before-homecoming` är onboarding-only draft. Alla åtta paneler ska förbli skilda resor inom v2:s sex områden. Panel 4 Alla omfattar alla aktiva rutiner, oberoende av dagsval.
- Dog Expert bedömde inventeringen som CHANGES och endast som konservativt exkluderande filter: ägarens äldre expertbekräftelse gäller v1-bundlen, inte vuxentillämpning. Recensionsmallen har reviewer-/datum-/bedömningsfält, men de individuella fälten är tomma; approval record dokumenterar Eriks bekräftelse av expertverifiering för v1. Inga beteende-/träningsobjekt får räknas som vuxenrelevanta utan dokumenterad per-versionsgranskning av målgrupp och begränsningar.
- `daily-log-routines`, `weight-history-guide` och `health-records-guide` klassas som funktionshjälp på motsvarande produktvy, inte som hundråd. `first-week` förblir valpspecifik. `handling-guide`, `environment-checklist` och `being-alone-guide` behåller valpåldersfönstren. De tre åldersöppna programmen (`handling-program`, `environment-program`, `being-alone-program`) är inte därmed vuxengodkända; ensamhetsträning har särskild återgranskningsgrind.
- De här specialistresultaten ändrar inte scope till publicering, innehållsredigering eller runtimekod. Matrisen redovisar dem som begränsningar och väntande evidens.
- Den första oberoende dokument-QA:n returnerade CHANGES utan blockerare: äldre text krävde ett nytt segmentgodkännande, och nästa steg pekade på en task som saknades. Mandatet har synkats i workflow och QA/Reviewer/Security-rollfiler; köposterna delas nu upp i namngivna Panel 4-checkpoints. De tidigare fynden om nytt valpinnehåll, Panel 4-definitionen och inaktuellt kontrollbevis är också åtgärdade.
- För v1.8/child-plan v3: oberoende dokument-QA **PASS**; Architect **APPROVE**; Critic **PROCEED**; efter att reviewerfyndet om beständig evidens rättats gav oberoende Reviewer **PASS**. JSON, `dev_flow validate`, nio TOML-filer, relevanta Markdown-länkar (31/31) och `git diff --check` passerade. Paketet ändrar endast lokala styrdokument/kö och innehåller ingen runtime-, databas- eller GitHub-ändring. Se den sammanslagna posten i [MASTER-LOG](../../decisions/MASTER-LOG.md).
