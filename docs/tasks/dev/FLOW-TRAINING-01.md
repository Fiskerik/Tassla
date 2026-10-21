# FLOW-TRAINING-01 — Träning till återupptagen progress

Plan v2 — 2026-10-21. Status: lokal kod-/QA-/reviewcheckpoint stängd; separata slutacceptanser öppna.

## Mandat och spårbarhet

MVP rev02 är godkänd plan. Panel 6:s användarresa är att hitta ett publicerat träningsprogram, öppna rätt version och steg, bekräfta/ångra progress och kunna fortsätta efter flikbyte (`docs/mvp.md` §4.4 och panel 6; `docs/MVP-EXPERIENCE-CONTRACT.md`, panel 6). Användaren har bett att leverera en komplett resa i taget.

Den äldre kötexten om att ett separat **Fortsättkort och Hem** ska visa samma progress är oförenlig med det senare ägarbeslutet som beställde träningsredesignen. `docs/plans/UI-TRAINING-OVERVIEW-01-ux-spec.md` v3 säger uttryckligen att patchen tog bort panelens Fortsättkort och ersatte det med `Nästa övning` och statusordnade program. `docs/decisions/MASTER-LOG.md` och `docs/design/evidence/ui-training-overview-2026-10-18/VERIFICATION.md` bekräftar att detta är en avgränsad kompositionsavvikelse, inte full visuell acceptans av panel 6.

Dagens produktkoppling använder samma `training`-snapshot i `PublishedTrainingScreen` och Hem. Men urvalet av nästa program är inte gemensamt: Träning använder `pickNextExercise(sortPrograms(...))`, medan Hem i `src/features/home/ProductWorkspace.tsx` tar första råa programmet med en ofärdig övning. `fetchPublishedContentVersions` saknar uttrycklig ordning och `fetchTrainingWorkspace` bevarar källordningen. Om ett opåbörjat program ligger före ett pågående program kan Hem därför visa ett annat nästa steg. Detta är en konkret regressionshypotes som ska reproduceras med en ordningsfixtur; minsta produktionsfix är att återanvända Träningens befintliga `pickNextExercise`-regel. Hemmets synliga träningsyta är `För dig idag`; det finns inget separat Home-fortsättkort.

## Mål och avgränsning

Verifiera den befintliga, ägarbeställda resan: Träning visar nästa tillåtna publicerade steg; en bekräftad markering flyttar nästa steg; Hem visar den nya nästa-stegetexten från samma hunds bekräftade program/progress; efter Hem → annan huvudflik → Träning återkommer samma progress och tillåtna steg. Bekräfta också att de borttagna filtren inte renderas.

Detta är en lokal syntetisk integrations-/regressionscheckpoint med en möjlig enradig produktionsfix i Home-selektorn. Ingen datamodell-, API-, persistence-, route-, policy-, dependency- eller produktdesignändring ingår. Ingen full panel 6-visuell acceptans hävdas. Live Supabase/RLS, verkligt publicerat innehåll, native/VoiceOver/Dynamic Type och release är separata statusar.

Eriks beslut 2026-10-21 gäller alla framtida MVP-checkpoints: systematisk tillgänglighetsanpassning och dess 140 %/skärmläsar-/stor-textmatris görs först efter att MVP:n är släppt och godkänd. Denna task råkade redan innehålla sådana skärmbilder i QA; de behålls som informativ historik, inte som framtida eller slutlig acceptansgrind. Funktionella kontroller och normal visuell regression gäller fortfarande.

## Deluppgifter

1. **Korrigera kökontraktet före kod.** Peka köposten på denna plan v2. Ersätt det inaktuella Fortsättkort-kravet med de existerande `Nästa övning`-/Home-ytorna, lägg till konkret ordningsregression och bildbevis och behåll panelens fulla slutacceptans öppen.
2. **Samordna urvalet och regressionsskyddet.** Ändra bara `ProductWorkspace` så Hem väljer nästa steg med `pickNextExercise`, samma befintliga regel som Träning. Lägg till en regression med ett opåbörjat program före ett pågående program och ett test av Home/Training-kopplingen. Ingen ny selector eller gemensam komponent behövs.
3. **Verifiera hela lokala resan.** Återanvänd `tools/visual-check/app.tsx` och riktiga Home-/Training-presentationskomponenter. Lägg till en syntetisk public-resa med bekräftad markering, Home → annan huvudflik → Träning, bekräftad avmarkering och ny flikresa. Hemmets nästa steg ska matcha Träning efter varje ändring. Review-fixture verifierar synlig markering/innehåll och frånvaro av de borttagna filtren; review-progress över unmount/flikresa påstås inte eftersom den uttryckligen är lokal för den visningen. Spara public/review-bilder.
4. **Stäng lokal checkpoint.** Kör riktade test, full `pnpm check`, public/review-build och browserflöde. Spara screenshots vid 375×844 och verifieringsmatris med avvikelsen mot panel 6 och alla NOT TESTABLE-gränser. Oberoende QA och Reviewer granskar fryst diff innan kön stängs.

## Acceptans

- Endast nästa övning i samma statusprioriterade programordning öppnas på Hem och Träning, även när ett nytt program ligger först i källordningen.
- Bekräftad markering och avmarkering ändrar nästa steg; Hem och Träning visar samma steg efter varje ändring och efter flikresa. Ingen framgång visas före bekräftad callback.
- `Mina`, `Rekommenderat` och `Alla` visas inte i den godkända redesignen.
- Hemmets träningskort visar samma nästa tillåtna steg efter bekräftad progress; ett Home → annan huvudflik → Träning-varv behåller samma bekräftade program/progress och nästa steg.
- Public-fixture passerar full browserresa för bekräftad markering/avmarkering och flikbyte; review-fixture visar korrekt reviewcopy utan produktionsdataanspråk. Screenshots visar träningsvy före/efter och Hem efter bekräftad ändring. Alla fixtures är tydligt syntetiska.
- Relevanta funktionella/visuella delar av §14 bedöms för den ändrade resan. §14.15:s breda tillgänglighetsmatris är uppskjuten enligt ägarbeslutet. §14.16 och panelnivåns visuella likhet anges som ej godkända/ej tillämpliga inom detta undantag; ingen full rev02-panelacceptans hävdas.
- `pnpm check`, riktat test, public/review-builds, browserverifiering, `git diff --check` och kövalidering passerar. Faktisk branch, bas-commit, bundle-hash och lokalt diff-checkpoint dokumenteras.

## Exakta skrivvägar

- `src/features/home/ProductWorkspace.tsx`
- `tests/training-overview.test.mjs`
- `tests/training-tab-roundtrip.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-training-flow.py`
- `tools/visual-check/README.md`
- `docs/tasks/dev/FLOW-TRAINING-01.md`
- `docs/design/evidence/flow-training-2026-10-21/VERIFICATION.md`
- `docs/design/evidence/flow-training-2026-10-21/public/`
- `docs/design/evidence/flow-training-2026-10-21/review/`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`

Skyddat: övriga `src/features/**`, `src/data/**`, `docs/mvp.md`, `docs/MVP-EXPERIENCE-CONTRACT.md`, `docs/design/vision-rev02-screen-contracts.md`, `docs/plans/UI-TRAINING-OVERVIEW-01-ux-spec.md`, schema/SQL, live data och releaseprocess.

## Risk, roller och öppna bevisgränser

Risk M enligt befintlig köklass; användarresan och träningsprogress verifieras. Architect **APPROVE** och Critic **PROCEED** för exakt plan v2, 2026-10-21. Relevanta skills: `.agents/skills/tassla-consumer-ux/SKILL.md` och `.agents/skills/mobile-ios-design/SKILL.md`; `docs/design-rules.md` gäller visuell bedömning. Implementer får endast skriva angivna filer. Oberoende QA och Reviewer krävs. Security behövs inte om granskningen bekräftar att ingen auth-, data-, lagrings- eller nätverksgräns ändras.

Förväntade kvarstående statusar: live Supabase/RLS och verklig publicering NOT TESTABLE; nativeenhet NOT TESTABLE; bred VoiceOver/TalkBack, Dynamic Type och 140 %-granskning uppskjuten ur MVP-scope; full panel 6-visuell acceptans NOT ACCEPTED enligt ägarbeslutet; ingen signerad build eller release.

## Utfall — 2026-10-21

Home återanvänder nu `pickNextExercise` från Träning. Regressionen placerar ett opåbörjat program före ett pågående. Oberoende QA **PASS** och Reviewer **PASS** efter en administrativ kömetadata-rättning. Reviewerns första CHANGES gällde enbart inaktuella `next_step`, `implementation_state` och `evidence_status`; efter korrigeringen verifierades dessa fält och inga kod-/evidensfynd återstod.

Verifieringen och relevant §14-bedömning finns i [`VERIFICATION.md`](../../design/evidence/flow-training-2026-10-21/VERIFICATION.md) med public/review-skärmbilder. Lokal public-resa passerade 13/13, review 5/5, `pnpm check` 65/65, riktade träningsfiler PASS, public/review-builds PASS, Python-/diff-/kövalidering PASS. 140 %-skärmbilderna är arkiverade som informativa prov och utgör inte en MVP-grind.

Checkpointen identifieras av branch `codex/dog-profile-search-pilot`, bas-HEAD `a57e17388d380800c6c378b6368babe6877b4f1c` och den dokumenterade sexfils-snapshot-hashen i evidensrapporten. Ingen separat commit/push skapades. Live Supabase/RLS och verkligt innehåll är NOT TESTABLE; funktionell native/telefonverifiering är NOT TESTABLE; systematisk VoiceOver/TalkBack-, Dynamic Type- och 140 %-granskning är uppskjuten efter MVP-release/godkännande; full panel 6-visuell acceptans är NOT ACCEPTED; signerad build/release är inte skapad. Detta stänger endast lokal träning-/Home-checkpoint, inte hela MVP-panelens acceptans.
