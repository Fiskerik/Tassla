# Traction P2 — läsbar struktur i träningssteg

Status: lokalt verifierad. En lokal migration för publicering finns; den är inte tillämpad i drift. Hela upplevelseplanen är inte färdigverifierad.

Befintliga publicerade instruktioner i ren text behåller sin text och sina radbrytningar. En begränsad texttolk lägger stöd för underrubriker och numrerade steg i nya instruktioner; ingen HTML exekveras. Texten visas vänsterjusterad med gröna underrubriker i träningsmodal, fokuserat steg och historiskt steg. Tidslinjens korta förhandsvisning visar innehållstext utan Markdown-markörer.

Källkod och tester: `src/features/training/training-instruction.ts`, `src/features/training/PublishedTrainingScreen.tsx`, `tests/training-instruction.test.mjs`, `tools/visual-check/app.tsx` och `tools/visual-check/verify-training-instruction.py`. Innehållsunderlag: `docs/content/recall-program-draft-v1.md`. Det saknar dokumenterad mänsklig sakkunniggranskning; rådgivande AI-assisterad dog_expert gav PASS med trygghetsavsnitt i varje steg.

Lokal RN Web-kontroll: befintlig ren text, strukturerade rubriker/listor, tidslinjens förhandsvisning och centrerad modal vid 375/430 px samt 375×667 med scroll PASS. Sexstegens synliga trygghetsavsnitt och manuell delmålsbekräftelse har verifierats med syntetiska data vid 375/430 px. `202610270001_recall_training_program.sql` lägger till den AI-märkta versionen i publicerad katalog när migrationen tillämpas. Katalog-, progression- och RLS-kontrakt har testats i tillfällig PGlite; ingen live-databas har ändrats. Native iOS, VoiceOver och TestFlight kräver separat verklig körning.
