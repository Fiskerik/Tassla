# Träning: tydlig progression, passloggning och källor

Status: done · plan v2 (Critic PROCEED, Architect APPROVE) · base `knowledge/d3-catalog-delivery@c16cd323bbf21c1e033ab7a3db4c44eecb64637c`

## Mål och mandat

Gör träningsprogress lätt att förstå, gör ett sparat bra pass till en tydlig frivillig fråga om delmålet är uppnått, och visa artikelkällor som kompakta numrerade länkar. Mandatet kommer från Eriks skärmbilder och aktuella instruktion i chatten 2026-10-27. Migrationerna för tidigare paket är enligt Erik avklarade. Ingen ny migration, datainsamling eller ändring av persistence-kontraktet ingår.

## UI-kritik före implementation

UI Critic BRIEF, read-only, 2026-10-27: (1) träningsprogrammens framsteg ska visas som bekräftade delmål av antal steg; passantal visas separat och får inte räknas som avklarade steg, (2) långa artikel-URL:er och upprepade öppna-knappar byts till tätt placerade numrerade länkar enligt Checklistor/Träning, (3) befintlig passlogg har tre textval, separat spara/avbryt och fristående delmålsblock; gör valen tydliga och sparandet en handling, erbjud därefter ägarens separata delmålsbekräftelse, (4) ta bort Pausa/Underhåll som reseåtgärder; visa återupptagning endast för pausad resa. Briefen godkänner inte utseendet.

Product Critic PROCEED v1 och Architect APPROVE v1 efter att källinventeringen omfattade Knowledge, Checklistor och träningsprogrammets källvy. Checklistor och Träning använder redan tätt grupperade numrerade länkar med 44×44 pt-träffyta, utan synliga källnamn eller URL:er; dessa lämnas därför oförändrade. Knowledge-artikeln hade fullständiga URL:er och upprepade knappar. Plan v2 lägger till syntetisk fixture och renderassertion med tre HTTPS-källor för att verifiera den nya Knowledge-renderingen utan att ändra innehåll eller sänka träffytor. Förnyad Product Critic PROCEED och Architect APPROVE 2026-10-27: lämna Checklist/Training-raderna oförändrade; 44×44 pt gäller även Knowledge.

Första rendergranskningen: UI Critic REVIEW **REVISE**. Den bad om att förtydliga vilken övning en pausad resa återupptas vid, dölja föregående toast och den äldre aktivitetssektionen under passvalet, samt visa programkortens progress i granskningsbilden. Alla fyra punkter åtgärdades. Andra UI Critic REVIEW **PASS** 2026-10-27 på uppdaterade paneljämförelser, passloggning, återupptagning och källfotnoter.

QA första granskning **REVISE**: saknade fel/okänt `record_session`-prov. Scenarierna tillades och QA slutlig granskning **PASS**. Reviewer första granskning **BLOCK**: tillagda test-/fixture-/bevisfiler saknades i `write_paths` och resultatstatusar var gamla. Alla 64 ändrade paths är nu listade; Reviewer slutlig granskning **APPROVE** 2026-10-27.

## Ingår och skrivvägar

- `src/features/training/PublishedTrainingScreen.tsx`: progress på programkort, kompakt passval/sparning, tydlig bekräftelse efter ett senaste positivt pass, inga dubbla primärknappar, ta bort paus-/underhållsåtgärder och redundanta scrollinstruktioner. Behåll separat, uttrycklig ägarbekräftelse; pass är aldrig automatiskt ett delmål. Träningsprogrammets källlänkar behåller tätt grupperade nummer och 44×44 pt-träffyta.
- `src/features/training/README.md`: förklara ny ordning.
- `src/features/knowledge/KnowledgeScreen.tsx` och `src/features/knowledge/README.md`: fullständiga källnamn/URL:er ersätts av små `1)`-länkar i fotnotrad; säkra externa länkar och tillgängliga namn bevaras. Osäkra/opaka källvärden förblir läsbara textreferenser.
- Källrenderingsinventering: Knowledge, Checklistor och träningsprogrammets detaljvy visar källor som numrerade markörer, utan råa URL:er/per-källa-knappar. Verifiera Knowledge-källantal, tillgängliga namn, säkra HTTPS och opaka textvärden; Checklistor/Träning har redan 44×44 pt-länkar och ändras inte.
- `tests/training-progression-ui.test.mjs`, `tests/training-screen-policy.test.mjs`, `tests/training-overview.test.mjs`, `tests/content-delivery.test.mjs` och `tests/knowledge-training-empty-feedback.test.mjs`: täck ny text-/renderpolicy och justera föråldrade skärmassertioner utan att ta bort säkerhets-/länkprov.
- `tools/visual-check/app.tsx` och `tools/visual-check/verify-flow-training.py`: verifiera lyckad, misslyckad och okänd passkrivning, samma operations-ID vid återförsök, feedbackval och explicit delmålsbekräftelse; uppdatera resans paus-/fortsättningskontroller.
- `tools/visual-check/vision-r02-home-panels-app.tsx` och `tools/visual-check/verify-vision-r02-home-panels.py`: lägg syntetiska källor i artikelfixturen och verifiera synliga `1)`/`2)`/`3)`, 44×44 pt-mål och att URL:erna inte skrivs ut i läsarvyn.
- `docs/tasks/dev/TRAINING-LOGGING-UX-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/tasks/dev/TRACTION-IMPLEMENTATION-CHECKPOINT.md`.
- `docs/design/evidence/training-logging-ux-01/` och uppdaterade `docs/design/evidence/training-timeline-01/`: aktuella renderbilder, verifieringsresultat och §14-underlag från samma träningsskärm.

## Ingår inte

Ingen schemaändring eller migration; inga ändringar i RPC-/workspace-API, träningens feedbacktyper eller session/milestone-lagring; inga artikeltexter eller råd; ingen ändring av historiska pausade resor utöver tydligare återupptagningscopy; ingen TestFlight-/produktionsmigration eller release.

## Acceptans

| Kriterium | Kontroll | Resultat |
|---|---|---|
| Progresskortens stapel är bekräftade delmål ÷ aktuella programssteg; passräknaren förblir separat; tomma program får ingen felaktig andel. | Skärmassertion och bild med 1/3, separat passräknare och 0-stegs fallback. | Verifierat lokalt |
| Passloggning har begriplig feedback, en sparhandling, ingen gammal toast eller legacy-aktivitetssektion i valvyn och inget redundant avbrytblock; lyckat sparande lämnar valet frivilligt åt ägaren att bekräfta delmålet; delvis/tidigt avslutat eller misslyckat pass visar ingen falsk färdighet; okänt utfall kontrollerar samma operation. | RN Web-verifiering av lyckad, misslyckad och okänd skrivning, samma operations-ID vid retry, tre feedbackval samt separat ägarbekräftelse. | Verifierat lokalt |
| Pausa och Underhåll saknas som reseknappar. En pausad resa förklarar vilken övning som återupptas, går tillbaka till samma steg och spärrar passloggning tills resan återupptagits; aktiv resa leder till aktuell övning utan extra statusknappar. | Skärmtest och verifierare för aktiv/pausad state. | Verifierat lokalt |
| Artikelkällor visas tätt som `1)`/`2)` utan rubrik, rå URL eller per-källa CTA; länkarna följer 44×44 pt-minimum, har destinationsnamn för hjälpmedel och bevarar opaka källvärden som text. Checklistor och Träning har redan numrerade källor och bevaras. | Knowledge-test och 375/430 rendering med 3 HTTPS-referenser; källlänkar, fallback och 140 %-textproxy. | Verifierat lokalt |
| Ändrade UI-ytor är läsbara vid 375/430, 375×667 och 140 % text; inga klippta val eller modal-/navigationsoverlap. | RN Web render/flow och öppnade jämförelser; UI Critic, QA och Reviewer. | PASS, PASS, APPROVE |
| Bara listade sökvägar ändras; inga migrationer/dependencies. | Diff/path-audit, `pnpm check`, `git diff --check`, queue validation. | 64 ändrade sökvägar inom scope; alla kontroller och slutliga granskningar godkända |

## Arbetsgång och verifieringsstatus

Public-fixture renderades mot panel 6 som närmaste träningsreferens; artikelvyn saknar egen panel och följer panel 7:s artikel-/fotnotsmönster.

- Träning: `tools/visual-check/verify-flow-training.py` **28/28 PASS**, inklusive 375/430, 375×667, 140 % text, fel och okänt resultat vid passloggning, retry med samma operations-ID och explicit ägarbekräftelse. Inga browserfel.
- Artikelläsare: `verify-vision-r02-home-panels.py` **15/15 PASS** vid 375/430 och 140 % text; källor `1)`–`3)`, täta 44×44-mål, säker URL-rendering och inga råa URL:er.
- `pnpm check` **PASS** (TypeScript, edge TypeScript, lint, 96/96 testfiler). UI Critic slutlig REVIEW **PASS**, QA **PASS**, Reviewer **APPROVE**. Kövalidering, `git diff --check` och 64/64 sökvägar inom godkänd scope **PASS**.
- Ingen schema-/API-/persistensändring eller migration. Live Supabase/RLS, native iOS/Android, VoiceOver/TalkBack, faktisk Dynamic Type och TestFlight är inte verifierade här. Migrationernas status är användarrapporterat klar.

Efter push är nästa steg att bygga samma branch och prova passflödet på iPhone. Migrationerna är enligt ägarens rapport avklarade; live RLS/runtime-status ska inte blandas ihop med lokal render.
