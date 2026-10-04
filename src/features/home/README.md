# Hem och previewskal

`AppFlow.tsx` är ingången till det inloggade produktflödet och grinden till utvecklingspreviewn. `DevelopmentPreview.tsx` äger previewnavigationen, den syntetiska hunden, redigerbara profilen, loggen och träningsprogressionen i React-minnet. Värdena överlever sidbyten och nollställs när appen startas om. `PreviewHomeScreen.tsx` visar hunden, ett ärligt tomläge för publicerat innehåll och en genväg till nästa steg att registrera.

I det inloggade flödet läser `AppFlow.tsx` sessionen från `AuthProvider`, hämtar ägarens hund och hämtar publicerat innehåll via `src/data/app-data.ts`. Previewskärmarna använder inte Supabase, auth, beständig lagring eller nätverksanrop. De fyra flikarna är Hem, Logg, Träning och Mer. Mer öppnar de visuella grunderna för Hälsa, Kunskap och Tassla-pass.

Starta lokal preview med `pnpm start:preview`; kör `pnpm check` för typkontroll, lint och tester. Previewn använder bara syntetiska uppgifter. Serverinnehåll visas bara i det inloggade flödet, och de tre underskärmarna saknar aktiv funktionsdata.
