# TRAINING-PROGRAM-IMAGES-01 — konsekvent bild per programversion

Status planned · plan v2 · bas `7435502` · risk M · root ensam writer. MVP-COMPLETION-261031 steg3. Inga nya bilder, råd, dataskrivningar eller publicering.

Rekommendation väljer nu foto via listposition, medan program och steg alltid får samma foto. Använd en explicit, granskad mapping för kända `content_id:version` från befintliga innehållsartefakter; okänd identitet eller version får en fast generisk fallback. Steg ärver programmets bild. Samma fokus och bild används i rekommendationskort, programbanner och övningsmodal; corgi-fortsättningen på Hem och Träning berörs inte. Ingen titel/index/hash styr semantik. Hundens ansikte ska vara synligt även i låga banners.

Skrivvägar: `assets/images/README.md`, `src/features/training/training-program-image.ts`, `src/features/training/PublishedTrainingScreen.tsx`, `src/features/training/README.md`, `tests/training-program-image.test.mjs`, `tests/training-screen-policy.test.mjs`, `tools/visual-check/app.tsx`, `tools/visual-check/verify-training-program-images.py`, `docs/design/evidence/training-program-images-01/`, `docs/tasks/dev/TRAINING-PROGRAM-IMAGES-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md`.

Acceptans: fyra kända identity-versioner, test av omordning/titel/fallback och samma bild över program/steg; 375/430, låga banners och stor text på syntetiska skärmar med faktiskt ansiktsfokus; oberoende UIcritic, QA, Reviewer; pnpm check och public iOS JS-export. Native/RLS/live och bildlicens utöver befintlig tillgång hävdas inte. Dokumentera skillnaden mellan lokala draftartefakter och verkligt publicerade versioner.

Arkitekt: handling→puppy-training, miljö→shiba, ensamhet→dog-resting, inkallning→svart/tan med separat explicit fokus; dessa är befintliga generella assets, inte personliga hundbilder. Alla fokuspunkter ska provas i faktiska vyer innan acceptans.

Critic v2 PROCEED: uppdatera assetmanifest med roller, källor, fokus och verklig granskningsstatus. Mät och granska dokumenterade ansiktsgränser i verkliga kort/banners/modaler inklusive fallback; byt fokus eller bildyta om ansikte/öron inte ryms. Lokala innehållsartefakter är inte publiceringsbevis. UIcritic BRIEF såg samtliga original och anger fokus som startvärden.

## Checkpoint 2026-11-05

Architect, Critic v2 och UIcritic BRIEF följdes; UIcritic granskade därefter samtliga rekommendationskort, programbilder och modalbilder vid 375/430 samt fallback: ansikten syns. Hanteringsvalpen är liten i miljöbilden. QA och oberoende Reviewer PASS scoped. Faktisk RNWeb-vy verifierar bildidentitet även vid omordning och fallback; måtten testas separat för kända ansiktsgränser. Dubbel programbanner i modal togs bort. `pnpm check` 917 pass/1 skip och public iOS JS-export PASS. Native, VoiceOver, live/RLS och faktisk publicering återstår. Full panel6-likhet är delvis, inte PASS. Nästa: DatePicker-beslut och dag-/scopeflöde i steg4.
