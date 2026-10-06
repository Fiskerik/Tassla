# Redaktionell MVP-inventering

`mvp-content-inventory.json` är metadata för åtta ämnesförslag, inte publicerat innehåll och inte en importfil. Den innehåller inga råd, fulltexter, källor eller databasfält. Alla poster är `proposed` och spärras av källurval och piloturval. Hantering, miljötrygghet, ensamhet och hälsoteman kräver dessutom sakkunniggranskning av hundexpert innan de kan gå vidare.

Åldersfönstren är redaktionella urvalsförslag i veckor. De är inte utvecklingsmål, medicinska intervall eller individuella rekommendationer. Urval och verkliga källor bestäms i en senare innehållsslice; hälso-, tränings- och beteendetext kräver relevant sakkunniggranskning. Inget här godkänner pilot, datainsamling eller publicering.

Kör `python tools/validate_content_inventory.py` för att kontrollera inventeringens slutna metadatafält, de åtta unika posterna, åldersfönster och gransknings-/publiceringsgrindar. Validatorn kontrollerar struktur, inte källornas kvalitet eller att en expertgranskning faktiskt har gjorts.
