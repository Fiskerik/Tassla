# UIUX-REVAMP-R2B-SHARED-SHEET-01 — BottomSheet med skyddad dragstängning

Version: v2\
Status: plan v2 godkänd; lifecycle-cleanup och uppåtvändningsfix QA v5 PASS; slutlig Reviewer-recheck PASS
Datum: 2026-10-16\
Riskklass: M\
Panel: Logga, gemensamt UI-stöd

## Mål och spårbarhet

Inför nedåtdrag från rubrikytan i den gemensamma BottomSheet för Loggs befintliga händelseredigerare. Gesten följer fingret, använder samma ägarstyrda stängningsregel som redan skyddar utkastet och lämnar formulärscrollen fri. Övriga BottomSheet-konsumenter ska inte ändras.

Spårning: docs/mvp.md §4.3 Logg – snabb registrering vid behov; docs/plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md §5 R2b, §6 och fynd F04; Logga-kontraktet i docs/MVP-EXPERIENCE-CONTRACT.md; befintlig R1b-guard i src/features/puppy-log/LogScreen.tsx. MVP v2-mandatet för stegvis implementation gäller enligt AGENTS.md och docs/dev/workflow.md. Detta ändrar ingen dataskrivning eller datamodell.

## Vertikal deluppgift

En opt-in, nedåtriktad pan gest i rubrikytan på Loggs redigeringssheet, med visuell verifiering av verkliga BottomSheet- och LogScreen-komponenter i public/review-harnessen. Inga andra sheetar migreras i detta paket.

## Beteende

- Opt-in-propen dragToDismiss är en discriminated variant: utelämnad/false behåller befintligt onRequestClose: () => void-kontrakt; true kräver onRequestClose: () => boolean. Endast Loggs redigeringssheet aktiverar den. I opt-in-läget betyder endast literal true att ägarens guard accepterade omedelbar stängning; BottomSheet ändrar aldrig visible och döljer/avmonterar aldrig sig själv.
- En lågmäld, dekorativ dragindikator läggs i rubrikytan endast i opt-in-läget; hela befintliga minst 44 pt höga rubrikytan är gestmål. Gester börjar där. Endast nedåtrörelse med vertikal dominans tas över. Sheetens ScrollView, textfält, fasta footer och övriga touchytor får inte få pan-responder.
- Under drag översätts sheeten nedåt i samma takt som fingret; uppåtdrag flyttar den inte. Gesture-intent kräver minst 8 pt nedåtrörelse och tydlig vertikal dominans. Close kräver minst 120 pt nedåtdistans; hastighet kan aldrig ensam stänga sheeten. Gränserna är gemensamma tokens.
- En kort dragning, uppåtdrag, horisontell gest eller terminerad gest återställer positionen med befintlig RN Animated.spring; reducerad rörelse återställer direkt.
- En dragning över 120 pt anropar ägarens onRequestClose exakt en gång. Returnerat false betyder att guard/prompt nekar omedelbar stängning och sheeten fjädrar tillbaka. Literal true är endast ett besked från ägaren; BottomSheet låter aktuell fingerposition bestå tills ägaren ändrat visible eller avmonterat komponenten. Ingen egen close-animation eller Modal-animation konkurrerar med draget. Translationen nollställs först efter dold state/avmontering, eller före nästa öppning.
- LogScreen returnerar false om en discard-dialog redan är öppen, redigeraren är låst eller en skrivning är pending/failed/unsure, eller dirty state kräver ägarens val. Retry/readback och eventuella statusmeddelanden stannar synliga. Den befintliga Alert behåller sina två handlingar. Ett senare uttryckligt val att lämna stänger på samma sätt som idag.
- När dragToDismiss saknas monteras inga PanResponder-handlers och ingen gest- eller animationswrapper läggs till. Bakgrundsknapp, stängknapp, Android onRequestClose, spara-åtgärd och datakontrakt förblir oförändrade. En gest får aldrig kasta utkast eller bekräfta en mutation.
- keyboardAware, innehållsscroll, safe-area-padding och fast footer bevaras. Inga ändringar i Motion.tsx planeras: använd befintlig useReducedMotion och RN Animated; versionsstödet verifieras mot installerade RN 0.86.3-typer.
- Ingen dependency, persistens, navigation, tjänst, schema, RLS, auth, copy eller annan konsument ändras.

## Godkännandekriterier

1. Alla befintliga BottomSheet-konsumenter fungerar oförändrat när dragToDismiss utelämnas; inga responderhandlers/wrappers skapas då och endast Loggs redigeringssheet optas in.
2. Nedåtdrag från rubriken följer fingret. Uppåt-/horisontell rörelse tar inte över. Innehållsscroll och textfält förblir användbara; rubrikens stängknapp fungerar vid tryck.
3. Under tröskeln och vid cancel/terminate återgår sheeten. Reducerad rörelse ger direkt återställning.
4. Över 120 pt går exakt en close-förfrågan genom samma Logg-guard: clean kan stänga; dirty visar discard-prompt och bevarar utkastet; pending, failed, unsure, locked eller redan öppen prompt stannar kvar med befintlig retry/readback och bekräftad status synlig. Stanna kvar lämnar redigeraren öppen; Lämna utan att spara följer existerande uttryckliga discard-väg. Inga mutationsanrop skapas av drag.
5. Tangentbordsanpassad redigering behåller fokuserat fält, användbar vertikal scroll och synlig fast spara-footer vid 375×844, 430×844, 375×667 och 140 % web-textproxy.
6. Public- och review-verifiering använder verkliga LogScreen/BottomSheet-komponenter. Interaktionsassertioner mäter fingerföljning medan draget hålls, båda sidor om tröskeln, cancel/terminate, exakt en close-callback, denied-reset, oförändrat utkast, noll mutationer, scrollTop/fokus samt clean/dirty/pending/failed/unsure och tangentbordsläge. Browser-gestbevis rapporteras separat från native.
7. §14 i docs/design-rules.md bedöms punkt för punkt med skärmbilder/resultat i evidens-README. Visuell jämförelse mot Logga-referensen bedöms separat från funktionsbevis.
8. Oberoende QA och Reviewer får PASS för den lokala checkpointen. Native iOS/Android touch, verkligt systemtangentbord, VoiceOver, Modal-/system-back-prioritet och fysisk 140 % Dynamic Type anges NOT TESTABLE om de inte faktiskt provas.

## Skrivvägar

- src/components/ui/BottomSheet.tsx
- src/components/ui/bottom-sheet-gesture.ts
- src/features/puppy-log/LogScreen.tsx
- src/theme/tokens.ts
- tests/bottom-sheet-gesture.test.mjs
- tests/log-screen-policy.test.mjs endast om befintlig guardassertion behöver preciseras
- tools/visual-check/app.tsx
- tools/visual-check/verify.py
- tools/visual-check/README.md
- src/features/puppy-log/README.md
- docs/tasks/dev/UIUX-REVAMP-R2B-SHARED-SHEET-01.md
- docs/plans/UIUX-REVAMP-R2B-SHARED-SHEET-01-ux-spec.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/tasks/VISION-REV02.md
- docs/design/evidence/vision-rev02/shared-sheet/R2B-SHARED-SHEET-01/
- docs/decisions/MASTER-LOG.md först efter QA- och Reviewer-PASS

Ändra inte sources/, Motion.tsx, andra BottomSheet-konsumenter, workspace-/service-/databasfiler eller filer utanför listan. Om implementationen visar att dessa skyddade ytor måste ändras: stoppa, revidera planen och inhämta nya reviews.

## Kontroller

- node --experimental-strip-types --test tests/bottom-sheet-gesture.test.mjs tests/log-screen-policy.test.mjs tests/main-navigation.test.mjs
- Public och review visual-check för log-sheet-gesture, inklusive interaktioner och screenshots vid de angivna viewportarna/textläget.
- pnpm check
- python -m py_compile tools/visual-check/verify.py
- python tools/dev_flow.py validate
- git diff --check

QA bedömer lyckat, guardat och låst flöde, samt public/review-renderevidens. Reviewer granskar exakt plan, ändrade API-anrop mot installerade RN-typer, testresultat, §14-checklistan och README. Ingen Security-review krävs: auth, dataåtkomst, persistens och persondataändamål ändras inte.

## Planreview och checkpoint

Architect ska godkänna exakt v2 och Critic ska ge PROCEED för samma scope före implementation. Därefter går kön planned → ready → implementing. Efter implementation: cleanup, relevanta kontroller, implementing → qa; oberoende QA-PASS, därefter Reviewer-PASS. Rapportera browser-, native-, live- och releasebevis separat. R2a:s huvudgest förblir en separat blockerad checkpoint tills dess egen runtime-verifiering finns.

## Granskningsprotokoll för v1

- Architect, plan/UX v1: CHANGES. Kräv typat opt-in-resultat, behåll accepterad fingerposition till ägarens state/unmount, verifiera position/callback/write och bevisa att opt-out saknar handlers/wrappers. Installerade RN 0.86.3 PanResponder- och Animated.spring-API:er är giltiga.
- Critic, plan/UX v1: PROCEED WITH CHANGES. Lägg till lågmäld upptäckbar dragindikator, ta bort stängning på kort/snabb rörelse, täck failed/unsure-återhämtning och kontrollera utkast/fokus/scroll, samt säg tydligt att ägarens visible/guard styr stängningen.
- Dessa punkter är inarbetade i v2. Båda rollerna ska granska exakt v2 före implementation.

## Granskningsprotokoll för v2

- Architect, exakt plan v2 och UX-spec v2: **APPROVE**. Den typade opt-in-varianten, ägarstyrda stängningen, opt-out utan handlers/wrapper och RN 0.86.3 PanResponder/Animated API:er är genomförbara. Vid implementation: behåll discriminant-narrowing genom att arbeta med props-objektet; avbryt pågående spring vid ny gest; anropa ägaren högst en gång endast vid release över 120 pt; terminate återställer alltid och begär aldrig stängning; återställ accepted translation först efter hidden/ny öppning.
- Critic, exakt plan v2 och UX-spec v2: **PROCEED**. Upptäckbarhet, tydlig stängningströskel, draft/recovery-skydd och beviskrav är tillräckligt avgränsade. QA ska jämföra fokus före/efter gest; failed/unsure kan redan sakna aktivt fältfokus när editorn är låst.

## Implementationsutfall — 2026-10-16

Plan v2 är implementerad inom de godkända skrivvägarna. Endast Loggs händelseredigerare använder opt-in-gesten; övriga BottomSheet-konsumenter har kvar sitt tidigare API/renderingsväg. Ägarens requestEditorLeave returnerar nu ett explicit resultat så att drag aldrig ändrar synlighet, kastar draft eller skapar mutation.

Första QA-passet fångade fokusförlust i RN Web och saknad kontroll av explicit discard. Uppföljningen återställer fokus efter avbruten gest (before=true, after=true), asserterar Stay och explicit discard inklusive öppet promptskydd, och passerar 11/11 kontroller i public/review utan page errors. Fysisk native fokus/tangentbord är fortsatt NOT TESTABLE och kräver appkontroll.

Kontroller: fokuserad suite 19/19; pnpm check 547/547, app-/edge-typecheck och ESLint PASS; python -m py_compile tools/visual-check/verify.py, python tools/dev_flow.py validate och git diff --check PASS. Ingen live Supabase/RLS, fysisk iOS/Android, VoiceOver, Dynamic Type eller installerad build verifierades. Ingen planändring eller scopeutökning.

Nästa steg: oberoende QA mot exakt v2-plan, därefter Reviewer. Master-logg och done-status väntar tills båda har PASS.

## Oberoende QA-recheck — PASS, 2026-10-17

QA verifierade den aktuella källan, v2-kontraktet och färska public/review-renderingar. Fokus efter avbruten gest, dirty Stay/explicit discard, öppet promptskydd, owner guard, locked recovery, opt-out, trösklar och reduced motion passerar. Fokuserad suite 19/19; `pnpm check` 547/547 plus app-/edge-typecheck och ESLint; `py_compile`, queue validation och diffcheck PASS; browser 11/11 per bundle utan page errors. Rapport: `docs/design/evidence/vision-rev02/shared-sheet/R2B-SHARED-SHEET-01/qa/INDEPENDENT-QA-v2-recheck.md`. Native och live-begränsningar förblir NOT TESTABLE. Oberoende Reviewer är nästa grind; done, commit och push väntar.

## Reviewer-fynd och korrigering — 2026-10-17

Den första Reviewer-rechecken blockerade på snabb omdragning medan den nekade stängningens Animated.spring fortfarande återgår. En ny PanResponder-grant stoppar nu fjädern och tar baspositionen från `stopAnimation`-callbacken; rörelsen efter grant läggs ovanpå den aktuella sheetpositionen. En generationstagg gör att en sen callback från en äldre gest inte skriver över en nyare gest eller återställning. Detta följer v2-kravet att avbryta aktiv fjäder vid ny gest och att positionen ska återgå vid nekad stängning.

Public- och review-verifieraren täcker nu en synlig andra headerdragning innan återstudsen är klar, utan snap till ursprungsläget och med fortsatt fingerföljning; resultatet var 12/12 vardera, inga page errors, fokus true → true. Fokuserad suite 19/19 och `pnpm check` 547/547 passerade före den senaste cleanup-lifecycle-fixen. QA runtime- och evidensrecheck v3 passerade (`docs/design/evidence/vision-rev02/shared-sheet/R2B-SHARED-SHEET-01/qa/INDEPENDENT-QA-v3-rapid-redrag.md`). Därefter identifierade Reviewer att en sen native `stopAnimation`-callback kunde överleva effect cleanup. Sessionen invalideras nu även vid cleanup och testas separat; aktuell QA- och evidensrecheck körs innan Reviewer gör ett slutligt PASS/BLOCK. Native touch/tangentbord, assistive technology och live Supabase/RLS är fortsatt NOT TESTABLE.
