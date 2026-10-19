# UX-feedback 2026-10-19 — genomförandeplan v6

Datum: 2026-10-19 · Status: v6 väntar på Architect/Critic-review av träningskortets kantlinjering. v5:s C är fortsatt BLOCKED. Ägaren har beställt lokala UI-ändringar A/B, ändrat passknappen till Visa PDF och bett att träningskortets bild ska linjera med kortets vänsterkant.

## Samlad scope

A. **Rasväljare:** ersätt den långa, alltid synliga raslistan i onboarding och profilredigering med en kompakt väljare som öppnar en sökbar modal. Återanvänd befintliga BreedOption[] och projektets planerade SearchableBreedPicker-gräns. Ingen katalogimport, Mix, databasändring eller dependency ingår.

B. **Träningsdetalj:** visa en befintlig träningsbild i övningens detaljblad och öka avstånd mellan innehållsdelarna. Bevara progress, markeringar, urval och innehåll.

Ägarens tillägg 2026-10-19 för B: miniatyren i **Fortsätt där ni var** ska fylla kortets vänsterkant och fulla höjd. Beskär bilden med `cover` och klipp den innanför kortets rundade hörn. Högertexten behåller sin tokenbaserade padding. Ändra inte bildkälla, navigation, progress eller innehåll.

C. **Tassla-pass PDF:** ägardirektivet är Visa PDF → riktig PDF-förhandsvisning → ägaren väljer dela eller stäng. Implementation är blockerad tills Android-kontrakt, dependency och filens livscykel har godkänts. Arkitekturen kan inte utlova att externa Android-visare har Dela/Stäng-kontroller. Den föreslagna @magrinj/expo-quick-look@0.5.0 är inte verifierad som publicerad installbar artefakt; lägg inte till den eller en annan native dependency före exakt registry-/licens-/källgranskning och ägarens uttryckliga dependency-godkännande. Security och Compliance samt dokumenterad cache-/kontolivscykel krävs före implementation. Ingen fallback till den gamla direkta delningen får införas utan beslut.

Bild 2:s hundväljare finns inte i appkoden. Nuvarande konto-/hundmodell stöder en hund per ägare och OwnedDog saknar foto. Ingen ny hundväljare, multi-dog-modell eller personligt foto-/lagringsflöde ingår utan ett nytt ägarbeslut. Den befintliga generiska Hem-illustrationen är inte ett personligt porträtt.

Alla ändringar följer docs/design-rules.md, aktuella tokens och §14. sources/ förblir orörd. Ingen testsvit läggs till eller körs.

## A — UX-BREED-PICKER-2026-10-19

**Mål:** raslistan visas först efter att ägaren tryckt på rasfältet; skapa och redigera använder samma komponent.

**Kontrakt:**
- En kompakt knapp visar vald ras eller Välj ras och öppnar en tillgänglig modal med sökfält och en fristående FlatList; listan nästlas inte i sidans scrollvy.
- Sökning trimmas och matchar endast befintliga rasnamn skiftlägesokänsligt. Endast ett befintligt BreedOption.id kan sparas; fri text är aldrig ett val.
- Öppning nollställer sökningen. Stäng, Avbryt och systemets bakåt/stängning bevarar valt värde. Ett val sparar ID och stänger listan. Träfflösning erbjuder tydlig tomtext och rensa-sökning.
- Skapaformuläret har ingen dold förstahandsras; det visar Välj ras tills användaren väljer. Redigering behåller den sparade rasen; befintlig varning och fallback för en äldre ras som saknas i listan bevaras.
- Laddning, fel/försök igen, save/readback, kennelattribution, ålder och profilens övriga dataflöde ändras inte.
- 44 pt träffytor, etiketter/valdsemantik för skärmläsare, långa namn som radbryts och tangentbord/bakåt hanteras.

**Kontroller:** typecheck, ESLint för ändrade filer, befintlig RN Web-fixture med öppnad/stängd picker, syntetiska vyer 375×844, 430×844, 375×667 och 140 % textproxy, git diff --check om Git-metadata finns samt kövalidering. Native Dynamic Type/VoiceOver är NOT TESTABLE i webbfixtur.

## B — UX-TRAINING-DETAIL-2026-10-19

**Mål:** övningens befintliga detaljblad får en relevant bild och rymligare textlayout.

**Kontrakt:**
- Återanvänd assets/images/puppy-training.png som dekorativ beskuren bild med rundade hörn; den döljs för skärmläsare. Ingen ny asset eller dependency.
- Öka mellanrum enligt spacing tokens mellan bild, ordinal, rubrik, instruktion/anpassningsnotis och åtgärder så sidan inte känns trång. Texten radbryts och actions går att nå vid 375×667 och 140 % proxy.
- Bilden i **Fortsätt där ni var** beskärs till `cover` och ligger kant-i-kant med kortets vänster-, över- och underkant. Kortets yttre klippning behåller rundade hörn; textens tokenpadding ändras inte.
- Övningsordinal hämtas från stegets index i programmets faktiska steps-array plus ett; position används inte som ordinal.
- Behåll samma program/steg, instruktioner, källor, klar/avmarkera, progress, sparstatus och navigation.

**Kontroller:** typecheck, ESLint för ändrade filer, befintlig RN Web-fixture och manuell render vid 375×844, 430×844, 375×667 samt 140 % textproxy, §14-bedömning och kövalidering. Native tillgänglighet och paneljämförelse utan referensbild redovisas som NOT TESTABLE.

B startar först när A har en QA-/Reviewer-checkpoint.

## C — UX-PASSPORT-PDF-PREVIEW-2026-10-19 — BLOCKED

**Mål när blockerarna är lösta:** knappen heter exakt Visa PDF; aktiveringen skapar och öppnar den faktiska PDF-filen i en förhandsvisning. Därifrån kan ägaren välja Dela eller Stäng. Ingen automatisk delning, ingen leveransbekräftelse och inget ändrat snapshot-/readiness-/urvalskontrakt.

**Blockerare:** användaren väljer hur Androids externa visare får bete sig; exakt dependency/artifact, källa/licens och kompatibilitet verifieras; Erik godkänner dependencyn; Security och Compliance granskar filåtkomst och informationen som lämnar appen; livslängd och städning dokumenteras för konto-/hundbyte, sign-out, appavslut och radering; färsk native build och realistiskt iOS-/Android-underlag planeras. Ingen komponent/API antas finnas innan den verifierats. Androids ACTION_VIEW betyder öppningsförsök till vald kompatibel app, inte att Dela eller Stäng finns där.

**C-kontroller efter ny planreview:** verifierad exakt dependency/lock, typecheck/lint, iOS-/Android-build och enhetskontroller av iOS-förhandsvisning/dela/stäng/städning samt Android med/utan PDF-handler, URI-läsbarhet och vald visares faktiska kontroller. Ingen falsk native PASS från webb.

## Review och arbetsordning

Architect godkände A/B i v5. v6 ändrar B efter ägarens önskemål om miniatyrens kantlinjering, vilket kräver ny Architect/Critic-review innan B-kod ändras. A-kontraktet är oförändrat men följer planversion v6. Critic har inget nytt blockerande fynd för A/B i v5; dess PROCEED WITH CHANGES gäller C och kräver plattformsspecifik copy, canPreview/ärligt fel, iOS-städning efter Quick Look, separat Android-filretention samt dokumenterade cleanup-gränser. Architect blockerar C tills användaren väljer plattformskontrakt, dependency och integritets-/disclosurevillkor. C:s tidigare v5-godkännande gäller inte efter ändrat direktiv.

Arbetsordning: A → QA/Reviewer/checkpoint → B → QA/Reviewer/checkpoint → C när blockerarna är lösta. Använd en aktiv del åt gången. Spara lokala ändringar och exakta kontroller; skapa inte commit/push utan fungerande Git-repo och separat mandat.
