# Codemagic – från nytt konto till egen iPhone

Erik uppger 2026-10-04 att Codemagic ännu inte är konfigurerat. Denna guide beskriver nödvändiga ägarsteg, inte en verifierad molnkörning. Appen använder Expo prebuild i Codemagic; inget EAS-konto/bygge behövs för detta arbetsflöde.

1. Skapa/logga in på [Codemagic](https://codemagic.io/) och anslut GitHub-repot Fiskerik/Tassla. Välj YAML-baserat workflow. Bygg den branch där slutligt granskad appkod, codemagic.yaml och lockfile faktiskt finns. Lokal kod är inte automatiskt tillgänglig för Codemagic.
2. Under Team integrations lägger du till App Store Connect-integrationen med namnet tassla-app-store, enligt YAML. Använd din Apple Developer/App Store Connect-behörighet. API-key ID, issuer ID och p8-nyckel hör endast hemma i Codemagics säkra integration, inte chatten eller appens .env.
3. Under Code signing identities konfigurerar du iOS-distributionscertifikat och App Store-provisioningprofil för com.erimaliab.tassla. Följ Codemagics guidade Apple-hämtning eller ladda upp dina befintliga filer där. Kontrollera att apposten i App Store Connect har samma bundle-ID.
4. Lägg två publika appvariabler i gruppen tassla-mobile: EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Kopiera från din befintliga lokala konfiguration själv. Ingen service_role, Google client secret eller OpenAI-nyckel får läggas i appbygget.
5. Kontrollera Google web application-clienten i Google Cloud och Google-provider i Supabase. Googles tillåtna redirect är Supabase-projektets /auth/v1/callback. Appens separata Supabase Redirect URL ska vara exakt tassla://auth/callback. Google secret ligger i Supabase, inte i appen. Om Googles audience är Testing behöver din testadress finnas som test user. Endast login-scopes, inga Gmail-/Drive-behörigheter.
6. Innan uppladdning: kontrollera App Review-kraven för integritetspolicy, kontoradering och likvärdigt login-alternativ vid Google. Dessa krav är inte verifierade genom APP-03. Starta därefter ett manuellt tassla-ios-bygge när APP-03-koden, kontrollerna och uppladdningsgrinden är klara. Workflow kontrollerar koden, genererar iOS-projektet, applicerar signering och laddar IPA till App Store Connect. submit_to_testflight:false betyder inte att uppladdning är avstängd; extern betagranskning/App Store-publicering begärs inte.
7. När Apple behandlat bygget lägger du till det för dig själv som intern TestFlight-testare. Installera appen på iPhone och testa Google där. Expo Go verifierar inte Tasslas signerade callback.

## Telefonprov som kräver verkligt resultat
Google: inloggning/avbryt/nytt försök, kall och varm callback. Före första skrivningen: jämför Supabase user.id för Google och befintlig magic link; vid olika ID avbryt och utred kontot utan egen e-postmerge. Dokumentera testets ändamål, rättsliga grund, information, lagring/radering och faktisk Supabase-region. Skapa sedan din hund, logga en post och starta om: hund och post ska finnas kvar. Testa rättning/radering, nätfel, utloggning och byte mellan två egna testkonton utan överlappande data. Träning utan publicerade program ska visa tomt läge, inte demoprogram. När granskat program publiceras ska dess riktiga versionsprogression återläsas.

Spara byggnummer, genomförda steg och fel i APP-03-rapporten. Certifikat, signering, faktisk Google-retur och backendbehörighet kan inte godkännas av lokal export. Offentlig release har separat granskning av butikskrav, integritet och kontoradering.

## Om certifikatet saknas
Eriks bilder 2026-10-04 visar ansluten GitHub/Apple API-integration och hämtad app_store-profil för rätt bundle-ID, men Certificate: Not uploaded. Det betyder att Codemagic inte har ett matchande signeringscertifikat. API-nyckeln ger åtkomst till Apple; den är inte signeringsidentiteten.

Försök först iOS certificates → Fetch certificate för ett tidigare Codemagic-genererat distributionscertifikat. Om detta inte går: återanvänd originalets .p12 med privat nyckel och lösenord från den tidigare byggmiljön. En .cer från Apple-portalen innehåller inte den privata nyckeln. Om uppladdat certifikat inte matchar profilen, uppdatera profilen i Apple Developer med rätt certifikat och hämta den igen.

Eriks nästa bild visar tre certifikat under Unavailable och ingen Codemagic-genererad identitet tillgänglig för nedladdning. Hitta då den tidigare miljö som har privata nyckeln (till exempel EAS, annan Codemagic-kontext eller Mac/Xcode) och dess exporterade .p12. En ny API-nyckel skapar inte den saknade privata signeringsnyckeln. Distribution identity tillhör Apple-teamet och kan användas för flera appar; Tasslas provisioningprofil måste innehålla samma certifikat. [Apple certifikatöversikt](https://developer.apple.com/help/account/certificates/certificates-overview).

Fel vid nytt certifikat: redan current Distribution certificate/pending request kan bero på nådd certifikatgräns. Återkalla inte gamla certifikat som rutinåtgärd; kontrollera först vilka andra appar/byggmiljöer som använder dem. Saknad privat nyckel kan kräva ersättningscertifikat och regenererad profil, men det är ett separat ägarbeslut efter inventering. Inga certifikat har återkallats av Codex.

Källa: [Codemagic certifikat/profiler](https://docs.codemagic.io/yaml-quick-start/building-a-native-ios-app/) och [Not uploaded-felsökning](https://docs.codemagic.io/troubleshooting/common-ios-issues/).

Underlag kontrollerat 2026-10-04: [Codemagic React Native/YAML](https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/), [första signerade bygge](https://docs.codemagic.io/yaml-quick-start/first-signed-build/), [Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [mobilcallback](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).
