# UI- och kodregler för Tassla

Ägarens krav, registrerade 2026-10-04. Reglerna styr kommande godkända implementationer; aktuell färgpalett och visuell acceptans preciseras i `docs/design-rules.md`. Denna guide väljer inte stack eller nya dependencies.

## Visuell riktning
- Aktuell visuell målreferens: `vision_rev02.jpg` i projektroten, enligt Eriks beställning av uppdaterat designregelverk 2026-10-13. Följ `docs/design-rules.md`, `docs/design/vision-rev02-screen-contracts.md` och de länkade objekt-/Hem-kontrakten för layout, komponenter, innehåll och QA. Skilj befintlig funktion från föreslagna produktobjekt; bilden är inte källa till verkliga räknetal, råd eller automatiskt godkännande av nya datainsamlingar. Rev01 är historik.
- Undvik utseendet från generiska Tailwind-/Bootstrap-teman eller färdiga standardteman. Detta är ett designkrav, inte ett generellt förbud mot stylingverktyg.
- Följ vision_rev02:s färgfördelning och typografi enligt designreglernas §2–4. Hem använder varm bakgrund, blå/grön/lila destinationsytor och gul tipsaccent enligt `docs/plans/HOME-REV02-visual-ux-spec.md`. Implementera namngivna tokens och komponentvarianter; befintliga standardkomponenter får inte styra bort från målbilden. Färg får inte vara enda informationsbäraren. Visuell acceptans följer designreglernas §14, med separat bedömning efter verklig datakoppling.
- Använd korta, ändamålsenliga övergångar mellan skärmar och målstyrd rörelse som svar på handlingar eller bekräftade tillstånd. Loopande dekorativ rörelse är förbjuden. Knappar ska ge omedelbar, tillfredsställande tryckrespons med tydligt pressed-/loading-/disabled-tillstånd. Rörelse får inte fördröja handlingen eller utge osparade uppgifter för att vara sparade.
- Custom CSS-animationer används för webbytor när CSS är tillämpligt. Mobilappen använder valt ramverks plattformsanpassade animationer och navigation. Lägg inte till CSS eller nya animationsbibliotek av slentrian.
- I appen används React Natives inbyggda `Animated`; inga rörelsedependencies eller haptikpaket läggs till utan separat beslut. Centralisera 120–350 ms durations i `tokens.motion`, avbryt vid ny ändring, respektera `useReducedMotion`, animera inte initial rendering och låt aldrig rörelse vara enda feedbackkanal. Se `docs/design-rules.md` §15–17.
- Respektera reducerad rörelse, stor text, skärmläsare, kontrast och prestanda. Testa tryckrespons och övergångar på fysisk telefon inför pilot.

## Kod och dokumentation
- Modulära funktioner med ett tydligt ansvar. Dela när olika ansvar blandas, inte enbart för att skapa fler filer eller abstraktioner.
- Följ vedertagna moderna konventioner för vald teknik och projektets formattering/lint. Namngivning ska vara konsekvent och beskriva ansvar, beteende och data.
- Kontrollera ändrade externa API:er och mönster i aktuell officiell dokumentation för den installerade versionen. Dokumentation för en nyare version är inte bevis på att API:t finns lokalt. Versionsuppgradering kräver eget godkännande där det behövs.
- Tydliga namn först, korta kommentarer om icke uppenbara skäl. En kort README/guide förklarar varje funktion/modul enligt arbetsflödet.

## Efter varje större koddel
Gör städningen inom samma godkända deluppgift före QA och Reviewer, även vid återupptagning efter avbrott:
1. Läs den ändrade koden som en ny utvecklare. Förenkla flöden, separera blandade ansvar och enhetliggör namn där det behövs.
2. Leta efter onödig funktionalitet, död kod, oanvända importer/variabler/filer, dubblering och inaktuella kommentarer. Kontrollera även dynamiska referenser, navigation, konfiguration och externa kontrakt innan något tas bort. Sökresultat ensamt bevisar inte att en fil är oanvänd.
3. Bevara godkänt beteende och håll dig inom tilldelade filer. Större arkitektur-/scopeändring återgår till planering och granskning.
4. Uppdatera guide och kör relevanta kontroller efter sista ändringen. Spara vad som förenklats/tas bort, verifiering och kvarstående osäkerheter i checkpoint. Om koden redan är enkel: dokumentera genomförd kontroll utan konstgjord refaktorering.

Reviewer kontrollerar dessa regler på den slutliga diffen. QA verifierar beteende och relevanta UI-tillstånd; oanvänd kod får inte döljas genom att bara stänga av kontroller.

## Bilder och ikoner — Eriks genomförandekrav 2026-10-06
Varje paket har en UI-designcheckpunkt: använd passande bilder/illustrationer och ikoner där de hjälper förståelse och gör upplevelsen trevlig. Återanvänd Tasslas befintliga dog-welcome/dog-resting och Ionicons samt theme tokens där de passar; nya bilder ska vara lämpliga och ha spårbar källa/generation. Lugn hierarki, tydliga kort/status, textetiketter till handlingar, skärmläsarfallback, stor text, reducerad rörelse och laddningsprestanda. Undvik att dekor döljer formulär eller sparstatus. Kontroller får inte bara kommunicera med ikon/färg. Ingår i cleanup/QA/review, inte ett separat kosmetiskt slutprojekt.

## Bindande designpolicy — Eriks beslut 2026-10-07
Läs docs/design-rules.md före planering, implementation och granskning av UI. Använd originalets målbild, gemensamma tokens/komponenter och 18-punktschecklista: max en huvudknapp, kompakt information, tydlig navigation, enhetliga ikoner och inga tekniska banners eller statusetiketter på normala poster. Product ansvarar för UX-copy; Critic granskar begriplighet. Varje UI-task ska ange användaruppgift, huvudhandling, synlig information, fördjupning, målbild/avvikelser och visuell verifiering. Separat QA/Reviewer jämför renderade skärmdumpar med målbilden; kodkontroll ensam ger inte visuellt PASS. Dokumentera NOT TESTABLE när evidens saknas och rätta konkreta regelbrott i berörd slice. Nyare designpolicy ersätter motstridiga äldre visuella råd; MVP-scope, sanningsenlighet, säkerhet och Eriks TestFlight-policy kvarstår. Befintlig UI är inte ombyggd genom instruktionerna. Nya agentstarter läser policyn; pågående agenter ska uttryckligen få den innan nästa UI-arbete.
