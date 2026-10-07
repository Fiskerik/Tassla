# Betrodda serveroperationer

Betrodda funktioner byggs endast vid konkret behov och använder hemligheter i servermiljö. De ingår aldrig i appens bundle och ingen service-role-nyckel skickas till klienten.

`delete-account/` är en lokal, syntetiskt förberedd Edge Function-kandidat. Den autentiserar en Bearer-token genom online `auth.getUser(token)` och använder endast verifierat användar-ID för en enda administrativ radering. Den är inte deployad eller testad mot ett faktiskt konto. Deno saknas lokalt, därför är entry-runtime ännu inte verifierad. SQL-triggern för hundstädning ersätter inte serverfunktionen, backupplan eller användarinformation.
