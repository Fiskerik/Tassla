# ACCOUNT-DELETE-STATUS-01 — verifiera kontoraderingens okända status

**Status:** blocked · **Risk:** H

Skärmbilden från Erik 2026-10-25 visar meddelandet att servern inte kunde bekräfta om kontot raderades och instruerar användaren att inte försöka igen än. Den visar därför ett okänt utfall, inte bevis på vare sig lyckad eller misslyckad kontoradering.

Repoets `supabase/functions/delete-account/README.md`, `supabase/functions/README.md` och `src/features/account/README.md` säger att Edge Function-kandidaten inte är driftsatt/verifierad mot verkligt konto. Detta kan förklara felet i en TestFlight-miljö, men screenshoten innehåller ingen endpoint-/serverlogg som fastställer vad den specifika begäran gjorde. Konto-raderingsmarkören och instruktionen att inte försöka igen ska lämnas intakta tills status är verifierad.

## Nästa säkra steg

Ägaren behöver ange vilket Supabase-projekt/build som används och uttryckligen godkänna en driftsättnings-/verifieringsplan innan externa ändringar. Därefter ska funktionen verifieras utan att radera Eriks riktiga konto, först med serverstatus/preflight och sedan med en särskild syntetisk testidentitet i en avsedd testmiljö. Logga inga tokens, användar-ID:n eller raderingspayloads. Faktisk radering av ett konto kräver separat uttrycklig begäran för den kontoinnehavaren.

Ingen kod, servermiljö eller konto har ändrats genom denna backlogpost. Lokal kontoradering förblir en undeployed kandidat; TestFlight-/Supabase-status och skärmbildens serverutfall är **NOT TESTABLE** här.
