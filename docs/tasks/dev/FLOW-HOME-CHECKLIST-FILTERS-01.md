# FLOW-HOME-CHECKLIST-FILTERS-01 — status och granskningsunderlag

Datum: 2026-10-22
Status: A03 och panel-4-granskningen är klara enligt Eriks ägaruppdatering 2026-10-22: ikonmigrationen är migrerad, extern QA godkänd och manuella iOS-tester passerade. Uppgiften stängs på ägarrapport; ingen ny live DB- eller enhetskontroll gjordes i denna session. A04:s separata sparåterhämtning följer eget QA-/Reviewer-spår.

## Omfattning

Planen täcker Checklistans Idag, Denna vecka, Alla och Kommande; sparad dagsaktivitet inklusive uttryckligen överhoppade rutiner; read-only projektion av kommande återkommande rutiner och planerad hälsa; exakta historiska träningskällor; källnavigation och retur; samt fullständiga laddnings-, tom-, partial- och fellägen. Den bindande UX-/dataplanen är [plan v2](../../plans/FLOW-HOME-CHECKLIST-FILTERS-01-ux-spec.md).

## Källfynd och reviewutfall

- Befintlig dagsladdare förbereder aktuell dag via `ensure_due_daily_routine_days`; den ska inte användas för historiska eller framtida datum. Historiska dagar får endast komma från sparade dagsrader eller sparade skip-snapshots. Befintlig FK-cascade raderar dessa när rutinmallen tas bort, så historiken lovar inte arkiv för borttagna rutiner.
- `dog_daily_routine_day_skips` är en separat ägarvald status som dagens källa redan läser. V2 tar med den i avgränsade historikläsningar som en statisk **Överhoppad** rutinrad, utanför completion-progress.
- Rutinregler projiceras med befintlig `isRoutineDueOnDate`; framtida förekomster är presentationer och märks Planerad.
- `fetchTrainingWorkspace` väljer åldersrelevanta/resumable versioner och räcker inte för alla sparade historiska urval. V2 kräver exakt publicerad `program_version_id`/`step_id`-resolver och hundscope:ad progressläsning; olöst källa eller ofullständig progress blir Delvis hämtad.
- Befintlig `fetchPlannedHealth` väljer fler fält än listan behöver och är en begränsad sida. V2 kräver en ny minimal hund-/datumavgränsad, paginerad read-only-läsare.
- Product-beslut i v2: visa ägarregistrerade hälsoplaner i Kommande eftersom detta är den godkända panel-4-resan och befintlig data; ingen ny användning eller write tillkommer. Security behöver bekräfta v2:s exakta query/RLS-implementation före kod.
- Filtret ägs av `ProductWorkspace` för retur från källa; v2 definierar abort/generation, keyset-paginering, known-mutation-invalidation och 2×2-segmentacceptans vid 375×667/140 %.

Första Architect/Critic/Security-review gav CHANGES/CHANGES/APPROVE WITH CONDITIONS och ledde till v2. Slutlig v2-review: Product APPROVE för hälsoplaner read-only inom panel 4; Architect APPROVE; Critic PROCEED; Security APPROVE. Live Supabase RLS är inte verifierad i denna statiska review. `git diff --check` och `python -X utf8 tools/dev_flow.py validate` passerar; inga appfiler har ändrats.

## Slutlig review v2

- Product — APPROVE: planerade, ägarregistrerade hälsoplaner visas read-only inom den tidigare godkända MVP-panel 4; ingen ny datanvändning.
- Architect — APPROVE: befintlig SDK/SQL/RLS-/recurrence-/route-gräns håller; exact published training source, paginering och livstidskydd ryms i listade paths.
- Critic — PROCEED: filterbegränsning/copy, skip/Planerad-status, segmentstorlek, destinations- och tillståndsresor är tillräckligt specificerade.
- Security — APPROVE för planens statiska kontrakt; befintlig dog-membership RLS används och inga nya writes/RPC/migrationer planeras. Live Supabase/deployerad RLS är fortsatt NOT TESTABLE.

## Implementation checkpoint 1 — data och datummodell, 2026-10-20

Implementerat lokalt inom godkända paths:

- `checklistFilterRange` räknar ISO-måndag–söndag, exakt rullande 30 kalenderdatum och Kommande från imorgon till och med sju dagar framåt, med UTC-kalenderaritmetik över datumnycklar för att undvika lokal DST-förskjutning.
- `projectUpcomingRoutineDates` använder den befintliga `isRoutineDueOnDate` för uttryckliga återfallsregler och returnerar endast presentationsdatum; ingen förekomstrad eller RPC skapas.
- `fetchDailyActivityRangeSnapshot` är en separat read-only-läsare för sparade rutin-dagar, skip-snapshots, träningsurval och (endast när anropare ber om det) aktuella rutinmallar. Varje hämtad källa pagineras med keyset, hundfilter, datumgränser för historikrader och validering. Föräldraabort avbryter läsningen; andra källfel rapporteras per källa så att en anropare kan visa partial i stället för komplett/tomt. Källor som inte efterfrågats räknas inte som lästa.
- `deriveSavedRangeActivities` härleder enbart frysta dags-/skip-snapshots och exakt matchade urval; den gör ingen historisk backfill. Exakt träningskälla krävs för en träningsrad; olösta urval utelämnas från aktivitetsmodellen och rapporteras separat av källslaget. Skip-rader är statiskt märkta som skip i modellen och completion blir inte sant.
- `fetchPlannedHealthChecklistRange` läser endast `id,dog_id,event_type,due_on` inom hundens exakta datumintervall och keyset-paginerar med abortskydd.
- `fetchExactHistoricalTrainingSources` slår upp endast sparat versions-/stegpar, endast publicerad version, och exakt hund/version/steg-progress. Listfrågan hämtar bara publicerings-/titelmetadata och stegtitel, inte body/instruktion; detaljtext ska hämtas först när detaljvyn öppnas. Olösta/avpublicerade källor returneras uttryckligen som olösta; transport- och progressfel kastas så anroparen kan visa partial/error.

Riktade tester: `tests/daily-activity-range.test.mjs` provar sidbyte och cursor för sparade rutindagar, hund-/datumparametrar, frånvaro av RPC, partiellt källfel, pre-abort, exakt publicerad träning + hundprogress och minimal paginerad health range. `tests/daily-activity-model.test.mjs` provar ISO-/nyårsgräns, 30-dagarsgräns, sju framtida dagar, skottår, återfallsankare, varannan-vecka/veckodagar, månadsslut och exakt historikmodell. Fokuserad körning efter korrigering: 13/13 PASS. `pnpm check` (typecheck, edge typecheck, lint och full testsvit), `git diff --check` och `python -X utf8 tools/dev_flow.py validate` PASS. Live Supabase/RLS är NOT TESTABLE.

Detta stänger endast läs-/modellskivan, inte tasken. Ingen UI eller route har kopplats in; inga appskärmar ändras av checkpointen. Exakt kvar: filtret måste ägas av `ProductWorkspace`; filterbyte/route/account/dog/timezone/day invalidation och generationskontroller måste abortera stale reads; checklistan behöver fungerande responsiva 2×2 filter, loading/empty/partial/error/retry och datumgrupper; health/routine/exact-training destinationer måste öppnas och återställa filter/grupp/scroll; rutinhändelser i Kommande måste dölja dagsåtgärder; historisk träning ska vara skrivskyddad och hämta detaljtext först när den öppnas; queue-integrerad visuell evidens och §14 samt UI-/lifecycle-/navigationstester saknas. Native VoiceOver/Dynamic Type, live RLS, TestFlight och renderad 375/430/375×667/140 %-evidens är NOT TESTABLE i denna skiva.

Ägaren stoppade först arbetet och har därefter uttryckligen bett att fortsätta enligt den godkända plan v2. Riktningen och scope bekräftas därmed återanvända; ingen ny produktfunktion eller datanvändning läggs till. Tasken är fortsatt ofärdig.

Git-checkpoint: `41adec0` (`wip: checkpoint checklist filter data model`) är pushad och mergad i main via PR #22 (`2967a3f`). Återstående implementation sker på `codex/tassla-home-checklist-filters-2026-10-21`.

## Merge-återställning — checkpoint, 2026-10-22

- Den tidigare UI-/workspace-anslutningen finns i `c562bdf` före merge-commit `824ab20`. Konfliktlösningen för panel 2/3 tog bort filterprops, historiska lästillstånd och range-dataanslutningen ur `DailyChecklistScreen`/`ProductWorkspace`, trots att modell- och datalagret låg kvar. Det är samma saknade symboler och props som Codemagic rapporterade i Check application.
- Återställt segmenten Idag, Denna vecka och Alla, anslutningen till den hund-/dags-/kontoscope:ade historikläsningen, tydliga loading/partial/error/empty-tillstånd, återförsök och datumgrupperade skrivskyddade historikrader. Historiska rader får ingen dagens progress.
- Panel 1:s ändrade beteende är bevarat: Hem öppnar Checklistor via pilen; redigering sker genom långtryck på rutinraden. Den gemensamma `DailyActivityItem`-komponenten finns kvar för dagens interaktiva rader.
- Denna återställning gör inte den fullständiga plan v2-resan klar. `Kommande` exponeras ännu inte i segmenten; framtida plan-/rutinlänkar, full källretur, route/lifecycle-tester samt public/review-§14-acceptans återstår. Tasken står därför kvar som `implementing`.
- Verifiering: `pnpm check` PASS (TypeScript, edge-TypeScript, ESLint och 64/64 tester); `pnpm bundle:ios` PASS (1 458 moduler); riktad Playwright-render för Idag/Denna vecka/Alla och range loading/partial/error/empty PASS utan browserfel; `git diff --check` och `python -X utf8 tools/dev_flow.py validate` PASS.
- NOT TESTABLE: live Supabase/RLS, native VoiceOver/Dynamic Type/gestures och TestFlight.

## A02 — återinför rutinpunkternas ikonval, lokal implementation verifierad (2026-10-22)

Erik frågade efter ikonvalet som fanns i gårdagens Checklistarbete och bad tidigare att återinföra den försvunna checklistfunktionen. Fynd: den omergrade `origin/codex/dog-profile-search-pilot` innehåller en färdig, separat ikon/detail-amendment med ikonväljare och migrationskälla. Det materialet fördes inte in i aktuell `main`; konflikten lämnade därför filterresan kvar men utan rutinpunkternas ikonfält och väljare. Den branchens appkod och bilder återanvänds inte som implementation eller visuell auktoritet.

Erik bekräftar att manuella tester 1–4 i senaste bygget gick igenom. De testerna och den tidigare återställda filterresan ändras inte av A02. Den aktuella rev02-kontraktslinjen är att Hem förblir kompakt medan Checklista visar en varierad ikon per rutinpunkt.

A02 återför enbart användarvalbar ikon per rutinpunkt: ikon-only grid i rutinens befintliga skapa-/redigeraflöde; visning i Checklista och stabilt läsvisningsfallback för äldre punkter; dagens long-press öppnar rätt punkt i samma rutinredigerare. Vanlig radöppning, checkbox, historik, skip, träning och hälsa förblir separata. Valet följer befintlig owner-scoped create/replace RPC, CAS/revision, retry/readback och frysta dags-/skip-snapshots. En ny framåtriktad migration behöver tillåta endast optional `icon` i befintlig checklist-JSON; migrationen får inte köras i detta arbete.

Konkret plan och skrivvägar finns i [A02 plan amendment](../../plans/FLOW-HOME-CHECKLIST-FILTERS-01-ux-spec.md#implementation-addendum-a02--valbara-ikoner-för-rutinpunkter-2026-10-22). Live Supabase/migration, RLS och native är separat NOT TESTABLE.

Architect granskade A02 v1 och gav **CHANGES**: migrationen ska stå som enda uttryckliga undantag från skyddade migrationsfiler och vara transaktionell; rollout kräver separat apply/runtime-verifiering eftersom en gammal validator avvisar ikonpayloads. Planen synkades; Architect gav därefter **APPROVE A02 v2** 2026-10-22. Critic v2 gav **PROCEED WITH CHANGES** och krävde att fallbacken inte blir en vilseledande slumpikon; Security v2 gav **CLEAR** och noterade att äldre klienter avvisar ikondata vid läsning och kan skriva över metadata.

Architect granskade A02 v3 och gav **CHANGES**: definiera fallbackens exakta textmappning och synka plan/task/kö. Vidare kontroll visade att “inga gamla samtidiga redigerare” inte räcker eftersom gamla appbyggen även avvisar icon-bärande data vid läsning. A02 v4 har en explicit svensk tokenkarta, neutral fallback vid noll eller motstridiga kategorier samt krav på att gamla klienter inte kan läsa sådant innehåll innan produktionsskrivningar tillåts. Architect v4 gav **APPROVE**, Critic v4 **PROCEED** och Security v4 **CLEAR** med utrullningsvillkor. Ingen migration eller databasåtgärd har körts.

### A02 implementation checkpoint — 2026-10-22

- Ikonvalet finns i rutinens skapa-/redigerflöde och Checklista visar vald ikon eller entydig legacy-fallback. Long-press fokuserar rätt rutinpunkt och öppnar radiogriden; Hem förblir utan punktikoner. Ändrad rutinmall sparas genom befintlig owner-scoped RPC-kontrakt; dagsnapshot/completion lämnas fryst.
- De två efterfrågade rutinhandlingarna är ikon-only och har olika bekräftelsecopy. Browserkontrollen verifierar avbryt och bekräfta för båda.
- V5:s ämnesfärg använder endast befintliga kategori-token för tydliga matchningar (`water`, `walk`, `sleep`, `food`, `vaccination`, `veterinary`, `training`). Övriga ikoner och neutral `list-outline` är dämpade utan kategoribakning. Valram och bock är separata från färgen. Lägsta uppmätta kontrast i den renderade ikonvisningen är 4,97:1.
- Public och review-render PASS i 375×844, 430×844 och 375×667. Ikonval/readback, 20 tillgängligt namngivna alternativ, 44×44-träffytor och inga browserfel verifierade. Evidens: [verifieringsrapport](../../design/evidence/flow-home-checklist-filters-2026-10-20/a02/VERIFICATION.md), [public](../../design/evidence/flow-home-checklist-filters-2026-10-20/a02/public/) och [review](../../design/evidence/flow-home-checklist-filters-2026-10-20/a02/review/).
- `pnpm check` PASS (65/65); offentlig `pnpm bundle:ios` PASS (1 460 moduler); `git diff --check`, `python -X utf8 tools/dev_flow.py validate`, exakt SQL/TypeScript-allowlist och installerade Ionicons-glyphs PASS.
- Ingen migration eller DB-operation körd. Äldre klienter avvisar icon-payloads; verkligt create/replace/readback och RLS kräver separat godkänd development-runtime-verifiering. Produktionsskrivning är spärrad tills gamla klienter inte kan läsa sådana checklistor eller separat granskad kompatibilitet verifierats. Native gestures/VoiceOver/Dynamic Type och TestFlight är NOT TESTABLE.
- Skärmens text `Kontrollera den föregående ändringen` är en generell osäker spar-/readbackstatus. Den visar inte i sig att en tabell saknas. A02-migrationen ändrar validatorn för JSON i den befintliga rutinkällan; den skapar ingen tabell. Om just ikonpayload skickades mot gammal validator kan den avvisas, men den exakta orsaken kräver backendens felkod/logg och verifierad migrationsstatus.
- Erik rapporterar manuella testerna 1–4 som PASS i senaste bygget. De hålls stängda.

V4-reviewens visuella blockering är historik och löstes i A02 v5. Architect **APPROVE** och Critic **PROCEED** godkände den reviderade tokenplanen; efter implementation gav oberoende QA **PASS** och frozen Reviewer **PASS**. Båda rutinhandlingarna använder nu varsin ikonknapp och visar först bekräftelsetext när användaren trycker. Kompakta handlingar och varierade, diskreta checklistikoner finns i [A02-verifieringen](../../design/evidence/flow-home-checklist-filters-2026-10-20/a02/VERIFICATION.md).

Detta stänger endast A02:s lokala ikon-/handlingsslice. Hela panel-4-tasken förblir `implementing`; Kommande, källnavigation/retur och full §14-acceptans återstår. Native Alert-utseende, live Supabase/RLS, migrationsapply, äldre klienters runtime, VoiceOver/Dynamic Type och TestFlight är inte verifierade. Ingen migration eller databasoperation kördes. Eriks manuella tester 1–4 är fortsatt PASS och återöppnas inte.

## A03 — Kommande och källnavigation, lokal implementation verifierad (2026-10-22)

- Fyra fungerande filter visas i två rader vid 375 och 430 pt. Vald status, 44 pt-mål, inga checkboxar eller progress i historik/Kommande samt korrekt tomt, laddande, partiellt och felaktigt Kommande-läge verifieras.
- Kommande projicerar endast befintliga återkommande rutiner och minimalt lästa ägarplaner för hälsa. Raderna är `Planerad`, skrivskyddade och saknar completion/progress. Planerad rutin öppnar fokuserad rutinhantering utan dagens Lägg till/Ta bort-handlingar.
- Hälsoresa öppnar den valda planen direkt i första vyn och återgår till Kommande med filter/scroll bevarade. Historiskt träningssteg öppnas exakt och skrivskyddat och återgår till Alla med scrollpositionen bevarad.
- Ny dedikerad verifierare: `tools/visual-check/verify-checklist-filters.py`; produktionsskärmarna renderas genom `tools/visual-check/vision-r02-home-panels-app.tsx`. Syntetisk review ger 19/19 och public ger 10/10 kontroller. Resultat och bilder: [A03-verifiering](../../design/evidence/flow-home-checklist-filters-2026-10-20/a03/VERIFICATION.md).
- `pnpm check` PASS (app-/edge-TypeScript, ESLint; 642 passerade, 1 skip av 643 testfall); offentlig `pnpm bundle:ios` PASS (1 460 moduler); `git diff --check` och `python -X utf8 tools/dev_flow.py validate` PASS. Eriks manuella tester 1–4 är redan bekräftade och kördes inte om.
- A03-renders är syntetisk React Native Web. De bevisar inte live Supabase/RLS, applicerad A02-migration, äldre klienters läsbeteende, native VoiceOver/Dynamic Type/gest eller TestFlight. 140 % text är ett CSS-layoutprov.
- En separat bred Home-review-kontroll visade en befintlig 4 pt-överlappning mellan destinationskorten och bottenmenyn i review-fixturens initialvy; public Home-fixturen passerade. Den ändrades inte i denna panel-4-uppgift och behöver en egen Home-korrigering.
- Vid den frysta lokala checkpointen saknades extern QA/Reviewer-evidens i arbetskatalogen; A02:s tidigare oberoende godkännanden gällde bara ikon- och rutinhandlingsslicen. Eriks senare ägaruppdatering nedan stänger A03.

### Ägarönskemål om checklistor i Kunskap

Erik vill att checklistor i Kunskap och Hem ska kännas och fungera på samma eller liknande sätt. Beslut för fortsatt UX: återanvänd ikonfamilj, radvisuell grammatik och tydliga bekräftelsemönster där de passar, men behåll deras olika innebörd. Hemrutiner är ägarens återanvändbara/återkommande rutiner; Kunskap visar publicerade fasuppgifter och ägarens egna punkter i en viss fas. Kunskapsflödet är därför inte omgjort i A03. Där finns inget explicit ikonfält på egna punkter; beständig ikonväljare där behöver ett separat granskat datakontrakt/migrationssteg, inte en gissning om en saknad tabell. Detta är en dokumenterad uppföljning, inte implementerad funktion.

Vid checkpointen återstod extern QA och full panel-4-§14-avslutning. Erik bekräftade senare att A03-granskningen är klar. HOME-ROUTINE-CHECKLIST-RUNTIME-VERIFY-01 är en separat verifiering och har inte körts i denna session. Ikon-/radgrammatiken i Kunskap fortsätter under FLOW-KNOWLEDGE-01.

A03 checkpointcommit `25bde34` (`feat: add upcoming checklist filters and source routes`) är pushad till `origin/2026-10-22-checklist-kommande-navigation`.

## A04 — återhämtning av rutinändringar, 2026-10-22

Erik rapporterade att rutinens text/checklista och punktikoner inte gick att ändra och spara efter sin databasändring; redigeraren blev låst med en generell status. Kodspåret visade att `runDailyMutation` sparade både definitivt `failed` och osäkert `unknown` som en pending retry. Managerbladet låser formuläret när felstatus och retry finns, vilket gjorde att ett definitivt avslag krävde samma oförändrade försök i stället för rättning. Detta bevisar inte att live-tabell, RLS eller migration saknas; dessa är inte tillgängliga för verifiering här.

Plan [A04 save recovery v7](../../plans/FLOW-HOME-CHECKLIST-FILTERS-01-save-recovery-v7.md) fick Architect **APPROVE**, Critic **PROCEED**, Security **PASS** och oberoende A04 QA **PASS**. A03 ligger kvar fryst vid `25bde34`; Erik har sedan bekräftat extern QA och slutförande. Denna sparåterhämtning har eget kö-id `HOME-ROUTINE-SAVE-RECOVERY-01`.

Implementerat lokalt:

- Definitivt avslag rensar pending-retry och visar `Ändringen sparades inte. Försök igen.` Utkastets etikett, punktordning och ikonval behålls, redigeraren låses upp och endast ett nytt uttryckligt knapptryck skickar nästa mutation.
- Osäkert utfall behåller exakt samma operation och befintlig retry/readback. Andra mutationer är fortsatt spärrade tills det osäkra utfallet är avstämt.
- CAS-konflikt för rutinersättning blir en egen status. Readback validerar både exakt `dog_id` och rutin-id innan raden visas. Utkastet blir skrivskyddat och ändras först när ägaren trycker `Ersätt utkastet med senaste versionen`; nästa redigering använder då den nya revisionen.
- Inga tabeller, migrationer, RPC:er, grants, RLS-regler eller dataändamål har ändrats. Ingen databasoperation har körts.

Riktade tester: `daily-activity-data.test.mjs` **11/11 PASS**, `daily-activity-ui.test.mjs` **12/12 PASS**. Full `pnpm check` **PASS** (65 testfiler), iOS-export **PASS**, `git diff --check` och `python -X utf8 tools/dev_flow.py validate` **PASS**. Syntetisk RN Web-verifiering passerade **9/9 public och 9/9 review**: failed vid 375/430 px, unknown/exakt retry vid 375 px, conflict/read-only/uttrycklig ersättning vid 375/430 px samt ny sparning mot senaste syntetiska revision. Se [A04-verifiering](../design/evidence/flow-home-checklist-filters-2026-10-20/a04/VERIFICATION.md).

Ingen schemaändring, migration, RPC, grant, RLS-ändring eller databasoperation ingår i A04. Erik rapporterar att ikondatabasens migration är applicerad och att manuella iOS-tester passerade; backendorsaken till det tidigare misslyckade sparandet har inte härledts från live loggar. A03:s QA/§14-grind stängdes efter ägaruppdateringen. Home-reviewns 4 px syntetiska överlappning är separat och utanför A04.

Panel 7 fortsätter separat enligt godkända [FLOW-KNOWLEDGE-01 v3](../../plans/FLOW-KNOWLEDGE-01-ux-spec-v3.md). Den använder tre nya ämnesspecifika guidebilder. Lokal rendering och paketkontroller har passerat, men full panel-7-acceptans är fortfarande öppen. Den äldre `FLOW-PANELS-6-7-IMAGE-DIVERSITY`-checkpointen hålls separat.


### Ägaruppdatering — A03 och panel 4, 2026-10-22

Erik bekräftar att `202610220001_daily_routine_checklist_icons.sql` är migrerad, att A03 är granskad av extern QA och klar samt att de manuella iOS-testerna passerade. Köposten stängs enligt ägarens rapport. Denna session verifierade inte själv den live databasen, migrationshistoriken eller enheten; de lokala A03-resultaten från den frysta checkpointen behålls som tidigare evidens.
