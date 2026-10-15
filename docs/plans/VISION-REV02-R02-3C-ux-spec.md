# R02-3C UX-spec — Kunskap

Datum: 2026-10-14 · Version: 1.1 · Branch: `design/vision-rev02`

## Mål och scope

Fortsätt från Kunskapens befintliga fyra ingångar: `För dig`, `Artiklar`, `Checklistor` och `FAQ`. Ge den första läsytan panel 7:s varma redaktionella bildhierarki och vänsterställda rubrik, samtidigt som artikel, källa, checklista och FAQ fortsätter använda nuvarande data och handlingar.

Skrivscope: `src/features/knowledge/KnowledgeScreen.tsx`, `FAQScreen.tsx`, `PuppyChecklistScreen.tsx`, `README.md`, den här UX-specen, R02-3-planen/reviewrapporten, `tools/visual-check/know02-app.tsx`, kö-/leveransdokumentation och renderad evidens. Befintliga `Tabs`-segment och redaktionella bildassets återanvänds. Innehållsmodeller, källor, spar-/synklogik, route, migrations och Supabase-funktioner är skyddade.

## Flöde

1. Ägaren öppnar Kunskap från huvudnavigationen och ser rubriken, fyra segment och befintliga genvägar.
2. `För dig` visar det befintliga ålders-/rasurvalet som ett större redaktionellt artikelkort och mindre artikelkort. Kortcopy hämtas från samma innehåll och samma källversion som idag.
3. `Artiklar` visar samma befintliga guideuppsättning utan checklistor eller träningsprogram.
4. Ett valt kort öppnar en läsvy med full text, rubrikhierarki, källor och den befintliga säkra externa länkåtgärden.
5. `Checklistor` behåller de sex befintliga faserna, kontextval, checklistemarkeringar, egna punkter, progress och spar-/konfliktåterhämtning.
6. `FAQ` behåller befintliga kontextval och expanderbara svar; ingen nätbaserad frågetjänst tillkommer.

## Tillstånd och återkoppling

- Guideflikarna behåller separata `loading`, `error` med retry och `empty`-tillstånd. Dessa får inte läggas ovanpå FAQ eller checklistor.
- Artikeltext visas endast från vald publicerad version. Saknade källor anges tydligt. Endast giltiga HTTPS-källor utan credentials kan öppnas; felmeddelandet behålls.
- Checklistor behåller sina nuvarande laddnings-, fel-, pending-, saved-, conflict- och unknown-state. Bock visas som sparad endast efter bekräftad läsning.
- Reviewinnehåll förblir tydligt temporärt och döljs helt när feature flag är av.

## Visuell riktning och avvikelse

Vänsterställd `Kunskap`-rubrik, varm canvas, kapselsegment, en stor bild över text följd av mindre bildkort, separata FAQ-/checklistkort, dämpad metadata och diskret lila kunskapsaccent. Använd befintliga generiska redaktionella hundbilder; de får aldrig beskrivas som användarens hund.

Panel 7 innehåller sök och ämnesfilter. De läggs inte till i denna slice: produktens innehåll har ingen godkänd sök-/filtermodell eller taxonomy. Den avvikelsen registreras explicit i §14; artikelkorten och befintliga destinationsingångar byggs visuellt mot panelen utan falsk sökfunktion.

## Tillgänglighet

Behåll minst 44 pt tryckytor, synliga val för tabs/kontekst, skärmläsarroller och labels, full scroll för text och formulär samt respektera reducerad rörelse. Webbrendering är inte native Dynamic Type/VoiceOver-verifiering. Granska 375×667, 375×844, 430×844 och 140 % browserzoom.

## Ålder saknas i checklistöversikten

När `ageWeeks` är `null`, kontexten fortfarande är standarden `by_age` och ingen preferens är sparad, finns inget beräknat fasförslag. Översiktskortet ska då säga `Ingen fas vald` och `Lägg till hundens födelsedatum för ett åldersförslag, eller välj en fas själv.` Använd en neutral rubrik som `Checklistkontext`; visa inte `Er fas`, `Efter ålder` eller `Förslag utifrån hundens ålder` som om en fas beräknats. Alla befintliga checklistor är fortfarande åtkomliga utan markering som rekommenderad.

## Acceptans

- De fyra existerande ingångarna fungerar och vald tab annonseras.
- Artikelkort öppnar rätt version, full text och källista; säkra externa länkar behåller återkoppling.
- Checklistans phase/context, progress, egna punkter och återhämtning förblir funktionella.
- FAQ-frågor expanderas/kollapsas och behåller kontext.
- Public/review renderar med korrekt review-gating, utan falska publicerade fixtures.
- §14 redovisar layout, färger, typografi, former, bildspråk, densitet och saknade paneldata var för sig.
- Vid saknat födelsedatum och osparad standardkontext visas neutral copy utan påstående om beräknad fas; alla checklistor förblir öppningsbara och ingen får rekommendationsmarkering. Rendera detta tillstånd färskt i public/review-harnessen.
