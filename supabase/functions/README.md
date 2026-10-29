# Betrodda serveroperationer

Betrodda funktioner byggs endast vid konkret behov och använder hemligheter i servermiljö. De ingår aldrig i appens bundle och ingen service-role-nyckel skickas till klienten.

Erik rapporterar uppladdade funktioner med separata `index.ts` och `handler.ts`:

| URL-slug | Visningsnamn i dashboard | Källmapp | Gateway-JWT |
|---|---|---|---|
| `swift-api` | delete-account | `delete-account/` | true |
| `bright-task` | sync_drive | `sync-drive-article/` | false; separat stark sync-token i handlern |

`supabase/config.toml` anger dessa slugs och explicita entrypoints, utan att flytta källmapparna. Entry är relativ till config.toml och kräver CLI>=1.215.0 vid framtida deployment. Ingen deployment görs av denna ändring. Ägarens uppladdningsbesked är inte verifierad kodparitet eller runtimefunktion.

Kontoradering autentiserar en Bearer-token med online `auth.getUser(token)` och använder endast verifierat ID för en enda administrativ radering. SQL-triggern för hundstädning ersätter inte serverfunktionen, backupplan eller användarinformation. Tidigare okänd radering förblir blockerad; ingen automatisk reset eller ny begäran efter URL-ändringen. Native, Deno-entry på verklig edge och livekonto är ännu inte verifierade.
