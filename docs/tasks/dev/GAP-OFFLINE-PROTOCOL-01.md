# GAP-OFFLINE-PROTOCOL-01

Status: checkpoint; isolerad modell verifierad, integration återstår. Bas `d122622645eefb3f4c44ce488afea7105624d878` med lokala GAP-checkpoints. Mål: pröva ett säkert köprotokoll med syntetiska data som förberedelse för den beställda offlinekön. Detta är ingen aktiverad funktion eller lagringsadapter. En skrivägare; oberoende Security, QA och Reviewer. Risk H: modellens regler påverkar framtida persondata och återförsök.

Skrivvägar: `src/features/puppy-log/offline-queue-model.ts`, `tests/offline-queue-model.test.mjs`, `src/features/puppy-log/README.md` och detta kontrakt. Ingen integration i UI/lagring/nät, schema, dependency eller aktivering. Gällande uppgiftsmandat och säkerhetsutredning: `docs/plans/GAP-SNABBLOGG-OFFLINE-2026-11-11.md`.

Krav: oföränderliga intents med ägar- och hundscope, stabilt event-ID, minimal payload och strikt validering. Begränsad kapacitet är en explicit inparameter, inte antagen lagringskapacitet. Avvisa korrupt/okänd version, främmande scope och ID-konflikt utan att kasta bort data. FIFO och en aktiv lease; `queued` har aldrig sänts, `attempting` är persistad skickavsikt, `unknown`/`rejected` spärrar automatisk replay. Endast `queued` kan avbrytas. Efter omstart betraktas `attempting` som `unknown`. Saknad eller avvikande rad efter osäkert utfall får aldrig automatiskt leda till ny insert. Endast exakt matchad bekräftelse får ge förslag om avköning; inget permanent borttagande eller success påstås före verifierad lagringsbekräftelse. Inga effekter som skickar innan verifierad persistad `attempting`; stale scope/generation/revision/lease får inte ändra aktuell kö. Ett misslyckat lagringssteg bevarar intent och tillåter inte sändning.

Acceptans: rena beteendetester för samtliga övergångar, krasch/återstart, felaktiga/sena ack, köfullhet, ID-kollision, scopebyte, match/saknad/avvikelse, sekventiella konkurrrerande försök och invariant att send kräver korrekt persistensack. Testerna bevisar protokollogik, inte faktisk native lagring, kryptering, server, RLS, radering eller en fungerande offlinekö. Kör riktade tester och `pnpm check`, oberoende Security/QA/review och dokumentera återstående integrationssteg.

## Experiment och integrationsvillkor

Modellen är isolerad och oaktiverad. Den föreslår en ny snapshot och utfärdar endast en simulerad effekt efter matchande ack, bas, scope och revision. Vid ny sessionsgeneration måste rebind godkännas för samma ägare/hund; `attempting` blir `unknown`. Exakt matchning kräver komplett serverrad och jämför mikrosekunder. Identiska stale ack med samma gamla bas kan åter ge `send`: den rena funktionen kan inte avgöra om adaptern anger aktuell bas sanningsenligt. Innan aktivering krävs autentiserad rebind, serialiserad atomisk CAS och engångsdispatch i den faktiska adaptern, återläst persistensack, riktiga adapter-/krasch-/feltester samt verifierat serverkvitto och RLS. Ingen faktisk lagring, kryptering, native, nätverk eller radering har verifierats av detta experiment.

## Checkpoint

Den rena modellen och nio syntetiska beteendetester är implementerade inom deklarerade skrivvägar. `pnpm check` PASS: typecheck, edge-typecheck och lint samt 952 tester (951 PASS, 1 skipped). `git diff --check` PASS. Oberoende QA rapporterade 9/9 och Reviewer meddelade att tidigare UUID-blockerare är löst; Security APPROVE gäller endast den oaktiverade modellen. Inga appkopplingar eller externa sidoeffekter har lagts till.

Nästa steg är att specificera och prova en faktisk adapter och dess verifierbara atomiska lagrings-/rebind-/engångsdispatchkontrakt samt server/RLS och livscykel för utloggning och radering. Den rena modellen och dess tester bevisar inte dessa delar, och den befintliga appen har fortfarande ingen offlinekö.
