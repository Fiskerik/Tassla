# MOTION-01 – UX-specifikation

Datum: 2026-10-10
Status: v4 planutkast, granskningsresultat för v3 registrerade
Källa: Eriks beslut i `docs/decisions/0004-motion-package.md`

## Användaruppgift

Förstå när en bekräftelse visas, följa träningsprogrammets framsteg och se vilka checklistesteg som markerats klara. Rörelse ska förstärka synlig text och befintliga ikoner utan att fördröja nästa handling.

## Avgränsning

Denna slice animerar Toast, Progress och ChecklistItem samt lägger till centrala durations-tokens. Den animerar endast ändringar efter att vyn monterats. Den inför ingen ny status, sparlogik, analytics-händelse eller beroende. `TrainingScreen.tsx` lämnas orörd; den används endast av `DevelopmentPreview`.

Toast monteras som en dold, stabil plats i den berörda vyn innan feedback visas. Ägaren växlar `visible` efter statusändring; komponenten animerar bara senare synlighetsändringar. Identiteten följer toast-platsen, inte meddelandetexten: om text/tone byts medan en tidigare exit pågår stoppas utgången, senaste feedback visas och ingen gammal `onExitComplete` får rensa den. När `visible` blir falskt behåller ägaren innehållet tills Toast meddelar att utgången är klar, och tar sedan bort det. Skärmarnas befintliga auto-dismiss-tid räknas som synlig tid och startar efter entrén: timeouten begär utgång men får inte avmontera Toast före `onExitComplete`. Vid skärmavmontering avbryts animation/timer utan att försöka visa utgång.

En dold Toast är borttagen ur skärmläsarträdet. När utgång börjar tas den också omedelbart ur trädet medan den visuella ytan avslutar rörelsen. När den visas exponeras den som en enda märkt alert; använd inte både automatisk alert-/live-region-annonsering och ett separat `announceForAccessibility` för samma meddelande.

ChecklistItem animerar endast när `checked` växlar till sant efter mount och det nya värdet uttryckligen är bekräftat (`confirmed`). Komponentens nuvarande användning i lokala `TrainingScreen`-förhandsvisningen får inte få positiv rörelse för en lokal/ej sparad toggling; `TrainingScreen.tsx` förblir orörd.

## Tillstånd och rörelse

| Komponent | Startläge | Ändring efter mount | Reducerad rörelse | Betydelse utan rörelse |
|---|---|---|---|---|
| Toast | Dold och monterad plats; om synlig redan vid första mount visas den direkt utan animation | `visible false → true` efter mount tonar in med liten vertikal förflyttning; `true → false` tonar/förflyttar ut, behåller platsen under utgång och avmonterar efter callback | Visas/döljs direkt, utan förlorat meddelande eller handling | Befintlig text, ikon/åtgärd och `accessibilityRole="alert"`; dold/utgående Toast är inte i skärmläsarträdet |
| Progress | Aktuellt värde visas direkt | Ändrat värde fyller den 4 px höga stapeln från tidigare till nytt begränsat värde | Ny bredd direkt | Befintlig etikett, exempelvis "3 av 5 genomförda" och progressbarens accessibility value |
| ChecklistItem | Bock för aktuellt `checked`-värde visas direkt | Endast bekräftad `false → true` efter mount skalar in bocken; obekräftat värde och avmarkering uppdateras direkt | Bock uppdateras direkt | Checkboxens label och `accessibilityState.checked` |

Alla animationer kan stoppas och ersättas av senaste värde. De blockerar inte tryck eller sparflöden. Framgångstoastens bekräftade kontrakt ändras inte: `saved` krävs fortsatt för positiv feedback; `failed`/`unsure` använder befintlig fel-/osäkertext utan framgångsrörelse.

## Tillgänglighet och design

- Läs `docs/design-rules.md` som visuell källa och Consumer UX-skillen för beteende.
- Alla durations hämtas från `tokens.motion`; målsatta tider ligger inom 120–350 ms. Transform och opacity använder native driver. Progress-bredd använder JS-driver på den befintliga 4 px-stapeln.
- Varje berörd komponent med `Animated` använder `useReducedMotion` från `src/components/ui/Motion.tsx`.
- Animation spelas inte vid första renderingen. Ingen loop eller dekorativ idle-rörelse.
- Ingen färg, storlek, text eller framgångsbetydelse kommuniceras enbart genom rörelse.
- Ingen skärm ska få hårdkodade färger, fontstorlekar eller px-mått.

## Antaganden och avvikelser

- Varje ändrad Toast-callsite måste vara stabilt monterad med `visible` och behålla status/text till `onExitComplete`. Befintlig timeout får inte avmontera komponenten innan utgången slutförts. Toast-/sparägarskap flyttas inte till `ProductWorkspace`.
- Dold/utgående Toast använder `accessibilityElementsHidden` och plattformens motsvarande `importantForAccessibility="no-hide-descendants"`; vid visning exponeras en alert med en enda annonseringsmekanism.
- ChecklistItem får ett bekräftelseprop som bara skickas sant för data efter lyckad skrivning. Nuvarande förhandsvisningskonsument skickar inte bekräftelse och får därför ingen framgångsrörelse.
- Visuell evidens kan inte visa tidsförloppet. Rörelsetillstånd dokumenteras med kort skärminspelning när miljön tillåter; annars markeras rörelsebeteendet NOT TESTABLE och beskrivs i QA-underlaget.
- Eriks telefonresultat för DS-CODE-01 och LOGGA-QUICK den 2026-10-10 är användarrapporterade. Det ersätter inte oberoende QA eller saknade skärmdumpar.

## Verifiering före leverans

- Policytest täcker att filer med `Animated` använder delad reducerad-rörelse-hook och att durations ligger i tokens.
- Beteende verifieras för dold mount → synlig → dold → utgångsklar, att befintlig timeout aldrig klipper utgången och att dold/utgående Toast inte finns i VoiceOver/TalkBack-trädet. Initialt synlig toast visas direkt utan animation och annonseras inte dubbelt.
- Beteende verifieras för checklistans lokala/ej bekräftade ändring och bekräftat `false → true`; bara det bekräftade efter-mount-fallet animeras. Fel och osäker skrivning får ingen framgångsrörelse. Skärmläsartext och progressvärde finns kvar.
- Kör fokuserade relevanta tester, `pnpm check`, `git diff --check`, QA och oberoende review enligt workflow. Rendering/tidsförlopp utan inspelning rapporteras NOT TESTABLE.
