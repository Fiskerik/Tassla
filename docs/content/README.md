# Redaktionell MVP-inventering

`mvp-content-inventory.json` är metadata för åtta ämnesförslag, inte publicerat innehåll och inte en importfil. Den innehåller inga råd, fulltexter, källor eller databasfält. Alla poster är `proposed` och spärras av källurval och piloturval. Hantering, miljötrygghet, ensamhet och hälsoteman kräver dessutom sakkunniggranskning av hundexpert innan de kan gå vidare.

Åldersfönstren är redaktionella urvalsförslag i veckor. De är inte utvecklingsmål, medicinska intervall eller individuella rekommendationer. Urval och verkliga källor bestäms i en senare innehållsslice; hälso-, tränings- och beteendetext kräver relevant sakkunniggranskning. Inget här godkänner pilot, datainsamling eller publicering.

Kör `python tools/validate_content_inventory.py` för att kontrollera inventeringens slutna metadatafält, de åtta unika posterna, åldersfönster och gransknings-/publiceringsgrindar. Validatorn kontrollerar struktur, inte källornas kvalitet eller att en expertgranskning faktiskt har gjorts.

`mvp-content-bundle-v1.json` innehåller åtta redaktionella/appguider och tre träningsprogram. Erik bekräftade 2026-10-08 att innehållet är godkänt och att hundexperten har verifierat det; detta är dokumenterat i `mvp-content-approval-v1.md`. Tio runtime-stödda versioner är markerade `published`. `before-homecoming` är fortsatt `draft`: den har endast onboarding-kontext, men nuvarande databas/runtime saknar ett kontextfält och skulle annars kunna visa den i vanlig åldersbaserad feed.

Varje version har `body_claim_refs` och varje träningssteg har `claim_refs`, båda begränsade till lokala claim-id:n i samma versions `claim_trace`. Validatorn kan kontrollera struktur och referenser men inte verifiera godkännandets äkthet eller att varje mening faktiskt stöds av källan.

Åldersfönstren i bundle v1 är låsta redaktionella urval: `first-week` 8–12 veckor, `handling-guide` 13–16, `environment-checklist` 17–26 och `being-alone-guide` 27–52. Appguiderna `daily-log-routines`, `weight-history-guide` och `health-records-guide` gäller 0–null och fungerar som yngre/äldre fallback; programmen gäller från 8–null och ska anpassas individuellt. `before-homecoming` är 0–0 enbart som metadata och exkluderas alltid från vanlig selection. Fönstren säger inte när en valp bör utveckla en färdighet. `first-week` får endast tillämpas när valpen nyligen har flyttat hem; ålder bevisar inte detta. Under 8 veckor ska vanlig selection inte visa valpråd eller program.

Kör `python tools/validate_content_bundle.py` för strukturkontroll. `--publication-check` kräver godkända grindar och befintliga evidensreferenser för publicerade versioner; onboardingversionen får förbli draft. Kontrollen är strukturell, inte en autenticitetskontroll.

`supabase/content/mvp-content-v1.sql` är en manuell draft-import med exakt parity-verifiering. Efter den importen kan `supabase/content/publish-mvp-content-v1.sql` köras för att publicera de tio godkända runtimeversionerna. Det är en separat, transaktionell SQL-åtgärd. Erik rapporterar att senaste committen har migrerats till Supabase, men denna checkout har ingen liveanslutning/readback och verifierar inte om migration, innehållsimport eller separat publiceringsskript faktiskt körts. Appens loaders hämtar endast `status=published`; draftversioner förblir dolda.

## Aktuell täckning för Kunskap och Träning — 2026-10-24

Detta är en läsning av repository, UI-filter och SQL-underlag, inte en liveinventering av Supabase. Bundle v1 har 11 versionsposter: tio är markerade `published` i det godkända bundle-/publiceringsunderlaget och `before-homecoming` är `draft`. `KnowledgeScreen` visar bara `article`/`guide` i guidevyn; de sex artiklarna nedan har publiceringsstatus i bundle v1 och kan renderas där om motsvarande versioner finns publicerade i aktuell databas. Den sjunde icke-programversionen, `environment-checklist`, filtreras bort från guidevyn och är inte en faschecklista.

| Slug | Guide | Åldersurval |
|---|---|---|
| `first-week` | Första veckan hemma | 8–12 veckor |
| `daily-log-routines` | Vardagslogg och rutiner i Tassla | 0+ |
| `handling-guide` | Trygg hantering bygger på frivillighet | 13–16 veckor |
| `being-alone-guide` | Hjälp valpen att vara själv en liten stund | 27–52 veckor |
| `weight-history-guide` | Så fungerar vikthistoriken | 0+ |
| `health-records-guide` | Registrera en utförd vaccination eller ett veterinärbesök | 0+ |

Urvalsbegränsning: `first-week` har åldersmetadata 8–12 veckor, men texten gäller valpar som nyligen flyttat hem och ålder visar inte flyttdatum. Runtime-urvalet använder ålder, inte en verifierad flytthändelse. Den får därför inte framställas som relevant för alla valpar i åldersfönstret utan att kontraktet förtydligas.

De tre bundle-programmen är markerade `published` från 8 veckor: `handling-program` (Trygg hantering i små steg), `environment-program` (Utforska miljön med trygghet) och `being-alone-program` (Öva på att vara själv i hundens takt). Träning kan visa dem när dessa versioner finns publicerade i aktuell databas. Den avvikande bundleposten är `environment-checklist` (17–26 veckor, Trygghet i nya miljöer), med `content_type=checklist`; det är en guidepost, inte den separata faslistan i Kunskap.

Publik FAQ-täckning är **0 svar**. `FAQScreen` visar följande fyra statiska poster i `review-content.ts` endast när granskningsflaggan är aktiverad; denna fixture-modell har inga källfält och posterna saknar publicerat versionsunderlag:

| Review-ID | Fråga | Kontext |
|---|---|---|
| `review-v1:faq:first-night` | Hur kan första natten bli lugnare? | Första dagarna hemma |
| `review-v1:faq:alone-time` | När börjar vi träna på att vara ensamma? | Första dagarna hemma |
| `review-v1:faq:child-contact` | Hur möter barn valpen på ett tryggt sätt? | Före hemkomst |
| `review-v1:faq:course` | När passar en valpkurs? | Efter ålder |

Den lokala faschecklistekatalogen för D3 innehåller nu sex versionerade faser och 18 befintliga punkter, med sakkunniggranskad text/källmappning och separata draft-import-/publiceringsskript. Validatorn, importen, separat publicering och appadaptern har implementerats lokalt. Den 2026-10-26 passerade import-/publiceringsskript och published-only RLS/owner-data-prob i isolerad disposable PostgreSQL 16.15 med syntetiska fixturer; importens idempotens och vägran vid ändrad granskad titel verifierades. Ingen live Supabase-migration, import, publicering eller readback utfördes, så fjärrstatus är okänd. Katalogen renderas publikt i appen först när alla sex versioner finns publicerade i målmiljön. Den tidigare read-only inventeringen fann **0** publicerade faslistor. Den befintliga `review-v1`-katalogen seedas av `202610110002_puppy_checklists.sql`. Fasidentitet, framsteg och egna punkter behåller sina stabila mall-ID:n och item keys.

| Review-ID | Fasrubrik | Åldersurval |
|---|---|---|
| `review-v1:before-homecoming` | Inför hemkomsten | Före hemkomst (0–7 metadata, ej faktisk ålder) |
| `review-v1:first-days` | Första dagarna hemma | Alla åldrar, kontextval |
| `review-v1:8-12-weeks` | 8–12 veckor | 8–12 veckor |
| `review-v1:3-6-months` | 3–6 månader | 13–25 veckor |
| `review-v1:6-12-months` | 6–12 månader | 26–51 veckor |
| `review-v1:over-1-year` | Över ett år | 52+ veckor |

Sex ytterligare Markdown-artiklar under [`artiklar/`](artiklar/README.md) står som `draft` och ligger utanför den låsta bundle v1/importen. README:n för artiklarna dokumenterar ägarens bekräftelse att deras review-gates motsvarar genomförd granskning, men statusen är fortfarande draft och materialet är inte inkopplat i appens publicerade katalog. Det är återanvändningskandidater, inte publicerat innehåll:

| Titel | Källfil |
|---|---|
| Ensamhetsträning i valpens takt | [`artiklar/ensamhetstraning-i-valpens-takt.md`](artiklar/ensamhetstraning-i-valpens-takt.md) |
| Lär känna hundens kropp och varningssignaler | [`artiklar/koll-pa-hundens-kropp-och-varningssignaler.md`](artiklar/koll-pa-hundens-kropp-och-varningssignaler.md) |
| Så blir valpen rumsren – en lugn rutin | [`artiklar/sa-blir-valpen-rumsren.md`](artiklar/sa-blir-valpen-rumsren.md) |
| Socialisering och miljöträning utan press | [`artiklar/socialisering-och-miljotraning.md`](artiklar/socialisering-och-miljotraning.md) |
| Sömn och återhämtning för hundar | [`artiklar/somn-och-aterhamtning-for-hundar.md`](artiklar/somn-och-aterhamtning-for-hundar.md) |
| Valpens första dagar hemma | [`artiklar/valpens-forsta-dagar-hemma.md`](artiklar/valpens-forsta-dagar-hemma.md) |

Den äldre `mvp-content-review-v1.md` beskriver förhandsgranskning; `mvp-content-approval-v1.md` gäller ägarens senare godkännande av exakt de tio bundleversionerna, inte FAQ:er eller faschecklistor.

Erik godkände D3-plan v5:s schema-/mappingförslag den 2026-10-24; [schema-/mappingstasken](../plans/UI-UX-ANVANDARPLAN-2026-10-24.md#knowledge-d3-catalog-schema-01--schema-och-stabil-fasidentitet-v5) har Architect APPROVE, Security PASS, Critic PROCEED, oberoende QA PASS och Reviewer PASS. Catalog-, foundation-, icon-, puppy-checklist- och training-progression-proberna passerar i disposable PostgreSQL 16; träningsfixturen publicerar nu v1 och v2 sekventiellt och behåller replay-testet för indragen v1. Schemaimplementationens commit `240362753b4deec30766b3c3b8226a6c40975748` är pushad på sin arbetsbranch. `KNOWLEDGE-PHASE-CATALOG-01` har nu lokal JSON, innehållsgranskning, validator, separata draft-import-/publiceringsskript och appadapter. Kör `python -X utf8 tools/validate_knowledge_catalog.py` före båda SQL-skripten: den jämför deras inbäddade importfält/URL:er och review-hashar med granskad JSON och avvisar ändrat SQL-payload. SQL-skripten och RLS-proben behöver fortfarande köras mot disposable PostgreSQL 16; dessa nya skript har inte körts, ingen live migration/readback utförts, och innehållsstatus i Supabase är **inte verifierad här**. Syntetisk webbrender visar endast UI/datakontrakt, inte live publicering.

## AI-ursprungsmärkning och publicering

Före import och apprelease appliceras `supabase/migrations/202610180002_content_ai_origin.sql`. Draft-importen markerar alla elva v1-versioner `is_ai_generated=true` och verifierar ursprunget tillsammans med exakt body/source-paritet. Kör importen före `supabase/content/publish-mvp-content-v1.sql`, som publicerar de tio godkända runtimeversionerna och verifierar deras ursprung; `before-homecoming` förblir AI-markerad draft. Appen visar `AI-genererat innehåll` när en guide eller ett träningsprogram öppnas. Migrerings-, import- och publiceringsstatus i fjärrdatabasen är inte verifierad i denna checkout.
