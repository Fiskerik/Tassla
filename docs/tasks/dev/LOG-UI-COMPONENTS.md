# LOG-UI-COMPONENTS – plan v1

Datum: 2026-10-08  
Status: planned → implementing under the existing approved DS-CODE-01 segment

## Användaruppgift och scope
Logga-skärmen ska kunna byggas med en varm, lugn och tillgänglig uppsättning delade UI-delar. Den här uppgiften ändrar endast `src/theme/tokens.ts`, `src/components/ui/`, den dev-only-gallerivyn och lintkonfigurationen. Befintliga produktionsskärmar, navigation och dataflöden skyddas.

## Beslut och antaganden
- Primärfärgen är `#186A4D`: den är både dagens appvärde och FIGMA-DS-01:s beslutade gröna 700; `#12543D` används endast för tryckt läge.
- Systemfont används i native; Figma-planens Inter är en proxy och innebär ingen ny dependency.
- `Color/borderStrong` sätts till den beslutade mörkare kontrollkanten `#536257`; `Color/border` behålls för dekorativa kanter.
- Ionicons 15 finns redan installerat. Kategorier mappas centralt; Bajs får den befintliga enkla lokala ikonen.
- Svenska status- och åtgärdstexter följer design-rules §8–9. Success-toast kräver `confirmed`; osäker lagring visas som uncertain med försök igen.

## Deluppgifter
1. Tokeninventering och UI-primitiver – ägare huvudsession; verifiera mot DS-01, INVENTORY och appens nuvarande tokens.
2. Delade komponenter och dev-galleri – ägare implementer; inga produktionsroutes eller dataändringar.
3. Lintregler och rapport – ägare huvudsession; flagga hex/fontSize i app- och feature-skärmar, tillåt tokens.
4. QA/review – separat QA och reviewer; Product granskar copy och Critic granskar friktion. Renderad visuell evidens saknas tills Expo kan köras.

## Verifiering
`pnpm typecheck`, `pnpm lint`, `pnpm test`, `git diff --check`. Skärmdumpar av galleriet försöks köras; annars markeras visuell QA NOT TESTABLE.

## Skyddade filer
Ingen ändring av `src/features/**`, `app/**` (förutom eventuell redan befintlig dev-preview), `src/data/**`, databas eller Figma.

## Reviewstatus
Den bredare DS-CODE-01-slicen är redan arkitektgodkänd och Erik-mandaterad i `docs/tasks/dev/ds-code-01.md` v4.1 och `docs/tasks/dev/queue.json`. Den här planen är en smal korrigering/komplettering av samma write paths: BottomNav, ActionMenu, Skeleton, explicit `borderStrong`, Field-tillstånd och truthful Toast. Nytt scope får inte ändra produktionsskärmar eller data. Architect review av denna precisering: CHANGES; åtgärdspunkterna är införda i komponentkontrakten nedan och måste verifieras igen före slutlig review.

## Kompletterande acceptance
- Alla angivna familjer exporteras från `src/components/ui/index.ts`; Button/AppBar/BottomNav/Field/Toast täcker uttryckliga varianter och states.
- Kontrollkanter använder `tokens.colors.borderStrong`; dekorativa kort/ytor kan använda `border`.
- BottomNav har exakt Hem, Logg, Träning, Hälsa, Mer med home/create/school/heart/grid outline/fylld-ikoner.
- Toast har `success|error|neutral|uncertain`; success kräver `confirmed`, uncertain visar exakt osäker-copy och retry.
- Dev-galleriet visar alla nya familjer och states endast bakom befintlig `__DEV__`-previewport.

## Checkpoint 2026-10-08
Implementerat den kompletterande kodslicen: `borderStrong`, BottomNav, ActionMenu, Skeleton, Button state-prop, AppBar-färg/bakgrund, Field states, ListRow time/detail/chevron och truthful Toast. Product bad om `Sparat` som standardcopy och retry-krav för uncertain; Critic blockerare om delningscopy, ListRow-kontrakt och statiskt pressed-state är åtgärdade. Typecheck/lint kunde inte köras eftersom paket saknas och registryåtkomst gav EPERM; `git diff --check` passerar. Rendering är NOT TESTABLE.
