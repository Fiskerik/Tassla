# Release-log – DS-CODE-01

Datum: 2026-10-07  
Paket-ID: DS-CODE-01  
Status: BLOCK – kod QA/reviewer PASS; visuell QA NOT TESTABLE  
Jämförelsebas: commit `85cf5dcde1f1bb3d4282353a1edf8fdcc8608e1e`; GitHub Release saknas.  
Leveranscommit: Okänd  
TestFlight-version/build: Okänd

## Major changes

Implementerat: kodbaserade designtokens, 18 delade komponentfamiljer med tillstånd, central kategoriikonmappning samt ett utvecklingsgalleri bakom befintlig dubbel previewport. Befintliga produktskärmar och produktionsnavigation är oförändrade.

## Minor changes

Implementerat: lintgrind som ger fel för nya UI-filers lokala hex/numeriska fontSize och varningar för motsvarande legacyfynd i app/feature-TSX. Guider och policytester är uppdaterade.

## Bug-fixes

Utvecklingsmiljön saknade det redan låsta `expo-notifications` i `node_modules`; exakt version 57.0.21 återställdes med frusen lockfile utan package-/lockfileändring innan slutkontroll.

## Verifiering och kända begränsningar

Architect APPROVE plan v4 och Critic-villkoren är tillämpade. Oberoende QA kod-PASS. `pnpm check` PASS: typecheck, edge-typecheck, lint utan fel och 355/355 tester. Fokuserat UI/preview 8/8 PASS. Lint redovisar 238 befintliga varningar: 62 hårdkodade hex och 176 numeriska fontSize i 18 featurefiler; de är inte rättade i detta paket. `git diff --check` PASS.

Reviewer BLOCK: `Button.fullWidth` exponerar en oanvänd möjlighet för icke-ikonknappar att bryta fullbreddskontraktet. Korrigeringsplan v4.1 tar bort denna prop och omverifierar. Visuell QA är fortsatt NOT TESTABLE: ingen Android-enhet/emulator, iOS-simulator eller installerad webbruntime finns. Ingen skärmdump har fabricerats och paketet är inte visuellt godkänt. Display aliasar Title och avmaskningens `medical-outline` är öppna designbeslut. HeroCard använder dokumenterad overlayapproximation, inte äkta gradient.

## Nästa sprint/paket

Kodsliden har förnyad QA- och reviewer-PASS efter Button-korrigering v4.1: fokuserat 9/9, `pnpm check` 356/356, iOS-export och diffkontroll PASS. Total leverans är ändå BLOCK enligt designpolicyn. Kör verklig gallerirendering på liten/stor bredd och stor text, spara skärmdumpar, utför oberoende visuell QA och låt reviewer omgranska innan status DONE. Separata framtida slices migrerar befintliga skärmar; ingen sådan migration ingår här.
