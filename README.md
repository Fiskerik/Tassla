# Tassla

Gratis iOS-app för valpägare. MVP och arkitektur är godkända av Erik. Leveransmål: Hem, Valplogg, Träning, Hälsa, Kunskap och enkelt Tassla-pass enligt docs/mvp.md och docs/Architecture.md.

## Första appsegmentet
APP-01 bygger e-post → magic link → hundprofil → Hem. Expo Router hanterar navigation; Supabase hanterar session, databas och serverns åtkomstregler. Hem visar publicerat innehåll eller ett ärligt tomt läge. Övriga MVP-skärmar kommer i senare segment.

Start: `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm start` i projektroten med Node 24/pnpm 11.19.0. Full guide för callback, Codemagic och telefonprov: [docs/dev/app-start.md](docs/dev/app-start.md). `pnpm bundle:ios` kontrollerar JavaScript-bundling, inte signering eller verklig iPhone-inloggning.

## Viktiga delar
Tillfällig gränssnittsgranskning utan appinloggning: `pnpm.cmd start:preview`. Testprofilen ligger enbart i minnet; Supabase och ordinarie auth behålls. Release har inget previewläge. Se startguiden ovan.

APP-02 utökar förhandsvisningen till alla sex MVP-områden. Vardagslogg och Träning får lokal interaktion och exempel; Hälsa, Kunskap och Tassla-pass är sidgrundar. Detta är en lokal UI/domänleverans, inte komplett moln-MVP. Checkpoints och verifieringsresultat finns i docs/tasks/dev/app-02-report.md.

- app/: routerns ingång och authcallback.
- src/features/account/: inloggning/session; onboarding/: hundprofil; home/: ägarens Hem.
- src/data/: Supabase-klient, säkert sessionslager och databasåtkomst.
- src/components/ och src/theme/: gemensamt gränssnitt och Tasslas färger/typografi.
- supabase/migrations/ och supabase/tests/: beslutad foundation och syntetiska RLS-tester. Erik har visat lyckat foundation-test; kör inte initialmigrationen igen.
- codemagic.yaml: förberett manuellt iOS-workflow, ännu inte verifierat på byggserver.
- docs/tasks/dev/: plan, checkpointkö och verifieringsrapporter.
- test_agent.py/run_team.py/tassla_team/: separat rådgivande SDK-team; det startar inte appen.

## Nycklar och begränsningar
Behåll Supabase URL/publishable key i lokala `.env` enligt `.env.example`. Behåll separat befintlig OPENAI_API_KEY för SDK-teamet; använd aldrig EXPO_PUBLIC för den. Secret/service_role och databaslösenord hör inte hemma i appen.

Ingen Google-inloggning, OTP, kontoradering, analys, offlinekö eller pilotleverans ingår i APP-01. Native iOS/Auth/dataintegration måste verifieras på telefon enligt guiden. Kontoradering och övriga releasekrav ska lösas före extern distribution.
