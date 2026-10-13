# UX-spec — rev02 R02-4F: Påminnelser

Datum: 2026-10-13 · Version: 1 · Status: implementing · Ägardirektiv: fortsätt med återstående skärmar.

## Användaruppgift

Ägaren ska kunna välja om Tassla får schemalägga lokala påminnelser på just den här enheten och separat välja en frivillig träningspåminnelse.

## Avgränsning och skyddade beteenden

Endast presentationen i befintliga `NotificationSettingsScreen`. Behåll av som standard, separat enhetsbehörighet och appval, lagring per ägare/enhet, tidvalidering, träningsval, lokal schemaläggning/avbokning, status, retry, okänt utfall, toast, generisk låsskärmstext, info-modal och återgång till Mer. Ingen backend eller leveransgaranti tillkommer.

## Visuell riktning

- Vänsterställd rubrik och synlig tillbakaåtgärd till Mer.
- Varm canvas med amberfärgad opt-in påminnelseaccent och ljusa, rundade valkort.
- Samla appens på/av-val, träningsval och tid i ett tydligt inställningsblock.
- Enhetsbehörighet och aktuell schemaläggningsstatus visas i separat block, så de inte blandas ihop med ägarens val.
- Förklara kort att avstängning på appnivå inte raderar planerna och att schemaläggning inte bekräftar leverans.
- Behåll val/checkboxarnas nuvarande tillståndssemantik och minimum 44 pt tryckyta.

## Filer och render

- `src/features/notifications/NotificationSettingsScreen.tsx`
- `src/components/ui/SupportScreenHeader.tsx` (opt-in stödskärmsrubrik)
- `src/components/ui/index.ts`, `src/features/notifications/README.md`, `tools/visual-check/app.tsx`
- Denna spec, R02-4-plan, queue, rapport och `docs/design/evidence/vision-rev02/r02-4f/`.

Rendera public/review vid 375×844, 430×844, 375×667 och 140 % browserzoom; val av/på, träningsval, permission unknown/granted/denied, dirty/sparar/sparat/fel och info-modal. Endast syntetiska fixtures; native notisbehörighet och leverans är NOT TESTABLE.

## §14 jämförelse

Ingen påminnelsepanel finns i `vision_rev02.jpg`. Jämför mot panelens kort-, färg-, ikon- och rubrikhierarki; punkt 16 ska vara Nej för exakt panelmatch och deldimensionerna redovisas.
