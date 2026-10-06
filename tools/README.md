# Lokala utvecklingsverktyg

Verktygen i den här katalogen är lokala kontroller och stödfunktioner. De använder inga nätverksanslutningar eller produktionshemligheter.

- `python tools/validate_content_inventory.py` kontrollerar den metadata-only innehållsinventeringen.
- `python tools/validate_content_bundle.py` kontrollerar den slutna draft-bundlen och käll-/reviewreferensernas struktur. Lägg till `--publication-check` för att kräva ifyllda granskningsgrindar och inga overifierade påståenden. Det är fortfarande ingen autenticitetskontroll, sakgranskning, databasimport eller publicering.

Validatorerna använder endast Python-standardbiblioteket. Positiv och negativ fixture-testning ägs av QA i `tests/`; temporära fixtures ska inte ändra originalinventeringen eller bundlen.
