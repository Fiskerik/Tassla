# Hundprofil och onboarding

`dog.ts` validerar kalenderdatum och räknar hela åldersveckor. `ProfileScreen.tsx` hämtar rasval, validerar namn/födelsedatum och skapar hunden genom `create_dog`. När hunden finns visar `ProductWorkspace.tsx` en läsbar sammanfattning under Mer; profilredigering ingår inte ännu.

Dataflöde: efter en bekräftad tom hundfråga visas formuläret → raslista från `breeds` → `create_dog` hämtar ägare från aktiv Supabase-session → RLS-skyddad hundfråga bekräftar sparandet innan arbetsytan visas. Om RPC-resultatet är osäkert frågas hundprofilen igen innan ett nytt skapandeförsök tillåts. Kör `pnpm check`; faktisk RPC/ägartestning kräver Supabase-utvecklingsprojektet och har inte verifierats här. Foundation-schemat stöder en hund per konto.
