# Lokala utvecklingsverktyg

Verktygen i den här katalogen är lokala kontroller och stödfunktioner. De använder inga nätverksanslutningar eller produktionshemligheter.

- `python tools/validate_content_inventory.py` kontrollerar den metadata-only innehållsinventeringen.
- `python tools/validate_content_bundle.py` kontrollerar den slutna draft-bundlen och käll-/reviewreferensernas struktur. Lägg till `--publication-check` för att kräva ifyllda granskningsgrindar och inga overifierade påståenden. Det är fortfarande ingen autenticitetskontroll, sakgranskning, databasimport eller publicering.
- Bundle-validatorn låser P04 v1:s exakta redaktionella åldersfönster per slug; de är urvalsmetadata, inte utvecklingsmål eller individuell rådgivning. `before-homecoming` måste förbli exkluderad från vanlig åldersselection.
- Varje versions `body_claim_refs` och varje stegs `claim_refs` måste vara icke-tomma, unika lokala claim-id:n. Validatorn kontrollerar endast referensstrukturen; sakpåståendetäckning och källstöd kräver faktisk mänsklig granskning.
- `supabase/content/mvp-content-v1.sql` är ett statiskt transaktionsutkast. Granska och kör det endast enligt separat godkänd utvecklingsdatabasplan; det är inte ett verktyg som validatorn kör.

Validatorerna använder endast Python-standardbiblioteket. Positiv och negativ fixture-testning ägs av QA i `tests/`; temporära fixtures ska inte ändra originalinventeringen eller bundlen.
