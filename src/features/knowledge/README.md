# Kunskap

`KnowledgeScreen.tsx` visar enbart publicerat ålders- och rasrelevant innehåll som arbetsytan redan hämtat från Supabase. Hem och Kunskap delar samma version-ID, innehåll och källista; navigation hämtar eller väljer inte om data. Loading, fel med retry och publicerat tomläge är separata. `guide-body.ts` tolkar endast `##`/`###`-rubriker, enkla `- `-listor och stycken till native textblock; rå HTML renderas aldrig. Hem använder en kort vanlig textinledning från samma body. Källor som är syntaktiskt giltiga HTTPS-URL:er öppnas endast efter knapptryck via React Native Linking; öppningsfel visas i vyn. Repositoryreferenser och andra strängar visas som text och länkas inte. `source-links.ts` avvisar annat än giltig HTTPS utan användaruppgifter. Lokal preview skickar inget nätverksanrop och visar ingen artikeltext.

Hälsotexter behöver granskas innan publicering. Kör `pnpm check` för typkontroll, lint och tester; innehållsurvalet kräver en konfigurerad utvecklingsmiljö med publicerade versioner.

`DraftContentPreview.tsx` är en separat granskningsvy som laddar den kanoniska draft-bundlen endast när både `__DEV__` och `EXPO_PUBLIC_TASSLA_DRAFT_PREVIEW=true` är aktiva. Den nås via det lokala `DevelopmentPreview`-flödet, aldrig via `ProductWorkspace` eller publicerat innehåll. Varje text märks `Utkast – ej granskat eller publicerat`.
