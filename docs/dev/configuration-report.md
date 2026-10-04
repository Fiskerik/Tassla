# Utvecklarflöde – konfigurationsrapport 2026-10-04

## Implementerat
- Codex implementer, QA och reviewer: GPT-6 Luna high. Dev-definitioner tillgängliga i .codex/agents; phase-0-spärren kvarstår för appkod.
- Tech Lead före implementation; separat QA och reviewer efter implementation; säkerhetsgranskning vid behov.
- Kön docs/tasks/dev/queue.json och verktyget tools/dev_flow.py med ordnade övergångar, beroendekontroll, max två aktiva deluppgifter och kontroll av överlappande skrivområden.
- Flöde/mandat/rapportkrav i docs/dev/workflow.md och AGENTS.md.

## Granskning och verifiering
Oberoende review hittade att alias i filsökvägar kunde kringgå ägarkontrollen. Rättat genom att avvisa absoluta sökvägar, traversal, globbar och tomma skrivområden för aktiva uppgifter. Lokala kontroller verifierade planreview före implementation, Erik-mandat, beroenden, QA/review-ordning, samtidighet och sökvägar. TOML-filer parsade och syntaxkontroll genomförd. Inga betalda modellkörningar eller riktiga implementationuppgifter utförda.

## Begränsningar / Erik
Köverktyget verifierar inte att en angiven actor verkligen är en viss människa/agent, testloggars sanning eller planversioners ändringar. Koordinatorn följer instruktionerna och sparar verkliga reviewresultat. Ingen automatisk nattlig scheduler aktiverad. SDK:s rådgivningsteam använder fortfarande sin separata modellkonfiguration; Luna-inställningen här avser faktisk Codex-utveckling.

## Nästa steg
Bekräfta första segmentets MVP-scope, stack, tillåtna dependencies, datamandat och kostnadsram. Skapa komplett kontrakt och låt Tech Lead granska innan appkod. Starta en liten övervakad körning och verifiera verklig agentladdning, verktygsbehörighet och tester innan nattarbete.
