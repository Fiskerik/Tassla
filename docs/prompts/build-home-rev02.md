# Bygginstruktion — Hem med vision_rev02:s form, färger och innehåll

Version 1.2, 2026-10-13. Uppdaterad efter Eriks jämförelse av R02-2 med målbilden och beslut om runt hundporträtt/veckoremsa. Detta är instruktion för nästa designkorrigering; den exakta v11-planreviewn och den nya visuella granskningen är separata grindar.

## Läs och inspektera

1. `AGENTS.md`, aktuell checkpoint/kö, `docs/dev/workflow.md` och `.agents/skills/tassla-consumer-ux/SKILL.md`.
2. `docs/design-rules.md` och **`docs/plans/HOME-REV02-visual-ux-spec.md`**. Det senare är konkret Hem-kontrakt för färger, mått, porträtt, rader, innehåll och interaktion.
3. `docs/design/vision-rev02-spec.md`, `docs/design/vision-rev02-objects.md`, `docs/tasks/VISION-REV02.md`. Startinventering skiljs från nuvarande R02-2-kod/QA-status.
4. Öppna panel 1 i `vision_rev02.jpg` och senaste R02-2-render, inte bara den äldre R02-1-fixturen.
5. Läs faktisk `HomeScreen.tsx`, `DailyActivityItem.tsx`, `DestinationTile.tsx`, `daily-activity-model.ts`, workspacekoppling, tokens och bildmanifest. Kontrollera befintliga API:er innan några nya importer föreslås.

## Resultat att bygga

Bygg Hem med en personlig hälsning, runt fotoestetiskt generiskt hundporträtt, levnadsveckor ovanpå porträttet, ett Just nu-kort, en kompakt dagslista och tre tydliga pastellfärgade destinationskort. Visa etiketten `Standardbild` direkt på porträttet i både public och review-läget. Ge etiketten solid varm bakning och läsbar mörk text vid standardskala; den får inte klippas. Ingen 140 %- eller stor-textgranskning krävs i MVP-checkpoints. Referensen styr komponenternas synliga form och färg, inte bara deras ordning. Nuvarande portrait asset är AI-genererad bildkonst, inte ett faktiskt fotografi eller ägarens hund; koppla inte bildens identitet till hundnamn/ras i text, alternativtext, data eller produktanspråk. Ingen personlig fotofunktion ingår.

- Veckoremsan ska ha högre lagerordning än porträttet. Låt `L`/`R` vara porträttcirkelns vänster-/högerkant och `x` markörcentrum. Zonen är `L−16 ≤ x ≤ R`; `z=(x−(L−16))/(R−(L−16))`. För icke-aktuell markör tonas endast dekorpunkten/bakgrundstvätten med opacity 0,78 för `0≤z<1/3`, 0,56 för `1/3≤z<2/3`, och 0,38 för `2/3≤z≤1`. Utanför zonen ingen fade. Veckonummer behåller full opacity och solid varm bakning; aktuell markör behåller full styrka. Tona bildbidraget bakom remsan mot varm canvas. Kontrollera att siffror och etiketter är läsbara i standardskala vid vanliga viewportar; ingen 140 %-grind.

- En enda rubrik `Dagens att göra`; räknaren och diskret chevron till hantering på samma rad, progress under.
- Manuell rutin: fyrkantig visuell checkbox inom befintlig träffyta, kort uppgiftstitel och fungerande detaljchevron. Träningsrad: en öppningshandling med fyrkantig icke-interaktiv statusindikator och begriplig synlig etikett. Ta bort kategoriikon, separat `Visa` och `Ta bort` från Hem-raderna.
- Visa stegets titel på Hem; program/vecka finns i fördjupningen. Bevara samma ID/version och källstyrda completion.
- Flytta befintlig rutin-/träningshantering till fungerande fördjupning som nås från dagsrubriken, `Visa alla` och tomt läge enligt kontraktet. Flytta även teknisk källförklaring dit. Bevara tillägg, redigering, borttagning och återhämtning.
- Inför namngivna färgtokens: varm bakgrund/kort, grön progress/status, gul tips-/solaccent, blå Logga-yta med tass, grön Träna-yta med träningshatt, lila Kunskap-yta med bok. Destinationer har egna semantiska färger och är inte kopplade till loggkategorier.
- Använd de nya kompakta typografi-/kortvarianterna och hela måttbudgeten i kontraktets §4. Ingen text-/träffytekrympning för att klara ett höjdtest. Standardfixturens fem uppgifter och tre genvägar ryms vid 375×844/430×844 med minst 16 pt ovanför menyn.
- Använd den spårbara AI-genererade generiska portrait placeholdern för fotoestetik i både public och review Home; manifest och reviewram ska säga att den är syntetisk standardbild, inte ägarens hund eller ett verkligt foto. En fallback testas separat. Personligt foto kräver separat fotostöd.

## Arbetsordning och skyddat beteende

Spara exakt plan med skrivfiler, beroenden och acceptans. Använd redan givet ägarmandat; följ erforderlig Architect/Critic-review enligt arbetsflödet. Bygg först tokens och återanvändbara komponentvarianter, sedan komposition/fördjupning och bildasset, därefter visuell kalibrering. Uppdatera berörda README och galleri.

Tänkta skrivområden: `src/theme/tokens.ts`, avgränsade varianter i `src/components/ui/`, `HomeScreen.tsx`, presentationsmappning i `daily-activity-model.ts`, nödvändiga callbacks i `ProductWorkspace.tsx`, bildmanifest/assets och `tools/visual-check/`. Ingen global omläggning av andra skärmar genom ändrade defaulttokens.

Bevara R02-2:s datakontrakt: ägarbekräftade rutiner, sparad versionsbunden träningsprogress, hela dagsmängdens räknare, datum/tidszon, scopebyte och pending/failed/unsure. Ingen ny databasmigration, fotoinsamling, automatisk dagsplan eller falsk progress för visuell effekt.

**Samma presentationskomponenter ska användas av både referensfixture och R02-2:s verkliga adapter.** En snygg separat demo godkänner inte produktvyn. Syntetisk märkning för referensrender ligger permanent i verktygsram utanför den deklarerade viewporten och följer med bildexporten. Reviewdata och skrivningar förblir isolerade. Befintligt läge med banner i appytan redovisas separat med faktisk banneryta, aldrig dolt.

## Verifiering och rapport

- Kör berörda beteendekontroller och projektets föreskrivna checks för kodändringen. Databasprov och nativeprov som inte körts redovisas separat.
- Rendera relevanta standardvyer, ändrad copy, 375×667 när den berör funktionen, fler än fem, loading, empty, error/partial och sparfel/osäkert svar. Prova checkbox, träningsresa, hantering, genvägar och funktionell återgång. 140 %/stor-textprov är valfria och inte en MVP-acceptansgrind.
- Visa referens och faktisk render sida vid sida. Granska färgytor, typografisk vikt, fyrkantiga bockar, porträttets motiv/roll, radbredd, ytor och synliga genvägar. Kontrast och geometri måste också klara kontraktet.
- Separat QA/Reviewer fyller §14 samt det preciserade Hem-kontraktets acceptans. Inget visuellt PASS från enbart geometri, godkända tester eller historisk R02-1-render.
- Rapportera kvarstående skillnader och status separat för layout, bildasset, dataflöde och databasaktivering. Ändra inte R02-2 från QA till done på grund av en dokumentuppdatering.
