# Betamätning

`createAnalyticsService` skickar endast eventtypen till smala Supabase-RPC:er. Servern hämtar konto från auth-sessionen, tar tiden från databasklockan, kräver aktivt samtycke och kontrollerar allowlisten. RPC-fel returneras som misslyckade mätanrop och påverkar inte kärnflöden.

Användningsmätning är av som standard. `set_beta_metrics_consent(false)` stänger av och raderar kontots events i samma transaktion. Kontoradering tar bort consent och events via auth-FK cascade. Direkt klientläsning/skrivning till `product_events` är spärrad.

Tillåtna event är `onboarding_opened`, `referral_opened`, `dog_created`, `home_viewed`, `first_log`, `training_started`, `training_completed`, `routine_completed` och `meaningful_return`. Skicka aldrig namn, e-post, fritext, hälsa, hund-/kennel-/device-ID eller innehålls-ID. Dedupe för samma konto/event inom två sekunder hindrar dubbeltryck; servern avvisar okända typer.

För träningsresan skickas `training_started` efter lyckad nystart när den tidigare inlästa statusen saknade resa och readback bekräftar operationen. `training_completed` skickas när readback visar ett nytt ägarbekräftat delmål med samma operations-ID. Återupptagning, passloggning, okända utfall och redan bekräftade delmål ger inget sådant event. Händelserna är best effort: nystart räknas utifrån klientens tidigare snapshot och samtidiga starter kan påverka utfallet.

`dog_created` skickas efter att en hundprofil har bekräftats, om den inte redan fanns i den inlästa hundlistan och kontot redan har aktivt samtycke. Det är best effort: vid återställning eller en föråldrad lista kan en profil som skapats tidigare räknas på nytt. Ingen händelse samlas in retroaktivt för en användare som väljer samtycke senare. Nätverksfel påverkar inte profilskapandet.

I första profilvyn kan användaren frivilligt välja mätning. `onboarding_opened` skickas först efter bekräftat samtycke. `referral_opened` anger att en redan sparad djuplänksreferens fanns i profilvyn efter samtycke; den räknar inte anonyma QR-skanningar och innehåller ingen kod. Eventförlust vid nätverksfel och sena samtycken gör kohorten ofullständig. Återkallelse raderar händelserna.

Migration `202610270003_traction_metrics.sql` lägger till dessa event och `beta_traction_report(p_from,p_to)`, som bara service-role får köra. Rapporten omfattar UTC-startdatum 21–9 dagar före idag; D1 och D7 är rullande tidsfönster 24–48 respektive 168–192 timmar efter första uppmätta onboarding. Hundskapande → Hem → första nytta använder ordnade observerade event (Hem tolereras upp till 30 sekunder före hundskapande på grund av asynkrona anrop). Första nytta är första logg, träningsstart eller bekräftad rutinmarkering. Rutinmarkeringar vars första svar är osäkert kan saknas även efter återförsök. Färre än fem konton, eller delvärden under fem, returneras som null. Det är inte en fullständig mätning av alla QR-skanningar, besökare eller användare utan samtycke. SQL kan provas lokalt med `node tools/verify-traction-metrics-sql.mjs` efter separat installation av PGlite i temporär verktygskatalog. Ingen migration eller rapport är därmed aktiverad i drift.

Femgränsen döljer små värden i ett enskilt svar men anonymiserar inte resultatet: en betrodd rapportläsare kan jämföra överlappande intervall och härleda skillnader. Rapportåtkomst förblir därför begränsad till service-role; dela inte nyckeln med klienten.

Mätposter rensas äldre än 30 dagar när nya events skrivs och genom en separat daglig Supabase `pg_cron`-uppgift. Tillämpa migrationen och kör `supabase/beta-metrics-retention-job.sql` efter att `pg_cron` aktiverats i utvecklingsprojektet. Scheduler-installation och SQL-testet måste verifieras där innan produktionsinsamling slås på.

`createSyntheticAnalyticsAdapter` är en separat processlokal testhjälp, avstängd som standard och utan nätverks-/databasåtkomst. SQL-test och Node-test använder endast syntetiska data.
