# Raskatalog — visuell och funktionell kontroll (§14)

Datum: 2026-10-18<br>
Fixture: produktionens SearchableBreedPicker i isolerad visningsfixture samt ProfileScreen/EditDogProfileScreen med syntetisk katalog. Ingen profil skrivs till Supabase.<br>
Lägen: public och review RN Web. Viewports 375×844, 430×844, 375×667; textproxy 140 % vid 375×844. Reducerad rörelse är aktiverad i browserkontrollen.<br>
Automatisk evidence: browser-results.json och PNG-bilder i mapparna public/ och review/.

## Bedömning 1–18

1. **Ja.** Profilformuläret har en rasåtgärd; valet görs i en modal med tydlig stängning.
2. **Ja.** Rasraderna delar höjd, form, färg och markerad vald-state.
3. **Ej tillämpligt.** Inget raderas i rasväljaren.
4. **Ej tillämpligt.** Detta är inte Hem eller en dagsrad.
5. **Delvis verifierat.** Modalen och långa namn ryms i de tre web-viewportsen utan horisontell overflow. RN Web-fixturen har noll safe-area-insets; faktisk iOS/Android safe area är inte testad.
6. **Ja.** Färg, typografi, radie, touchmått och avstånd använder delade tokens. Ingen global token eller komponent ändrades.
7. **Ja.** Chevron, stäng och valdmarkering använder projektets Ionicons-familj.
8. **Ej tillämpligt.** Kravet på Hem-genvägarnas destinationsfärger gäller inte rasväljaren.
9. **Ja.** Chevron öppnar sökning/lista; varje rad väljer ett befintligt katalog-ID.
10. **Ja.** Ingen statusbadge visas på en normal rasrad; vald ras har en bekräftande bock i lokal formstate.
11. **Ja.** Ingen banner eller uppmuntranscopy läggs till.
12. **Ja.** Sökhjälp, inget-resultat och fallback är kort och vardaglig svenska.
13. **Ja, mot godkänd UX-spec.** Vald ras och sökfältet har tydlig hierarki. Bildspråk används inte i rasväljaren.
14. **Ja.** Browserkontrollen täcker ready, loading, empty, error/retry, sökträff, no-match och fallback-val. Endast screenshot-tillstånd sparades för öppet, no-match, tomt och vald ras.
15. **Delvis verifierat.** Webbläsaren kontrollerar 140 % textproxy, fokus in i sökfältet och återgång till öppnaren. Rader och kontroller använder tokenens minst 44 pt touchmått. Native VoiceOver, fysisk tangentbordshantering och Dynamic Type är **NOT TESTABLE** utan enhet.
16. **NOT TESTABLE.** Ingen separat rev02-referensbild för onboardingens rasväljare finns att jämföra sida vid sida. Den syntetiska bilden är granskad mot DOG-PROFILE-BREED-CATALOG-01 UX-specen och befintliga designtokens; full pixel-/bildlikhet med en panel påstås inte.
17. **Ja.** Modalens öppna/stängda state fungerar och tangentbordsfokus återgår till samma rasfält. Ingen huvudflik eller route ändrades i denna checkpoint.
18. **Ej tillämpligt.** Rasväljaren kräver ingen hundbild eller porträtt.

## Browserresultat

Både public och review klarade 11 kontroller vardera: förvalt Blandras, viewportpassning, skiftlägesokänslig sökning, FCI-no-match/fallback, rensa sökning, 140 % textproxy, nyregistrering med vald ras, tom katalog/retry, fel/retry, loading→ready samt profilredigering från sparad ras. Inga browserfel loggades.

Visuell likhet med en separat referenspanel och native tillgänglighet är inte verifierade. Fjärr-Supabase/RLS och faktisk profilskrivning är inte verifierade. Den lokala iOS-bundlingen och kod-/modellkontrollerna dokumenteras i checkpoint-rapporten.
### Evidenskorrigering, 2026-10-18

Oberoende QA upptäckte att de första filerna för öppet läge vid 375×667 och 430×844 var kopior av stängt läge. De har ersatts efter ny browserkörning på den befintliga public- och review-bundlen. Färska öppna screenshots visar sökfält och raslista, båda lägena verifierade utan horisontell overflow eller browserfel. Se modal-recapture.json i respektive katalog. Ingen appkod ändrades för denna evidenskorrigering.
