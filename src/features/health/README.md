# Hälsa

`HealthScreen.tsx` nås från Hälsa-fliken i det inloggade workspace-flödet. Där visar ägaren viktposter för den aktuella hunden och kan lägga till, rätta eller bekräftat radera poster. Poster visas som ägarregistrerade, inte som verifierad journal. Skärmen ger inga medicinska råd. När den används utan data-props i den lokala förhandsvisningen visar den fortfarande den tomma grunden och gör inga anrop.

`ProductWorkspace.tsx` äger hälsans läs- och skrivstatus. `workspace-data.ts` använder det befintliga `dog_events`-schemat med `event_type = weight`, `occurred_on` och `weight_kg`; actor-id lämnas till databasens auth-default och RLS. Vid osäkert svar kontrolleras samma id och värden före ett säkert nytt försök. Ingen offlinekö finns.

Datum måste vara ett verkligt lokalt `ÅÅÅÅ-MM-DD` till och med idag. Vikten måste vara större än 0 och högst 200 kg med högst tre decimaler. Historiken sorteras på datum och id. Den hämtas i en läsning utan separat sidladdning; poster utöver projektets PostgREST-svarsgräns visas inte i denna slice.

Kör `pnpm check` för typkontroll, lint och lokala tester. `pnpm bundle:ios` kontrollerar iOS-exporten. Dessa kontroller verifierar inte telefonens tangentbordsbeteende eller riktig Supabase/RLS. De hör till den separata APP-05-PHONE-DB-verifieringen med syntetiska konton.
