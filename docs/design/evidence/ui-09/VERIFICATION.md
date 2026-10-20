# UI-09 — verifiering av kompakt loggbekräftelse

Datum: 2026-10-19
Status: **RN Web-rendering verifierad för den avgränsade toast-resan; full rev02- och nativeacceptans är öppen.**

## Metod

Aktuell `LogScreen`, `Toast` och `BottomNav` renderades med syntetisk kisshändelse i en tillfällig React Native Web-harness. Viewport: 375×667. Normalbilderna använder standardtext; 140 %-bilderna använder DOM-baserad text- och radavståndsskalning efter layout som webbstresstest. Safe-area-inset är 0. Detta bevisar inte native Dynamic Type, VoiceOver/TalkBack eller plattformens touchmätning.

## Evidens

| Tillstånd | Normal text | 140 % webbstresstest |
|---|---|---|
| Bekräftad sparning, `Fler` stängt | [PNG](log-success-375x667.png) | [PNG](log-success-375x667-font140.png) |
| Bekräftad sparning, `Fler` öppet | [PNG](log-success-more-open-375x667.png) | [PNG](log-success-more-open-375x667-font140.png) |
| Fel med försök igen/avbryt | [PNG](log-error-retry-375x667.png) | [PNG](log-error-retry-375x667-font140.png) |
| Full Logga-vy mot rev02 | [Jämförelse](log-rev02-comparison.png) | — |

## Resultat

- Bekräftad sparning visar en kompakt grön toast med bock och `Kiss loggat`, efter de fyra vanliga snabbvalen och före `Fler`.
- `Ångra` syns både när `Fler` är stängt och öppet. I 375×667-bilden med 140 %-text ligger toasten kvar ovanför `Fler` och täcker inga snabbval.
- Fel-fixturen visar `Kunde inte spara`, `Försök igen` och `Avbryt`; den visar ingen grön bock eller falsk sparbekräftelse.
- Att öppna `Fler` renderade Promenad, Olycka och Vatten utan JavaScript-fel efter att harnessens saknade `global`-alias för React Native-polyfyllnaden lades till. Detta var ett harnessfel, inte en produktionsändring.
- Källpolicytestet `tests/toast-compact-policy.test.mjs` kontrollerar att endast bekräftad sparning får bock/compact-success, att Ångra/Retry/Cancel bevaras och att val via `Fler` stänger expansionen. Screenshoten visar öppet tillstånd; testet täcker urvalskontraktet.
- `Button` använder befintlig `tokens.size.touchMin` (44 px) för ikonvarianten. Fysisk tryckyta och native semantik är inte mätta i denna harness.

## Responsiv matris och scrollkontroll 2026-10-20

En kompletterande headless RN Web-körning täcker 360 och 430×844 vid normal text och 140 % post-layout-stresstest. För varje kombination fångades bekräftad sparning med `Fler` stängt/öppet och fel med försök igen/avbryt: 12 nya renderingar. Mätningarna finns i [responsiv matris](responsive-matrix-2026-10-20.json); ingen horisontell overflow, JavaScript-pageerror eller överlapp mellan toasttext och snabbvalsetiketter observerades. `Ångra` mäter 44×44 CSS px i webbrenderingen, inte fysiska pt.

Det fokuserade policytestet `node --experimental-strip-types --test tests/toast-compact-policy.test.mjs` passerade 5/5 den 2026-10-20. Det täcker endast UI-kontrakt och ersätter inte de saknade skärmbilderna efter val från `Fler`.

| Tillstånd | 360×844 normal | 360×844 140 % | 430×844 normal | 430×844 140 % |
|---|---|---|---|---|
| Success, `Fler` stängt | [PNG](log-success-360x844.png) | [PNG](log-success-360x844-font140.png) | [PNG](log-success-430x844.png) | [PNG](log-success-430x844-font140.png) |
| Success, `Fler` öppet | [PNG](log-success-more-open-360x844.png) | [PNG](log-success-more-open-360x844-font140.png) | [PNG](log-success-more-open-430x844.png) | [PNG](log-success-more-open-430x844-font140.png) |
| Error med retry/avbryt | [PNG](log-error-360x844.png) | [PNG](log-error-360x844-font140.png) | [PNG](log-error-430x844.png) | [PNG](log-error-430x844-font140.png) |

En extra 360×844/140 %-kontroll med `Fler` öppet bekräftade att huvudåtgärden är fullt åtkomlig ovanför bottenmenyn utan page errors; se [scrollbilden](log-success-more-open-360x844-font140-scrolled.png). Mätningen vid startposition visar dock bara 0,42 CSS px mellan sista åtgärdens nederkant (766,58 px) och tablistens överkant (767 px). Ingen överlappning observerades, men spacing är visuellt mycket tight. Arkitektens råd är att hantera detta separat i FLOW-LOG/UI efter kontroll av gemensam `AppScreen`-inset (som redan använder `tokens.spacing.xxl`) för att undvika dubbel safe-area-/bottenpadding. Att välja en typ ur expanderat `Fler` täcks av policytestet men saknar egen efter-val-skärmbild.

140 %-bilderna använder post-layoutsskalning av DOM-text/radavstånd och är en webbstresstestproxy, inte native Dynamic Type. Safe area, skärmläsare, reducerad rörelse och fysisk tryckyta är fortsatt NOT TESTABLE.

## §14-bedömning för UI-09

Bedömningen avser bara den fokuserade toastresan, inte godkännande av hela Logga-skärmen. `N/A` betyder att kriteriet inte gäller en toast; `NOT TESTABLE` betyder att bevis saknas. Rev02-jämförelsen av hela skärmen har en separat utgång.

| §14 | Bedömning för UI-09 | Underlag / avgränsning |
|---|---|---|
| 1 | Ja | Toastens nästa handling är tydlig; fel-fixturen visar Försök igen och Avbryt med skilda visuella roller. |
| 2 | N/A | Ingen grupp av jämställda poster/handlingar bedöms i denna toastgrind. |
| 3 | N/A | Raderingsbekräftelse ingår inte i de fångade toast-fixturerna. |
| 4 | N/A | Hemrader och deras fördjupningsväg ingår inte. |
| 5 | Nej, separat FLOW-LOG/UI | 360×844/140 %-webbproxy mätte 0,42 CSS px mellan sista åtgärd och tablist. Ingen överlappning; gemensam AppScreen-inset behöver utredas separat innan lokal padding ändras. |
| 6 | Ja | Befintliga delade Toast-/Button-komponenter och tokens används; inga lokala stylingundantag infördes i UI-09. |
| 7 | Ja | Bekräftelseikonen använder verifierad Ionicons-symbol; statisk API-granskning finns dokumenterad i historisk checkpoint. |
| 8 | NOT TESTABLE | Semantiska success/error-färger syns, men rev02-färgbalans och kontrastmätning bedöms inte i den smala toastgrinden. |
| 9 | Ja | Bock visas bara vid bekräftad success; fel har retry/cancel utan falsk sparsignal. |
| 10 | Ja | Bekräftad toast visar bock; ingen obekräftad statusbock förekommer i testade states. |
| 11 | N/A | Uppmuntransbanners och §8-copy ingår inte. |
| 12 | Ja | Testad statuscopy är kort och vardaglig: `Kiss loggat` respektive `Kunde inte spara`. |
| 13 | NOT TESTABLE | Hel Logga-copy-, metadata- och bildhierarki kan inte godkännas från toastens utsnitt. |
| 14 | Ja, avgränsat | Sparad success- och errorstate är renderade; loading/empty/partial states ingår inte i denna toastgrind. |
| 15 | NOT TESTABLE | Webbmåttet 44×44 CSS px bevisar inte fysisk 44×44 pt, native Dynamic Type, skärmläsare, safe area eller reducerad rörelse. |
| 16 | Nej, separat helskärmsgrind | [Jämförelsen mot rev02 Logga-panelen](log-rev02-comparison.png) visar att full Logga-komposition skiljer sig från målpanelen. UI-09 gör inget anspråk på helskärmsacceptans. |
| 17 | N/A | Huvudnavigation, aktiv förälder och tillbakaresor ändras inte av toasten. |
| 18 | N/A | Hundidentitet och porträtt ingår inte i toast-komponenten. |

## Avgränsning

Detta underlag verifierar toastens placering och sanningsenliga tillstånd i RN Web. Det stänger inte full visuell målbildsacceptans, native rörelse-/hjälpmedelskontroll eller fysisk device-QA. Figma ändrades inte.
