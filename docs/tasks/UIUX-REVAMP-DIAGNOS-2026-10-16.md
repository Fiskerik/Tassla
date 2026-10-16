# Tassla UI/UX-revamp — diagnos och genomförandeunderlag

**Ersatt som övergripande plan av [UI/UX-masterplanen](../plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md).** Detta dokument behålls som fördjupning om gester och sheets; dess begränsade omfattning och femstegsordning ska inte styra totalrevampen.

Datum: 2026-10-16. Beställning: granska Hem och popups samt lämna en teknisk plan för LUNA. Ingen appimplementation eller release ingår i detta steg.

## Bas och bevis

- Begärd branch: `codex/mvp-v2-panel4-checklists-2026-10-16`.
- GitHub verifierade branchens HEAD: `5ffb133f8b4bb330611a9b779fc4cf8686036070`.
- Vid analysens början var arbetsytan en äldre `work`-checkout på `00d4d4a3e38c08a6bb7d4c541cc509457126276f`. Diagnosen bygger på källfiler hämtade via GitHub-connectorn med exakt ovanstående SHA; temporär granskningskopia finns i `/tmp/tassla-5ffb133`. Den äldre checkouten användes inte som bevis för branchens nya checklistflöde. Dokumenten flyttades senare till målbranchen inför Eriks beställda commit/push.
- Referensen `vision_rev02.jpg`, designreglerna, Hem-kontraktet, beslutsregistret och `tassla-consumer-ux` har granskats. Appen är Expo/React Native/TypeScript, inte SwiftUI.
- Detta är statisk analys. Senaste installerade buildens SHA och runtime är inte verifierade. `docs/tasks/dev/vision-rev02-gestures-v8.md` på målbranchen säger uttryckligen blocked för faktisk browser/native-swipe; dess statiska PASS bevisar inte fungerande gester.

## Diagnos

1. **Popup-drag saknas.** `src/components/ui/BottomSheet.tsx:11` använder transparent RN Modal med `animationType="slide"`, stängknapp och backdrop. Det finns ingen pan-responder eller translation. Slide är en presentationsanimation, inte interaktiv swipe-to-dismiss. `InfoModal` i `src/components/AppPrimitives.tsx:124` har inte heller draghantering. En generell popupfix måste ange vilka komponentfamiljer som migreras; bekräftelsedialoger ska behålla sin tydliga semantik.
2. **Trolig responderkonflikt.** `ProductWorkspace.tsx:2447–2451` monterar `MainSwipeNavigation` inuti `AppScreen`, vars vertikala `ScrollView` ligger i `AppPrimitives.tsx:25`. `MainSwipeNavigation.tsx:33–36` begär ägarskap först efter över 44 pt och horisontell dominans 1,2. Scrollvyn kan då redan äga gesten. Detta är en konkret risk, inte fastställd nativefelorsak.
3. **State-kedjan finns.** `ProductWorkspace.tsx:160–164,186–189` kopplar svep till `setNavigation`. Ingen utebliven sidstate-uppdatering är belagd. Gestlagret saknar däremot interaktiv `onPanResponderMove`-translation och explicit terminate/reset. `ScreenTransition` i `Motion.tsx:76–91` animerar endast inkommande innehåll med 8 pt/fade och nycklar om underträdet. Det är inget fingerföljande sidbyte eller native navigationstack.
4. **Åldersremsa och huvudnavigation är skilda.** `HomeScreen.tsx:305–326` skyddar den horisontella FlatList med `HorizontalGestureRegion`. Där ska drag scrolla åldrar, inte byta huvudflik. Listans scrollstate används till visuell toning, inte val av veckoinnehåll. `HomeCarousel` finns som fil men är inte monterad i `HomeScreen`.
5. **Livscykelrisker.** `useMemo` återskapar responderkontrollern när `enabled` eller `onSwipe` ändras; callbacken ändras vid sidbyte, inte nödvändigtvis vid varje render. Exkluderingen är en gemensam boolean, utan ägarskap per region eller multitouch. Testa cancel, unmount och snabba sekvenser innan någon exakt runtimeeffekt påstås.

## Rekommenderad UX och arkitektur

- Behåll Hemmets rev02-hierarki: identitet/ålder → Just nu → dagens uppgifter/progress → tre jämställda genvägar. Detaljer nås med tryck och synlig tillbaka; swipe är en kompletterande handling.
- Dela gestkontroller, presentation och domänstate. Navigationsstate och bekräftad mutationsdata är auktoritativa; `Animated.Value` representerar enbart drag/övergång. Behåll befintlig scope-isolering, cache, scrollOffsets, datum/filter och felåterhämtning.
- Börja inom beslut 0004: RN `Animated` och `tokens.motion`. Använd `Animated.spring` för återgång/snap och släpp från tryckskala 0,98 till 1; `Animated.timing` för kort fade och bekräftad progress. Transform/opacity använder native driver. PanResponderns move-callback går fortfarande på JS-tråden; native driver för släppanimationen gör inte själva gesten UI-trådsdriven.
- Sikta på 120–350 ms där tidsstyrning används, dämpade springs utan lång studs, avbrytbara rörelser och direkt tillstånd vid reducerad rörelse. Bekräftelseanimation först efter sparande/readback. En vanlig width-animation kräver JS-driver; en transformlösning får inte förvränga etiketter eller tillgängliga progressvärden.
- Detaljer kan senare bli riktiga Expo Router/native-stack-routes med iOS push/back-swipe. Nuvarande page-state-byte påverkas inte av att bara ändra root-stackens animation. Migrera en resa i taget och bevara ingångens förälder och dataägarskap.
- `matchedGeometryEffect` är SwiftUI och finns inte i denna stack. Shared-element-övergångar, Reanimated/Gesture Handler, bottom-sheet-bibliotek och haptics är eventuella senare beslut med konkret behov; de ingår inte i första fixen och är inte installerade dependencies.

## Steg för LUNA

| Steg | Ägare / beroende | Berörda filer | Acceptans och verifiering |
| --- | --- | --- | --- |
| 1. Baslinje och reproduktion | LUNA; start | Tillfällig dev-instrumentering i `MainSwipeNavigation.tsx`, vid behov `ProductWorkspace.tsx` | Anteckna build/SHA. Logga grant/move/release/terminate och exkludering utan persondata. Skilj flikswipe, vertikal scroll och åldersremsa. Första konkreta implementationsplanen granskas före kod. |
| 2. Reparera huvudswipe | LUNA; steg 1 | `MainSwipeNavigation.tsx`, `AppPrimitives.tsx`, `ProductWorkspace.tsx`, gesttokens | Gestkontroll för den scrollbar viewporten ligger ovanför dess ScrollView men utanför bottenmenyn. Separera riktningslås kring 10–12 pt från commit kring 44 pt eller dokumenterad hastighetsregel. Ingen ovillkorlig capture. Stabil responder med aktuella callback-refar, explicit terminate/reset, tillräcklig träffyta och exkludering per aktiv region. Bevara horisontella listor, TextInput, modal- och detaljspärrar. Ett svep ger högst ett sidbyte; vertikal scroll fungerar. |
| 3. Inför säker sheet-dragning | LUNA; steg 2 stabilt | `BottomSheet.tsx`, `DailyActivityManagerSheet.tsx`, `Motion.tsx`, tokens | Börja med handtag/rubrik som dragzon; innehållets ScrollView behåller scroll. Nedåtdrag följer fingret, kort/avbrutet drag fjädrar tillbaka. Samtliga stängvägar går via befintligt `closeSheet → requestLeave` (`DailyActivityManagerSheet.tsx:146`). Ett void `onRequestClose` kan neka eller öppna kasta-dialog: drag får aldrig själv unmounta/gömma sheeten. `visible` styr faktisk stängning; pending/unknown/dirty skyddas. Separera mounted/exiting om egen exit-animation införs. |
| 4. Sammanhängande detaljresa | LUNA; steg 3 stabilt | Exakt en detaljroute under `app/`, berörd vy och navigation | Föreslagen första resa: Hem → daglig Checklista → tillbaka. Bevara Hem-flik, scroll, datum/filter, inmatning och befintlig datakälla. Native-stack migreras separat, utan parallell konkurrerande page-state för samma route. Åldersval byggs bara om ett uttryckligt innehållskontrakt finns. |
| 5. Polera bekräftad återkoppling | LUNA; fungerande resa | `Motion.tsx`, `tokens.ts`, berörda checklist-/progress-/kortkomponenter | Återanvänd fungerande motionkomponenter; ersätt lokala omedelbara progresshopp där relevant. Tryckrespons, spring-snap och check/progress följer verklig state. Reducerad rörelse, VoiceOver och stor text förblir användbara. Jämför färsk render mot rev02, inte en separat snygg fixture. |

Arbeta en slice i taget. Varje slice får exakt plan, begränsad diff, relevanta tester, `pnpm check`, `git diff --check`, oberoende QA/review och hållbar checkpoint. Gemensam regressionsmatris: vertikal/horisontell/diagonal dragning, avbrutet drag, flikgränser, öppna detaljer, sheet-scroll, tangentbord, dubbeltryck, dirty/pending/unknown, reducerad rörelse och stor text. Node-/webbtester ersätter inte native gestprov. Native-lucka redovisas separat utan automatisk telefon-/TestFlight-grind mellan slices.

## Granskning och checkpoint

- Architect: rekommenderad arkitekturriktning; exakt implementationsplan återstår. Bekräftar responder-/scrollrisken och kravet att `visible`, inte draget, avgör stängning.
- Critic: **PROCEED WITH CHANGES** för planunderlaget, inte implementationsgodkännande. Ändringarna är införda som preciseringar nedan: börja med reproduktion; trösklar är provvärden; skilj åldersscroll från navigation; bevara sammanhang och återställ nekad stängning.
- Trösklarna 10–12/44 pt är inledande provvärden, inte beslutade acceptansmått. Exakt geständring fastställs efter steg 1.
- När sheetens stängbegäran nekas eller öppnar kasta-dialog återställs dragläget. Reducerad rörelse ger direkt återställning utan spring. Scrollposition, formulär och sparstatus ska bestå även genom avbruten eller nekad stängning.
- Körning: `node --experimental-strip-types --test tests/main-navigation.test.mjs` i exakt branchs temporära källkopia avslutades med exit 0. Testet gäller routemodellen, inte RN-touch eller nativeanimation. Full `pnpm check` och appbuild kördes inte; ingen appkod ändrades.
- Nästa steg: LUNA specificerar steg 1–2 som första avgränsade implementationsslice och återger konkret reproduktion innan trösklar/gesthierarki fastställs.
