# Kunskap

`KnowledgeScreen.tsx` visar enbart publicerat ålders- och rasrelevant innehåll som arbetsytan redan hämtat från Supabase. Artikeltext renderas som vanlig text, inte HTML. Om urvalet är tomt visas ett ärligt tomläge. Lokal preview skickar inget nätverksanrop och visar ingen artikeltext.

Hälsotexter behöver granskas innan publicering. Kör `pnpm check` för typkontroll, lint och tester; innehållsurvalet kräver en konfigurerad utvecklingsmiljö med publicerade versioner.
