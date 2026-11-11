# KNOWLEDGE-READ-CHECKLIST-01 — publicerad läschecklista

Status done · bas `04718d30d0c1b193339bb4db068f692e2c159a89` plus DAILY-RING-MOTION-01 (checkpointhash `8316d76865bb69a8bc1120d54fa8a8a6f16812b7b8222c03b900e1a0a5067b51`, sedermera commit `9eeea4e2ea166e56a23add813e9e6126dc140916`). Risk L/M · root ensam writer. Steg3 i MVP-COMPLETION-261031.

Publicerat läsbart `checklist`-innehåll, inklusive den befintliga Trygghet i nya miljöer-versionen, ska synas och gå att söka/läsa i Kunskapsbiblioteket. Märk kortet Checklista, behåll rekommendationsflagga, kropp, källor, AI-markering och exakt versionsidentitet; gör inte texten till interaktiv hundchecklista. Kontrollera att utanför åldersintervallet fortfarande läsbart men ej rekommenderat. Endast existerande publicerade runtime-rader; inga draftar, nya råd, publicering eller dataskrivningar. Uppdatera sök-/bibliotekstext till samlande korrekt benämning.

Skrivvägar: `src/features/knowledge/KnowledgeScreen.tsx`, `src/features/knowledge/README.md`, `tests/knowledge-search-screen.test.mjs`, `tests/article-delivery.test.mjs`, `tests/knowledge-training-empty-feedback.test.mjs`, `tools/visual-check/app.tsx`, `tools/visual-check/verify-drive-articles.py`, `tools/visual-check/verify-vision-r02-home-panels.py`, `tools/visual-check/verify-know02.py`, `tools/visual-check/verify-knowledge-read-checklist.py`, `docs/design/evidence/knowledge-read-checklist-01/`, `docs/tasks/dev/KNOWLEDGE-READ-CHECKLIST-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md`.

Acceptans: titel- och punktlistasökning, exakt läsare med alla fem punkter/källor/AI-status, tillbaka med bibehållen sökning; 17–26 veckor rekommendation vs annan ålder fullständigt bibliotek, training/FAQ ej inläst som artikel, inga draftfallbacks. Befintliga artiklar och interaktiva faschecklistor oförändrade. 375/430 och 140 % syntetiska skärmbilder med panel7-jämförelse; UX-/UIcritic, Critic, QA, Reviewer, `pnpm check`, iOS JS-export och diff/scope. Live-publicering/RLS/native är separata NT.

Arkitekt readonly: befintlig fetchKnowledgeContent returnerar redan publicerade checklistor med versions-/källmetadata och rekommendationsflagga, åldern styr endast rekommendation. Läsaren kan redan återge befintlig punktlista; enbart katalogfiltret exkluderar checklistor.

Plan v6: även befintliga tester och browserprover som uttryckligen förutsätter artikelspecifik biblioteksrubrik får uppdateras till samlande, sanningsenlig rubrik; övriga kontrakt bevaras.

Plan v6: tre befintliga visuella regressionstester använder också gamla tillbakaetiketten och ingår för byte av just denna väljare: tools/visual-check/verify.py, verify-ui-r02-04.py, verify-ui-copy-cleanup.py. Ingen annan ändring i dessa prover.

Plan v6: befintligt artikelprov antog tidigare 0,70–0,80 för små bildramar men aktuell komponent och dess befintliga enhetstest kräver 16:9 (0,5625). Korrigera enbart den inaktuella bildproportionen samt tabbens faktiska tillgänglighetsroll i samma verifierare; inga produktändringar utöver v3.

Plan v6: FAQ-regressionen antog äldre numrerade källors hjälpmedelsetikett. Uppdatera dess väljare till det befintliga, ägarbeställda `Öppna källa: [titel] · RSPCA`-kontraktet; behåll antal och 44 pt-kontroller. Ingen produktändring.

## Checkpoint 2026-11-04
Den tidigare ringcheckpointen är nu commit `9eeea4e` med obligatorisk hook. Arkitekt readonly bekräftade hämtning av publicerade versioner; Critic PROCEED v6 och UIcritic BRIEF/REVIEW på öppnade bilder. Implementering och README inom deklarerade paths, QA:s oberoende targeted tester och RNWeb PASS. Sanningsenliga biblioteksetiketter, exakt checklistversion och fem punkter/källor/AI-status visas utan bockar. 140 %-provet skalar även nyrenderade läsare och verifierar faktisk textstorlek. Artikel- och profilregressionen PASS 12 scenarier efter att gamla väljare anpassats till verifierad layout; separata know02 reviewflöden PASS. Slutlig `pnpm check` 908 PASS/1 skip och public iOS JS-export PASS efter registrets återkomst; faktisk livepublicering/RLS/native inte verifierad.

Plan v6: samma äldre artikelregression öppnar registreringens datumfält utan att först expandera befintliga Fler uppgifter. Uppdatera provet med det faktiska användartrycket och bevara fält-/rensa-/könsassertions. Ingen onboarding- eller datakod ändras.

Oberoende Reviewer APPROVE v6 efter faktisk kontroll av publiceringsfilter, identitet, åldersgränser, sökretur och tester. Commit föregås av aktiverad Git-hook och scopekontroll.
