# Lokala tester

`pnpm check` kör typkontroll, lint och Node-testerna utan nätverk. Domäntesterna täcker ålders- och innehållsurval. `auth-storage.test.mjs` täcker callback-validering och den rena chunklagringen. `app-data.test.mjs` använder den installerade Supabase-klienten med en lokal fetch-funktion för att kontrollera att PostgREST förmedlar avbrottssignalen till begäran; inget anrop lämnar processen. Den 12 sekunder långa timeouten i `app-data.ts` granskas statiskt, eftersom den rena timeout-hjälpen inte är fristående/testexporterad.

`log-model.test.mjs` kör den rena vardagsloggmodellen: händelsetyper, canonical tid/future, notisens 500 Unicode-codepoint-gräns, syntetiska identiteter, immutable CRUD, lokal kalendergruppering samt datum/tidsvalidering inklusive Stockholm-vårens DST-gap. DST-fallet hoppas över i andra tidszoner.

`training-model.test.mjs` verifierar program- och stegidentiteter mot den granskade interna demotexten i `docs/tasks/dev/app-02-content.md`, hund-/program-/versionsisolering, enbart nästa steg, idempotens och versionsbunden återställning. Programmens källor och försiktighetsbegränsningar kontrolleras mot samma text.

`preview-policy.test.mjs` täcker den exakta flagg-/utvecklingslägesmatrisen, den installerade Expo CLI-sökvägen, argumentöverföring och kopiering av barnprocessens miljö utan att starta servern. Previewns profilvalidering, root/AppFlow-providergräns, callback-guard och övriga UI-/navigationskopplingar är statiskt granskade; de har ingen renderer- eller enhetstestmiljö här. Åldershjälpens ogiltiga och framtida datum täcks av `domain.test.mjs`.

Fysisk UI-/telefonkontroll av navigation, tangentbord/stor text, bekräftelsedialoger, animationer och appomstart kan inte göras med Node-testerna. Supabase-integrationen, RLS/ägarsisolering, e-postleverans och signerad iPhone-callback kan inte verifieras här. Foundation-testet finns separat i `supabase/tests/foundation.sql` och kräver en Supabase-utvecklingsdatabas.
