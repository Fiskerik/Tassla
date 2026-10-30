# UI-SOURCE-PUBLISHER-01 — korta utgivarlänkar

Status done, planv1, riskL, bas81cbfc1 påfix/mvp-build-feedback, root ensam skrivägare.

Senaste uttryckliga ägarinstruktion: visa endast Avsab etc, inte hela titeln. Det ersätter titellabeln från föregående färdiga UI-task. Visa utgivare vid exakt känt värdnamn; säkra okända värdar får ärligt värdnamn. Full granskad titel finns kvar i tillgängligt länknamn. Befintliga URL,44pt-mål, svepskydd, fel och frånvaro av successmeddelande bevaras. Ingen backend, innehålls-/sparändring eller publicering.

Scope: liten delad labelfunktion vid source-links med exakt värdmappning, återanvänd i ContentSources. Ingen metadatahämtning. UI Critic BRIEF har öppnat förebilden och rekommenderar detta inom samma yta. Underliggande arkitektur från UI-MVP-BUILD-FEEDBACK-01 v2 återanvänds. Ingen ny arkitektur, auth eller persondatabehandling.

Acceptans: 375px efterbild visar Avsab/RSPCA/Dogs Trust i stället för sidtitlar; fulla hjälpmedelsnamn och länkmål kvarstår. Befintligt test för källsäkerhet kompletteras med värdspoof/okänd/unsafe-fallback; visuellt skript visar kort label och samma öppnings-/felbeteende. Kör riktade kontroller, fullcheck/hooks, UICriticREVIEW och oberoende Reviewer. Nativegräns oförändrad.

Skrivvägar:
- `src/features/knowledge/ContentSources.tsx`
- `src/features/knowledge/source-links.ts`
- `src/features/knowledge/README.md`
- `src/features/training/README.md`
- `tests/content-delivery.test.mjs`
- `docs/design-rules.md`
- `tools/visual-check/verify-mvp-build-feedback.py`
- `docs/design/evidence/ui-source-publisher-01`
- `docs/tasks/dev/UI-SOURCE-PUBLISHER-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`
- `docs/decisions/MASTER-LOG.md`

Nästa: planreview, sedan etikettändring och en ny jämförbar källbild.

Checkpoint: UI Critic PROCEED planv1 och finalREVIEW utan visuella blockerare efter öppnad375×844bild. Endast delad källetikett ändrades; exact-hostmappning gör kända utgivare korta utan att dölja annan värd. Befintligt innehåll och URL/sparstatus oförändrade. Riktat test13/13, source-only RNWebPASS med full hjälpmedelstitel/44px/exaktURL/fel/okändguard, full pnpmcheck101/101 och diff/pathauditPASS. README/designregel uppdaterade enligt senaste beslut, inga nya dependencies. Screenshot/resultat i docs/design/evidence/ui-source-publisher-01. Native/livegräns oförändrad. Oberoende Frozen Reviewer PASS utan fynd: granskade fullcheck, diff/pathaudit, värdspoofskydd, hjälpmedelstitlar och bildbevis.

Nästa: commit, sedan separat endpointkoppling swift-api/bright-task. Föregående UI-checkpoint81cbfc1, buildkonfiguration601f17d.
