# UI-MAIN-SWIPE-01 — verifiering

Datum: 2026-10-18
Branch: `codex/tassla-ui-ux-bundle-2026-10-18`
Plan: `docs/tasks/dev/UI-MAIN-SWIPE-01.md` v5; UX-spec v5
Fixture/referens: huvudflödet i syntetisk workspace. Ingen layout eller synlig kontroll avsågs ändras.

## Genomfört

- `node --experimental-strip-types --test tests/main-swipe-rules.test.mjs tests/main-swipe-navigation-policy.test.mjs` — PASS efter korrigering, 8 tester.
- Första oberoende QA blockerade v3: respondern kunde hindra lodrät scroll efter axelbyte. v5 gör överlämning villkorsstyrd och källtestet verifierar att senaste `dx`/`dy` lämnas till regeln. Den korrigerade v5 passerade oberoende QA: överlämningsvillkoret och dess källtest bedömdes korrekt. QA kördes inte om efter dokumentationsnotisen.
- `pnpm check` — PASS: TypeScript, edge-account typecheck, ESLint och 529/529 tester.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS, offentlig iOS JavaScript-bundle exporterad.
- `TASSLA_UI_TOOLS=... TASSLA_UI_OUTPUT=... node tools/visual-check/build.cjs` — PASS, React Native Web-fixture byggd från produktionskomponenter.
- `git diff --check` — PASS.
- `PYTHONUTF8=1 python tools/dev_flow.py validate` — PASS efter task- och evidensuppdatering.

## Visuell kontroll och gestbegränsningar

Fixturens webbundle byggdes, men jämförbar skärmbild kunde inte tas: den installerade Playwright Chromium-binären startade inte i Windows-miljön (fel i Windows side-by-side-konfiguration). Ingen före/efter-bild har därför granskats. Visuell layoutjämförelse är **EJ TESTBAR**. Källändringen omfattar en `flexGrow: 1`-gestyta, `directionalLockEnabled` och villkorsstyrd överlämning när rörelsen inte längre är tydligt vågrät; faktisk påverkan på renderad layout är inte bekräftad.

Enhetstester visar reglerna och statisk wiring. De verifierar inte att React Native lämnar över touchprioritet som avsett. Faktisk svepnavigering, lodrät scroll, inre horisontella kontroller och plattformsprioritet på fysisk enhet är **EJ TESTBARA** här. Detta checkpoint ersätter inte den öppna `VISION-R02-GESTURES`-verifieringen.

## Designregler §14-checklista

1. Ej tillämpligt — inga primära handlingar ändrade.
2. Ej tillämpligt — handlingars visuella vikt ändras inte.
3. Ej tillämpligt — ingen radering.
4. Ej tillämpligt — Hem-rader ändras inte.
5. EJ TESTBAR — före/efter-render saknas; inga layoutmått avsågs ändras.
6. Ja, källkontrollerat — återanvänder befintlig delad gestkomponent och RN scrollvy.
7. Ej tillämpligt — inga ikoner.
8. EJ TESTBAR — jämförbar render saknas; inga färger ändras avsiktligt.
9. Ja, källkontrollerat — svepriktning skickas till befintlig huvudflikcallback.
10. Ej tillämpligt — inga statusmarkörer.
11. Ej tillämpligt — inga banners eller uppmuntran.
12. Ej tillämpligt — ingen UI-copy ändras.
13. EJ TESTBAR — visuell hierarki har inte renderjämförts.
14. Ej tillämpligt — inga nya data- eller sparlägen.
15. EJ TESTBAR på native — beröringsprioritet/plattformstillgänglighet har inte provats; koden bevarar befintliga kontroller.
16. EJ TESTBAR — ingen före/efter-skärmbild kunde tas. Påstås inte visuellt godkänd.
17. Delvis, statiskt verifierat — fem flikar, kunskapsdetaljens avstängningsgrind och ingen rundgång finns kvar; faktisk gest och återresa är EJ TESTBARA.
18. Ej tillämpligt — hundinnehåll och identitet ändras inte.

Statusen avser endast de lokala svepreglerna. Ingen fullgodkänd visuell eller nativegeststatus hävdas.
