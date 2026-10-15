# UX-FIX-BASELINE-WINDOWS-01 — Windows-portabla baslinjetester

Status: plan v1 godkänd av Architect och Critic 2026-10-15. Lokal kandidat: `9a81815993f015478be480f9c8d19b0923b05f76`.

## Syfte

Göra två redan befintliga baslinjetester portabla på Windows. Ingen produktkod eller UX-semantik ändras.

## Ägare och avgränsning

- Implementer: `gpt-6-luna`, medium.
- Skrivägare för testfiler enligt repoägarskapet: QA.
- Endast `tests/content-release-guard.test.mjs` och `tests/toast-compact-policy.test.mjs` får ändras.
- Inga nya dependencies, inga borttagna tester och ingen ändring av produktkod.

## Godkänd lösning

1. `content-release-guard.test.mjs`: konvertera `new URL(..., import.meta.url)` med `fileURLToPath` innan sökvägen skickas till `spawnSync`; behåll alla fem scenarier och metadata-/exitassertioner.
2. `toast-compact-policy.test.mjs`: normalisera CRLF/CR till LF för den inlästa LogScreen-källan innan befintliga strikta ordningsassertioner; behåll exakt `grid → successToast → Fler`, expanded-grid efter `Fler` och samtliga feedbackassertioner.

Architect APPROVE: testportabiliteten är säker och ändrar inte produkt-, cache-, schema- eller UX-kontrakt. Critic PROCEED: båda felen är reproducerade som Windows-sökvägs-/radslutsproblem; den strikta semantiska täckningen bevaras.

## Acceptans och verifiering

- Riktade Node-tester för de två filerna passerar.
- `pnpm test`, därefter `pnpm check`, passerar på kandidatbasen.
- `git diff --check` och `python tools/dev_flow.py validate` passerar.
- Diffen innehåller bara de två testfilerna. Full check som fortfarande faller innebär blockerad checkpoint och dokumenterat exakt fel, inte DONE.

## Checkpoint

Baseline på 9a81815: typecheck, edge typecheck och lint passerade; `pnpm test` föll i de två ovanstående testfilerna (content guard `C:\C:\...` och CRLF/LF-sentineln i toast-policy). Ingen implementation av UX-FIX har börjat.
