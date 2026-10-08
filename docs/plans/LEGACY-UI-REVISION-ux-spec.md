# Legacy UI revision — UX-specifikation

Datum: 2026-10-08
Mandat: Erik vill att all användarvänd UI som fanns senast 2026-10-07 23:59 (Europe/Stockholm) revideras mot repo-skillen `tassla-consumer-ux`, `docs/design-rules.md` och Figma DS-02. Post-cutoff-UI skyddas om inte ett av Eriks uttryckliga fel kräver justering.

Baseline för cutoff: commit `5d7907fc06ec9eb75f75246f1929c812c08ebf3b` (commitdatum 2026-10-07 18:01:59 Europe/Stockholm; författardatum 18:00:49), verifierad i git som den sista relevanta UI-committen före cutoff. Post-cutoff-baseline som inte får rullas tillbaka: `src/components/ui/*`, `src/theme/tokens.ts`-utökningarna, `src/features/home/ProductWorkspace.tsx`/home-layouten och Logga-slicen (`src/features/puppy-log/LogScreen.tsx`, `log-model.ts`, dess handlers och tillhörande policytester). Endast Eriks uttryckliga punkt 2 och 5 får röra LogScreenens presentation; data-/mutationsemantik och Toast-semantik skyddas.

## Mål

En ny valpägare ska förstå nästa handling på tre sekunder, kunna arbeta med en hand och alltid få sanningsenlig återkoppling. Den visuella riktningen är varm gräddvit bakgrund, mörkgrön primär, tunna tydliga kanter, innehållsstyrda kort, konsekventa ikonchips, en primärknapp per vy och korta svenska texter.

## Berörda användarresor

1. Hälsa → Vikt → tryck på en viktpost → rätta datum/vikt i samma post → spara, fel eller osäker status.
2. Logg → tryck på en händelse → ändra händelse med tydliga kantlinjer → spara/radera/ångra.
3. Mer → Påminnelser → slå på träningspåminnelse → välj tid i lista eller fritext → spara.
4. Äldre konto-, hälso-, hem-, kunskaps-, tränings- och passvyer → samma tokens, komponenter, hierarki och tillstånd utan ny funktionalitet.

## Eriks fem uttryckliga fel

1. **Vikt:** När en vikt ändras ska redigeringsfältet öppnas i samma rad/kort som användaren tryckte på; användaren ska inte behöva scrolla till ett toppformulär.
2. **Feedback och händelser:** Efter en ändring ska ingen ruta med knappen ”Stäng status” visas. Använd Figma-kompatibel Toast med korrekt spar-/fel-/osäkerstatus. I ”Ändra händelse” ska valbara typer och block ha tydliga borders och minst 44 pt tryckyta.
3. **Träningspåminnelse:** ”Lägg till en frivillig träningspåminnelse” ska vara tryckbar när användaren vill välja den. Om huvudnotiser är av ska interaktionen antingen förklara och aktivera det nödvändiga förvalet eller lämna ett tydligt, återställbart val; den får inte vara tyst disabled.
4. **Tid:** När tidsväljaren öppnas ska fritextfältet vara synligt, inte täckas av listan eller tangentbordet. Fältet ska behålla fokus/värde och kunna skriva `00:00–23:59`.
5. **Loggningsmodal:** Redigering av en logghändelse ska ha kompakt, innehållsstyrd sheet/modalhöjd enligt Figma BottomSheet/Field, utan att onödigt innehåll pressar primärknappen utanför synligt område.

Varje punkt måste ha ett reproduktionstest före ändring och ett positivt/negativt tillståndstest efter ändring. Punkt 2 och 5 får ändra post-cutoff `LogScreen.tsx` endast i dessa uttryckliga delar.

## Tillstånd som måste vara synliga och testbara

- Normal, laddar, tomt, fel, avstängd/disabled, sparar, sparat, osäker sparstatus, försök igen och fungerande ångra där skrivningen verkligen lyckats.
- Modaler/sheets ska ha kompakt innehållsstyrd höjd, 44 pt stängyta, tangentbordssäker scroll och ett tydligt nästa steg.
- En lyckad ändring får inte rendera en permanent statusruta eller knappen ”Stäng status”; använd Figma-kompatibel Toast.
- Stora textstorlekar får inte dölja fält, tid eller primär åtgärd.

## Scope och skyddade områden

Planerade write paths, i ordning:

1. `src/components/AppPrimitives.tsx` för `TimePickerField`/sheet-layout och tokenbaserad knappaffordance; `src/components/ui/Button.tsx` får endast den uttryckligen begärda primärknappsskuggan. `src/theme/tokens.ts` ändras inte.
2. `src/features/health/HealthScreen.tsx`, `HealthHistoryScreen.tsx`, `PlannedHealthScreen.tsx` — inline-rättning och äldre hälsaytor.
3. `src/features/notifications/NotificationSettingsScreen.tsx` — träningspåminnelsens affordance; tidsinmatningens delade layout ändras endast i `src/components/AppPrimitives.tsx` under LUI-03. `src/notifications/*`-service/domainfiler är skyddade.
4. `src/features/puppy-log/LogScreen.tsx` — endast uttryckliga border-/modal-/feedbackfel; den post-cutoff Logga-slicen ska i övrigt inte göras om tyst.
5. Äldre ytor med fastställd målbild: `src/features/training/PublishedTrainingScreen.tsx`, `src/features/knowledge/KnowledgeScreen.tsx`, `src/features/health/HealthScreen.tsx`, `src/features/health/HealthHistoryScreen.tsx`, `src/features/health/PlannedHealthScreen.tsx` och `src/features/passport/PassportScreen.tsx` — successiva makeover-slices efter gemensamma primitives.
6. Övriga användarvända skärmar (`src/features/account/*`, `src/features/onboarding/*`, `src/features/home/*`, `src/features/knowledge/DraftContentPreview.tsx`, callback-/preview-rutter) inventeras och revideras mot Figma-/designreglerna utan ny produktfunktion. Varje sådan fil får egen UX-checkpoint innan ändring.
7. `docs/plans/LEGACY-UI-REVISION-ux-spec.md`, QA-evidens och release-log — koordinatorfiler.

Skyddat: data- och SQL-kontrakt, navigationens produktomfattning, nya funktioner/fält, referral- och analyticslogik, QR-dokumenten, komponentbibliotekets API/semantik, Logga-mutationer och Home-layoutens nya struktur. Presentationella token-/shadow-/reduce-motion-ändringar är tillåtna när de inte ändrar dessa kontrakt.

## Deluppgifter och checkpoints

| Slice | Ägare | Beroenden | Leverans/acceptans | Checkpoint |
|---|---|---|---|---|
| LUI-01 Feedback och gemensamma legacy-former | Implementer + QA | Architect/Critic-planreview; Figma Toast `12:220`, Field `57:1399`, Dialog `58:1366` | Ändra endast `HealthScreen.tsx`, `HealthHistoryScreen.tsx`, `PlannedHealthScreen.tsx`, `PassportScreen.tsx`, `EditDogProfileScreen.tsx` och `NotificationSettingsScreen.tsx` från bekräftad `ActionFeedbackModal` till befintlig Figma-kompatibel `Toast`; behåll error/unknown och ändra inte `src/components/ui/Toast.tsx` | Fokuserade feedback-/formtester, typecheck/lint/diff, 360/430 + stor text; Reviewer |
| LUI-02 Vikt i samma post | Implementer + QA | LUI-01; befintlig health-weight datalogik | Den viktpost användaren tryckte på öppnar redigering i just den posten, utan toppformulär eller krav på att scrolla; sparar, fel, unknown, cancel och delete behåller befintliga callbacks och scrollposition | `health-weight` + nytt placerings-/tillståndstest; visuell QA; Reviewer/Security vid åtkomstregression |
| LUI-03 Påminnelseval och tidsfält | Implementer + QA | LUI-01; notification service/domain oförändrad; Figma Field `57:1399`, CheckboxCard `57:1502`, BottomSheet `58:1405` | Ändra endast `src/features/notifications/NotificationSettingsScreen.tsx` och `src/components/AppPrimitives.tsx`: träningsvalet får tydlig tryckbar/aktiverande affordance, och `TimePickerField` visar värdet utan överlapp med lista/tangentbord, bevarar fokus/värde och accepterar fritext `00:00–23:59`; service/domain ändras inte | notification-/time-picker-test, 360/430/stor text, native beteende `NOT TESTABLE` om ingen enhet |
| LUI-04 Logga explicit feedback/border/modal | Implementer + QA | LUI-01; post-cutoff Logga-skydd; Figma BottomSheet `58:1405`, Field `57:1399` | Ändra endast `src/features/puppy-log/LogScreen.tsx` presentation: editor-ram/border och den verifierade modalstorleken; mutationer, callbacks, pending/retry/readback och `src/components/ui/Toast.tsx` är oförändrade | `log-screen-policy` + riktat UI-test, separat visuell review |
| LUI-05 Äldre skärmar mot Figma | Implementer + QA | LUI-01–04; separat screen-spec och Critic-checkpoint per fil | Nästa tillåtna filer är en i taget: `PublishedTrainingScreen.tsx`, `KnowledgeScreen.tsx`, `HealthHistoryScreen.tsx`, `PlannedHealthScreen.tsx`, `PassportScreen.tsx`. Varje fil får först målbild/node-ID, protected areas och diffscope; inga nya tabs/fält/IA. Övriga äldre skärmar läggs inte till utan ny checkpoint | Relevant tests + screenshots/checklist per screen; Reviewer |

Kända baselinefel i beroenden (saknade installerade paket och redan dokumenterade `pnpm check`-problem) rapporteras som BLOCKED/NOT TESTABLE; de får inte ometiketteras som UI-PASS.

## Figma-referenser

DS-02 används som normativ komponentreferens, inte som mandat att ändra produktfunktioner: AppBar `13:113`, BottomSheet `58:1405`, Button `12:130`, Toast `12:220`, Field `57:1399`, CheckboxCard `57:1502`, ListRow `13:631`, Card `12:140`, QuickLogTile `13:650` och Foundations/Review `61:1725`/`63:1722` i filen `2UI5GtK3JjZH3ncCS9M35c`. Varje LUI-05-fil måste ange tillämplig node innan kodändring.

## AI-slop-skydd

- Återanvänd befintliga tokens och komponenter; skapa inte parallella knapp-, kort- eller feedbackspråk.
- Behåll bara information som behövs för nästa beslut; ta bort teknisk text, dubbla banners och dekorativa kort.
- Låt data styra höjd och radbrytning; använd inte fasta höjder som klipper svensk text.
- Använd specifika hundnamn där de redan finns, men hitta inte på foton, resultat eller nya produktflöden.
- Varje ändrad copy granskas mot två-radersregeln, förbjudna tekniska ord och korrekt sparstatus.

## Acceptans och verifiering

- Varje slice får en separat implementeringsplan, relevant QA och oberoende visuell review.
- `pnpm typecheck`, relevant testfil, `pnpm lint` och `git diff --check` körs efter varje slice; full `pnpm check` körs när miljön tillåter.
- Skärmdumpar krävs för 360 och 430 pt, stor text och alla ändrade tillstånd bredvid Figma-referensen. Om rendering saknas rapporteras `NOT TESTABLE`, aldrig visuell PASS.
- Figma/design-reglernas 18 kontrollpunkter ska fyllas i per berörd vy.

## Öppna risker

- Fysisk telefon/TestFlight och native tangentbord är inte automatiskt verifierade i denna miljö.
- Figma visar målbild och komponentkontrakt; den godkänner inte nya produktfunktioner eller ändrad datamodell.
- Om en äldre vy inte kan flyttas utan ny produkt-/datamodell ska den stoppas och frågan lyftas till Erik.
