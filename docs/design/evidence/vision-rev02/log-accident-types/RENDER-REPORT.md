# Olyckstyper och mönster — lokal rendergranskning

Datum: 2026-10-14 · Bas: `56bf2246e9fa89613421c9304598daf46c2bf4b9` · Fixture: syntetisk, helt lokal · Status: implementerrender + oberoende QA/Reviewer/Security PASS för A:s avgränsade lokala scope.

## Render och interaktion

Produktionskomponenten `LogScreen`, `CheckboxCard` och `BottomSheet` byggdes med `tools/visual-check/build.cjs`, React Native Web 0.21.2 och projektets Ionicons-font. Browsern var Chromium vid 375×844, 430×844, 375×667 samt 140 % CSS-zoom som webbaserad textskalningsproxy. Browsern rapporterade inga sidfel.

Följande tillstånd fångades:

- [Olycka, Kiss förvalt, 375×844](accident-selector-default-kiss-375x844.png), [430×844](accident-selector-default-kiss-430x844.png), [375×667](accident-selector-default-kiss-375x667.png), [140 % webzoom](accident-selector-default-kiss-140pct-webzoom.png).
- [Inget val: orsak synlig och Spara avstängd](accident-selector-empty-validation-375x844.png). Browserns tillgänglighetsträd gav `aria-checked=true` för förvalt Kiss och `false` för Bajs; efter avmarkering var båda `false`.
- [Redigera känd olycka](accident-edit-typed-375x844.png) och [historisk olycka utan känd typ](accident-edit-legacy-375x844.png).
- [Dubblettbekräftelse](accident-duplicate-confirmation-375x844.png), [Avbryt återställer samma val](accident-duplicate-cancel-retains-selection-375x844.png) och [bekräftad olycka](accident-duplicate-confirmed-375x844.png). Bekräftelsen ligger ovanpå bladet; bladet döljs under bekräftelsen.
- [Pending](accident-pending-375x844.png), [failed](accident-failed-375x844.png) → [retry sparad](accident-failed-retry-saved-375x844.png) och [unsure](accident-unsure-375x844.png) → [retry sparad](accident-unsure-retry-saved-375x844.png).
- [Mönster med två olyckstyper](patterns-accident-count-and-singular-375x844.png): `Kiss: 2 gånger · ungefär var 12 minut` och `Bajs: 2 gånger · ungefär var 22 timme`.

Interaktionen bekräftade att typen väljs innan första skrivning, defaultvalet går att stänga av, tomt val visar exakt en valideringstext och blockerar Spara, dubblettens Avbryt behåller förvalet och dubblettens Bekräfta skickar olyckan. Harnessens retry återanvänder samma fixture-intent och skapar inte en separat fixturepost. Detta är en browserinteraktion med syntetisk state, inte Supabase/readback-verifiering.

## Designregelverk §14

1. **Ja** — snabbvalen har en tydlig huvudhandling per ruta.
2. **Ja** — jämställda Kiss/Bajs-val och Spara/Avbryt har enhetlig form och storlek.
3. **Ja för ändrat befintligt flöde** — Radera är skild från Spara; native raderingsbekräftelse omrenderades inte i den här slicen.
4. **Ej tillämpligt** — regeln avser Hem-rader.
5. **Ja för renderade webviewporter** — 375×844, 430×844, 375×667 och 140 % webzoom; native safe area är `NOT TESTABLE`.
6. **Ja** — befintliga delade `CheckboxCard`, `BottomSheet`, `Dialog`, `Button`, färg- och avståndstokens används.
7. **Ja** — befintlig Ionicons-familj.
8. **Ja för den här vyn** — blå Kiss, varm Bajs och befintliga ytor behålls.
9. **Ja** — etikett, kryssruta och sparad olyckstyp beskriver samma handling.
10. **Ja i renderade tillstånd** — pending/failed/unsure är synliga; sparad typ visas först efter fixture-bekräftelse.
11. **Ja** — återkopplingen säger vad som hände och hur ägaren kan fortsätta.
12. **Ja** — intervallcopy visar singular `minut` och `timme` med befintligt `ungefär`.
13. **Ja för den här ändringen** — rubrik, hjälptext, val och avslutande handling har läsbar ordning.
14. **Ja** — default, tomt val, typed/legacy edit, dubblett, pending, failed, unsure, retry och mönster renderades.
15. **Delvis / native NOT TESTABLE** — checkboxens webb-`aria-checked` och kontrollernas storlek granskades; native VoiceOver/TalkBack, fysisk tangentbordshantering och Dynamic Type verifierades inte.
16. **Ej ombedömd i denna avgränsade ändring** — hela Logga-panelens rev02-likhet hör till sin tidigare skärmleverans.
17. **Ja** — Logg visas som aktiv huvudflik.
18. **Ej tillämpligt** — Logg-ytan identifierar inte en hund.

## Kontroller och gränser

- `pnpm typecheck`: PASS.
- Scoped ESLint för ändrade TypeScript-/TSX-filer: PASS.
- `git diff --check`: PASS.
- `python3 tools/dev_flow.py validate`: PASS.
- React Native Web-bygge: PASS.
- Dog Expert QA, Reviewer och statisk Security: PASS 2026-10-14 för A:s scope. Shared-file hunks som hör till Hemmets åldersändring ingår inte i A:s acceptans eller dessa reviewbeslut; se `docs/tasks/dev/log-accident-home-age.md` v4.1.
- Inga automatiska tester kördes eller lades till.
- Migrationen och authenticated INSERT/UPDATE/readback/RLS kördes inte mot Supabase. Det finns ingen live database-claim; se `LOG-ACCIDENT-RUNTIME-VERIFY-01` i kön.
- Native iOS/Android, VoiceOver/TalkBack, Dynamic Type och fysisk safe area är `NOT TESTABLE` i denna render.
