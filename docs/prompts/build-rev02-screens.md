# Codex-instruktion — bygg Tasslas skärmar enligt vision_rev02

Läs `AGENTS.md`, aktuell uppgiftskö/checkpoint och `docs/dev/workflow.md`. Läs därefter `docs/design-rules.md`, UX-skillen och **`docs/design/vision-rev02-screen-contracts.md`**. För Hem läses dessutom `docs/plans/HOME-REV02-visual-ux-spec.md` och `docs/prompts/build-home-rev02.md`.

Öppna rätt panel i `vision_rev02.jpg` och den nuvarande produktvyn. Bygg mot panelens färgfördelning, bildspråk, typografi, komponentformer och innehållstäthet. En befintlig komponent med fel form eller monokrom presentation ska få en namngiven opt-in variant. Funktionella tester eller historisk QA ersätter inte jämförelsen mot visionen.

Arbeta en avslutningsbar vy/resa åt gången enligt paketordningen. Börja med den första ofärdiga godkända delen i checkpointen, inte med att bygga alla åtta samtidigt. Skriv exakt plan: användaruppgift, panel, skillnader, skrivfiler, verkliga API:er, data, bilder, interaktioner, tillstånd och acceptans. Följ projektets plan-/specialistgranskningar och återanvänd befintligt ägarmandat utan en ny rutinfråga om samma scope.

För den valda vyn:

1. Skriv jämförelsematrisen referenselement → nuvarande skillnad → token/komponent/asset → korrigering → acceptans. Inventera faktisk källkod; dokumenterade förslag är inte färdiga importer.
2. Implementera de minsta gemensamma token-/komponentvarianterna som vyn behöver. Bild-över-text, segmentkontroll, chip, kompakt lista och tonat destinationskort ska följa respektive panel. Visa dem i galleriet med rätt tillstånd.
3. Koppla samma presentation till befintliga produktobjekt och isolerad syntetisk referensfixture. Bevara datum/scope, versionsbundna källor, sparåterkoppling och radering. Flytta administration till tydlig fördjupning utan att förlora åtkomst.
4. Ta fram bildmanifest med källa/generation, rättigheter, roll och beskärning. Saknat personligt foto ger dokumenterad fallback; det godkänner inte fotografisk likhet. Inga inbakade skärmbilder som UI.
5. Implementera endast meningsfulla kontroller: inga falska sökrutor, filter, veckomål, durationsvärden eller diagram. Redovisa faktiskt saknade produktkontrakt. Ett sådant beroende blockerar berörd funktion, inte oberoende färg-/komponentarbete inom mandatet.
6. Rendera faktisk vy vid kontraktets storlekar/tillstånd. Granska och rätta komposition, färger, typografi, former, bilder och täthet separat. Bevara stora tryckytor, tillgänglig text och naturlig scroll.
7. Kör relevanta beteendekontroller och projektets obligatoriska checks. Separat QA/Reviewer granskar slutlig render och §14. Uppdatera guide, checkpoint och kända avvikelser; lämna en fungerande del innan nästa vy påbörjas.

Bevara Loggs synliga primära snabbval och ett-trycksregistrering enligt panel 5-kontraktet. Framsteg och Insikter får synlig tillbaka-knapp som dokumenterad navigationsavvikelse.

Skydda orelaterade skärmar från globala defaultbyten. Bilden godkänner inte ny data-/fotoinsamling, migrationskörning, nya dependencies, externa integrationer eller publicering. Redan godkänt R02-2-kontrakt gäller: ägarmarkerad rutin och sparad träningsprogress; guideöppning, vårdplan och olänkad logg räknas inte som completion.

Slutrapporten anger vad som faktiskt ändrats, visar referens och render, listar kvarstående visuella skillnader och skiljer på kod, syntetisk interaktion, verklig datakoppling och miljöaktivering. Ingen vy kallas visuellt klar med saknade bilder eller blockerande form-/färgfel. Commit/push redovisas separat och följer aktuellt mandat och projektets hookar.
