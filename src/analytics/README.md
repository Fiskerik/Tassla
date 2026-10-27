# Betamätning

`createAnalyticsService` skickar endast eventtypen till smala Supabase-RPC:er. Servern hämtar konto från auth-sessionen, tar tiden från databasklockan, kräver aktivt samtycke och kontrollerar allowlisten. RPC-fel returneras som misslyckade mätanrop och påverkar inte kärnflöden.

Användningsmätning är av som standard. `set_beta_metrics_consent(false)` stänger av och raderar kontots events i samma transaktion. Kontoradering tar bort consent och events via auth-FK cascade. Direkt klientläsning/skrivning till `product_events` är spärrad.

Tillåtna event är `dog_created`, `home_viewed`, `first_log`, `training_started`, `training_completed` och `meaningful_return`. Skicka aldrig namn, e-post, fritext, hälsa, hund-/kennel-/device-ID eller innehålls-ID. Dedupe för samma konto/event inom två sekunder hindrar dubbeltryck; servern avvisar okända typer.

För träningsresan skickas `training_started` efter lyckad nystart när den tidigare inlästa statusen saknade resa och readback bekräftar operationen. `training_completed` skickas när readback visar ett nytt ägarbekräftat delmål med samma operations-ID. Återupptagning, passloggning, okända utfall och redan bekräftade delmål ger inget sådant event. Händelserna är best effort: nystart räknas utifrån klientens tidigare snapshot och samtidiga starter kan påverka utfallet. Samtycke krävs; detta är inte ett bevis för komplett QR-/onboarding-funnel eller D1/D7-rapportering.

`dog_created` skickas efter att en hundprofil har bekräftats, om den inte redan fanns i den inlästa hundlistan och kontot redan har aktivt samtycke. Det är best effort: vid återställning eller en föråldrad lista kan en profil som skapats tidigare räknas på nytt. Ingen händelse samlas in retroaktivt för en användare som väljer samtycke senare. Nätverksfel påverkar inte profilskapandet.

Mätposter rensas äldre än 30 dagar när nya events skrivs och genom en separat daglig Supabase `pg_cron`-uppgift. Tillämpa migrationen och kör `supabase/beta-metrics-retention-job.sql` efter att `pg_cron` aktiverats i utvecklingsprojektet. Scheduler-installation och SQL-testet måste verifieras där innan produktionsinsamling slås på.

`createSyntheticAnalyticsAdapter` är en separat processlokal testhjälp, avstängd som standard och utan nätverks-/databasåtkomst. SQL-test och Node-test använder endast syntetiska data.
