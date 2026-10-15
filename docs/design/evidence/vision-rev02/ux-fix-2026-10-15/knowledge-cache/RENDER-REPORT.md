# UX-KNOWLEDGE-CACHE-01 — lokal renderings- och scopekontroll

Datum: 2026-10-15 · Branch: `codex/ux-rethink-2026-10-15` · Fixture: `tools/visual-check/know02-app.tsx` · Reviewläge, 375×844 CSS px.

## Omfattning

Produktionskomponenterna `KnowledgeScreen` och `PuppyChecklistScreen` renderades med syntetisk checklistdata. Denna ändring lägger endast till en minnescache för redan bekräftade läsningar. Nyckeln består av session/konto, hund, checklistversion och publicerings-/granskningsläge. Home-datum ingår inte. ProductWorkspace rensar andra scope när konto eller vald hund ändras och raderar sitt aktuella scope när workspace avmonteras, även vid utloggning.

En tidigare oläst fas visas som laddande tills dess läsning är klar. En varm öppnad fas och översikten återanvänds efter tillbakaresa och route-remount. Bekräftade checklistskrivningar uppdaterar detaljens snapshot och översiktens summering; confirmed preference writes uppdaterar även översiktens context. Retry gör en ny källäsning. Misslyckad refresh visar senast bekräftad data med fel och retry-copy. Pending/unknown write-intent och tidigare Kontrollera-flöde behålls.

## Evidens

- [Tidigare oläst fas visar laddning](./unseen-template-loading-375.png).
- [Varm fasdetalj](./warm-template-detail-375.png).
- [Fasdetalj efter route-remount utan ny läsning](./warm-remount-detail-375.png).
- [Nytt konto-/hundscope laddar ny översikt](./scope-change-cold-overview-375.png).
- [Senare fasläsning uppdaterar detaljräknaren](./newer-detail-summary-375.png) och [varm översiktsräknare](./newer-detail-reconciled-overview-375.png).

Manuell Chromium-observation i den syntetiska RN Web-fixturen: kall översikt gjorde 3 checklistläsningar; första öppning av en tidigare oläst fas ökade till 6; återöppning och unmount/remount stannade vid 6; scopebyte gjorde 3 nya läsningar (totalt 9) och visade det nya hundscopets åldersförslag i stället för föregående sparade kontext. Den särskilda `detail-newer`-fixturen visade först 1/4 i översikten, 2/4 i detaljen med två bockar efter en nyare detail-read, och 2/4 vid varm återgång till översikten. Inga sidfel rapporterades. Detta verifierar lokalt cacheval och UI-livscykel, inte produktionsnätverk, Supabase/RLS, persistent cache eller native beteende.

## §14 — deltaegenkontroll

Bedömningen gäller denna cacheändring. Befintlig Knowledge-layout och tidigare fulla §14-bedömning finns i [`r02-3c/RENDER-REPORT.md`](../../r02-3c/RENDER-REPORT.md); dess dokumenterade avvikelse mot panel 7 är oförändrad.

| Punkt | Status | Underlag |
|---|---|---|
| 1 | Ja | Faskortet har en tydlig öppningshandling; retry visas vid läsfel. |
| 2–4 | Ej tillämpligt | Ingen jämställd handlingsgrupp, radering eller Home-rad ändras. |
| 5 | Ja för web-fixtur; native NOT TESTABLE | Renderad vid 375×844; native safe area ingår inte i Chromium. |
| 6–7 | Ja, oförändrat | Befintliga UI-komponenter och Ionicons används; cacheändringen lägger inte till lokal styling eller symboler. |
| 8 | Oförändrad | Befintliga varma ytor och accenter kvarstår; ingen ny kontrastmätning gjordes. |
| 9 | Ja | Fasnamn, öppningshandling och loading-copy beskriver samma innehållsresa. |
| 10 | Oförändrad | Cachen skapar inte optimistisk completion; checkrader hämtas från bekräftad data. |
| 11–13 | Ja för ändrat innehåll | Reviewinnehållet har tydlig tillfällig-märkning; loading/fel-copy är saklig. Övrig Knowledge-copy och bildhierarki är oförändrad. |
| 14 | Delvis | Tidigare oläst fas, warm return, remount och scopebyte renderades. Misslyckad refresh och write-conflict renderades inte i denna slice; tidigare KNOW-02 evidence täcker befintliga synk-/återhämtningslägen. |
| 15 | Delvis / native NOT TESTABLE | Web-fixturen använder semantiska knappar och befintliga träffytor. 44 pt-mått, VoiceOver/TalkBack, Dynamic Type och reducerad rörelse verifierades inte på native. |
| 16a komposition | Oförändrad; full panelmatch Nej | Ingen kompositionsändring. Panel 7:s saknade sökfält/ämneschips kvarstår enligt R02-3C-rapporten. |
| 16b färger | Oförändrad; delvis enligt tidigare rapport | Cacheändringen påverkar inte färgfördelning. |
| 16c typografi | Oförändrad; Ja enligt tidigare rapport | Ingen typografisk ändring. |
| 16d komponentformer | Oförändrad; delvis enligt tidigare rapport | Befintliga kort/segment används. |
| 16e objekt | Ja i syntetisk fixture; produktionsdata NOT TESTABLE | Visad fas och progress kommer från fixture; ingen ägardata eller backend användes. |
| 16f innehållstäthet | Oförändrad; delvis enligt tidigare rapport | Kalla och varma detaljlägen renderades; cache ger ingen ny layout. |
| 16g bildspråk | Oförändrad; delvis enligt tidigare rapport | Checklistcache ändrar inte redaktionella bilder. |
| 17 | Delvis | Checklistfasens tillbakaresa och remount fungerar i fixture; bred navigation mellan sektioner ingick inte här. |
| 18 | Ej tillämpligt | Panel 7 och checklistdetaljen visar inte en identifierad hunds profilfoto. |

## Kontroller och begränsningar

- `pnpm typecheck`: PASS.
- Scoped ESLint på `PuppyChecklistScreen.tsx`, `KnowledgeScreen.tsx`, `checklist-data.ts` och `ProductWorkspace.tsx`: PASS.
- Review RN Web-bygge via `tools/visual-check/build.cjs`: PASS.
- Manuell Chromium-cache-/scopekontroll: PASS enligt läsantal ovan; inga sidfel.
- `git diff --check` och `python3 tools/dev_flow.py validate`: PASS.
- Ingen testsvit, databasoperation eller live-kontodata kördes.
- Oberoende QA delta: PASS 2026-10-15 för detail-summary-reconciliation och warm overview reuse.
- Statisk Security delta: PASS 2026-10-15 för exakt-scope rensning när ProductWorkspace avmonteras. Runtime sign-outflödet är inte provat.
- Oberoende Reviewer: PASS 2026-10-15 för cache scope, återhämtning, bekräftade skrivningar och nyare detail-read som uppdaterar översiktsräknaren.
- Oberoende QA först blockerade en möjlig skillnad mellan parallella overview/detail-läsningar. Efter korrigeringen godkände QA delta: synlig räknare använder samma reconciled summary som cache; `detail-newer` rendern visar 1/4 → 2/4 → 2/4. QA PASS.
- Runtime sign-out, Supabase/RLS, native safe area, native skärmläsare och persistent/offline cache är NOT TESTABLE i denna lokala verifiering.
