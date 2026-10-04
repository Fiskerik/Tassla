# Mobilappens ingång

`_layout.tsx` monterar säkert område och Expo Router. I vanlig utveckling och release används AuthProvider och `index.tsx` visar AppFlow: session → inloggning eller ägarens hundprofil/Hem. `auth/callback.tsx` tar emot produktappens `tassla://auth/callback`; account-modulen avvisar callback i förhandsvisningsläget innan `useAuth` anropas.

Kör `pnpm start` för det vanliga inloggningsflödet. `pnpm start:preview` startar den installerade Expo CLI:n med flaggan endast i barnprocessen. Den gemensamma policyn kräver exakt `EXPO_PUBLIC_DEV_PREVIEW === 'true'` och `__DEV__ === true`; release följer alltid auth. Förhandsvisningen monterar inte AuthProvider och visar en redigerbar syntetisk hund/Hem-profil bara i minnet. Den använder inga Supabase-frågor, mejl eller molnsparning.

Kör `pnpm check` för lokala kontroller och `pnpm bundle:ios` för lokal iOS-export. Förhandsvisning i Expo Go är en UI-kontroll; den verifierar inte produktappens signerade magic-link-callback. Routerns övergångar respekterar Minska rörelse. Ingen Google/OTP eller de övriga fem användarytorna ingår ännu.
