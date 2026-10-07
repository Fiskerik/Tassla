# Release-log — P07 lokala påminnelser
Datum:2026-10-07. Jämförelsebas47e5a19; humancheckpointfc39347 sparade större delen av P07. Status: lokalt klar och oberoende granskad. Ingen public release/push/deploy i denna körning.
## Major changes
Frivilliga lokala påminnelser för ägarens planerade hälsodatum och nästa valda träningstillfälle. Separat huvudval per konto/telefon, av som standard; planernas reminder-enabled/tid lagras i förberedd migration. Urvalet paginerar fram40 tidigaste faktiskt framtida lokala tider innan cap, med upplysning om fler finns. Tidigare idag/icke representerbar sommartid schemaläggs inte.
## Minor changes
Påminnelseinställningar med bell/calendar-ikoner och text, separata permission-/spar-/schemastatus. Generisk låsskärmstext utan hundnamn eller hälsotext. Tryck på notis matchar aktuell owner/hund och serverplan innan hälsovy öppnas; träning öppnas för aktuellägd hund. Utloggning avbokar endast egna requests och varnar om cleanupfel; sammaowners felindikator finns endast i appprocessen.
Expo-notifications57.0.22; iOS exaktUTC-calendar och Android DATE med faktiskSDKreturmatchning. Nästa träningsnotis är ett schemalagt tillfälle och omprövas när appen öppnas, inte ett påstått offline-dagligt schema.
## Bug-fixes
Utvecklingsfynd före leverans: passerade tider får inte uppta40-gränsen; SDKoutputshape skiljer sig från input; extra kalenderfält/repeat-/tidszonfel eller gammal icke-generisk copy ersätts; tokenförnyelse ska inte avboka; ny leverans på samma ID ska öppnas igen; gammal cleanupfailure får inte varna annatkonto. Finalcorrection1: master-av avbokar oberoende av en permissions-/channelkontroll. Ett gammalt statiskt useMemo-test uppdateras med den nya stabilacallbacken; beteendeassertions bevaras. Inget av detta påstås vara buggar i tidigare GitHubRelease.
## Verifiering och begränsningar
Faktisk planreview v3/nativev4 ArchitectAPPROVE/CriticPROCEED/SecurityAPPROVE; Compliance gäller minimerat lokaländamål, inte juridiskcertifiering. Slutlig oberoende QA78/78 fokuserat och fullcheck300/300 inklusive typecheck/lint PASS. iOS-export PASS efter sandbox-EPERM och godkänd filskrivningseskalering; diffcheck PASS. Förnyad final Reviewer PASS och statisk Security PASS efter master-av-korrigeringen. Den gamla statiska dependencyassertionen korrigerad inom godkänt scope med övriga assertions bevarade. Migration/SQLtvåägarprov intekörda; fysisknotisleverans inteutförd. Erik väljer telefonprov utan automatiskgrind.
## Nästa paket
P08 verklig QR/attribution och P09 individuell mätning väntar på Eriks databeslut och installationsuppgifter; inget implicitgodkännande. Oberoende P10 lokal/undeployed konto-raderingskandidat är exaktgranskad och kan byggas efterP07DONE. Actualdeploy/realdata/privacypublikation väntar separat. P11 samlad QA förberedd; fullbeta är fortfarande inteklar.


