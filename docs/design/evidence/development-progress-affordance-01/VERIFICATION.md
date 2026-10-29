# DEVELOPMENT-PROGRESS-AFFORDANCE-01 — verifiering

Lokal RN Web-kontroll av ändrad åldersbåge, Hemmets fasrad och utvecklingsrubrik. Fixtures är syntetiska; jämförelsen gäller lokalt UI, inte produktionsdata eller iPhone/TestFlight.

## Render och beteende

- Public: `public/RESULTS.json` — 32/32 PASS vid 375 och 430 pt. Täcker tidig, normal och ungefärlig mittpunktsålder; båglängden växer monotont; neutral track och grön passed stroke har samma SVG-båge; åldersetiketten kan döljas/återställas utan att progress försvinner; vuxen/saknad/ogiltig/framtida ålder visar ingen båge; Doos-titel; knappens färg, kant, radbrytning, träffyta och Hem → Utveckling.
- Review: `review/RESULTS.json` — 32/32 PASS på samma ändrade ytor samt loading/error för guider.
- Home-knappens 140 % CSS-textproxy vid 375 px behåller fastexten och fria ytan före porträttet; detta är inte native Dynamic Type.
- Öppnad jämförelse: `public/compare-panel2-development-progress-midpoint-375.png` (panel 2 + utvecklingsvy; 798×1069 px). Separata captures visar normal valp, mittpunktsålder, Hem-fasrad normalt/140 % och `Doos utveckling`.
- Oberoende QA PASS för de begärda ändringarna. Samma jämförelsebild visar att hela panel 2 fortfarande skiljer sig i komposition: referensens stora porträtt, integrerade båge och tätare milstolpsyta motsvaras av separat bildremsa, båge och efterföljande block i appvyn. Helpanelens komposition/bildspråk/innehållstäthet är därför **ÖPPNA**, inte godkända av denna task.

## Kodkontroller

- `node --experimental-strip-types --test tests/development-screen-model.test.mjs` — PASS.
- `CI=1 pnpm check` — TypeScript, Edge TypeScript och ESLint PASS; 829 test PASS, 1 skip.
- `python -m py_compile tools/visual-check/verify-vision-r02-home-panels.py` — PASS.
- `python -X utf8 tools/dev_flow.py validate` och `git diff --check` — PASS efter QA och Frozen Reviewer.

UI Critic och oberoende beteende/visuell QA bedöms separat. Native iOS VoiceOver, fysisk träffyta, Dynamic Type och TestFlight är **NOT TESTABLE** här. Ingen navigation, åldersberäkning, persistens eller databas ändrades.

Full checklista enligt `docs/design-rules.md` §14, inklusive separata §14.16-statusar och motivering för kvarstående helpanelsskillnader, finns i `REVIEWS.md`.
