# Bygginstruktion — Tassla Hem enligt vision_rev02

Version 1.0, 2026-10-13. Kopiera instruktionen nedan till en implementationtask. Den är avsiktligt komplett med läsordning, delmål och stoppvillkor. Paketstatus/mandat kontrolleras i repot innan arbete; detta är inte ett påstående om redan godkänd teknisk plan.

---

Du arbetar i Tassla-repot. Målet är ett Hem som ligger så nära första panelen i `vision_rev02.jpg` som möjligt i komposition, komponenter, bildspråk, innehåll och fungerande användarresa.

## Läs och inspektera först

1. `AGENTS.md`, `docs/dev/workflow.md`, aktuell uppgiftskö och senaste checkpoint.
2. `docs/design-rules.md`, `.agents/skills/tassla-consumer-ux/SKILL.md`.
3. `docs/design/vision-rev02-spec.md`, `docs/design/vision-rev02-objects.md`, `docs/tasks/VISION-REV02.md`.
4. Öppna `vision_rev02.jpg`, panel 1. Öppna aktuell Hem-render från HOME-NEXT-01:s `final-correction`-evidens. Den gamla renderingen är bas, inte nytt facit.
5. Inspektera verkliga definitioner i `HomeScreen.tsx`, `ProductWorkspace.tsx`, `home-today.ts`, `main-navigation.ts`, `src/components/ui/`, `src/theme/tokens.ts` och relevanta dataläsare. Föreslagna API:er i dokumenten är inte befintliga imports.

## Första avslutningsbara del: R02-1

Ta fram en exakt implementationplan för en Hem-referens och nödvändiga gemensamma komponentvarianter. Använd redan tillgängliga publicerade källor i produktionsläget och explicit märkta syntetiska dagsuppgifter i befintligt granskningsläge. Inga reviewskrivningar får nå produktionsadaptrar. Rapportera produktionens saknade dagsfunktion som kvarstående beroende.

Förslagna skrivområden att precisera till faktiska filer i planen:

- `src/components/ui/`: namngivna kort-/flik-/knapp-/rads-/destinationsvarianter och galleriexempel.
- `src/theme/tokens.ts`: gemensamma mått/format som faktiskt behövs.
- `src/features/home/HomeScreen.tsx`: H1–H4-komposition och typade presentationsprops.
- `src/features/home/ProductWorkspace.tsx`: enbart nödvändig adapterkoppling/scopehantering.
- `tools/visual-check/app.tsx`, `build.cjs`, `verify.py`: explicit mode, täta och långa fixtures, jämförbar rendering.
- Berörda README, specifika QA-tester och evidensvägar med separat ägarskap.

Skydda befintlig loggsparning, träningens versionsprogress, hälsoplaner/historik, FAQ/checklistsparning, auth och radering. Om en sådan del måste ändras, beskriv den exakta ändringen och granska den berörda planen. Återanvänd ägarmandat där det redan finns. Följ Architect/Critic före implementation, QA och separat Reviewer efteråt.

## Komposition att bygga

- Personlig hälsning, namn/ålder och porträtt med verklig foto-/illustrationsroll.
- Levnadsveckor direkt under hälsningen. Ingen carousel före remsan.
- Ett Just nu-kort med publicerad relevant ingress och fungerande läsdestination.
- Dagens att göra med sammanhållen lista, progress och upp till fem synliga rader när dagskontraktet är tillgängligt. Full räknare omfattar hela mängden; fler rader nås genom Visa alla.
- Tre tonade jämställda destinationskort: Logga, Träna, Kunskap. Använd destinationssymboler, inte godtyckliga eventkategorier.
- Femfliksmeny Hem/Logg/Träning/Kunskap/Mer med korrekt safe area.

Ingen ny extra Hem-appbar från rev01. Inga individuella stora kort för varje dagsrad. Bildens fasta namn, råd och 2/5 får inte kopieras som produktionsfakta.

## Komponent- och objektregler

Utveckla gemensamma komponentvarianter före skärmlokala speciallösningar. Migrera berörda konsumenter uttryckligen; ett globalt defaultbyte får inte förändra alla andra skärmar av misstag. Varje ny variant har ett tydligt galleri-exempel och relevanta tillstånd.

Håll läsningar/skrivningar i workspace/dataadaptrar. Loading, error, ready-empty och partial är skilda. Scope är ägare/kontogeneration/hund; dagsberäkning uppdateras vid resume/midnatt. Foto-, aktivitet- och innehållsdata från tidigare scope får inte återkomma genom sena svar.

Den första referensdelen kan visa verklig interaktion med syntetiska dagsobjekt i isolerat review-state. Skriv inte en ny tabell eller importera påhittade daily-API:er för att få det att se produktionsklart ut. Ny dagspersistens är nästa vertikala del med exakt produkt-/datakontrakt.

## Nästa del: R02-2 med verkliga aktiviteter

Efter R02-1:s sparade checkpoint konkretiseras de rekommenderade produktvalen i objektkontraktet: urval, stabil identitet, datum/tidszon, källa, manuell/källstyrd markering, borttagning/ångra och progressmängd. Oavgjorda detaljval tas upp med Erik endast om de faktiskt behövs för berörd funktion.

Architect granskar schema/API och Security åtkomst/radering. Därefter kopplas ett helt flöde: välja dagsaktivitet → spara → visa → markera via rätt källa → återläsa efter appstart → samma count i Hem och lista → ångra. Behåll befintlig tränings-/faschecklistprogress som auktoritativa källor. Inga dubbla completion-flaggor och ingen falsk progress vid okänt sparresultat.

Fortsätt sedan enligt paketordningen för övriga skärmar. Ett godkänt granskningsläge räknas inte som färdig produktionskoppling.

## Verifiering och slutrapport

- `pnpm check`, `git diff --check` och `python tools/dev_flow.py validate` för implementationstasken.
- Relevant iOS-bundle vid produktkodändring enligt taskplan; kontrollera publicflaggan.
- Använd `tools/visual-check/README.md` för befintliga build-/serve-kommandon. Bygg public och review separat, kör Home-scopet mot rätt bygge och spara resultaten i taskens evidenskatalog. Gammal verifierare kan behöva uppdateras för nya kontrakt; sänk inte acceptansen för att få PASS.
- Standardskrift vid 375×844/430×844: hela genvägskort minst 16pt över menyytan i specificerad normalfixture. 375×667, lång text och 140 %: naturlig scroll, full nåbarhet, inget horisontellt överflöde.
- Jämför verkliga renderbilder med panel 1 sida vid sida. Bedöm porträttstorlek, åldersremsa, ytor, radhöjd, bildandel, typografi, ikoner och innehåll, inte bara geometri.
- Prova tomt/fel/loading/partial, dubbeltryck, retry/unsure, konto-/hundbyte, dagsbyte, reviewgräns, navigering och relevant ångra. Tester ska kontrollera beteende, inte bara matcha källkodstext.
- Separat QA/Reviewer fyller regelverkets §14 och listar avvikelser med beslut. Inga visuella PASS från enbart typkontroll.

Rapportera: vad som finns i kod, vad som fungerar endast med fixtures, vad som är verifierat mot verkliga data, återstående beslut och exakt nästa del. Visa renderbild och länka evidens. Commit/push/deployment följer aktuellt uttryckligt mandat, inte denna prompt.
