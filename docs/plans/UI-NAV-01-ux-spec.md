# UI-NAV-01 – Routerbaserad navigation

Status: Architect APPROVE för exakt plan, 2026-10-09. Genomförs i 01a följt av 01b.

## Användaruppgift

Ägaren ska kunna växla mellan Hem, Logg, Träning, Hälsa och Mer utan att förlora scrollposition eller pågående lokal skärmstate. Djupare vyer ska öppnas som riktiga native routes med tydlig Tillbaka-navigering och iOS-svep.

## Beteende och tillstånd

- Auth-, hund-loading-, saknad hund- och felstates behåller nuvarande copy och retryflöde.
- Workspace-context monteras först efter auth- och hundgate och lever så länge samma hund/session är aktiv.
- Tab routes är permanenta destinationer. Tabbyte använder `BottomNav` och remonterar inte workspace-state.
- Djup routes använder native stackens högerin-animation och back gesture. Reduced Motion använder `none` enligt befintlig root policy.
- Add/edit-formulär presenteras som native modal sheet där route finns; användaren kan alltid stänga med Back/gesture och sparstatus förblir sann.
- Notification response navigerar via Router till Träning eller Planerade hälsohändelser efter befintlig ägar-/hundkontroll.
- Konto-radering döljer fortsatt footer medan busy/confirmed/unknown.

## Routekarta

- Tab roots: `/home`, `/log`, `/training`, `/health`, `/more`.
- Pushed: `/knowledge`, `/passport`, `/profile`, `/notifications`, `/account`, `/beta-info`, `/planned-health`.
- Auth callback `/auth/callback` lämnas oförändrad.

## Versionskontroll och antaganden

- Befintliga manifestversioner: `expo-router ~57.0.24`, `react-native-screens ~4.26.2`.
- Använd endast native-stack-konfigurationerna `animation`, `gestureEnabled`, `fullScreenGestureEnabled` och `presentation` som stöds av Expo Router/native-stack för dessa versioner. Ingen egen swipe-animation eller ny dependency.
- Denna slice använder inte `presentation` på tab/pushed routes; quick edit-formuläret i Logga använder den befintliga `BottomSheet`-komponenten som native modal sheet. Övriga befintliga inlineformulär behåller sina nuvarande dataflöden.
- 01a ändrar inte skärmarnas visuella struktur. 01b gör endast de uttryckligen beställda AppBar-, BottomNav- och brandändringarna.

## Scope och skyddade områden

Ändrade filer ska begränsas till route/layoutfiler under `app/`, `src/features/home/` context/workspace/AppFlow, de skärmar som behöver AppBar/backrensning, `src/components/AppPrimitives.tsx`, `tests/`, samt detta dokument och section 14 i `docs/design-rules.md`. Data-, auth-, notification-service-, schema- och dependencyfiler är skyddade.

## Verifiering

`pnpm typecheck`, `pnpm lint`, riktade och fulla tester, `pnpm bundle:ios`, `git diff --check`. Fysisk iOS/native gesture, stor text och Reduce Motion dokumenteras som NOT TESTABLE här och verifieras av Erik med telefonchecklistan i slutrapporten.

## Telefonchecklista för Erik

- Svep från iOS-kanten på en pushed route och kontrollera att den går tillbaka.
- Testa full-screen swipe back där plattformen stöder det.
- Tryck på AppBar Back och kontrollera samma destination som swipe.
- Byt tab och kontrollera att varje tabs scrollposition och lokala state behålls.
- Tryck på en notification och kontrollera att rätt Träning- eller Planerade hälsohändelser-route öppnas.
- Logga ut och logga in igen; kontrollera auth gate och hundgate.
- Starta kontoradering och kontrollera att BottomNav/footer är låst/dold under busy och unknown.
- Kontrollera stor text, Reduce Motion på och snabb dubbeltryckning på en rad (endast en route ska öppnas).
