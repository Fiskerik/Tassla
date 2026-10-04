# DEV-PREVIEW-01 – lokal app utan inloggning

Plan v1, 2026-10-04. Erik: ”kan vi strunta i inloggningsflödet så länge? ... så länge backbonen finns”. Detta godkänner ett lokalt förhandsvisningsläge, inte publik åtkomst till privata Supabase-data. Inga nya dependencies, tabeller eller externa åtgärder.

## Leverans och gränser
`pnpm start:preview` kör tools/start-preview.cjs, som startar projektets installerade Expo CLI med Node och barnprocessens miljö `{ ...process.env, EXPO_PUBLIC_DEV_PREVIEW: 'true' }`. Expo gör denna publika variabel tillgänglig genom statisk läsning av process.env.EXPO_PUBLIC_DEV_PREVIEW i appen. Skriptet ändrar inte .env eller förälderns miljö. En gemensam policy används i root/AppFlow/callback: endast exakt strängen 'true' tillsammans med __DEV__ === true öppnar lokal förhandsvisning. Vanlig start utan flagga och alla release/TestFlight-byggen följer befintlig auth, även om flaggan av misstag finns i release-miljön. Expo-kontot som Expo Go själv kräver gäller fortfarande.

Förhandsvisningen visar en tydligt märkt syntetisk hundprofil och Hem utan påhittade råd. Namn/födelsedatum kan ändras lokalt för att granska profil och ålder; inga nya MVP-områden eller CMS skapas. Uppgifterna finns endast i minnet, återställs vid omstart och visas aldrig som molnsparade.

I detta läge monteras inte AuthProvider. Ingen sessionsåterläsning, tokenförnyelse, Supabase-fråga/RPC, mejlbegäran eller kontoradering får köras. Callback-routen måste också skyddas från att använda useAuth utan provider. Ordinarie backend, SQL/RLS och authkod behålls. Inget anonymt konto och ingen service-role-nyckel används.

## Deluppgifter
1. Koordinator sparar mandat/plan; Architect granskar v1 och Critic granskar risker före kod.
2. Implementer Luna high: liten testbar flaggpolicy, separat preview-UI, router/AuthProvider-gräns, portabelt Node-startskript och package.json-script. Skrivområden: src, app, tools/start-preview.cjs, package.json. Återanvänd befintliga komponenter/datumvalidering; undvik generell datakälla/framework. Enkel README och städning ingår.
3. QA skriver enbart tests och verifierar flagga/release-gräns, lokal profilvalidering, provider/callback-gräns. Reviewer granskar appkod oberoende av implementer; QA:s tester granskas separat om granskaragenten återanvänds. Security granskar authgränsen. Koordinator sparar rapport och guide.

En skrivare åt gången, högst två deluppgifter samtidigt. Kontroll: pnpm check, iOS-export utan .env, git diff --check och exakt startscripts flaggöverföring. Telefonprov i Expo Go redovisas separat; lokala tester bevisar inte fysisk UI eller Supabase-integration. Ingen betald SDK-körning, externa konton eller mejl används.

## Planreview
Architect architecture_astra: APPROVE v1, samma policy i alla ingångar, ingen import-initiering av klienten, release aldrig preview. Critic app_qa_luna: PROCEED WITH CHANGES; namnge flagga och konkret överföring till Metro. Ovanstående EXPO_PUBLIC_DEV_PREVIEW och barnprocessmiljö preciserar detta utan ny scope/dependency. Faktiska modeller: befintlig Astra TechLead och Luna high för avgränsad Critic-granskning; inte en körning av varje TOML:s modell.

Precisering återgranskad: architecture_astra APPROVE och app_qa_luna Critic PROCEED för exakt v1 med namngiven flagga/startskript.
