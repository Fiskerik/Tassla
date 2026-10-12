# Lokal UI-verifiering

Den här isolerade provytan renderar produktionskomponenterna via React Native Web med syntetiska uppgifter. Den ingår inte i appens routes eller Codemagic-bundle. `app.tsx` håller testdata i minnet. `native.jsx` ersätter PDF/delning, typsnittsladdning och safe-area med testimplementationer. Ionicons använder projektets riktiga font och glyfer. Inga konton eller nätdata används.

Installera verktygen separat så att appens låsfil förblir oförändrad:

```sh
npm install --prefix /tmp/tassla-ui-tools --no-package-lock react-native-web@0.21.2 react-dom@19.2.3 esbuild@0.25.12
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/site
```

I en annan terminal, med Python Playwright och `/usr/bin/chromium` installerade:

```sh
python tools/visual-check/verify.py
```

QA-11-resultat och skärmbilder sparas som standard i `docs/design/QA-11/evidence/`. `TASSLA_UI_EVIDENCE` kan styra resultatkatalogen. HOME-NEXT-01 v7.2 public/review-körningar sparas under `/tmp/tassla-home-next-01-v7.2/{public,review}`; använd `TASSLA_UI_SCOPE=home` för att verifiera Home-/navigationsytan oberoende av äldre Kunskapsflödesassertioner. Checklistan i designregler §14 och oberoende renderade skärmdumpar jämförda med `vision_rev02.jpg` är obligatoriska QA-grindar; saknad evidens är inte ett godkännande.

Publicläge och Home-scoped verifiering:

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/home-next-public node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/home-next-public
TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/public python tools/visual-check/verify.py
```

Reviewläge:

```sh
TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/home-next-review node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/home-next-review
TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/review python tools/visual-check/verify.py
```

Home-harnessen täcker träningssteg, laddning/fel/tomt/färdigt/urvalsbyte, publicerat reviewgated innehåll, en tät dagens-fixture med minst fem valplogghändelser, träningssteg och plan, dagens tre grupper, inline-länk, genvägar, vald femfliksnavigation, Hälsa/Tassla-pass i Mer, 375/430 px och 140 % text. Den verifierar att dagens grupper och genvägar ligger ovanför bottenmenyn. `app.tsx` använder `homeScenario` för syntetiska tillstånd; `TASSLA_UI_REVIEW` avgör om reviewfixture byggs in. Harnessen är bara en React Native Web-rendering med syntetiska data.

KNOW-02 har en separat entry/output och skriver till `docs/design/KNOW-02/evidence/`:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_ENTRY=tools/visual-check/know02-app.tsx TASSLA_UI_OUTPUT=/tmp/tassla-preview/site/know02 TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs
python tools/visual-check/verify-know02.py
```

Browserklockan låses till 2026-10-11 kl. 15 UTC för reproducerbara loggtider. `?screen=log&mutation=failed` respektive `unsure` provar återhämtning utan backend. `?state=empty|loading|error` provar lästillstånd.

React Native Web-harnessen registrerar RN `Alert`-alternativen och kan anropa en vald callback via `window.__tasslaAlertActions`; detta verifierar menyvalens kopplade åtgärder, inte native Alert-visning, tangentbords-/VoiceOver-beteende, native PDF eller databas/RLS. Harnessen verifierar inte animationers native bildfrekvens. 140 % text är ett layoutprov, inte fullständig Dynamic Type-verifiering.
