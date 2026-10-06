# Hem och arbetsyta
APP-04A: Utloggning finns under Mer, kräver bekräftelse, blockerar dubbeltryck och kan återförsökas om lokal sessionsrensning inte kan bekräftas. Om lokal session rensas men serverrevokering inte bekräftas visas varningen på signed-out-vyn och ingen retry finns kvar under Mer. Fysisk tangentbords-, VoiceOver- och bottennavigationstestning är NOT TESTABLE lokalt.

`AppFlow.tsx` väljer lokal utvecklingspreview eller, i normalflödet, inloggning och hundprofil. `ProductWorkspace.tsx` är den inloggade arbetsytan: Hem, Logg, Träning och Hälsa ligger i fast bottennavigation. Mer öppnar Kunskap, Tassla-pass och hundprofil. Arbetsytan är nycklad per hund, serialiserar loggläsningar och ignorerar gamla svar vid avmontering.

Hem och Kunskap visar enbart ålders- och rasrelevant publicerat innehåll från Supabase. Hem visar även senaste loggposten och nästa registrerbara steg från en publicerad träningsversion. Ingen exempelhund eller lokalt träningsprogram används som reserv när nätdata saknas. Den dekorativa hundbilden är inte hundens profilfoto. `HealthScreen` och `PassportScreen` är avsiktliga tomma grunder.

`DevelopmentPreview.tsx` är en separat flaggad, RAM-baserad förhandsvisning med syntetiska uppgifter; den gör inga Supabase-anrop. Kör `pnpm start:preview` för den och `pnpm check` för typkontroll, lint och tester. En signerad Google-retur, faktisk backendpolicy och iOS-byggresa behöver separat enhetsverifiering.
