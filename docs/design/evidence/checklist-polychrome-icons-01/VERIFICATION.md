# Verifiering — CHECKLIST-POLYCHROME-ICONS-01 v2

## Kontroller

- `CI=1 pnpm check` — PASS: TypeScript, Edge TypeScript, ESLint och 98/98 testfiler.
- `node --experimental-strip-types --test tests/checklist-ui.test.mjs tests/daily-activity-ui.test.mjs tests/daily-routine-checklist-icons.test.mjs tests/ui-library-policy.test.mjs` — PASS i full CI-körning.
- `verify-checklist-icons.py` — public 37 kontroller, review 37 kontroller; 0 browserfel. Täcker samtliga 20 val och tonpar vid 375×844, 430×844, kort 375×667, markerad ikon och sparad Hem-rutin.
- `verify-checklist-custom-icons.py` — public 7 kontroller, review 7 kontroller; 0 browserfel. Kunskapens egen punkt klarar 375×844, 430×844, 375×667 med 140 % text; val skrivs och läses tillbaka med samma ikon och färg.
- Ikonkontrast är minst 4,97:1 för de semantiska tonparen. Neutral reserv `list-outline` använder text-/yt-tokens och har 11,95:1 kontrast.
- `python -m py_compile` på båda visual-check-skripten, `python -X utf8 tools/dev_flow.py validate` och `git diff --check` — PASS.

## Evidens och gränser

Public-/reviewbilder och de separata `icon-picker-results.json` samt `custom-checklist-results.json` ligger i respektive katalog. Resultatfilerna har skilda namn eftersom två verifierare tidigare skrev till samma generiska filnamn.

Detta är syntetisk RN Web-evidens. Den verifierar inte native VoiceOver/TalkBack, fysisk Dynamic Type, live Supabase/RLS, migrationsutrullning eller TestFlight.
