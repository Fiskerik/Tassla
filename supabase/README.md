# Databasgrund
Kör migrations/202610040001_foundation.sql en gång i ny tom Supabase-utvecklingsmiljö, sedan tests/foundation.sql separat. Fulla steg finns i ../docs/dev/supabase-setup.md. Testet återställer syntetiska ändringar genom rollback.

Migrationer är schemakälla, inte dashboardändringar. Framtida schemaändringar får nya numrerade migrationer; ändra inte denna fil efter att den har körts i en sparad miljö. Nödvändiga schemaändringar kan annars inte reproduceras.

`migrations/202610060001_planned_health.sql` läggs efter grundmigreringen i en ny utvecklingsmiljö. Den skapar ägarens separata planer för vaccination och veterinärbesök; de är inte utförda hälsohistorik. Kör inte migrationen mot en fjärrmiljö utan en separat granskad utvecklingsdatabasplan. SQL-provet `tests/planned-health.sql` körs separat och rullar tillbaka syntetiska data. Migration `migrations/202610060002_plan_reminders.sql` lägger till ägarvalda lokala påminnelsetider för planer; befintliga rader är av som standard. Kör den efter planmigreringen. Den ger inga fjärrnotiser och har inte körts mot en databas här.

SQL-funktion: create_dog(dog_name, dog_breed_id, dog_birth_date, kennel_code). Hund-ID returneras; ägaren identifieras via auth.uid(). Första appklienten återstår. Ingen service_role-nyckel ska användas av appen.

Ingen schemaändring aktiveras i ett fjärrprojekt automatiskt. För P09: kör `migrations/202610080001_beta_metrics.sql` efter grundmigrationerna, därefter `tests/beta-metrics.sql` separat med syntetiska konton. Slå på `pg_cron` i Supabase Database Extensions och kör `beta-metrics-retention-job.sql` för daglig 30-dagars gallring. Kontrollera `cron.job` visar jobbet och `cron.job_run_details` visar en lyckad körning innan frivillig insamling används i en betamiljö. Denna miljö saknar verifierad anslutning till Eriks Supabase-projekt; migration, RLS och scheduler har inte körts där.

## Innehållsutkast

`content/mvp-content-v1.sql` är en handkörd, versionsspecifik draft-import som ska köras först och kontrollerar exakt innehållsparitet. Efter den kan `content/publish-mvp-content-v1.sql` publicera tio godkända runtimeversioner med dokumenterad reviewreferens. Den lämnar `before-homecoming` som draft tills runtime upprätthåller onboarding-only-kontext. Ingendera filen har körts mot en databas här. Verifiera RLS och publicerad readback i målmiljön. Se `../docs/content/README.md`.
