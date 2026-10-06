# Redaktionell MVP-inventering

`mvp-content-inventory.json` är metadata för åtta ämnesförslag, inte publicerat innehåll och inte en importfil. Den innehåller inga råd, fulltexter, källor eller databasfält. Alla poster är `proposed` och spärras av källurval och piloturval. Hantering, miljötrygghet, ensamhet och hälsoteman kräver dessutom sakkunniggranskning av hundexpert innan de kan gå vidare.

Åldersfönstren är redaktionella urvalsförslag i veckor. De är inte utvecklingsmål, medicinska intervall eller individuella rekommendationer. Urval och verkliga källor bestäms i en senare innehållsslice; hälso-, tränings- och beteendetext kräver relevant sakkunniggranskning. Inget här godkänner pilot, datainsamling eller publicering.

Kör `python tools/validate_content_inventory.py` för att kontrollera inventeringens slutna metadatafält, de åtta unika posterna, åldersfönster och gransknings-/publiceringsgrindar. Validatorn kontrollerar struktur, inte källornas kvalitet eller att en expertgranskning faktiskt har gjorts.

`mvp-content-bundle-v1.json` är en separat uppsättning elva fullständiga svenska utkast: åtta redaktionella/appguider och tre träningsprogram. Den har stabila sluggar och UUID:n, versionsbundna påståendespår, källregister och explicita väntande granskningsgrindar. `before-homecoming` har endast onboarding-kontext och får inte visas genom vanlig åldersbaserad urvalsväg.

Kör `python tools/validate_content_bundle.py` för strukturkontroll. Det accepterar väntande utkast men bekräftar inte sakstöd eller att granskning skett. `--publication-check` kräver godkända grindar, befintliga evidensreferenser och inga kvarvarande overifierade påståenden. Även då verifierar verktyget endast fält och filsökvägar; en ansvarig måste själv kontrollera att sakkunnig- och mänsklig granskning faktiskt utförts och att källorna stöder texten.

`supabase/content/mvp-content-v1.sql` är en manuell, idempotent draft-import för separat granskad utvecklingsmiljö. Den lämnar `content_versions.status` som `draft` och skriver inte review- eller publiceringsfält. Därför blir innehållet inte synligt i appen. Inget i bundle eller validator publicerar innehåll. Publicering kräver en senare faktisk granskning och separat godkänt arbetsflöde.
