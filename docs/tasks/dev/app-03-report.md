# APP-03 – checkpoint

2026-10-04. Erik vill nu ha Codemagic/Google och verkliga data samt design närmare visionsbilden. Han har bekräftat att Codemagic ännu inte är konfigurerat.

Plan v1 finns i app-03.md. TechLead architecture_astra: APPROVE som teknisk plan, villkorad av paketgodkännande, Compliance och Critic. Inga paket installerade eller appkod ändrad för APP-03 ännu. Compliance pågår. Critic återstår. Explicit paketfråga ställd till Erik: expo-crypto ~57.0.3, @expo/vector-icons ^15.0.2, expo-font ~57.0.4; versionsförslag från installerade Expo 57.

Två dekorativa beaglefoton genererade med inbyggt imagegen, visuellt inspekterade och kopierade till assets/images/dog-welcome.png och dog-resting.png. Prompter och användningsbegränsningar dokumenteras i assets/images/README.md. Inga API-nycklar eller verkliga ägarbilder användes.

Codemagic-startguide finns i docs/dev/codemagic-first-build.md. Konto/repoanslutning, Apple-integration, signering och faktisk TestFlight-körning är ännu inte gjorda; behöver Eriks åtkomst. Ingen Git-push, molnkörning, extern publicering eller Google-login har utförts av Codex.

Erik godkände därefter uttryckligen de tre paketen; installationen slutfördes med expo-crypto 57.0.3, @expo/vector-icons 15.0.2 och expo-font 57.0.4. Compliance PROCEED för intern kod, Critic PROCEED med två förtydliganden och Astra APPROVE uppdaterad exakt plan v1. Planen dokumenterar nu identitetsprov före första skrivning och separata App Review/integritetsgrindar redan före TestFlight. Ingen automatisk seed krävs: saknade publicerade program ska ge tomläge.

Queue APP-03-LOCAL är implementing. Luna arbetar i ordningen A auth/byggkontrakt, B ägarworkspace/data, C visualer. Root äger rapport/queue; tester och oberoende granskning följer appimplementationen. Codemagics inloggningssida öppnades för Erik; inga kontoåtgärder utfördes.

Compliance-källor: EU-kommissionens information om personuppgifter/rättslig grund/information till individer; Supabase identity-linking och Google-auth; Google OpenID Connect; Apples App Review Guidelines och TestFlight-översikt. Granskningen är inte en juridisk certifiering. Inför egen verklig testskrivning behöver Erik dokumentera ändamål, rättslig grund, information, lagring/radering och faktisk Supabase-region. Publik pilot och release är fortfarande separata beslut.

Nästa steg: Luna A/B/C-checkpoints, faktisk lokal kontroll, QA samt oberoende source/security-granskning. Verklig Google/signering/RLS kräver separata telefonresultat.

Förberedande kontroller efter paketinstallation: Expo install --check PASS, kompatibla dependencies. Befintlig pnpm check PASS: typecheck, lint och 25/25 tester. Detta är baseline, inte slutverifiering av den nya implementationen.

## Verklig testresa – ännu inte utförd
- Codemagic: senare bilder visar anslutet GitHub-konto och Apple API-integration samt hämtad app_store-profil för com.erimaliab.tassla. Matchande certifikat saknas (Not uploaded); exakt byggbranch och appanslutning ännu inte verifierade.
- Manuell signerad byggkörning och Apple-behandling: ej utförda.
- Google callback, avbrott/nytt försök och kall/varm app: ej utförda.
- Google/magic-link samma Supabase user.id: ej verifierat.
- Hund/logg över omstart, rättning/radering och nätfel: ej utförda.
- Två egna testkonton och negativa RLS-prov: ej utförda.
- Publicerad träning och faktisk versionsprogression: ej utförda; tomläge ska fungera utan program.
- Ingen testares privata uppgifter, authkoder eller signeringshemligheter ska sparas i rapporten.

## A – Google/callback, Luna checkpoint
Implementer rapporterar A stabil: Google via Supabase OAuth/PKCE + expo-linking, validerad HTTPS/projekt-origin/authorize-path/provider/exakt callback, magic link kvar och samtidighetsvakt. Callback accepterar en senare ny kod efter fel och undviker dubbla exchanges. Filer: account AuthProvider/AuthCallbackScreen/SignInScreen/README, data auth-callback/supabase/README. Ingen extern authbegäran utförd. app.json hade redan scheme och Codemagic-kontraktet behövde ingen ändring.

Implementerns kontroll: pnpm check PASS25 och diffcheck PASS. Detta är rapporterad lokal kontroll för A; slutlig oberoende QA/reviewer/security återstår. Cleanup: rena URL/callback-policyhelpers, generiska UI-fel utan koder/token/råfel. QA får nu skriva authpolicy-tester i tests/ medan Luna fortsätter B i app/source. Ingen överlappande skrivare.

Root upptäckte vid A-genomläsning att samtidighetsvakten släpptes efter browser-open trots pågående OAuth-resa. Implementer ombedd rätta enligt ursprungligt kontrakt: spärr över resan, tydlig avbryt/återhämtningsväg och session/callback-samordning. A betraktas inte slutgodkänd innan detta har rättats och QA granskat beteendet.

Reviderad A stabil enligt Luna: googlePending visas, spärr bibehålls över browserresan och släpps vid session, faktisk foreground-retur eller explicit Avbryt. Google och magic link spärras under resan. Implementerns check PASS25 och diffcheck PASS igen; QA informerad. B påbörjas nu.

QA A: tests/auth-oauth.test.mjs tillagt av separat QA-agent, 3/3 fokustester PASS, filens lint/diffcheck PASS. Testar URL-tillit, exchange-policy och faktisk installerad Supabase SDK med lokal minnesstorage och fetch som kastar om nätverk används. S256 challenge matchar lagrad verifier; inga nätanrop utfördes. SDK skipBrowserRedirect är klientflagga, inte extra queryparameter. Manuell sourcekoll fann ingen kvarstående reproducerbar A-defekt; native AppState/route/touch/callback behöver fysisk telefon. B-testning och slutlig helkontroll återstår.

Astra delgranskning A: CHANGES. Native PKCE-kryptografi inte säkerställd av Node-testet: installerad SDK kan falla tillbaka till Math.random/plain utan global crypto.getRandomValues/subtle.digest, och installerat expo-crypto skapar inte dessa automatiskt. Implementer ska använda godkänt kryptopaket med faktisk verifierad adapter före första klientanrop och fail closed vid saknat stöd. Även foreground-lås behöver samordnas över callback-exchange; foreground ensam betyder inte avslutad authresa. Ingen slutlig A-acceptans förrän rättning + oberoende test/security-review. Testreview fann verkliga SDK-API:er och rätt flowindex/slot/JSON-lagring, men native crypto/exchange/lifecycle saknades. Inga filer ändrade av granskaren.

A-rättningen har nu ren pkce-crypto-adapter och expo-pkce-crypto-wrapper för native API. Google-url kräver giltig S256 challenge. Typecheck/lint PASS enligt implementer; 27/28 tester passerar, enda felet är tidigare QA-fixture med för kort challenge. QA uppdaterar till giltig fixture och testar adaptern utan Node WebCrypto, ingen försvagning av appvalidering. B datasource workspace-data.ts finns; UI/datahelhet och QA B ännu inte färdiga.

QA utökat A/B: auth-oauth 4/4 PASS, inklusive produktionsadaptern med Node global crypto borttagen och lokal provider, faktisk SDK/verifier/challenge och ingen fetch. Native Expo-exekvering är fortfarande ej verifierad. workspace-data 4/5 PASS: stabil UUID vid commit/response-loss, timeout/abort UNKNOWN, tomt publicerat programläge och fullständiga UUID-träningsoperationer med insert/delete (ingen PATCH). Ett regressionstest FAIL: påbörjad, fortfarande publicerad v1 ersätts av nyare v2. Root skickade rättning till implementer enligt ursprunglig plan; inte försvaga testet. QA lint/diffcheck för testfiler PASS, helcheck väntar på stabil UI.

Root genomläsning av PublishedTrainingScreen fann också att nästa markera-knapp kunde bli aktiv före explicit Fortsätt efter sparning. Implementer ombedd spärra vid acknowledged/pending enligt tidigare beteende. Inga källändringar av QA/root.

Astra A-rereview PASS för korrigerad kod och oberoende testgranskning: adapter före klientinit, preflight båda loginmetoder, S256 URL-krav, verifierade installerade Expo API:er, ingen foreground-release och tydlig cancel/session/error. QA-testet utan Node WebCrypto bedömdes meningsfullt. Granskaren körde inte om testerna; native Expo/React-livscykel/telefon fortfarande ej verifierade. PASS gäller endast A, inte B/C eller helsegmentet.

QA B omkörning: auth 4/4 och workspace 7/7 PASS. Startad publicerad v1 återupptas med sina UUID trots v2; exact-six loggfilter och tydligt constraint-rejection failed tillagda. Lint/diffcheck PASS för testerna. Actual SDK med lokal fetch verifierar requestkontrakt/abort/reconciliation, inte verklig RLS. UI-helgranskning och helcheck återstår.

Root B-genomläsning: implementer ombedd kontrollera okänt insert-ID före retry, skilja bekräftad write från misslyckad efterföljande läsning och skydda state efter konto-/hundbyte eller abort. Detta följer godkänd plan och är ännu inte slutgranskat.

## B – data/workspace, Luna checkpoint
Appkärnan rapporteras stabil/testbar: workspace-data med paginering/sex vardagstyper, återläsning före osäkert insert-retry med samma UUID, update/delete-reconciliation samt publicerad träning/progression. ProductWorkspace/AppFlow har konto-/hundkey och stale-guard. LogScreen stöder serverstatus/async edit/historik; PublishedTrainingScreen visar hela versionstexten och källor före stegen samt explicit Fortsätt och bekräftad reset. Bekräftad write skiljs nu från misslyckad efterföljande historikläsning. Modulguider uppdaterade, typecheck/riktad lint PASS enligt implementer. C visual/cleanup pågår. Astra gör oberoende B data/security/testreview; slutlig UI/helcheck efter C.

Astra B CHANGES: tidsstämplar i update-reconciliation ska jämföras som validerade tidpunkter, inte text (.000Z jämfört med +00:00). Sidfrågor behöver unik id som sekundär sortering och skydd mot överlappande omladdning/sidhämtning; offset under andra samtidiga backendändringar ska inte framställas som snapshot. completeStep-feltext ska säga när återkontroll misslyckats. Övriga kolumner/grants/SDK-operationer, publicerad versionsprioritering och bevarad pausad progression motsvarar foundation. QA-testerna bedömdes meningsfulla men update/withdrawn/lifecycle saknades. Implementer rättar source, QA lägger regressionsfall. Ingen testomkörning eller extern DB-verifiering av Astra.

B-rättningar enligt implementer: numerisk validerad tidsjämförelse, unik id sekundärsortering, serialiserade loggläsningar och dubbeltrycksvakt för äldre historik, sanningsenlig training-reload-feltext. README dokumenterar att offset kan förskjutas av annan enhets samtidiga writes. QA auth 4/4 + workspace 9/9 PASS, lint/diffcheck PASS. Nytt update-lost-response-prov med samma tidpunkt i annan zontext, pagineringssort och pausad indragen versionshistoria passerar. Dessa nya fall kördes först efter fix (ingen påstådd före-fix repro); äldre versionsregressionen var röd före rättning. Astra rereview pågår, C styling/modulguide/cleanup återstår.

Astra B-rereview PASS för korrigerat datalager, teknisk security och oberoende testreview. Tidigare timestamp/order/readserialization/feltext-fynd bedöms åtgärdade; regressionerna använder riktigt datalager/SDK. Inga tester omkörda av granskaren. Offset under annan enhets samtidiga ändringar, fysisk UI/livscykel och faktisk RLS kvarstår. PASS gäller B, inte C eller helsegmentet.

## C – visualer och helkontroll
Luna färdigställde foto-/ikonkort, kompakt skärmstruktur, fem navigationsval enligt visionsbilden, större hundars ålderspresentation och 140ms fade med Minska rörelse. Kunskap/Pass/profil via Mer, Hälsa fortfarande ärlig grund utan ny funktion. Modulguider uppdaterade. Källan fryst för slutgranskning. Implementer check PASS38 och diffcheck PASS; inga externa auth/backendanrop och ingen .env läst.

Astra APPROVE exakt plan v1 med visuell femvals-precisering; tidigare fyravalsmening korrigerad till samma femval. Installerade Ionicons/useFonts och lokala bildreferenser verifierades, ingen ny C-securityblockerare identifierad. Slutlig QA/Reviewer och fysisk UI-verifiering återstår.

Root utförde på fryst källa: pnpm check PASS (typecheck/lint, 38/38, 0 skipped), git diff --check PASS samt pnpm bundle:ios PASS med EXPO_NO_DOTENV=1. Export: 1215 moduler, 26 assets, inklusive två dekorativa bilder och endast Ionicons-familjens font. Exporten är osignerad lokal paketering, inte Codemagic/TestFlight eller Google/RLS-verifiering. Node/Git hade endast modultyp/CRLF/färgvarningar, inga kontrollfel.

Slutlig oberoende QA PASS lokal handoff: faktisk check38/38 zeroSkipped och diffcheck, statisk owner-change/retry/training/nav-koll utan blockerare. Critic PROCEED femvals-precisering inom befintlig funktion. Kö review, separat SourceReviewer-turn återstår. FysiskUI/nativecrypto/RLS är fortfarande ej verifierade.

## Codemagic – ägarens aktuella certifikatproblem
Nya bilder visar GitHub/Apple API anslutna och Tasslas App Store-profil hämtad, men Certificate Not uploaded. Nycertifikatförsök nekas med current Distribution certificate/pending request. Enligt officiella Codemagic-docs kan detta betyda nådd Apple-certifikatgräns. Root rekommenderade först Fetch certificate för tidigare Codemagic-genererad identitet, annars befintlig .p12 med privat nyckel, och att profilen måste matcha certifikatet. Ingen .cer/API-key ersätter privat signeringsidentitet. Inga certifikat återkallade eller konton ändrade av Codex. Optional textfråga till Erik: finns befintligt distributionscertifikat i Fetch-listan? Nästa externa steg beror på det svaret.

Senare Fetch-bild: tre certifikat Unavailable, ingen Codemagic-generated identity tillgänglig för nedladdning. Apple-listan kan läsas men privat signeringsnyckel saknas i aktuell Codemagic-kontext. Root frågar vilken tidigare byggmiljö som skapade dem för att hitta .p12/privat nyckel; inte återkalla ännu. Distributionscertifikat är teamidentiteter, inte ett certifikat per app.

## Slutreview: BLOCK, lokal överlämning inte godkänd
SourceReviewer hittade fetchBreeds utan deadline; profilsetup kan hänga utan retry. Kö blocked. Avgränsad korrigeringsplan app-03-correction-1.md framtagen och Erik-fråga ställd enligt AGENTS.md-regeln om BLOCK. Korrigeringen väntar på svar; tidigare 38/38 och iOS-export PASS kvarstår som körresultat, inte slutacceptans. Övrig auth/data/nav/API-granskning utan nytt fynd, phone/RLS/native fortsatt ej verifierade.

Astra APPROVE exakt korrigeringsplan 1: befintlig 12-sekundersdeadline + AbortSignal, test faktisk fetchBreeds/abort/avvisning. Ingen scopeändring. Eriks återupptagningsbesked inväntas; ingen appfix utförd ännu och Reviewer BLOCK kvarstår.

Erik svarade därefter "Ja, rätta och granska igen". Korrigering 1 återupptagen efter Astra APPROVE: endast fetchBreeds i app-data.ts ändrad till befintlig deadline och abortSignal, samma generiska fel. Implementer typecheck/riktad lint/diffcheck PASS. QA:s verkliga funktion-/SDK-regression och helcheck återstår; root uppdaterar iOS-export efter källrättningen. Inga andra källfiler ändrade i korrigeringen.

QA korrigering 1: två faktiska fetchBreeds/SDK-tester (namnsortering, 12sek fake-clock/abort/generiskt avvisat anrop) PASS, check39/39 och diffcheck PASS. Root noterade att ursprungligt RPC AbortSignal-kontraktstest hade ersatts och bad QA bevara det också, ingen ytterligare appändring. Root uppdaterad iOS-export efter rashämtningen PASS1215/26 assets utan dotenv. Kö qa; slutligt helresultat och Reviewer-rereview följer återställt RPC-test.

## Slutligt granskningsbesked efter korrigering 1
QA återställde ursprungligt create_dog RPC AbortSignal-test: fokustestfil3/3 och helcheck40/40 PASS, typecheck/lint/diffcheck PASS. Endast tests/app-data.test.mjs ändrades av QA i korrigeringen. SourceReviewer ändrade därefter sitt tidigare BLOCK till PASS för lokal överlämning efter faktisk rättning och Eriks återupptagningsgodkännande. Ingen agent överprövade BLOCK.

Astra oberoende test/security-review av korrigering 1 PASS: verklig fetchBreeds och installerad SDK/AbortSignal, Node-timer provade exakt12s, inget påhittat API eller nytt säkerhetsfynd. Ingen testomkörning av Astra. Tidigare A/B/C-plan/security/testreview står. Telefon/nativecrypto/Google/RLS/signering fortfarande ej verifierade.

Lokalt levererat: riktig Google/PKCE-grund, kontoägd Supabase-workspace med logg och publicerad versionsprogression, sex användarytor utan demo-fallback, foton/ikoner/femvalsnav/sidfade, modulguider och Codemagicbyggguide. Hälsa och PDF-pass är fortsatt tydliga grundsidor; saknat publicerat innehåll ger tomläge. Två tillfälliga bilder genererades med built-in imagegen och har dokumenterade prompts i assets/images/README.md.

Nästa ägarsteg: hitta originalets .p12/privata signeringsnyckel från tidigare byggmiljö (Fetch-bilden visar3 Unavailable), matcha Tasslas App Store-profil och certifikat i Codemagic. Konto/repo/API/profil är delvis konfigurerade enligt bilderna. Git-branch måste också innehålla färdiggranskad kod före molnbygge; ingen commit/push eller molnbygge har utförts här. TestFlight-grind, identitetsprov och verkliga telefon/RLS-testresultat kvarstår enligt guiden. Ingen App Store-publicering eller certifikatåterkallelse utförd.

Root sista helcheck på korrigerad källa: PASS40/40, noll skipped, typecheck/lint PASS. APP-03-LOCAL registrerad done efter Reviewer PASS och oberoende Astra-review; detta är enbart lokal källöverlämning. Ingen extern integration förklaras färdig.

Granskningsunderlag: [EU personuppgifter](https://commission.europa.eu/law/law-topic/data-protection/reform/what-constitutes-data-processing_pl), [rättslig grund](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en), [information](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/information-individuals_en), [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect), [Google via Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [Apple App Review](https://developer.apple.com/app-store/review/guidelines/), [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).
