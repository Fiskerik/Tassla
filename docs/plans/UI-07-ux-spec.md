# UI-07 UX-spec: varumärke och bottenmeny

Datum: 2026-10-10. Status: planerad, Architect-review inväntas.

## Mål och användaruppgift

Ägaren ska känna igen Tassla på varje skärm, snabbt se vilken sida som är öppen och nå huvudflikarna utan en synlig gräddvit remsa under menyn. Vid stor text ska alla fem fliknamn fortsatt gå att läsa var för sig.

## Inträde och flöde

Title/Back/Close AppBar-varianterna använder två rader: dämpat centrerat `Tassla` ovan, centrerad sidtitel under med lika breda 44pt sidofack (Back till vänster, Close till höger, tomma fack i Title). Home använder en rad med lika bred vänsterspacer och notisslot till höger, även när åtgärden saknas, så varumärket alltid centreras geometriskt. `BottomNav` behåller fem destinationer, ordning, ikoner och valstate. När `AppScreen` har footer ligger en full-device-width surface wrapper utanför maxbreddat scrollinnehåll och täcker nederkantens safe-area-inset; utan footer monteras ingen footerwrapper och SafeAreaView behåller sin bottom edge.

## Tillstånd, återkoppling och tillgänglighet

Ingen ny interaktion. Behåll touchytor, accessibility labels/roles, active state, befintlig reducerad rörelse och befintlig tillbaka-/stänglogik. Fliknamn ska få bryta naturligt till två rader vid stor text inom fem lika flexibla flikar; använd flexShrink/bredd/textcentrering och växande min-height, utan fast höjd, numberOfLines eller skalningsgräns. Primär navigation ska fortsatt nås med en hand.

## Utseende, tokens och avvikelser

Använd enbart `src/theme/tokens.ts` och befintliga UI-komponenter. Centrerat varumärke får använda dämpad `textSecondary` och befintlig caption-stil; sidtitel behåller hög kontrast. Footer använder befintlig `surface` och safe-area-inset. Ingen ny logotypgrafik, token, färg, beroende, destination eller datamodell. Förberedelsen av åldersbaserat innehåll före hemkomst förblir en dokumenterad framtida möjlighet; ingen runtime-ändring.

## Filer och skyddad yta

Förväntade appfiler: `src/components/ui/AppBar.tsx`, `src/components/ui/BottomNav.tsx`, `src/components/AppPrimitives.tsx`, möjligen deras befintliga README/test/harness om nödvändigt. Ändra inte navigationens destinationer, appdata eller tokens. Eventuell ändring utanför detta scope kräver ny planreview.

## Verifiering

Verifiera även callbacks för notis, Back, Close och samtliga fem flikval samt selected accessibility state. Skärmdumpar enligt `docs/design-rules.md` §14: Hem, Logg, Träning, Hälsa, Kunskap, Mer och en undersida med Back/Close där relevant; 360/430 px, 140 % text, footer och en verklig skärm utan footer (sign-in/loading). Kontrollera att `Tassla` är centrerat/dämpat, sidtitel läsbar, navigationskontroller kvar, etiketter ej överlappar, och vit safe-area-yta täcker hela botten. RN Web bevisar layout men inte native safe area eller Dynamic Type; markera de senare NOT TESTABLE om ingen native runtime finns. Kör riktade type/lint/UI-tester, `pnpm check`, iOS-bundle, diff- och kövalidering enligt task.
