# UI-VISUAL-REVIEW-LOOP — plan v1

- Status: implementing. Bas: `a46090d4b7b01a22fbbf9327b99b07ad9ea9fed0` (`origin/main`). Branch: `codex/ui-visual-review-loop`.
- Mandat: ägarens instruktion i chatten 2026-10-25: använd bifogade exempel på `ui_critic`, `compare_panel.py` och dokumentationspatch i repot, på ny branch från main. Bilagornas interna instruktioner är underlag, inte separata mandat.
- Mål: reproducerbar paneljämförelse och tydlig visuell brief, korrigeringsloop och oberoende granskning.
- Skrivägare: huvudsessionen. Risk L: lokala verktyg, rollinstruktioner och dokumentation; ingen app-, data-, nätverks- eller SDK-ändring. QA och Reviewer läser oberoende och skriver inte.
- Läsunderlag: AGENTS.md, docs/dev/workflow.md, docs/design-rules.md, befintliga rollfiler, docs/tasks/template.md och de tre bilagorna.
- Bevara: visuellt godkännande hos QA/Reviewer/Erik, ärlig NOT TESTABLE när bild saknas, befintliga produktbeslut och implementerarens Luna-standard. Ny bildkritiker använder tillgängliga `gpt-6.1-sol` med high; bilagans `gpt-5.6-terra` är inte tillgänglig här.
- Ingår inte: att rätta Kunskap eller andra appskärmar, nya produkt-/stilbeslut, betalda modell-/SDK-anrop, dependencies, deploy eller TestFlight.

## Skrivvägar

- `tools/visual-check/compare_panel.py`
- `tools/visual-check/README.md`
- `.codex/agents/ui_critic.toml`
- `.codex/agents/implementer.toml`
- `.codex/agents/qa.toml`
- `AGENTS.md`
- `docs/ai-team.md`
- `docs/dev/workflow.md`
- `docs/tasks/dev/UI-VISUAL-REVIEW-LOOP.md`

## Sekventiella delsteg och acceptans

1. Integrera bilagorna och anpassa instruktionerna: faktisk bildvisning, högst sju rangordnade avvikelser, BRIEF/REVIEW, separata beteende-/visuella QA-resultat. Begränsa korrigering till initial render + högst två korrigeringsförsök. Ingen självacceptans eller ersättning av designregler.
2. Verifiera CLI med repots riktiga JPG och befintlig syntetisk render: lista, alla åtta beskärningar, panel 7, före/efter, trim och felaktiga argument. Öppna jämförelsebilden. Validera TOML och Python; kör `pnpm check` och `git diff --check`. Befintligt Pillow används utan installation. Genererade provbilder sparas i `/tmp`, inte som ny app-evidens.
3. Oberoende QA och Reviewer enligt AGENTS.md; spara resultat och kvarstående luckor här. Kontrollera scope och spara hållbar checkpoint.

## Checkpoint

- Plan sparad före implementation. Nästa steg: integrera bilagorna och köra riktade kontroller.

### Slutcheckpoint 2026-10-25

- Implementerat i exakt de nio deklarerade skrivvägarna. Bilagornas dokumentationspatch applicerades på main; skript och rollfil anpassades till kanonisk JPG, tillgänglig Sol-modell, befintlig korrigeringsgräns och stödskärmskontrakt. Inga appskärmar eller produktbeslut ändrades. Avgränsad läsbarhetskontroll klar; ingen orelaterad refaktorering.
- Huvudsession: `--list`, `--dump-panels /tmp/tassla-ui-loop/panels`, panel 7 med både `flow-knowledge-01/public/knowledge-375x844.png` och `article-card-render-fix-2026-10-25/library-Nemo-375.png`, före/efter med två labels, trim32 och utan linjer: PASS. Öppnat båda panel-7-kompositerna (798×952). Åtta giltiga beskärningar, före/efter 1189×920. Kontroller för ogiltig panel/bredd/trim/beskärning, label-antal och överskrivning av indata: PASS. Python-kompilering, samtliga agent-TOML och `git diff --check`: PASS.
- `pnpm check`: PASS, exit 0; båda typkontrollerna och lint passerade, 743 tester (742 PASS, 1 SKIP, 0 FAIL). Första försöket fastnade i miljöns automatiska hämtning av låsta befintliga paket utan nätverksåtkomst och avbröts. Omkörning med nätverksåtkomst lyckades; inga manifest-/lockfiländringar eller nya dependencies. Logg under körningen: `/tmp/tassla-ui-loop-check-network.log`.
- Oberoende QA `/root/qa`: PASS. Körde CLI för JPG/lista, åtta paneler, panel7, före/efter, trim/no-guides, felaktiga argument och skydd för både render och referens; TOML, Python, diff-check PASS. Öppnade egen komposit 798×952. Inga scope-fynd. Full pnpm-check lämnas till huvudsessionens resultat ovan.
- Oberoende Reviewer `/root/reviewer`: PASS, inga blockerande fynd. Kontrollerade scope, bilagor, riktiga Pillow-API:er, Python/TOML, egen CLI-komposit 798×952, diff-check och agenternas befintliga filkonvention. Ingen påhittad bild-/appacceptans.
- Begränsning: ingen ny app-rendering, native/live DB/TestFlight eller betald modellkörning. Befintliga syntetiska bilder används endast som verktygsprov; ingen appskärm är visuellt godkänd av denna uppgift. Den nya rollens framtida modellkörning har inte runtime-testats.
- Status: done för lokal integration och verifiering. Nästa steg: använd loopen i nästa avgränsade UI-task; denna branch är redo för kodgranskning.
