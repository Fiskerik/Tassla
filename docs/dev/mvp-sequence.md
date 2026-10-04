# Föreslagen ordning för MVP-utveckling

Detta är ett arbetsförslag, inte ett godkänt appsegment eller en detaljerad implementationplan. Erik har godkänt MVP och kärnstack 2026-10-04. Övriga Discovery-grindar och konkreta segmentplaner hanteras enligt AGENTS.md. Arkitekturförslag: docs/Architecture.md.

1. Fastställ MVP, stack och första segmentets mandat. Lös särskilt notifieringar, offline, innehållsredigering och driftsbudget. Ange konkreta acceptanskriterier.
2. Tech Lead föreslår en liten arkitekturskiss: app, backend, innehåll, dataflöden och förtroendegränser. Beskriv huvudobjekt och åtkomstregler, inte alla framtida tabeller eller filer. Critic granskar; Compliance/Security granskar relevanta datafrågor. Erik beslutar.
3. Planera första fungerande användarflödet, exempelvis konto → hundprofil → relevant startsida. Den exakta skärningen måste rymmas i godkänd MVP. Dela i numrerade uppgifter med beroenden, filansvar, kontroller och README/guide. Architect granskar varje plan före kod.
4. Skapa minsta tekniska grund: appstart, navigation, miljökonfiguration och automatiska kontroller. Sätt upp Codemagic/TestFlight-kedjan tidigt för att fånga byggproblem; uppladdning/publicering kräver separat mandat och tillgänglig signering. Lägg till kort startguide. Inga nya dependencies utan godkännande.
5. Bygg första flödet genom alla lager: nödvändiga databasmigrationer och åtkomstregler, dataåtkomst, skärm, relevanta tester och dokumentation. Använd syntetiska data. Testa att andra användares data inte är åtkomliga och att verkliga API-anrop finns och fungerar. Skapa tabeller/filer först när detta flöde behöver dem.
6. QA verifierar; Reviewer granskar inklusive påhittade API:er, onödig komplexitet och dokumentation. Security/Compliance används där det krävs. Spara checkpoint och rätta blockerare innan nästa beroende del.
7. Upprepa med nästa godkända användarflöde tills de sex MVP-ytorna i övre delen av vision_rev01.jpg är täckta: Hem, Valplogg, Träning, Hälsa, Kunskap och enkelt Tassla-pass enligt docs/mvp.md. Ta nödvändigt innehåll/data innan beroende vyer, och PDF efter fastställt exporturval. Datamodellen växer via granskade migrationer; bygg inte hela framtida backend först. Fyll inte tomma filer en i taget utan användarvärde. Nedre treårsvisionen ingår inte.
8. Inför pilot: verifiera hela resan på fysisk iPhone, innehållsgranskning, tillämpliga juridiska krav, dataradering, åtkomstskydd, felhantering och återställning. Erik godkänner pilot/distribution efter dokumenterade kontroller.

En aktiv deluppgift som standard, högst två med separata skrivområden. Efter varje del sparas verkliga resultat, kvarstående frågor och exakt nästa steg. Ingen nattlig scheduler eller automatisk återstart är aktiverad.

## SDK och Codex
SDK-rollerna i tassla_team/ är idag rådgivande utan verktyg för kodändringar eller testkörning. Codex-rollerna i .codex/agents/ används för faktisk implementation och oberoende granskning under Erik. SDK kan utökas med kontrollerade utvecklarverktyg senare, men det kräver separat körmiljö, åtkomstkontroll, testning, budget och granskningsflöde. Rekommendationen för MVP är att behålla denna fördelning och undvika att bygga en andra utvecklingsplattform nu.
