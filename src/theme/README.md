# Theme tokens

`tokens.ts` is the source for all new shared UI color, spacing, radius, sizing, category and type values. New components import `tokens`; existing screens may continue using the exact `theme` legacy alias until a separately approved migration.

The app uses the operating system's system font. `typography.display` currently aliases `typography.title` because no independent Display value was specified. The primitive and semantic primary remain `#186A4D`, matching the current app and the design plan.

No setup is needed. Verify with `pnpm typecheck` and `node --experimental-strip-types --test tests/ui-library-policy.test.mjs`. Native font rendering and visual contrast still require device/screenshot review.

`tokens.motion` är enda källa för rörelse-durationer: tryck (120 ms), återgång (180 ms), sidinträde (240 ms), progress (220 ms), Toast in (240 ms), Toast ut (180 ms) och checklistbock (180 ms). React Native `Animated` och `useReducedMotion` används utan ny dependency. `size.quickLogHeight` är 104 pt. Figma-bibliotekets befintliga färg- och kategoritokens behålls. Fotokort och kompakta listor följer målbildens hierarki.
