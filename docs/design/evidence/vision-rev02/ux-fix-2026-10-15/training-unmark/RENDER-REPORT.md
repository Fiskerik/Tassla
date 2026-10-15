# UX-TRAINING-UNMARK-01 — lokal renderings- och statuskontroll

Datum: 2026-10-15 · Branch: `codex/ux-rethink-2026-10-15` · Fixture: `tools/visual-check/app.tsx` · Public component path (`reviewMode=false`), syntetiska data · 375×844 CSS px.

## Omfattning och resultat

I ett markerat träningssteg finns nu den separata handlingen `Avmarkera`, med skärmläsaretiketten `Avmarkera {stegstitel}`. Public `ProductWorkspace` återanvänder `deleteTrainingProgress` för exakt hund, programversion och steg och läser sedan om träningsworkspacen. Skärmen rapporterar bara bekräftad avmarkering när den återlästa publicerade programversionen finns och steget saknas i dess `completedStepIds`. Läsfel, kvarvarande markering eller saknad version ger fel/status med retry och lämnar den senast bekräftade progressen synlig. `publishToDaily` uppdaterar också Home-snapshoten från samma verifierade läsning. Senare steg raderas inte; `Börja om` behåller sin separata programomfattande bekräftelse.

Granskningsfixture `trainingScenario=later-completed` startar med steg 1 och 3 markerade. Bekräftad avmarkering av steg 1 ändrade visningen från 2/3 till 1/3, medan steg 3 låg kvar markerat. `trainingUnmark=pending` behöll 2/3 och visade ingen success innan callbacken bekräftade; därefter blev statusen 1/3. `unknown` och `failed` behöll 2/3 och visade en enda retryåterkoppling utan success. Dessa callbacks är syntetiska och verifierar inte server/RLS.

## Evidens

- [Mina före ändring, 2/3](./overview-before-375.png)
- [Markerad detalj med namngiven avmarkeringshandling](./completed-detail-375.png)
- [Pending utan optimistisk ändring](./pending-unmark-375.png)
- [Unknown behåller bock och visar retry](./unknown-unmark-375.png)
- [Failed behåller bock och visar retry](./failed-unmark-375.png)
- [Bekräftad avmarkering: 1/3, senare steg kvar](./detail-after-confirmed-unmark-375.png)

Huvudreferensen är [vision_rev02, panel 6](../../../../../../vision_rev02.jpg) och [screen contract, panel 6](../../../../vision-rev02-screen-contracts.md#panel-6--träning). Panelens rekommenderade kort och fortsättkort ändras inte i denna slice; ändringen finns i det befintliga delningsbladet för en enskild övning och återanvänder `BottomSheet` och `Button`. Syntetisk layout/render har granskats mot referensens färg- och formprinciper; denna rapport godkänner inte hela Träningspanelens visuella matchning.

## §14 — deltaegenkontroll

Bedömningen gäller avmarkeringshandlingen och dess träningsstatusar, inte en ny fullacceptans av panel 6.

| Punkt | Status | Underlag |
|---|---|---|
| 1 | Ja | En tydlig åtgärd i markerad detalj; efter ändring erbjuds nästa steg separat. |
| 2 | Ej tillämpligt | Inga jämställda handlingar ändras. |
| 3 | Ej tillämpligt | Detta är en separat, ångervänlig enstegsmarkering; programåterställningen behåller sin befintliga bekräftelse. |
| 4 | Ej tillämpligt | Hemrader ändras inte. |
| 5 | Ja för web-fixtur; native NOT TESTABLE | Renderad vid 375×844; native safe area ingår inte. |
| 6–7 | Ja | Befintlig `BottomSheet`, `Button` och ikonfamilj används; ingen lokal styling eller ny ikon införs. |
| 8 | Oförändrad | Denna statusändring påverkar inte färgfördelningen; kontrast i native textstorlekar är ej mätt. |
| 9 | Ja | Synlig handling och tillgänglig etikett namnger samma valda steg och avmarkering. |
| 10 | Ja | Bock/progress ändras först efter bekräftad återläsning; unknown/failed behåller 2/3. |
| 11 | Ja | Success visas först efter bekräftat resultat; felstatus har en enda retryväg. |
| 12–13 | Ja för ändrad copy | Kort vardaglig svensk copy; status och handling ligger i samma detaljblad. |
| 14 | Delvis | Markerat, pending, confirmed, failed och unknown renderades; övriga programläsningstillstånd ändras inte här. |
| 15 | Delvis / native NOT TESTABLE | Etiketten innehåller steg och handling. Chromium renderar knappen; VoiceOver/TalkBack, Dynamic Type, reducerad rörelse och native 44 pt-kontroll är inte verifierade. |
| 16a–g | Oförändrad / full panel ej godkänd | Denna slice ändrar inte panelens komposition, färger, typografi, kortformer, programobjekt, innehållstäthet eller bilder. Detaljbladets före/efter visas ovan; panel 6:s fulla visuella acceptans ingår inte. |
| 17 | Oförändrad | Huvudflikar, aktiv förälder och tillbakaresor ändras inte. |
| 18 | Ej tillämpligt | Träningsdetaljen identifierar inte hunden genom foto. |

## Kontroller och begränsningar

- `pnpm typecheck`: PASS.
- Riktad ESLint på `PublishedTrainingScreen.tsx`, `review-training-state.ts`, `ProductWorkspace.tsx` och `tools/visual-check/app.tsx`: PASS.
- RN Web-fixture byggd med `TASSLA_UI_REVIEW=false`: PASS.
- Manuell Chromium-probe av pending/confirmed/failed/unknown och bevarande av senare steg: PASS enligt ovan; inga live-konton eller serverdata användes.
- `git diff --check`: PASS.
- Testsviter och databasoperationer kördes inte.
- Live Supabase/RLS, programversionens samtidiga serverändring, Home i en ansluten runtime, native safe area/tillgänglighet och fysisk skärmläsare är NOT TESTABLE här.
- Statisk Security: första granskningen blockerade på saknad scope-fence när hund-/kontoscope ändras under anrop. `unmarkStep` fångar nu `currentSelectionKey` och avbryter status-/feluppdateringen efter delete/readback om refen ändrats. Security delta PASS 2026-10-15; verklig kontoväxling och Supabase/RLS är fortsatt ej runtime-testade.
- Oberoende QA PASS 2026-10-15 efter korrigeringen: exakt delete/readback, pending/failed/unknown, senare steg, Mina/Home/Fortsätt, resetseparation, etikett och en retry verifierade. Typecheck, riktad ESLint och diff-check körda av QA och PASS.
- Oberoende Reviewer PASS 2026-10-15: exakt scope/readback, scope-fence, bekräftad UI-progression, Home/Mina/Fortsätt, senare steg, resetseparation, etikett och återhämtning godkända. Retryknappen läser först aktuell status; om markeringen finns kvar kan användaren trycka Avmarkera igen.
- Queue `UX-TRAINING-UNMARK-01` är `done`. Denna lokala leverans checkpointas tillsammans med tidigare godkända UX-FIX-delar före nästa slice; push sker efter resten av Eriks beställda kö.
- Slutlig commit och push görs efter de återstående godkända köpunkterna enligt Eriks instruktion.
