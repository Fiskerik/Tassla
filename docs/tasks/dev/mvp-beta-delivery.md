# Tassla — samlad leveransplan till beta
Plan v2, 2026-10-06. Källa: docs/mvp.md, senaste kod e5327d1 och Eriks uppdrag att först planera hela MVP:n med arbetspaket/checkpunkter. Status: genomförande beställt av Erik med Luna medel; P01 APP-04B2 pågår. Senaste beslut och reviewcheckpoint längre ned gäller framför historiska planeringsnoteringar. Inte en färdig beta eller ett releasebeslut.

## Mål och utgångsläge
En betatestare kan skapa hundprofil, få relevant hjälp på Hem, logga vardagen, följa 2–3 träningsprogram, registrera hälsa, läsa granskat innehåll, välja påminnelser och skapa Tassla-pass PDF. Uppfödar-QR och minimal kohortmätning ingår i full MVP. Grundflöden och vikt finns; beta kräver sammanhängande integration, verkligt innehåll och driftsättning av beslutade backenddelar. En syntetisk demonstration kan visas tidigare men är inte samma leverans som hela pilot-MVP:n.
Vikt och tangentbord: Erik har rapporterat fungerande, build okänd. Nytt TestFlight-prov efter varje paket krävs inte. Erik väljer kritiska telefonprov. Lokal QA/review krävs per paket; verifieringsluckor redovisas utan fabricerat PASS.

## Gemensam checkpoint per paket
1. Precisera minsta kompletta användarflöde, konkreta skrivfiler, data-/UI-kontrakt och testfall; Architect granskar exakt implementationplan, Critic relevant scope och Compliance/Security berörda dataflöden. Inga påhittade godkännanden.
2. Implementer bygger en slice i taget och uppdaterar modulguide; begränsad cleanup.
3. QA kör relevanta beteendetester och pnpm check; iOS-export när native/UI/integrationsförändring motiverar det. Reviewer och relevant Security granskar stabil diff. SQL/RLS provas på utvecklingsdatabas separat.
4. Checkpoint och release-log med Major changes, Minor changes, Bug-fixes, faktisk verifiering, kända begränsningar och nästa paket. Fortsätt direkt till nästa godkända paket utan rutinmässig TestFlight-väntan.
5. Alla ändringar behåller fungerande logg/vikt, rätt hund-ID, ärliga laddar/tom/fel-lägen, åtkomstkontroll, dubbeltrycksspärr och tydliga osäkra skrivresultat där relevant.

## Arbetspaket i genomförandeordning
| Paket | Ansvar och leverans | Beroenden | Checkpunkt innan nästa paket |
|---|---|---|---|
| P00 Beslut och baslinje | Koordinator: denna plan, policy, release-log; QA: baslinjekontroller | Erik svarar på avgränsade frågor; befintligt scope | Paketplan granskad; öppna frågor tilldelade; faktiskt utgångsläge dokumenterat |
| P01 APP-04B2 Hälsans historik | Implementer: HealthScreen, workspace-data, ProductWorkspace, health README; QA: health-history-test | Lokal B1 klar, exakt B2-planreview | Skapa/läsa/rätta/radera vaccination/vet_visit med datum och högst 500 tecken ägartext; negativa åtkomstkontrakt, retry, inget regressionsfel i vikt |
| P02 APP-04C Profilredigering | Implementer: onboarding, app-data, ProductWorkspace; QA: profiltester | P01, befintlig profilmodell | Namn/ras/födelsedatum kan rättas; bekräftat resultat uppdaterar ålder/urval utan omstart; återförsök och sessionsbyte |
| P03 Kommande hälsa | Implementer: health, workspace-data och exakt granskad migration endast om befintliga kontrakt inte räcker; QA: datum/historiktester | P01 | Ägarangivna framtida vaccinationer/vet-händelser separeras från utförd historik; rätta/radera; inga härledda kliniska intervall; notifieringsval kopplas i P07 |
| P04 Innehåll och träningspaket | Koordinator/produkt: contentutkast/källor; Dog Expert för förgranskning, namngiven mänsklig granskare för publicering enligt befintlig plan; Implementer: innehållsleverans och träningskoppling | Innehållsurval och granskare beslutade | 3 föreslagna program: hantering, miljötrygghet, ensamhet; 8 korta guider/checklistor. Alla publicerade råd har faktisk källa/granskning. Programsteg, återupptagning och versioner verifierade. Kan förberedas under P01–P03 |
| P05 Hem/Kunskap och sammanhängande produktloop | Implementer: home, knowledge, training, select-content; QA: urval/navigering/progression | P02 + P04 | Åldersfaser ger varierat relevant urval; nästa träningssteg och handling finns på Hem; samma innehållsversion i Hem/Kunskap; ärligt tomläge, inget återanvänt falskt demo-innehåll |
| P06 Tassla-pass PDF | Implementer: passport, data, workspace och beslutade Expo-paket; QA: urval/escaping/export | P01–P03, PDF-fält/dependencies beslutade | Förhandsgranskning, uttryckligt fälturval, lokal PDF och ägarinitierad systemdelning; datum och ägarregistrerad märkning; ingen publik länk; tillfälliga filer rensas enligt granskad strategi |
| P07 Lokala påminnelser | Implementer: reminders/notifieringsadapter, health/training, app config, beslutade dependencies; QA: schemaläggningskontrakt | Kanal/dependencies beslutade, P03/P05 | Ägarvalda datum och frivillig träningspåminnelse; neka/tillåt/återkalla, ändra/radera avbokar notis, tryck öppnar rätt hund/vy, utloggning tar bort kontots lokala notiser. Verklig native leverans redovisas separat och Erik avgör telefonprov |
| P08 Uppfödar-QR och onboarding | Implementer: app routes, linking, onboarding/attribution, QR-underlag; QA: länkkontrakt; Security: attribution | Kodformat/ändamål och landnings-/installationsväg beslutade | Unik syntetisk kennelkod, utan kennel fungerar också; kod bevaras genom inloggning; ingen kennel får ägaruppgifter. Installerad app + oinstallerad iPhone har verkligt beslutad väg; inget löfte om automatisk attribution genom installation utan implementation |
| P09 Minimal mätning | Produkt/koordinator: definitioner; Implementer: analytics, begränsad backendbehörighet/migration; QA/Security | Ändamål, information, retention beslutade; P08 | Invite/onboarding/hund/Hem/första logg eller träningsstart/meningsfull återkomst; stabila ID:n, deduplicering, ingen hälsodata/fritext; D1/D7/D30-rapport beräknas per aktivering/källa och skiljer ofullständiga kohorter |
| P10 Beta-konto och förtroendeflöden | Implementer: account, Mer/integritetsyta, exakt backend för radering; QA/Security/Compliance | Betaläge, ansvar/support/retention och backendunderlag beslutade | Inloggning/utloggning, begriplig information/support, konto-/hundradering med rätt behörighet och dokumenterad datalivscykel; anonym nyckel i app, inga serverhemligheter. Serveradministration får inte simuleras av lokal rensning |
| P11 Samlad beta-QA och leveranskandidat | QA/Reviewer/Security, koordinator: release-log och instruktioner; Erik: kritiska telefonprov och distributionsbeslut | Alla föregående accepterade och granskad verklig backend | Sammanhängande resa, nätfel/återstart/kontobyte, verklig tvåkontoisolering, innehåll/QR/PDF/notifieringsluckor redovisade; signerad kandidat med commit/build kopplade. Erik väljer telefonprov och godkänner visning/inbjudan |

Varje större paket kan delas i mindre kompletta slices med egna release-log/checkpoints. Inga överlappande skrivare i ProductWorkspace/workspace-data. Ingen nattlig scheduler antas. Inga nya kalenderlöften före granskade kontrakt och baslinje.

## Öppna beslut skickade till Erik
- Lokala notiser föreslagna; behövliga Expo-paket för notiser/PDF/delning måste godkännas och versionskontrolleras före installation.
- PDF föreslås innehålla namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser. Fält är valbara i förhandsgranskningen, ingen automatisk export.
- Syntetisk demonstration eller beta med egna konton? För riktiga konton: ansvarig, supportadress, gallring och befintliga Supabase-/informationsbeslut dokumenteras före aktivering.
- Innehållsurval enligt P04 och vem som sakgranskar råd. Utan publicerbara råd levereras appguider men full innehålls-MVP markeras ofärdig.

## Rekommenderade detaljer att låsa i kontrakten
Åldersfaser som redaktionellt urval: 8–12, 13–16, 17–26 och 27–52 veckor, med ärligt fallback för yngre/äldre hund. Rasfilter används endast för verkligt rasrelevant granskat innehåll.
Offline: ingen ny offline-skrivkö; sparande kräver internet och misslyckad/okänd sparstatus är tydlig. Lokala notiser kan levereras utan nät efter lyckad schemaläggning. Offline-läsning av tidigare innehåll endast om uttryckligen implementerad.
Aktivering: hund skapad + Hem visat + första sparade logg eller påbörjat träningsflöde. Meningsfull återkomst: ny värdehandling (logg, träningssteg eller innehållsdetalj), inte enbart appöppning. Föreslagna D1/D7/D30 kalenderdagar från aktiveringsdatum, tidszon Europe/Stockholm; exakt definition/ändamål fastställs i P09. Numeriska framgångsmål behöver inte blockera kod, men fastställs före utvärdering.

## Betaredo: slutkriterium
Alla sex ytor har beslutad funktionalitet och granskat innehåll; kärnresan fungerar med sparad progression/historik; PDF och valfria påminnelser gör faktiskt utlovad handling; distribution/mätning fungerar för valt pilotupplägg; kontoinformation/radering/support är färdiga för betans dataläge. Källkod + backend + innehåll + signerad build har spårbar versionskoppling. Testluckor är explicit redovisade och inga kända kritiska fel eller blockerande reviewfynd återstår. Ett bra kodtest ersätter inte dessa integrationer; Erik bestämmer telefonprov.

## Status och nästa steg
Planeringsleverans; ingen MVP-implementation startad i detta steg. Invänta Eriks öppna detaljbeslut, spara Architect/Critic-resultat, precisera P01 och fortsätt godkända oberoende paket utan TestFlight-stopp. Release-log: ../../releases/MVP-BETA.md.

## Eriks detaljbeslut — 2026-10-06, efter plan v1
- Godkänt: lokala telefonnotiser för ägarvalda datum och träningspåminnelser; PDF med namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser, förhandsgranskning och ägarinitierad delning; behövliga Expo-paket för notiser/PDF/delning. Kompatibla exakta versioner väljs i implementationplan, inga orelaterade dependencies.
- Betan använder egna konton och sparade uppgifter. Erik kommer ange ansvarig/support/gallring; detta är ännu obesvarat och hindrar endast berörd aktivering, inte oberoende lokal utveckling med syntetiska data.
- Godkänt: förbered källbelagda utkast till 3 träningsflöden och 8 guider/checklistor. Erik ordnar sakgranskare. Utkast är inte publicerat/granskat innehåll.
- Föreslagen gallring 30 dagar efter avslutad beta har skickats som fråga, är inte ett fattat beslut.

## Planreview och införda preciseringar — v2
Architect: APPROVE samlad plan, inte implementation/betalansering. Critic: CHANGES med nedanstående preciseringar, införda i v2. Exakta paketplaner granskas före respektive implementation.
- P00/P11 kontrollerar samtliga befintliga loggflöden: kiss, bajs, mat, sömn/vaken och promenad, historik samt rättning/radering; befintlig funktion glöms inte i slutkontrollen.
- P04:s åtta texter omfattar artikel, guide och checklista med varierat urval över beslutade åldersfaser. Källor och faktisk granskning krävs både för text och samtliga programsteg. P04/P05 låser stabila innehålls-/steg-ID:n och hur progression behålls vid ny programversion.
- P08 utvecklas med syntetisk kennelkod; distributions-MVP kräver därefter unika verkliga pilotlänkar/QR, verifierad koppling till hundprofil och uppföljning per pilotuppfödare. Ingen omfattande portal eller kommersiellt partneravtal krävs.
- P09 omfattar också aktiva dagar, innehållsanvändning, genomförda träningssteg och manuellt rapporterade utdelade inbjudningar; rapportens kohortfönster/denominatorer beslutas före mätning.
- P03/P07-kontrakt låser planerad/utförd status, datum/tidszon, stabila notis-ID:n, ombokning/avbokning och städning vid kontobyte/hundradering.
- P06-kontrakt låser senaste vikt kontra historik och utförda kontra kommande händelser. Förhandsgranskningen visar exakt samma valda uppgifter som PDF; exportfiler städas efter lyckad/avbruten/misslyckad export. Valt fälturval i sak är godkänt av Erik; visningens exakta omfattning preciseras före kod.
- P10 radering omfattar händelser, progression, mätkopplingar och lokala notiser. Datalivscykel/åtkomst granskas före berörda backendändringar, även om användarytan byggs senare.
- Endast berört arbete väntar på obesvarat beslut. Notiser/PDF/dependencies och innehållsutkast är godkända. Namngiven granskare och ansvar/support/gallring återstår; det hindrar inte lokal utveckling av oberoende funktioner med syntetiska data.

### Tre skilda slutlägen
1. Lokalt färdig kandidat: alla beslutade funktioner kodade, relevanta lokala kontroller/review passerade; integrationer som inte provats tydligt markerade.
2. Betaredo: faktisk backend/RLS verifierad, granskat innehåll publicerat, utlovade integrationer fungerar, betans information/support/radering och signerad distributionskandidat klar. Erik väljer kritiska telefonprov och beslutar inbjudan. Inga 30-dagars pilotresultat krävs innan beta börjar.
3. MVP validerad: verkliga distribution-/aktivering-/engagemang-/retentionsresultat, inklusive mogna D30-kohorter, analyserade efter pilot. Detta inträffar senare och är inte byggleveransens slutkriterium.

## Betabeslut från Erik — 2026-10-06
Ansvarig: EriMali AB. Angiven postadress för support: Stenvallavägen 1. Gallringstid: betakonton och hunddata raderas 30 dagar efter avslutad beta. Postnummer/ort och support-e-post efterfrågade, inte kända. Backup-/loggretention och faktisk teknisk radering dokumenteras i P10; användarens gallringsbeslut är inte bevis att leverantörens backuper redan följer det. Lokal implementation behöver inte vänta på adresskompletteringen.

Slutlig Critic-kontroll: PROCEED samlad plan v2; tidigare produktfynd åtgärdade. Architect APPROVE samlad plan. Gäller planering, inte godkännande av enskilda implementationplaner eller betadistribution.

Kompletterad betakontakt enligt Erik: EriMali AB, Stenvallavägen 1, 18634 Vallentuna. Support: erimali.ab@gmail.com. Gallring 30 dagar efter avslutad beta. Dessa uppgifter används i P10:s information/support; inga meddelanden skickas genom detta beslut.

## Genomförandemandat 2026-10-06 — Luna medel
Erik: ”Ok, starta implementeringen uppifrån och ner. Använd Luna medel”. Hela samlade MVP-planens paket är beställda i ordning, med exakta interna kontrakt/review före varje paket. Implementer, QA och Reviewer använder gpt-6-luna medium från detta besked; det ersätter tidigare high för APP-05 och äldre modellbeslut för aktuellt genomförande. Architect/Compliance/Security behåller sina reviewroller. Ingen ny fråga om segmentmandat behövs för funktioner inom denna godkända MVP-plan. Lokal utveckling med syntetiska data fortsätter utan rutinmässig TestFlight-grind; Erik beslutar kritiska telefonprov och faktisk distribution.

## Bilder och ikoner — Eriks genomförandekrav 2026-10-06
Varje paket har en UI-designcheckpunkt: använd passande bilder/illustrationer och ikoner där de hjälper förståelse och gör upplevelsen trevlig. Återanvänd Tasslas befintliga dog-welcome/dog-resting och Ionicons samt theme tokens där de passar; nya bilder ska vara lämpliga och ha spårbar källa/generation. Lugn hierarki, tydliga kort/status, textetiketter till handlingar, skärmläsarfallback, stor text, reducerad rörelse och laddningsprestanda. Undvik att dekor döljer formulär eller sparstatus. Kontroller får inte bara kommunicera med ikon/färg. Ingår i cleanup/QA/review, inte ett separat kosmetiskt slutprojekt.

## Versionsunderlag för P06/P07
Installerad Expo 57 bundledNativeModules.json anger expo-print ~57.0.2, expo-sharing ~57.0.22, expo-file-system ~57.0.7 och expo-notifications ~57.0.21. Behövliga paket är godkända av Erik; installeras först inom respektive granskad implementationplan. Versionskontroll mot installerad metadata väger högre än andra SDK-versioners dokumentation. Officiella API-underlag: https://docs.expo.dev/versions/v57.0.0/sdk/print/ och https://docs.expo.dev/versions/v57.0.0/sdk/sharing/.
