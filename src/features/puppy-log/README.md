# Vardagslogg

`LogScreen.tsx` visar snabbregistrering, grupperad lokal historik och redigering. `log-model.ts` innehåller den rena domänmodellen för de sex loggtyperna, lokal datum/tid-validering och immutabla liständringar.

`DevelopmentPreview` äger loggposterna i minnet och behåller dem när användaren byter skärm. Exempelposter är märkta och ändringar försvinner när appen startas om. Modulen gör inga nätverks-, lagrings- eller serveranrop och visar ingen synkstatus.

Kör `pnpm check` för projektets typning, lint och testsvit. Modellen är fristående från React Native så QA kan testa den separat.
