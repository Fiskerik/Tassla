# UI-SHEET-ACTIONS-01 — svep ned och plan för tydligare kontroller

Plan v1 — 2026-10-18. Beställning: applicera bottomsheet-swipe-ned.patch, planera UX-tipsen i bifogad text och inventera alla knappar med beslut om text respektive ikon.

## 1. BottomSheet (risk M)
Ägare: koordinator/implementer; Architect före kod, oberoende QA och Reviewer efter kod. Anpassa patchens fyra filer till aktuell branch: src/components/ui/BottomSheet.tsx, sheet-dismiss.ts, sheet-drag.ts och tests/sheet-dismiss.test.mjs. Endast handtag/rubrik fångar tydlig nedåtgest; scrollinnehåll, kryss, backdrop och Android-back behåller respektive stängväg. Alla gester anropar senaste onRequestClose så att osparat-/busy-spärrar gäller. Återställ position när öppnad igen; stoppa animationer och timers vid stängning, ny dragning och avmontering. Reducerad rörelse snappar utan fjäder; inga nya dependencies. Rena tröskelregler och controllerbeteende prövas med verkliga controllerkoden och RN-stub. 96 pt eller 24 pt med vy >= 0.8 enligt patch; start >8 pt och lodrät dominans 1.5. Fel/osäker sparstatus får ingen ny semantik.

## 2. Kartläggning och framtidsplan (dokumentation)
Ägare: koordinator; Critic granskar prioriteringar och ikonbegriplighet. Läs alla actionytor i app/ och src/: delade knappar, Pressable/MotionPressable, checklistor/flikar, dialogåtgärder och dynamiska listor. Spara reproducerbart kodinventarium med fil/rad, etikett/uttryck, ikon, callback och rekommendation i docs/design/UI-ACTION-INVENTORY-2026-10-18.md plus CSV, med tools/inventory-ui-actions.cjs som läser TS AST. Skilj kodplatser från unika runtimeknappar; appkontroller från galleri. Kartlägg standard- och fel-/busy-/unknownlägen. Rekommendera vänd bakåtpil return-up-back-outline för Ångra och create-outline för kontextuell Redigera, full svensk accessibilityLabel och minst 44 pt. Behåll synlig text för primär handling, retry/unknown, destructive confirmation, konto/samtycke och oklara destinationer; navigation och snabblogg behåller namn. Inga breda knappändringar i denna slice.

Planera samtliga bifogade tips mot verifierad aktuell kod, inte bifogade påståenden. Separata testbara paket: ikoner, refresh, Kunskapssök, stor text, återkoppling/tomlägen och framtida haptik/favoriter/offline/mörkt läge/widgets. Offline får aldrig visa Sparas senare utan verklig kö. Avmarkering/radering behåller skydd tills exakt write/undo-kontrakt granskats. Rasfilter väntar enligt tidigare beslut. Nya beroenden och datamodeller är endast förslag.

## Skrivytor och skydd
Kod: de fyra patchfilerna samt tools/inventory-ui-actions.cjs. Dokument: denna fil, docs/plans/UI-SHEET-ACTIONS-01-ux-spec.md, docs/plans/UI-UX-NEXT-PACKAGES-2026-10-18.md, inventarium/CSV, docs/tasks/dev/queue.json, docs/tasks/dev/rapport.md och docs/decisions/MASTER-LOG.md. Eventuell evidens under docs/design/evidence/sheet-actions-2026-10-18/. Befintlig content-publiceringsdiff, databas, navigation, datamodell, andra skärmar och knappbeteende skyddas.

## Acceptans och verifiering
1. Patchens beteende fungerar med guardad nekad stängning, ny callback, reopen, avbruten dragning, timer/animationsstädning och reduced motion. Kontrollera installerad RN:s faktiska API:er.
2. Knappinventering täcker alla app-/src-kodplatser och dynamiska grupper, med konkret rekommendation och spårbar fil/rad.
3. Alla tips har nuläge, prioritet, beroenden, acceptans och testbart paket; plan är inte implementerad funktion.
4. Kör riktade Node-tester, pnpm check, public iOS JS-bundle-export, git diff --check och kövalidering. Rendera verklig BottomSheet om tillgängligt; native gesture, VoiceOver och tangentbordsinteraktion på enhet markeras separat NOT TESTABLE utan bevis. Ingen automatisk TestFlight-grind.

Checkpoint: lokal kod och dokument, ingen commit/push beställd i detta meddelande. Nästa paket påbörjas först separat.

## Planreview och konkretisering
Architect APPROVE v1: cancelMotion måste avbryta timer och aktuell CompositeAnimation vid ny dragning, hide/reopen, reduced motion och dispose. useLayoutEffect uppdaterar senaste guardade callback före nästa gest. Oberoende Critic PROCEED efter följande preciseringar: verifiera Health blocked, Training busyStepKey, Log editLocked/saving, Daily manager dirty/pending/unknown och checklistornas guarded close; inkludera native alerts, systemdialogingångar, wrappers och dynamiska grupper i inventeringen. Ägarens exempel för Ångra/Redigera styr nästa ikonpaket; full kontextetikett och intilliggande namngiven post krävs. Det gör inga breda ikonbyten i denna slice.

## Oberoende QA
QA PASS för lokal checkpoint: körde själv 24/24 riktade tester och regenererade inventeringen i minnet, byte-för-byte samma Markdown/CSV (120 filer, 0 parserfel, 416 platser). Granskade Health, Training, Log, Daily manager och checklistors guardade stängningar; inget bypass. Native alerts/system-API och wrapperplatser ingår. Native gest/tangentbord/VoiceOver och visuellt är NOT TESTABLE. Full pnpm check 517/517 samt public iOS JS-export verifierades av koordinatorn.

## Slutreview och lokal checkpoint
Oberoende Reviewer PASS, inga blockerande fynd. Guardpredikaten i de verkliga caller-filerna har källgranskats; controller-testernas nekade stängning modellerar att föräldern låter sheeten vara öppen, inte ett runtimeprov av hela formuläret. Native gest/tangentbord/VoiceOver och visuell rev02-matchning förblir NOT TESTABLE. Inga nya dependencies eller säkerhets-/datakontrakt: separat Security/Compliance behövdes inte för denna M-slice. Kodstädning genomförd: en gemensam cancelMotion, stabil controller, inga refs som muteras under render, inga överblivna timers och ingen parallell visibility-state. Inventeringen är reproducerbar och innehåller 120 källfiler / 0 parserfel / 416 kontrollplatser (25 Alert-objekt, 8 system-API-platser). Full pnpm check 517/517 och public iOS JS-bundle PASS; whitespace inklusive nya filer och kövalidering PASS.

Lokal kodcheckpoint sparad i arbetsdiffen utan commit/push. Nästa föreslagna implementation: UI-ACTIONS-COMMON (paket 1a i den länkade framtidsplanen). Denna beställnings svepfunktion och dokumentation är klar; breda ikonbyten/sök/refresh är endast planerade. Full enhets-/visuell acceptans lämnas öppen enligt verifieringsrapporten.
