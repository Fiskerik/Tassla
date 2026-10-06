# Utvecklarflöde under Erik

## Mandat
Codex huvudsession är koordinator. Erik godkänner segmentets mål, MVP-scope, stack, tillåtna dependencies, dataändamål och kostnadsram före implementation. Godkännande av detta arbetsflöde är inte godkännande av ett appsegment.

Tech Lead (`architect`) granskar varje implementationplan före kodändringar. APP-04 använde GPT-5.6 Luna medium enligt Eriks beslut 2026-10-05; APP-05 använder GPT-6 Luna medium enligt Eriks beslut 2026-10-06. Tech Lead och Security behåller sina starkare granskningsmodeller. Modeller anges i rollfiler, inte bara i en startprompt.

## Uppgiftskö
`docs/tasks/dev/queue.json` är en hållbar lokal kö. `python tools/dev_flow.py status` visar läget och `validate` kontrollerar köregler. Verktyget kör inga modeller, tester eller shellkommandon. Det är ett checkpointverktyg för Codex-koordinatorn, inte en nattlig scheduler.

Varje task innehåller: id, title, mvp_requirement (exakt sektion), plan (filreferens och version), write_paths (konkreta filer/mappar, inga globbar), acceptance, checks (faktiska kommandon), depends_on, status, history, next_step. Segmentgodkännande får bara registreras efter ett uttryckligt Erik-besked, med dess källa i segmentets planfil. APP-01 har nu mandat; delstegen A–D följs med checkpoints inom segmentet. Telefonverifiering registreras separat och kräver verkligt resultat.

## Små deluppgifter och checkpointad körning
Stora eller otydliga uppdrag får inte bli monolitiska koduppgifter. Dela dem före implementation i små, självständigt avslutningsbara vertikala delar. Varje del ska ha ett tydligt mål, avgränsat scope, berörda filer, beroenden, acceptanskriterium och konkret verifiering. Välj minsta logiska första del och redovisa vad som återstår; börja inte samtidigt på många features.

1. Koordinatorn läser kön och senaste checkpoint, väljer första ofärdiga del vars beroenden är klara. En aktiv deluppgift som standard, högst två totalt. Separerade worktrees behövs för parallella skrivare.
2. Implementer lämnar en kort plan utan appkod. Architect granskar planen och returnerar APPROVE / CHANGES / BLOCK med task-ID och planversion. Koordinatorn sparar underlaget och registrerar `planned → ready` enbart vid APPROVE. Substantiella produkt-/arkitekturplaner behöver även Critic enligt AGENTS.md. STOP kan inte kringgås.
3. Efter Erik-godkänt segment registreras `ready → implementing`. Implementer ändrar bara tilldelade filer inom godkänt mandat.
4. Implementera endast aktuell del. Den ska lämna repot i fungerande skick; sprid inte halvfärdiga ändringar över andra deluppgifter. Efter implementation gör Implementer en avgränsad läsbarhets- och städgranskning enligt docs/dev/ui-and-code-standards.md, förenklar där det behövs och kör relevanta kontroller igen efter ändringar. Spara resultat, antaganden och kontroller; `implementing → qa`. QA verifierar acceptanskriterier mot faktiska kommandon, aldrig enbart implementerns påståenden.
5. Vid QA PASS: `qa → review`. Reviewer granskar den stabila diffen; Security används vid auth/data/nätverk. Vid PASS och relevanta säkerhetsgranskningar utan blockerare: `review → done`. NOT TESTABLE är inte PASS.
6. Efter genomförd QA/review sparas en hållbar checkpoint för deluppgiften: commit när taskens mandat och repots läge medger det, annars en tydlig dokumenterad checkpoint med verifierat diff-/köstatus och exakt nästa steg. Nästa del startar först därefter. Innan en dyr fas som arkitekturändring, datamigrering eller bred implementation påbörjas ska föregående del vara färdig, verifierad och checkpointad. Vid blockerad commit/checkpoint ska orsaken dokumenteras och inget arbete låtsas vara avslutat.
7. Vid fel: `blocked`, spara problemet. Koordinatorn kan återföra till `planned` med korrigeringsplan; den granskas igen. Högst två korrigeringsförsök per problem innan frågan lämnas till Erik. Reviewer BLOCK och Critic STOP får inte överprövas av agenter.
8. Ändrad plan gör föregående godkännande ogiltigt och kräver ny planreview. Vid avbrott fortsätt från ofärdig del efter inspektion av faktisk diff; starta inte om segmentet. Håll arbetet token-/credit-medvetet: använd redan insamlad relevant kontext, undvik upprepade helrepoläsningar och breda sökningar när en riktad kontroll räcker, och gör inga orelaterade refactors.

Exempel på checkpointövergång: `python tools/dev_flow.py transition TASK-ID ready --actor architect --evidence "APPROVE för plan v1; review sparad i docs/tasks/dev/TASK-ID.md"`.

Kön kontrollerar övergångar, roller, beroenden, max två aktiva och överlappande skrivområden. Angivet actor/evidence är loggning, inte kryptografiskt bevis på oberoende granskning. Koordinatorn måste faktiskt anlita rätt agent och spara dess resultat. Kön kontrollerar inte automatiskt testresultat eller ändrade planversioner.

## Beslut under natten
Alla roller följer tillämplig EU- och svensk lagstiftning enligt AGENTS.md. Compliance är en gemensam specialist som rapporterar risker till Erik och koordinatorn, oberoende av Product/Commercial/Dev. Den används före nya eller ändrade persondataändamål, analys/spårning, AI-leverantörers dataåtkomst, juridiskt relevanta arkitekturval och före extern pilot/release. Security verifierar tekniska skydd; den ersätter inte Compliance. En väsentlig olöst juridisk fråga blockerar berörd uppgift tills Erik/jurist beslutat. Compliance behöver inte anropas för rent kosmetiska ändringar utan sådan påverkan. Spara källor, datum, tillämplighet, bedömning och öppna frågor i uppgiftens granskningsunderlag. Kön verifierar inte juridik automatiskt; koordinatorn ansvarar för denna granskningspunkt.
Tillåtet: lokala, reversibla implementationdetaljer inom kontraktet. Dokumentera skäl och antaganden. Blockerande produktfrågor, nya dependencies, kostnader, scopeändring, nya persondataändamål, datadelning och destruktiva ändringar väntar på Erik om de inte redan uttryckligen godkänts. Fortsätt endast med en oberoende godkänd uppgift. Ingen extern kommunikation, publicering eller deployment utan explicit mandat.

## Enkel kod och överlämning
Bygg minsta lösning som uppfyller det godkända behovet. Skapa inte generella ramverk, extra lager eller framtida funktioner utan ett konkret krav. Läsbara namn och små tydliga funktioner kommer först. Kodkommentarer är korta och på enkel engelska: förklara varför en oväntad lösning behövs, inte vad varje kodrad gör. Inga stora utkommenterade kodblock.

Varje implementerad funktion/modul dokumenteras i en kort README eller befintlig länkad guide: syfte, viktiga filer/startpunkter, dataflöde och ansvar, hur den körs/testas och kända begränsningar. Dokumenten i docs/ skrivs på svenska; kodkommentarer på engelska. Dokumentation ingår i samma deluppgift och uppdateras när beteendet ändras. Undvik dubblerad dokumentation och en README per liten fil. Rapporten till Erik beskriver beteende och länkar till filer; kodblock används bara när de behövs.

Reviewer kontrollerar särskilt påhittade funktioner och API:er: finns lokala definitioner och importer, stöds metod/parameter av installerad version, och gör implementationen det som namnet lovar? QA verifierar relevanta verkliga integrationer. En mock som själv uppfinner API:t räcker inte. Spara verifieringsunderlag, körda kontroller och luckor i checkpoint. Ett saknat/påhittat API eller en placeholder som utges för färdig funktion blockerar berörd leverans; osäker funktion markeras NOT TESTABLE tills den verifierats.

## Rapport och stopp
Efter varje deluppgift: förändrade filer, verkliga kontroller/resultat, plan/reviewreferenser, beslut, antaganden, nästa steg. Vid avslut: implementerat, verifierat, blockerat, behöver Erik. Rapport sparas i docs/tasks/dev/rapport.md. Inga påhittade PASS eller automatiska godkännanden.

Nattkörning är inte schemalagd ännu. En aktiv Codex-session behöver körmiljö och åtkomst; användningsgränser kan avbryta den. Checkpoints gör återupptagning enklare, men garanterar inte att pågående osparat arbete återställs. Börja med ett litet övervakat segment.
