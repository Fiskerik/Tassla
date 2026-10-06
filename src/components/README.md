# Gemensamma UI-komponenter
APP-04A: `AppScreen` använder keyboard-aware scrollning med dragavvisning. Faktisk tangentbordsruntime, VoiceOver, stor text och bottennavigation är NOT TESTABLE lokalt och kräver APP-04A-PHONE.
`AppPrimitives.tsx` innehåller den varma Tassla-ytan, rubriker, textfält, statuskort och primära/sekundära knappar. `AppScreen` kan komponera en fast sidfot under scrollområdet för preview-navigation; authskärmar använder den utan sidfot. Skärmarna använder `src/theme/tokens.ts`. Tryckrespons är tydlig och läser systemets reducerad rörelse-inställning; textfält och knappar har minst 48 punkters tryckyta.

Komponenterna är avsiktligt små och används av inloggning, onboarding och Hem. Kör `pnpm check`. Skärmläsare, stor text och fysisk enhetslayout behöver fortfarande QA på iOS och Android.
