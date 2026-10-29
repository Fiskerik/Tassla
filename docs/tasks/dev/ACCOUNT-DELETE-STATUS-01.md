# ACCOUNT-DELETE-STATUS-01 — verifiera kontoraderingens okända status

**Status:** blocked · **Risk:** H

Skärmbilden från Erik 2026-10-25 visar meddelandet att servern inte kunde bekräfta om kontot raderades och instruerar användaren att inte försöka igen än. Den visar därför ett okänt utfall, inte bevis på vare sig lyckad eller misslyckad kontoradering.

Vid den första uppföljningen beskrev repoets guider funktionen som en ännu inte driftsatt/verifierad kandidat. Senare uppladdningsbesked och aktuell URL-koppling redovisas nedan. Detta kan förklara felet i en TestFlight-miljö, men screenshoten innehåller ingen endpoint-/serverlogg som fastställer vad den specifika begäran gjorde. Konto-raderingsmarkören och instruktionen att inte försöka igen ska lämnas intakta tills status är verifierad.

### Ägarrapport 2026-10-29

Erik rapporterar att hundradering fungerar i senaste Main-bygget men att kontoradering fortfarande inte fungerar. Den nya iPhone-bilden visar åter ett okänt kontoraderingsutfall, inte ett fastställt serverfel eller bekräftad radering. Exakt buildnummer och bygg-SHA är inte angivna. Byggkanalen ändras separat till `public`; det driftsätter inte Edge Function och löser inte i sig kontoraderingsproblemet. Ingen ny raderingsbegäran eller serverändring har gjorts i denna uppföljning.

### Korrigerad URL-uppgift 2026-10-29

Erik rapporterar uppladdad funktion med visningsnamnet delete-account, men bekräftar att dess faktiska URL slutar på `swift-api` (synken heter i URL `bright-task`). Appen anropade tidigare `delete-account`; detta är en konkret routingavvikelse och möjlig orsak till felet. Den separata lokala tasken EDGE-FUNCTION-SLUGS-01 rättar anrop och config. Skärmbilderna visar inte den gamla begärans HTTP-status, serverutfall, kodparitet eller gateway-JWT. Den gamla okända markören lämnas orörd och denna task är fortsatt **blocked**.

## Nästa säkra steg

Verifiera rätt miljö/build och den driftsatta funktionen utan att radera Eriks riktiga konto: först läsning av funktions-/felstatus, därefter ett avsiktligt prov med separat syntetisk testidentitet i avsedd miljö. Logga inga tokens, användar-ID:n eller raderingspayloads. Arbetsmiljön saknar Supabase-adminanslutning; inga backendändringar eller raderingsförsök har gjorts. Ägarens redan uppladdade funktion är rapporterad, men liveparitet, tidigare utfall och nativekontoradering är fortfarande **NOT TESTABLE** här.
