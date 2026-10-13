# Hundprofil — visuell evidens och §14

Datum: 2026-10-13 · Branch: `design/vision-rev02` · Slice A: `DOG-PROFILE-AGE-DISPLAY` · syntetiska fixturedata.

## Renderingar

Målbilden är [vision_rev02.jpg](../../../../vision_rev02.jpg), panel 1 för Hem. Captures använder samma React Native Web-vyer som fixtureappen, inte en fristående mock. `public/` byggdes med `TASSLA_UI_REVIEW=false` och `review/` med `TASSLA_UI_REVIEW=true`. Båda lägena innehåller en syntetisk hund; granskningsläget visar dessutom sin banner.

Varje mapp innehåller 38 PNG-filer:

- `synthetic-home-{weeks|months|years}-{375x844|430x844|375x667}.png`
- `synthetic-profile-{weeks|months|years}-{375x844|430x844|375x667}.png`
- `synthetic-passport-{weeks|months|years}-{375x844|430x844|375x667}.png`
- `synthetic-profile-edit-age-unit-{375x844|430x844|375x667}.png`
- `synthetic-profile-edit-age-unit-scrolled-375x667.png`
- `synthetic-home-long-breed-{375x844|430x844|375x667}.png`
- `synthetic-profile-edit-{saving|pending|error|conflict}-375x844.png`

Age routes use `ageExample=calendar`, a deterministic 494-day-old fixture. The rendered labels are `70 veckor`, `16 månader 1 vecka`, and `1 år 4 mån`. The long-breed route uses `Nova Scotia Duck Tolling Retriever`; its label wraps at a word boundary. The editor-state captures use existing synthetic status fixtures and do not imply successful server writes.

Captures were made in Chromium at 1× scale on 2026-10-13 from local public/review builds. The 375×667 viewport may require scrolling to reach lower content. Text-only 140% zoom was not available because Firefox is not installed; native Dynamic Type, VoiceOver, iOS/Android safe areas, actual Supabase RLS, native PDF rendering and the system share sheet are **NOT TESTABLE** here.

## Snapshot and age contract

Manual source review of `src/features/passport/passport-model.ts` confirms `createPassportSnapshot` computes `dog.ageLabel` from the saved unit, birth date, and the snapshot's `createdOn`. `renderPassportHtml` emits that exact frozen field as the HTML `Ålder` value. `PassportScreen` displays `snapshot.dog.ageLabel`, so preview and exported HTML use the same snapshot value. If profile sharing is off, `dog` is null and the HTML emits no dog or age row. The three visible preview routes are captured above. Native PDF rendering is not asserted.

## Designregelverk §14

| # | Bedömning | Underlag |
|---|---|---|
| 1 | Ja | Hemmets nästa handling är tydlig; de tre destinationskorten är jämställda. Profilredigering har en Spara-handling; passet har Dela som PDF. |
| 2 | Ja | Hemmets tre genvägar har lika format; åldersvalen är tre jämnstora alternativ. |
| 3 | Ej tillämpligt | Slice A:s berörda vyer raderar ingen post. |
| 4 | Ja | Hemrader saknar kategoriikoner och upprepade Visa/Ändra/Ta bort-länkar; hantering öppnas via raden/rubrikens fördjupningsväg. |
| 5 | Ja för RN Web | 375×844, 430×844 och 375×667 renderade. Kort höjd ger naturlig scrollning. Native safe-area och tangentbord är inte verifierade. |
| 6 | Ja | Ålder, radioval och Home-identitet använder semantisk typografi och befintliga design tokens. |
| 7 | Ja | Befintliga Ionicons används; inga nya symboler eller ikonbibliotek tillkom. |
| 8 | Ja för granskade tokenpar | Hemmets blå/gröna/lila ytor och gula tipsaccent syns. Mätt kontrast: Home muted-text mot canvas 4,95:1, mot kort 5,49:1; vald profilradio 5,59:1; destinationsikoner blå 3,81:1, grön 4,61:1, lila 4,16:1. |
| 9 | Ja | Veckor/månader/år väljer enhet för samma ålder; veckoremsan fortsätter att visa tränings-/åldersveckan. |
| 10 | Ja i renderad fixture | Review-vyns två bockar är syntetiska bekräftade exempel. Åldersinställningen visas inte som statusbadge. Serverbekräftelse är inte provad. |
| 11 | Ja | Endast befintlig välkomst-/innehållsyta och tydlig `Standardbild`-etikett syns; ingen ny resultatgaranti har tillkommit. |
| 12 | Ja | Svenska ålderstexter använder vardagliga former och utelämnar nollkomponenter. |
| 13 | Ja | Hundnamn/ras är metadata över en separat åldersrad; uppgiftslistan och destinationerna behåller hierarkin. |
| 14 | Ja för renderade vyer | Read/edit/Home/Tassla-pass, alla åldersenheter samt saving/pending/error/conflict-fixtures renderades. Databasresultat och äkta sparning är inte verifierade. |
| 15 | Delvis / NOT TESTABLE native | Åldersvalet är en tillgänglig radiogrupp med markerat läge och minst 44 pt höjd. Text-only zoom 140%, Dynamic Type, VoiceOver och native träffytor är inte verifierade. |
| 16 | Ja för Slice A:s Home-delar; full Home-leverans är inte godkänd här | Jämför Home-captures med målbildens panel 1. Stödskärmarnas fulla panelmatch är inte tillämplig. |
| 17 | Ja visuellt | Hem/huvudflikar ligger kvar; profil och Tassla-pass nås under Mer. Åldersändringen ändrar inte tillbaka- eller flikresor. |
| 18 | Ja med tydlig begränsning | Hundens namn, ras och ålder kommer från fixture/profilvärden. Rund hundbild är en generisk AI-skapad standardbild, märkt `Standardbild`; den påstås inte vara ägarens hund. |

Punkt 16 — delbedömning av Home mot panel 1:

- **Komposition: Ja** — hälsning, identitet, veckoremsa framför porträttet, Just nu, dagslista, tre genvägar och bottennavigation ligger i samma ordning.
- **Färgfördelning: Ja** — varm canvas/kort, grön progress, blå/grön/lila destinationer och gul tipsaccent syns.
- **Typografi: Ja** — semantiska storlekar och dämpad metadata används; namn/ras och vald ålder skiljs åt.
- **Komponentformer: Ja** — rundat kort, kompakta uppgiftsrader och tonade destinationskort följer Hem-kontraktet.
- **Objekt: Ja** — identiteten är `Namn | Ras`; vald ålder ligger under och veckoremsan behåller sina veckotal.
- **Innehållstäthet: Ja vid 375×844 och 430×844** — fem uppgifter och tre genvägar syns vid normal höjd. Vid 375×667 lägre innehåll nås genom scrollning.
- **Bildspråk: Ja för godkänd standardbild** — runt fotoestetiskt hundporträtt i rätt plats; det är AI-genererad standardbild och inte ett verkligt ägarfoto.

Renderingsunderlaget är syntetiskt. Oberoende QA har godkänt de korrigerade lokala vyerna och åldersreglerna; Reviewer har godkänt Slice A statiskt; Security har godkänt skrivvägen och bekräftat att åtkomst-/kopieinventeringen uttryckligen inkluderar `dogs.age_display_unit`. Verklig sparning, RLS, native PDF, native hjälpmedel och Firefox text-only-zoom är fortsatt NOT TESTABLE. Visuell likhet bedöms endast för Slice A:s berörda ytor. Home-kontraktets bredare v11-plan och granskning är separat; dessa captures stänger inte den uppgiften. Syntetiska captures verifierar inte produktionsdata eller databasskrivning. Ingen testsvit kördes.
