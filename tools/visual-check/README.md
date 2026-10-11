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

QA-11-resultat och skärmbilder sparas i `docs/design/QA-11/evidence/`. KNOW-02 har en separat entry/output och skriver till `docs/design/KNOW-02/evidence/`:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_ENTRY=tools/visual-check/know02-app.tsx TASSLA_UI_OUTPUT=/tmp/tassla-preview/site/know02 TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs
python tools/visual-check/verify-know02.py
```

Browserklockan låses till 2026-10-11 kl. 15 UTC för reproducerbara loggtider. `?screen=log&mutation=failed` respektive `unsure` provar återhämtning utan backend. `?state=empty|loading|error` provar lästillstånd.

React Native Web-harnessen registrerar RN `Alert`-alternativen och kan anropa en vald callback via `window.__tasslaAlertActions`; detta verifierar menyvalens kopplade åtgärder, inte native Alert-visning, tangentbords-/VoiceOver-beteende, native PDF eller databas/RLS. Harnessen verifierar inte animationers native bildfrekvens. 140 % text är ett layoutprov, inte fullständig Dynamic Type-verifiering.
