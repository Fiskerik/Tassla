# TRAINING-PINNED-SESSION-01 — fast bild och återkoppling efter pass
Status done · plan v1 · risk M · bas 0acd741 · branch fix/routines-training-flow · root ensam writer.

Eriks uttryckliga instruktion: behåll bild/rubrik synliga när instruktionen scrollas; stäng övningsmodalen efter ett faktiskt sparat pass och visa en liten bekräftelseruta på programsidan. Tidigare separat sessionslogg och självbekräftat delmål bevaras. Inga nya råd, dependencies, data/API/schema eller ändrad auth. Dagplanering avslutad i0acd741.

Använd befintlig BottomSheet.headerContent för låg dekorativ ansiktsfokuserad bild och övningsrubrik; resten inklusive mål/steg/progress/sparhandling scrollar utan synlig indikator. Behåll centrerad ram/closeguard/svep. Efter record_session saved (även samma-operation retry) stäng selection och visa kompakt Passet sparat-ruta i programmets bakomliggande vy. Ingen success-toast inne i modal för pass. Gick som planerat + aktuell bekräftelsebehörighet ger explicit målfråga och Markera klart; sparat pass bekräftar aldrig automatiskt delmålet. Övrigt utfall enbart sparbekräftelse. Pending/failed/unknown behåller modal och utkast/retry; inget påstående om sparande före saved. Stale aktuell övning får ingen bekräftelseknapp. Bekräftelsekort kan stängas med tillgänglig44pt-knapp. Befintlig målbekräftelse via återöppnad övning kvarstår.

Acceptans: verklig RNWeb375/430/kort667/CSS140 visar bild+rubrik oförflyttade vid body-scroll och nåbar sparaåtgärd; hela generiska hundansiktet synligt. Sparat pass stänger modal och visar rätt stegs bekräftelse, ingen automatisk confirm-operation; mål bekräftas endast uttryckligt och stale/failed/unknown skyddas. Same-operation retry saved stänger likadant. Instruktionsinnehåll oförändrat. pnpm check/diff/scope/publiciOSexport, UI Critic BRIEF/REVIEW, oberoende QA och Reviewer. Native touch/VoiceOver/DynamicType/live Supabase NT, ingen hel panel6-acceptans.

Skrivvägar:
- src/features/training/PublishedTrainingScreen.tsx
- src/features/training/README.md
- tests/training-progression-ui.test.mjs
- tests/training-screen-policy.test.mjs
- tools/visual-check/verify-training-session-flow.py
- docs/design/evidence/training-pinned-session-01
- docs/tasks/dev/TRAINING-PINNED-SESSION-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HISTORY-2026.md
- docs/decisions/MASTER-LOG.md

Läst: designregler §0–15, consumerUX/iOSskills, panel6/stödmodal-kontrakt, faktisk PublishedTrainingScreen/BottomSheet.headerContent/training-progression samt befintlig fixture record/retry. UIreferens nära panel6, denna uppgift avgränsad stödmodal. Root ensam implementer, Architect6.1-sol medium (konfigurerad5.6sol saknas), UIcritic6.1-sol high, QA/Reviewer Luna medium. Ingen sakrådsändring.

Architect APPROVEv1 och UI Critic BRIEF PROCEED. Två BRIEF-punkter: beständig bild/titel och kompakt huvud utan upprepad generisk Övning. Faktisk övningstitel använder delat modalhuvud; headerContent innehåller enbart bilden. Instruktion/övriga uppgifter finns kvar. Första typecheck upptäckte obligatorisk Button.label på ikonstängning; rättat före omkörning. Första browserförsöket antog ett nytt pass men fixturetimeline har redan tidigare lyckat pass; verifieraren använder därför den verkliga Logga ett pass till-handlingen.

## Implementering och bevis
Faktisk titel i delat huvud tar bort upprepad Övning; låg bild i headerContent. record_session saved/omkontroll saved fångar operationens faktiska program/steg/feedback, stänger selection och visar kortet utanför modal. Explicit Markera klart kräver ready/currentstep/canConfirm/no pending vid render och klick; inga automatiska delmål. Felmeddelande vid misslyckad bekräftelse nära handlingen. Focus/detail/history och råd oförändrade. Bounded cleanup: ingen ytterligare refaktor behövdes; befintliga guard/retrycallbacks återanvänds.
Senaste fullcheck102/102/type/lint PASS (/tmp/tassla-training-check.log); public iOSexport PASS (/tmp/tassla-training-ios.log); nio RNWebresor PASS (/tmp/tassla-training-browser.log, after/results.json). Uppdaterade två källkodassertioner inkluderar att även record_session undviker modaltoast. Tidigare misslyckade kontroller åtgärdade, ingen bypass. CSS140bilder använder skalning även på nytillkomna kort, ingen nativeDynamicTypeclaim.
§14 stödmodal/efterkort:1 Ja en primär perläge;2 Ja standardButtons;3 ET inga nya raderingar;4 ET oförändrad Hem;5 Ja375/430/667;6 Ja tokens/deladeheaderAPI;7 JaIonicons;8 Ja befintlig varm/grönkontrast;9 Ja pass och målseparata;10 Ja endastreceipt;11 Ja savedonly;12 Ja kortcopy;13 Ja kompakt faktisk titel/foto;14 Ja saved/failed/unknown/pending;15 Ja44pt/semantik/CSS140, nativeVoiceOver/touch/DynamicType NT;16 kompositionJa/färgerJa/typografiJa/formerJa/bildspråkJa/täthetJa för stödmodal ochkort enligt faktiskkomposit after/panel6-session.png, ingenhelpanel6claim;17 Ja samma program/back;18 Ja neutralträningscopy/befintligtdekorfoto. UICriticREVIEW bådaBRIEFpunkterFIXED, helansikte/läsyta och separatkort öppnade. OberoendeQA/Reviewer kvarstår.

Oberoende QA PASS: egen102/102, nioflöden mednya /tmp-bilder och öppnadkomposit/kort/667/140. Exactsaved/retry samt render+klickguards, fokus/historik och24scopepaths verifierade. Native/liveNT. Produktdiff fryst för Reviewer.

Frozen Reviewer PASS inga fynd; verkliga BottomSheet/ButtonAPI och både initial/retryhandlers kontrollerade. Nästa separat uppgift: manuellt verifierad lokal kontospärr-reset.
