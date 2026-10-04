# APP-02-LOCAL – MVP-navigation, vardagslogg och Träning

Plan v1, 2026-10-04. Erik ger segmentmandat i chatten: ”skapa gärna vardagsloggen och nästkommande sida, samt alla sidor som ska vara i MVP:n ... populera vardagsloggen och den vi planerat efteråt”. Efterföljande sida är Träning enligt Architecture.md. Bygger vidare på godkänt lokalt testläge; riktig inloggning skjuts fortsatt upp.

## Leverans och gränser
Alla sex MVP-områden får egna små skärmkomponenter: Hem, Vardagslogg, Träning, Hälsa, Kunskap och Tassla-pass. Navigation: Hem/Logg/Träning/Mer; Mer öppnar Hälsa/Kunskap/Tassla-pass. Fyra bekväma huvudval i stället för sex trånga tabbar. Ingen ny navigationsdependency: lokal sidstate i previewns sammanhållna skal, med en tydlig tillbaka-knapp från undersidor. Scrollbart innehåll och fast navigation med safe area; stöd för stor text, skärmläsare och reducerad rörelse. Hem länkar till Logg och nästa träningssteg; profilredigering behålls.

Vardagsloggen visar märkta syntetiska exempel och snabbknappar för kiss, bajs, mat, sömn, vaken och promenad. Ett tryck registrerar aktuell tid. Historik sorteras nyast först, grupperas efter lokalt kalenderdatum; inga härledda vårdråd eller sömntimer. Poster kan rättas (typ, lokalt datum/tid, valfri notering högst 500 tecken) och tas bort efter bekräftelse. Tomt läge finns efter radering. Giltiga datum/tider, ingen framtid, unik postidentitet och stabilt syntetiskt hund-ID krävs. Ren domänmodell har samma händelsetyper som befintlig dog_events, utan låtsad serverbekräftelse.

Träning visar två korta belöningsbaserade program med tre steg var. Exakt text/källor granskas av dog_expert och sparas i app-02-content.md innan implementation. Ingen ensamhetsexponering, medicin, vårdschema eller sponsor. Program har stabil identitet/version och steg-ID; progression är per hund/programversion/steg. Endast nästa steg kan markeras genomfört, redan genomförda steg kan granskas igen, och programmet kan återställas efter bekräftelse. Progression kvarstår vid sidbyten i samma körning; inga dubbla slutföranden, ingen tyst flytt mellan versioner. Tydlig progressindikator, konkret nästa steg och avslutat läge. Materialet är intern granskad demotext, inte veterinärgranskad/pilotpublicerad.

Hälsa, Kunskap och Tassla-pass är enbart visuella sidgrundar med beskrivning/tomt läge. Ingen PDF/export, medicinsk data, vårdscheman, påminnelser, publicerat artikelbibliotek eller påhittad fungerande funktion.

Alla exempel/poster/progression ligger i React-minne och märks lokalt testläge. De överlever sidbyte, återställs vid appomstart; inga konton/Supabaseanrop, AsyncStorage, filskrivningar eller offline-synk. Ordinarie auth/provider/callback och releasepolicy behålls; inga schemaändringar, paketinstallationer, externa resurser eller betalda SDK-prov. Detta är användbar UI/domänleverans för Expo Go, inte färdig molnkopplad MVP eller beslut om pilotens offlinepolicy.

## Numrerade deluppgifter och checkpoints
1. Koordinator: mandat/plan, dog_expert innehåll, därefter TechLead APPROVE och Critic före kod. Äger docs/tasks/dev och queue. Ingen appkod före exact-planreview.
2. Implementer Luna high, checkpoint A: litet previewskal/navigation, sex skärmgrundar och bibehållen profil. Äger src/features/home, src/features/puppy-log, src/features/training, src/features/health, src/features/knowledge, src/features/passport, src/components (endast nödvändig AppScreen-komposition). Spara filer/cleanup/körd check/exakt nästa steg innan B.
3. Samma Implementer, checkpoint B: loggmodell, syntetiska exempel, snabbregistrering/rättning/radering/historik och modulguide. En del i taget. Kontroll och checkpoint innan C.
4. Samma Implementer, checkpoint C: granskad träningstext, lokal versionsbunden progression, Träning/Hem-koppling och modulguide. Bounded cleanup/konsekvent naming/ta bort ersatt dödkod före QA. Ingen skrivning till tests eller docs av implementer.
5. QA Luna high äger endast tests och testguide: domänbeteende logg/progression, datum/tid/future/500gräns, sidbyte enligt sourcegranskning, no-provider/no-network/release-gräns. Ingen ny rendererdependency; UI och fysisk telefon NOT TESTABLE här. Reviewer oberoende av appförfattaren; QA:s tester granskas separat om QA återanvänds som Reviewer. Security för previewisolering. Koordinator rapport/checkpoint/slutkontroll.

En skrivare/aktiv del som standard, högst två oberoende delar samtidigt. Inga två appskrivare. Checkpoints A/B/C gör arbetet återupptagbart; inte automatisk nattkörning.

## Verifiering och nästa steg
pnpm check (typ/lint/domäntester), iOS-export med EXPO_NO_DOTENV=1 och previewflag true, git diff --check. Bekräfta verkliga lokala API:er och installerad RN/Expo-version; ingen hallucinerad funktion eller mock som uppfinner API:t. QA kontrollerar faktisk loggmodell och programversion/stegidentitet. Telefon: alla sex sidor, snabblogg/edit/delete, återupptagen träning vid sidbyte, stora textstorlekar/tangentbord och omstart. Telefonresultat sparas separat av Erik; dessa är inte PASS utan prov.

Nästa framtida segment är verklig auth/dataverifiering och Supabasekoppling för logg/träning efter separat plan; återstående sidfunktioner, notifieringskanal/PDF-fält/innehållsurval kräver sina detaljbeslut.

## Planreview
architecture_astra TechLead: APPROVE exakt v1. app_qa_luna Critic: PROCEED exakt v1. Dog_expert granskat intern innehållstext enligt app-02-content.md. Faktiska befintliga modeller: Astra för TechLead/innehållsreview, Luna high för Critic och kommande implementation/QA; inga betalda SDK-prov.
