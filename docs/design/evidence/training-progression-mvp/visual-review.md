# TRAINING-PROGRESSION-01 — visuell kontroll

Datum: 2026-10-24. Manuell kontroll av lokala RN Web-renderingar med syntetiska fixturedata; ingen skärm eller data från en inloggad användare.

## Jämförelseunderlag

- Referens: beskärning av panel 6 från `vision_rev02.jpg` i `panel6-reference-crop.png`.
- Aktuella public- och review-renderingar: `public/default-375x667.png`, `public/default-375x844.png`, `public/default-430x844.png` och motsvarande filer i `review/`.
- Progressionsdetaljer: `public/session-saved-no-automatic-milestone-375x844.png` och `public/explicit-next-saved-step-375x844.png`.
- Rendererna är app-viewportbilder; RN Web verifierar inte iOS-statusfält, native safe area eller VoiceOver.

Panel 6 och den aktuella översikten delar ordningen rubrik → tre träningsflikar → rekommendationsrubrik → två bildkort → fortsättkort → bottennavigation. Den varma bakgrunden, gröna valda fliken, kortformen och träningsbildspråket följer befintliga tokens och komponenter. I aktuell vy är rekommendationskorten mindre informationstäta än panelen; de visar inte panelens tids-/kategori-chip. Progressionsdetaljens nya sparade pass och delmål har ingen separat rev02-referens och bedöms därför mot produktkontraktet, inte som en pixelmatch mot panelen.

## Designregler §14

| # | Bedömning | Underlag och avgränsning |
|---|---|---|
| 1 | Ja | Översikt och sparat pass håller högst en synlig primärknapp; verifieraren räknar knappar i dessa lägen i public/review. Nästa steg blir tillgängligt först efter separat delmålsbekräftelse. |
| 2 | Ja | Val av återkoppling och jämställda sekundära val använder gemensamma knappar; den uttryckliga bekräftelsen har tydligare primär vikt. |
| 3 | Ej tillämpligt | Den nya resan har ingen raderingshandling. Befintlig aktivitetens "Börja om"-återställning behåller namngiven bekräftelse och avbrytprov. |
| 4 | Ej tillämpligt | Träningsvyn är inte Hemmets dagslista; inga Home-rader ändras i denna slice. |
| 5 | Ja, RN Web | 375×667, 375×844 och 430×844 renderades; kort viewport kan scrolla. Native safe area är inte verifierad. |
| 6 | Ja | Progressionsvyn använder befintliga tokens och delade `Button`, `ListRow` och kortmönster; inga nya färgkonstanter infördes. |
| 7 | Ja | Befintliga Ionicons används; inga nya ikonfamiljer tillkom. |
| 8 | Partiell | Ytor och primärfärger använder befintliga tokens. Beräknade kontrastprov: ink på bakgrund 12,45:1; muted på bakgrund 5,75:1; primärgrön på bakgrund 5,83:1; vit på primärgrön 6,55:1. Detta är stickprov för tokenpar, inte en full inventering av all text, opacity, fokus eller native-tillstånd. |
| 9 | Ja | Knapplabel beskriver den handling som anropas; passloggning, ägarbekräftelse och nästa steg är skilda handlingar. |
| 10 | Ja | Ett loggat pass märks inte som bekräftat delmål; endast ägarens sparade bekräftelse markeras som sådan. |
| 11 | Ja | Bekräftelsecopy följer lyckad lokal callback och påstår inget om hundens känslor eller färdighet. |
| 12 | Ja | Ny copy är kort och användarnära; inga interna statusnamn eller driftinstruktioner visas. |
| 13 | Partiell | Hierarkin och ton följer panel 6. Aktuella kort har mindre metadata än referensen, vilket gör jämförelsen av innehållstäthet ofullständig. Ingen duration har hittats på eller lagts till. |
| 14 | Ja, RN Web | Verifieraren renderar normal-, sparad-, pausad-, okänd-, fel-, källsaknads- och läsfelslägen; resultaten finns i respektive `RESULTS.json`. |
| 15 | Partiell | Browserns 140 %-textproxy och tillgängliga namn kontrolleras i flödet. Native 44 pt-touch, VoiceOver, Dynamic Type och reducerad rörelse är inte verifierade i iOS. |
| 16 | Partiell | **Komposition:** översiktens ordning och ytor liknar panel 6; progressionsdetaljen saknar separat referens. **Färg:** varm grund och gröna val återanvänds, men bara tokenpar är kontrastberäknade. **Typografi:** gemensam systemtypografi används, ingen full storleksmätning mot referens. **Komponentformer:** samma flikar, kort och navigation, men pixelmått är inte normaliserade mot referensen. **Bildspråk:** programbilder används i samma roll men är inte samma exemplar. **Innehållstäthet:** mindre metadata i de aktuella rekommendationskorten. Därför godkänns inte full panelmatchning. |
| 17 | Ja | Befintliga Träning-flikar, huvudnavigation och tillbakaresa bevaras; public/review-flöden provar tabbar och återgång. |
| 18 | Ja för träningsöversikten | Programbilder och relevant program-/stegcopy visas. Panel 6 kräver inget separat hundnamn i denna vy. |

## Samlad status

- Visuell likhet med panel 6: **PARTIELL**, främst på grund av ofullständig kontrastinventering, innehållstäthet och avsaknad av separat referens för den nya progressionsdetaljen.
- Fungerande resa: **PASS i lokal RN Web-fixture**, 23/23 public och 23/23 review, utan browserfel.
- Produktionsdata: **NOT TESTABLE** här. Renderingen använder syntetiska callbacks, inte live Supabase/PostgREST/JWT/RLS.

Detta dokument är visuell lokal evidens, inte en native-tillgänglighets- eller releaseacceptans.
