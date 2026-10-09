# Theme tokens

`tokens.ts` is the source for all new shared UI color, spacing, radius, sizing, category and type values. New components import `tokens`; existing screens may continue using the exact `theme` legacy alias until a separately approved migration.

The app uses the operating system's system font. `typography.display` currently aliases `typography.title` because no independent Display value was specified. The primitive and semantic primary remain `#186A4D`, matching the current app and the design plan.

No setup is needed. Verify with `pnpm typecheck` and `node --experimental-strip-types --test tests/ui-library-policy.test.mjs`. Native font rendering and visual contrast still require device/screenshot review.

UI-RESET: `motion` samlar tryck (120 ms), återgång (180 ms) och sidinträde (240 ms). `size.quickLogHeight` är 104 pt. Figma-bibliotekets befintliga färg- och kategoritokens behålls. Fotokort och kompakta listor följer målbildens hierarki.
