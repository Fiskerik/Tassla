# Hundprofil och onboarding
`dog.ts` validerar kalenderdatum och räknar hela åldersveckor. `ProfileScreen.tsx` hämtar rasval från databasen, validerar namn och födelsedatum och skapar hunden genom RPC-funktionen `create_dog`.

Dataflöde: efter en bekräftad tom hundfråga visas formuläret → raslista från `breeds` → `create_dog` hämtar ägare från aktiv Supabase-session → RLS-skyddad hundfråga bekräftar sparandet innan Hem visas. Om RPC-resultatet är osäkert frågas hundprofilen igen innan ett nytt skapandeförsök tillåts. Kör `pnpm check`; faktisk RPC/ägartestning kräver Supabase-utvecklingsprojektet och är inte verifierad genom en lokal mock. Endast en hund per konto stöds av foundation-schemat.
