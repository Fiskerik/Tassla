# Redaktionell MVP-inventering

`mvp-content-inventory.json` är metadata för åtta ämnesförslag, inte publicerat innehåll och inte en importfil. Den innehåller inga råd, fulltexter, källor eller databasfält. Alla poster är `proposed` och spärras av källurval och piloturval. Hantering, miljötrygghet, ensamhet och hälsoteman kräver dessutom sakkunniggranskning av hundexpert innan de kan gå vidare.

Åldersfönstren är redaktionella urvalsförslag i veckor. De är inte utvecklingsmål, medicinska intervall eller individuella rekommendationer. Urval och verkliga källor bestäms i en senare innehållsslice; hälso-, tränings- och beteendetext kräver relevant sakkunniggranskning. Inget här godkänner pilot, datainsamling eller publicering.

Kör `python tools/validate_content_inventory.py` för att kontrollera inventeringens slutna metadatafält, de åtta unika posterna, åldersfönster och gransknings-/publiceringsgrindar. Validatorn kontrollerar struktur, inte källornas kvalitet eller att en expertgranskning faktiskt har gjorts.

`mvp-content-bundle-v1.json` innehåller åtta redaktionella/appguider och tre träningsprogram. Erik bekräftade 2026-10-08 att innehållet är godkänt och att hundexperten har verifierat det; detta är dokumenterat i `mvp-content-approval-v1.md`. Tio runtime-stödda versioner är markerade `published`. `before-homecoming` är fortsatt `draft`: den har endast onboarding-kontext, men nuvarande databas/runtime saknar ett kontextfält och skulle annars kunna visa den i vanlig åldersbaserad feed.

Varje version har `body_claim_refs` och varje träningssteg har `claim_refs`, båda begränsade till lokala claim-id:n i samma versions `claim_trace`. Validatorn kan kontrollera struktur och referenser men inte verifiera godkännandets äkthet eller att varje mening faktiskt stöds av källan.

Åldersfönstren i bundle v1 är låsta redaktionella urval: `first-week` 8–12 veckor, `handling-guide` 13–16, `environment-checklist` 17–26 och `being-alone-guide` 27–52. Appguiderna `daily-log-routines`, `weight-history-guide` och `health-records-guide` gäller 0–null och fungerar som yngre/äldre fallback; programmen gäller från 8–null och ska anpassas individuellt. `before-homecoming` är 0–0 enbart som metadata och exkluderas alltid från vanlig selection. Fönstren säger inte när en valp bör utveckla en färdighet. `first-week` får endast tillämpas när valpen nyligen har flyttat hem; ålder bevisar inte detta. Under 8 veckor ska vanlig selection inte visa valpråd eller program.

Kör `python tools/validate_content_bundle.py` för strukturkontroll. `--publication-check` kräver godkända grindar och befintliga evidensreferenser för publicerade versioner; onboardingversionen får förbli draft. Kontrollen är strukturell, inte en autenticitetskontroll.

`supabase/content/mvp-content-v1.sql` är en manuell draft-import med exakt parity-verifiering. Efter den importen kan `supabase/content/publish-mvp-content-v1.sql` köras för att publicera de tio godkända runtimeversionerna. Det är en separat, transaktionell SQL-åtgärd och har inte körts mot en databas här. Appens loaders hämtar endast `status=published`; draftversioner förblir dolda.
