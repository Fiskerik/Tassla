# UX-feedback 2026-10-19 — genomförandeplan v15

Datum: 2026-10-19 · Status: v15 synkar träningskortens opt-in-fyllning och verifieringsomfattning. A:s visuella uppföljning är done. B:s implementation och fräscha public/review-renderingar är klara; Architect har godkänt och Critic har gett PROCEED efter korrigering. Oberoende QA och Reviewer återstår. C är fortsatt BLOCKED.

## Samlad scope

A. **Rasväljare:** ersätt den långa, alltid synliga raslistan i onboarding och profilredigering med ett enda sökbart rasfält med en begränsad dropdownlista direkt under fältet. Återanvänd befintliga BreedOption[] och projektets planerade SearchableBreedPicker-gräns. Ingen katalogimport, Mix, databasändring eller dependency ingår.

B. **Träningsdetalj:** visa en befintlig träningsbild i övningens detaljblad och öka avstånd mellan innehållsdelarna. Bevara progress, markeringar, urval och innehåll.

Ägarens tillägg 2026-10-19 för B: miniatyren i **Fortsätt där ni var** ska fylla kortets vänsterkant och fulla höjd. Beskär bilden med `cover` och klipp den innanför kortets rundade hörn. Högertexten behåller sin tokenbaserade padding. Ändra inte bildkälla, navigation, progress eller innehåll.

C. **Tassla-pass PDF:** ägardirektivet är Visa PDF → riktig PDF-förhandsvisning → ägaren väljer dela eller stäng. Implementation är blockerad tills Android-kontrakt, dependency och filens livscykel har godkänts. Arkitekturen kan inte utlova att externa Android-visare har Dela/Stäng-kontroller. Den föreslagna @magrinj/expo-quick-look@0.5.0 är inte verifierad som publicerad installbar artefakt; lägg inte till den eller en annan native dependency före exakt registry-/licens-/källgranskning och ägarens uttryckliga dependency-godkännande. Security och Compliance samt dokumenterad cache-/kontolivscykel krävs före implementation. Ingen fallback till den gamla direkta delningen får införas utan beslut.

Bild 2:s hundväljare finns inte i appkoden. Nuvarande konto-/hundmodell stöder en hund per ägare och OwnedDog saknar foto. Ingen ny hundväljare, multi-dog-modell eller personligt foto-/lagringsflöde ingår utan ett nytt ägarbeslut. Den befintliga generiska Hem-illustrationen är inte ett personligt porträtt.

Alla ändringar följer docs/design-rules.md, aktuella tokens och §14. sources/ förblir orörd. Ingen testsvit läggs till eller körs.

## A — UX-BREED-PICKER-2026-10-19

**Mål:** raslistan visas först efter att ägaren tryckt på rasfältet; skapa och redigera använder samma komponent.

**Kontrakt:**
- Samma TextInput är både rasfält och sökfält. Stängt visar det vald ras eller Välj ras; fokus/tryck öppnar en tillgänglig, begränsad dropdown direkt under fältet. Ingen separat sökruta eller modal används.
- Det sparade ras-ID:t hålls separat från sökutkastet. Fokus på ett fält med vald ras rensar endast sökutkastet och visar katalogalternativen; text som skrivs söker från tomt och ersätter alltså inte eller utökar inte det sparade rasnamnet. Sökning trimmas och matchar endast befintliga rasnamn skiftlägesokänsligt. Endast ett befintligt BreedOption.id kan sparas; fri text är aldrig ett val.
- Dropdownens höjd begränsas så raslistan inte förlänger formuläret i hundratals rader. Val sparar ID och stänger listan. Stängning/tangentbordets avbryt utan nytt val återställer föregående sparade ras; text i sökningen sparas aldrig. Träfflösning erbjuder tydlig tomtext och rensa-sökning.
- Tillgänglighet kommunicerar fältets etikett, expanded/selected state och tillhörande alternativlista. Rader har minst 44 pt träffyta, långa namn radbryts, och tangentbord/fokus, utanförtryck, Escape/Android-back samt scrollning i dropdown hanteras utan att listan klipper utanför skärmen.
- Skapaformuläret visar Välj ras utan valt ID tills användaren gör ett val. Detta är ägarens aktuella beslut genom instruktionen att implementera planen och ersätter den tidigare DOG-PROFILE-BREED-CATALOG-01-standarden att förvälja Blandras. Uppdatera den befintliga picker-källassertionen till samma-fält-dropdown och det befintliga standardvärdestestets namn/assertion så att ett giltigt ras-ID måste väljas; lägg inte till tester eller testsvit. Redigering behåller den sparade rasen; befintlig varning och fallback för en äldre ras som saknas i listan bevaras.
- Laddning, fel/försök igen, save/readback, kennelattribution, ålder och profilens övriga dataflöde ändras inte.
- 44 pt träffytor, etiketter/valdsemantik för skärmläsare, långa namn som radbryts och tangentbord/bakåt hanteras.

**Kontroller:** typecheck, ESLint för ändrade filer, befintlig RN Web-fixture med stängt/öppet fält, sökning från förvalt värde, rensa sökning/ingen träff, val och avbryt/stängning som bevarar valt ID. Kontrollera utanförtryck och Escape, samt dropdown nära skärmens nederkant medan tangentbordet visas och föräldraformuläret kan scrollas. Fixture/browser kan inte verifiera native Android-back eller native VoiceOver/Dynamic Type; märk dem NOT TESTABLE. Rendera 375×844, 430×844, 375×667 och 140 % textproxy; kör git diff --check om Git-metadata finns samt kövalidering.

## A-uppföljning — UX-BREED-PICKER-VISUAL-CORRECTION-2026-10-19

**Mål:** ta bort den vita inre rektangeln som fick sökfältet att se inklistrat ut.

**Avgränsning:** detta är en separat visuell uppföljning efter A:s v12-checkpoint och ändrar inte rasdata, sökning, val, formulärflöde eller databas. Enradigt TextInput är transparent och saknar egen kant; den yttre fältcontainern äger fyllning, kant och klippning. Dropdownkanten möter fältets kant utan en vit inset.

**Verifiering:** fräscha public/review-renderingar för skapa och redigera vid 375×844, öppet fält vid 430×844 och 375×667, samt 140 % textproxy och kort vy. Uppdatera renderingsrapporten så status och syntetiska fixturevärden skiljs från produktionsdata. Fokuserad QA PASS och oberoende Reviewer PASS är sparade; native rendering och tangentbordsbeteende är NOT TESTABLE i RN Web. Kör typecheck, riktad ESLint, befintlig visuell fixture och kö/diff-kontroller; ingen testsvit läggs till eller körs. Native rendering och tangentbordsbeteende är NOT TESTABLE i RN Web.

## B — UX-TRAINING-DETAIL-2026-10-19

**Mål:** övningens befintliga detaljblad får en relevant bild och rymligare textlayout.

**Kontrakt:**
- Återanvänd assets/images/puppy-training.png som dekorativ beskuren bild med rundade hörn; den döljs för skärmläsare. Ingen ny asset eller dependency.
- Öka mellanrum enligt spacing tokens mellan bild, ordinal, rubrik, instruktion/anpassningsnotis och åtgärder så sidan inte känns trång. Texten radbryts och actions går att nå vid 375×667 och 140 % proxy.
- Bilden i **Fortsätt där ni var** beskärs till `cover` och ligger kant-i-kant med kortets vänster-, över- och underkant. Kortets yttre klippning behåller rundade hörn; textens tokenpadding ändras inte.
- Övningsordinal hämtas från stegets index i programmets faktiska steps-array plus ett; position används inte som ordinal.
- Behåll samma program/steg, instruktioner, källor, klar/avmarkera, progress, sparstatus och navigation.
- Spara ägarens detaljbild som `docs/design/evidence/vision-rev02/training-detail-2026-10-19/reference/owner-training-detail.jpg` och jämför detaljbladet med den filen. Fortsättningskortet jämförs separat sida vid sida med Panel 6 i `vision_rev02.jpg`.
- Eviderna ska visa ett nästa genomförbart steg med full instruktion och åtgärd, ett låst senare steg med förkravstext och inaktiverad åtgärd, ett genomfört steg med Avmarkera och ett programinformationsblad utan övningsbild/ordinal. Kontrollera även väntande/inaktiverad åtgärd och felåterkoppling.
- På 375×667 och 140 % webbtextproxy ska full instruktion och åtgärd kunna nås med bladets naturliga scrollning för genomförbart respektive genomfört steg. Fortsättningskortet ska fångas normalt, med lång titel och vid 140 %; rapportera separat hur den högre helbildsbeskärningen påverkar tätheten.


Ägarens tillägg efter v14, 2026-10-19: rekommendationskorten ska ha samma fasta höjd i logiska punkter över skärmbredder och oavsett titelns längd. Grundhöjden är 260 pt vid systemets standardtext; den skalar med systemets fontScale för att ge större systemtext utrymme. Korttiteln visas på högst tre rader, medan hela programnamnet behålls i knappens tillgängliga namn. Implementeringen använder HeroCard och en gemensam träningstoken. Höjdfyllning är opt-in och används bara av programkorten; övriga HeroCard-användningar behåller naturlig höjd.

**Kontroller:** typecheck; ESLint för src/components/ui/HeroCard.tsx, src/features/training/PublishedTrainingScreen.tsx och src/theme/tokens.ts; bygg och rendera den befintliga public/review RN Web-fixturen vid 375×844, 430×844, 375×667 och 140 % textproxy. Mät att programkorten behåller samma höjd vid båda bredderna, med lång titel och vid 140 % textproxy.

B startade efter att UX-BREED-PICKER-VISUAL-CORRECTION-2026-10-19 nått done och efter Architect/Critic-review av v14. Ägarens korttillägg är nu korrigerat och granskat i v15; B går vidare till QA och därefter Reviewer.

## C — UX-PASSPORT-PDF-PREVIEW-2026-10-19 — BLOCKED

**Mål när blockerarna är lösta:** knappen heter exakt Visa PDF; aktiveringen skapar och öppnar den faktiska PDF-filen i en förhandsvisning. Därifrån kan ägaren välja Dela eller Stäng. Ingen automatisk delning, ingen leveransbekräftelse och inget ändrat snapshot-/readiness-/urvalskontrakt.

**Blockerare:** användaren väljer hur Androids externa visare får bete sig; exakt dependency/artifact, källa/licens och kompatibilitet verifieras; Erik godkänner dependencyn; Security och Compliance granskar filåtkomst och informationen som lämnar appen; livslängd och städning dokumenteras för konto-/hundbyte, sign-out, appavslut och radering; färsk native build och realistiskt iOS-/Android-underlag planeras. Ingen komponent/API antas finnas innan den verifierats. Androids ACTION_VIEW betyder öppningsförsök till vald kompatibel app, inte att Dela eller Stäng finns där.

**C-kontroller efter ny planreview:** verifierad exakt dependency/lock, typecheck/lint, iOS-/Android-build och enhetskontroller av iOS-förhandsvisning/dela/stäng/städning samt Android med/utan PDF-handler, URI-läsbarhet och vald visares faktiska kontroller. Ingen falsk native PASS från webb.

## Review och arbetsordning

Architect godkände och Critic gav PROCEED för A:s exakta v12; implementation, QA och Reviewer PASS checkpointades och A flyttades till done. Ägarens senare visuella korrigering efterfrågade att den inre vita ytan inte ska se ditlagd ut. Korrigeringen använder enradigt TextInput med transparent bakgrund och en enda yttre ram. Public/review-bilder visar nu öppet fält i skapa/redigera, 375×844/430×844/375×667, 140 % textproxy och 375×420 kortvy; MD- och JSON-rapporter är synkade. Fokuserad QA gav PASS; oberoende Reviewer gav PASS; rapporten finns i breed-picker-evidensens REVIEW-REPORT.md. B:s exakta v12 fick CHANGES: v13 gjorde detail-state-matrisen, 375×667/140%-reachability, normal/lång titel/140%-kort och detaljbildens reproducerbara referens konkreta. Architect krävde även att A-checkpointen beskrivs korrekt och att känt fixture-lint inte markeras som passerat; v13 anger dessa gränser. Criticens v13-granskning identifierade att den efterföljande A-korrigeringen inte får döljas bakom A:s done-status. V14 ger den en egen review-checkpoint och lägger den som B-beroende. Därför krävs färsk Architect APPROVE och Critic PROCEED av exakt v14 innan B implementation. Criticens PROCEED WITH CHANGES för C kräver plattformsspecifik copy, canPreview/ärligt fel, iOS-städning efter Quick Look, separat Android-filretention samt dokumenterade cleanup-gränser. Architect blockerar C tills användaren väljer plattformskontrakt, dependency och integritets-/disclosurevillkor. C:s tidigare v5-godkännande gäller inte efter ändrat direktiv.

Arbetsordning: A:s v12-checkpoint → separat visuell uppföljning (QA PASS, Reviewer PASS) → B v14 review → implementation → QA/Reviewer/checkpoint → C när blockerarna är lösta. Använd en aktiv del åt gången. Spara lokala ändringar och exakta kontroller; skapa inte commit/push utan fungerande Git-repo och separat mandat.

## Ägarens efterföljande roadmap — statusbild 2026-10-19

Det här avsnittet lägger in arbetsordningen från ägarens bifogade statusbild.

- **Paket 3 — Sök i Kunskap:** visa publicerade artiklar som redan filtrerats för den aktiva hunden. Träffar, tomt resultat, laddning och fel ska ha tydliga lägen. Behåll befintlig åldersfiltrering och publiceringsregler.
- **Paket 4 — Dra för att uppdatera:** inför på Hem och Logg, samordnat med automatisk uppdatering. Skydda vyn mot gamla svar efter byte av hund eller konto.
- **Paket 5 — Tom-, laddnings- och felåterkoppling:** börja med Hem och Logg och fortsätt sedan med Kunskap och Träning. Fel ska ha ett eget synligt läge och okänd data ska inte visas som noll.
- Statusbilden anger att Paket 2a och 2b är implementerade, committade och pushade. VoiceOver, större systemtext, reducerad rörelse och tangentbord där relevant återstår som manuella iPhone-kontroller; de blockerar inte start av Paket 3.
- Övergångsanimationen mellan huvudflikarna är ett separat, blockerat arbete i lokal ocommittad ändring. Den väntar på visuell kontroll och kontroll av reducerad rörelse.

Arbetsföljd enligt statusbilden: Paket 2a/2b → Paket 3 → Paket 4 → Paket 5. Paketens exakta task- och köposter fastställs när respektive paket tas upp.

B:s v15-granskning: Architect APPROVE och Critic PROCEED efter att HeroCard-fyllningen gjorts opt-in endast för programkorten och planens ESLint-omfattning synkats med kön. Oberoende QA och Reviewer återstår.
