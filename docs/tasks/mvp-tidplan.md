# Föreslagen tidplan för Tasslas MVP

Status: **utkast för Erik**, 2026-10-05. Tidsuppskattning, inte ett nytt godkänt scope eller ett löfte om automatisk nattkörning. Utgår från `docs/mvp.md` (godkänd sexområdes-MVP), `docs/Architecture.md`, faktisk appkod och uppgiftskön 2026-10-05.

## Vad som redan finns och återstår

Finns lokalt: Expo/Supabase-grund, profil, Google/epostgrund, verklig vardagslogg och publicerad träningsprogression, Hem/Kunskap som visar publicerat innehåll, skärmramar för Hälsa och Tassla-pass, samt Codemagic-konfiguration. Kodens lokala kontroller har passerat, men det rättade macOS-bygget, fysisk telefon, Google-retur och verklig ägarisolering är inte slutverifierade. Hälsa och Tassla-pass är tomma grunder. Publicerat pilotinnehåll saknas.

Kvar inom beslutat scope: signerad iPhone-resa och backendprov; ägarregistrerad hälsa; beslutad lokal PDF; två–tre granskade träningsprogram och avgränsat artikel-/checklisteurval; åldersrelevant Hem; valt påminnelseflöde; uppfödar-QR och attribution; minimerad mätning D1/D7/D30; integritet, kontoradering, granskat likvärdigt inloggningsalternativ, tillgänglighet och pilot-QA. Partneravtal och stor uppfödarportal ingår inte.

## Antaganden för uppskattningen

- Erik svarar på avgränsade beslut inom 24–48 timmar och kan lägga ungefär 5–8 timmar per vecka på rekrytering, beslut, mobilprov och publicering. Yrkesgranskare och testare svarar enligt plan. Om Erik bara har 2–3 timmar per vecka blir kalendern längre.
- Codex arbetar aktivt i avgränsade uppgifter, normalt en och högst två parallellt. Plan, Tech Lead, QA och Reviewer används enligt `docs/dev/workflow.md`. Ingen nattlig scheduler är aktiv och användningsgränser kan avbryta körningar; checkpoints gör fortsättning möjlig.
- Litet piloturval för estimatet: 2–3 träningsprogram, ungefär 8–12 korta artiklar/guider/checklistor, 2–3 uppfödare och cirka 15–25 ägare. Det är ett arbetsantagande, inte ett beslutat innehållsurval eller ett statistiskt säkert retentiontest.
- Extern mänsklig hund-/veterinärgranskning behövs för relevant rådtext. AI:s dog_expert är förgranskning, inte veterinärintyg. Verkliga intervjudata delas med agenter bara i avidentifierad sammanfattning efter beslut om databehandling.
- Codemagic-krediter, Apple-behandling, tillgång till iPhone och granskare finns när respektive steg startar. Väntetid på dessa räknas separat från agenternas arbetstimmar.

## Kalender och beroenden

| Tid från start | Agenternas leverans | Mänskligt bidrag och beslut | Grinden för nästa steg |
|---|---|---|---|
| Vecka 1–2 | Intervjuguide, hypoteser, prototypuppgifter; förbereda första signerade bygget, auth/RLS-testplan och integritetsunderlag. | Erik rekryterar och intervjuar 6–8 nya valpägare samt 2–3 uppfödare (30–45 min vardera), sammanfattar svar avidentifierat. Han väljer pilotens huvudmålgrupp och prioriterar problemen. Han verifierar Apple/Codemagic/Supabase på egen iPhone och beslutar integritet/kontoradering/inloggningsväg före berörd uppladdning. | Ingen extern pilot eller persondatainsamling innan information, ändamål, rättslig grund och säkerhet är granskade. Bygg-/Google- och tvåkontoprov måste ha verkliga resultat. |
| Vecka 2–3 | Beslutsunderlag för innehållsurval, åldersfaser, PDF-fält, notifieringskanal, offlinebeteende samt aktivering och D1/D7/D30. Små implementeringskontrakt. | Erik väljer dessa öppna detaljer, nivå för intern/extern pilot, kostnadsram, och de måltal som ska prövas. Han ordnar namngiven sakgranskare för hälso-/träningsråd och beslutar hur pilotinnehåll publiceras. | Inga nya funktioner utöver `docs/mvp.md` utan uttrycklig scopeändring. Ändrade persondataändamål går via Compliance/Security. |
| Vecka 3–5 | Hälsa (vikt/vaccination/veterinärhändelse + datum), enkel PDF-förhandsgranskning/export, konkret innehållspublicering, 2–3 träningsprogram och relevant Hem/Kunskap. Varje del byggs och granskas separat. | Erik godkänner flöden, texter och visuellt uttryck på telefon. Hund-/veterinärsakkunnig granskar fakta, stopptexter och källor före publicering. Erik fastställer exakt PDF-urval. | Ingen ogranskad rådtext publiceras; exporten får bara innehålla beslutat ägarregistrerat urval. |
| Vecka 5–7 | Beslutad påminnelsekanal; QR/länk per uppfödare; minimal attribution och aktiverings-/retentionsmätning; kontoradering, integritetsytor och ägarisolering. | Erik säkrar 2–3 pilotuppfödare och deras vilja att dela länkar, utan att anta partneravtal. Han väljer vilka mätpunkter som behövs, information till användare, lagringstid och vem som får se data. Han sätter upp eventuell e-postleverans/SMTP om engångskod ska användas i piloten. | QR fungerar med och utan kennel. Inga identitets-/hälsodata i analyshändelser. Kontoradering och inloggningskrav granskade för avsedd Apple-distribution. |
| Vecka 7–9 | Hel QA på iPhone: inloggning, nätfel, två konton/RLS, registrering, PDF, tillgänglighet, återstart, mätning. Rättningar i högst 1–2 samtidiga uppgifter. TestFlight-underlag och pilotinstruktioner. | Erik gör fysisk acceptans på iPhone, håller 3–5 korta användbarhetspass, kontrollerar App Store Connect-uppgifter och bjuder in pilottestare. Han godkänner pilotstart och support-/återkopplingsväg. | Extern TestFlight-granskning kan behövas för första externa bygget; faktisk väntetid styr startdatumet. |
| Vecka 9–13 | Pilotdrift, prioriterade felrättningar och anonymiserad sammanställning av D1, D7 och D30 per startkohort/källa. | Erik och uppfödarna delar inbjudningar, ger testarna stöd och samlar kvalitativ återkoppling. Människor måste använda appen under minst 30 dagar för ett D30-utfall. | D30 kan inte snabbas upp av fler agenter. Litet piloturval ger riktningssignal, inte statistiskt säker bevisning. |
| Vecka 14 | Läranderapport: distribution → aktivering → engagemang → återkomst; nästa prioritering. | Erik avgör fortsätt, revidera eller stoppa; offentlig App Store-release är ett separat beslut med egen slutgranskning. | Beslutet tas mot fördefinierade mått och intervjufynd. |

Veckorna överlappar avsiktligt. Med start 2026-10-05 motsvarar pilotstart ungefär slutet av november/början av december 2026 och D30-slutsats ungefär början av januari 2027, om svar, byggresurser, rekrytering och granskning kommer i tid. Ett stopp för ny Codemagic-körning flyttar första telefonprovet och därmed piloten.

## Arbetstid

| Arbetsström | Fokusarbete för agenter |
|---|---:|
| Intervjuguide, analys, pilotprotokoll och beslutsspecifikationer | 8–14 h |
| Byggkedja, verklig auth, Supabase/RLS och telefonfel | 12–24 h |
| Hälsa och Tassla-pass/PDF | 25–40 h |
| Innehåll, granskningsoverlämning, publicering och Hem | 18–30 h |
| Påminnelser, uppfödar-QR, attribution och mätning | 22–36 h |
| Kontoradering, integritet, inloggningskrav, hel-QA och tillgänglighet | 25–40 h |
| Pilotfel, analys och beslutsunderlag | 12–22 h |
| **Totalt återstående agentarbete** | **122–206 h** |

Intervallet inkluderar implementer, Tech Lead, QA, Reviewer, Product, Compliance och begränsad hundexpertförgranskning. Det är summerat fokusarbete, inte elapsed kalender och inte en garanti för tokenkostnad. Praktiskt planeringsvärde: **cirka 150–170 agenttimmar**. Med 20–30 faktiskt genomförda agenttimmar i veckan, snabb mänsklig återkoppling och 1–2 aktiva deluppgifter ger det ungefär **7–9 veckor till pilotbar hel MVP**. Rekrytering, Apple-process och 30 dagars mätfönster ger **cirka 12–15 veckor till valideringsbeslut**.

Eriks egen insats uppskattas till **30–60 timmar utspritt över perioden**, inklusive intervjuer, beslut, iPhone-prov, TestFlight och pilotkontakt. En extern hund-/veterinärsakkunnig kan behöva cirka **6–12 timmar** för det lilla innehållsurvalet; juridisk rådgivning kan tillkomma om Compliance hittar materiella öppna frågor. Testarnas och uppfödarnas tid ligger utanför dessa siffror.

## Ägarbeslut i rätt ordning

1. Bekräfta pilotmålgrupp och rekrytera valpägare/uppfödare. Intervjuer får ändra prioritering; ändrat MVP-scope dokumenteras separat.
2. Före nytt bygge/uppladdning: lösa Apple-/integritetsgrindar, tillgängliga Codemagic-krediter, signerad iPhone, Supabase-region/ändamål/rättslig grund, kontoradering och Google-inloggningens likvärdiga alternativ. Magiclänk ska inte automatiskt antas uppfylla Apples regel 4.8.
3. Besluta exakt innehållsurval och mänsklig sakgranskare; besluta PDF-fält, notifieringskanal och offlinebeteende.
4. Besluta pilothypoteser, mätdefinitioner, målnivåer, lagringstid och informations-/samtyckestext där relevant. Gå igenom uppfödar-QR och om kenneldata kopplas till ägaren.
5. Godkänn varje avgränsat byggsegment efter granskning, testa fysisk app och godkänn extern pilot. Ägaren, inte agenterna, rekryterar och kommunicerar med deltagare.
6. Efter D30: ta beslut om iteration eller offentlig release. Partneravtal är inte startvillkor.

Apple kräver integritetspolicyadress och korrekta datadeklarationer för App Store-distribution; appar med kontoskapande ska erbjuda kontoradering; Google-inloggning kräver enligt regel 4.8 ett likvärdigt alternativ med särskilda egenskaper. Extern TestFlight kan behöva Apple-granskning. Dessa är nuvarande Apple-krav, skilda från GDPR-bedömningen. Källor: [App privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy), [kontoradering](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/), [App Review 4.8](https://developer.apple.com/app-store/review/guidelines/), [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).
