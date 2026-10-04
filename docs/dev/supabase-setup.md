# Skapa Supabase för Tasslas projektgrund

## 1. Ny utvecklingsmiljö
Skapa ett nytt Supabase-projekt för utveckling, till exempel tassla-dev. Välj lämplig EU-region som utgångspunkt för EU-pilot och förvara databaslösenord säkert. Regionval ersätter inte granskning av databehandling och leverantörsvillkor. Välj plan/kostnad själv; Codex har inte skapat några resurser.

## 2. Skapa tabeller
Öppna projektets SQL Editor. Skapa en ny query och klistra in **hela** supabase/migrations/202610040001_foundation.sql. Kör som postgres. Filen innehåller begin/commit; vid fel rullas hela körningen tillbaka.

Kör en gång i en ny tom miljö. Filen är inte idempotent och försöker avsiktligt inte skriva över ett befintligt schema. Om det finns tidigare Tassla-tabeller, avbryt och jämför schema först; använd inte DROP som snabb lösning. Om körningen lyckades, kör inte migrationsfilen igen. Vid misslyckande i samma anslutning kan `rollback;` behövas innan nytt försök.

Skapade tabeller: breeds, dogs, dog_memberships, kennels, dog_attribution, dog_events, reminders, content_items, content_versions, content_breed_targets, training_steps, training_progress och product_events. Seed innehåller bara Okänd ras och Blandras; inga faktaråd, konton eller kenneluppgifter skapas.

## 3. Kör det separata testet
I en **ny query**: klistra in hela supabase/tests/foundation.sql och kör som postgres. Testet använder syntetiska konton, ändrar rollen till authenticated/anon för att faktiskt kontrollera RLS, och avslutas med rollback. Förväntat sista resultat: Foundation tests completed; synthetic data rolled back.

Vid fel: spara felmeddelandet och raden. Kör `rollback; reset role;` om samma anslutning står kvar i felaktig transaktion, och starta ny query. Radera inte tabeller. Testet är endast för utvecklingsmiljö. En lyckad migrationskörning är inte ensam bevis för rätt åtkomstkontroll.

## 4. Förbered lokal anslutning
Hämta projektets URL och publishable key i projektets anslutnings-/API-nyckelinställningar. Lägg till dessa två rader i befintlig .env, utifrån .env.example; behåll AI-teamets övriga inställningar. Ingen anslutningskod finns ännu. Dela inte databaslösenord, secret/service_role eller OpenAI-nyckeln i chatten.

Den publika nyckeln identifierar appen; användarens session och databasens regler avgör åtkomst. Nyckeln ensam ger inte åtkomst till privata hunddata. [Supabase API-nycklar](https://supabase.com/docs/guides/getting-started/api-keys)

## 5. Vad SQL:en gör och inte gör
- En ägare/en hund i pilot. create_dog tar identitet från Auth-sessionen, skapar hund/medlemskap atomärt och kontrollerar eventuell kennelkod. Direkt medlemskapsändring är förbjuden.
- RLS och grants begränsar ägardata och publicerat innehåll. SQL Editor/postgres är privilegierat och kringgår vanliga RLS-regler; testets rollbyten är därför viktiga. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Händelse-ID måste skickas av klienten för återförsök. Idempotent appflöde, synk/offline och felhantering är inte implementerade av schemat.
- Publicerade versioner och deras barnposter skyddas mot ändring, utom indragning av version. Tabellen med granskningstext är inte i sig bevis för utförd sakgranskning. Redaktionell publiceringsprocess återstår.
- Mätdata har inga klientgrants: insamling är avstängd tills reglerna är beslutade. Påminnelsetabellen skickar inga notiser. PDF genereras inte av SQL.
- Auth-kontoradering städar ensamägd hunddata med trigger. Kontoraderingsknapp, betrodd API-funktion, backuphantering och driftkontroller återstår. Radera inte medlemskap manuellt som ersättning.

## Nästa steg
Bekräfta migrations- och testresultat. Därefter byggs en avgränsad Expo-appgrund med versionskompatibla paket och konto/profil/Hem. Inloggningsmetod, innehållspublicering och relevanta dataregler beslutas före faktiskt bruk. Offline/notiskanaler och PDF-fält hanteras före respektive beroende uppgift.

Verifieringsstatus 2026-10-04: inga Supabase-resurser eller PostgreSQL-server fanns tillgängliga för Codex. SQL-exekvering/integration är ännu **NOT TESTABLE** lokalt, inte godkänd pilot. Kör ovanstående i ditt nya utvecklingsprojekt och redovisa resultatet.
