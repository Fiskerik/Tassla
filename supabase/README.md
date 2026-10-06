# Databasgrund
Kör migrations/202610040001_foundation.sql en gång i ny tom Supabase-utvecklingsmiljö, sedan tests/foundation.sql separat. Fulla steg finns i ../docs/dev/supabase-setup.md. Testet återställer syntetiska ändringar genom rollback.

Migrationer är schemakälla, inte dashboardändringar. Framtida schemaändringar får nya numrerade migrationer; ändra inte denna fil efter att den har körts i en sparad miljö. Nödvändiga schemaändringar kan annars inte reproduceras.

`migrations/202610060001_planned_health.sql` läggs efter grundmigreringen i en ny utvecklingsmiljö. Den skapar ägarens separata planer för vaccination och veterinärbesök; de är inte utförda hälsohistorik. Kör inte migrationen mot en fjärrmiljö utan en separat granskad utvecklingsdatabasplan. SQL-provet `tests/planned-health.sql` körs separat och rullar tillbaka syntetiska data.

SQL-funktion: create_dog(dog_name, dog_breed_id, dog_birth_date, kennel_code). Hund-ID returneras; ägaren identifieras via auth.uid(). Första appklienten återstår. Ingen service_role-nyckel ska användas av appen.

Inga notiser, publiceringsjobb, backups, raderings-API:er eller analytics aktiveras automatiskt. Endast typvillkor/lagring/åtkomst skapas.
