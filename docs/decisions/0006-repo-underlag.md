# 0006 – Repo-underlag alltid på för SDK-teamet

Status: beslutat av Erik 2026-10-11
Datum: 2026-10-11

## Kontext

SDK-agenterna behöver avgränsat projektunderlag för att ge råd om Tassla. Agenterna har inga fil- eller shellverktyg; `run_team.py` läser tillåtna lokala filer och lägger utdrag i deras brief.

## Alternativ

1. **Underlag alltid på** – samma projektbaserade kontext följer varje fråga.
2. **Underlag valfritt** – risk att råd missar känd status och scope.

## Beslut

Repo-underlag är alltid på för SDK-teamet. `--no-repo` stänger av det. `--project-context` är föråldrad och behålls som no-op för kompatibilitet.

## Konsekvenser

Beslutet gäller befintligt skrivskyddat underlag. Det ger inte agenterna verktyg eller åtkomst till appkod. Detaljer och aktuella implementeringsgränser dokumenteras i `docs/ai-team.md`.

## Hur dyrt är det att ändra senare?

Lågt. Flödet kan stängas av med `--no-repo`.

## Vad skulle få oss att ändra oss?

Eriks nya beslut eller verifierad kostnad/sekretessrisk som motiverar en annan standard.
