# Release-logg – LOGGA

Datum: 2026-10-08
Paket-ID: LOGGA
Status: LOGGA-EDIT DONE på ägaraccepterad avgränsning; LOGGA-QUICK fortsatt blocked på egen visuell evidens
Jämförelsebas: `37bf93f` (`feat: complete shared log UI component library`)
Leveranscommit: `230ad34` (`feat: redesign quick log experience`), lokal och inte pushad
TestFlight-version/build: okänd
GitHub Release: saknas; commitbasen ovan används.

Plan och UX-spec: [`docs/plans/LOGGA-ux-spec.md`](../plans/LOGGA-ux-spec.md)

## Major changes

Implementerat lokalt, ej committat: Logga visar fyra primära snabbval, `Fler` med generisk plusikon för Promenad/Vaken, historik och bekräftad ångra för en ny snabbregistrering. AppBar har ett additivt rent titelläge. Befintlig typ-/datum-/tid-/anteckningsredigering och radering nås fortsatt via radtryck i produkt- och previewflödet; den separat planerade LOGGA-EDIT-designslicen ingår inte.

## Minor changes

Implementerat lokalt, ej committat: kompakt datumgrupperad lista med tid före ikon, mönsterkort endast när Kiss/Bajs har minst två poster, samt Fler-sheet. Pending visas endast på motsvarande rad; update/delete/undo återanvänder raden i stället för att skapa en extra. Laddning av äldre poster behåller befintlig lista och ger retry vid fel. Föråldrade svar från tidigare hund-/sessionkontext ignoreras.

## Bug-fixes

Quick-add behåller samma mutation/UUID för retry, visar `Sparar…` och single-flight-skyddar även readback-steget, blockerar andra loggskrivningar medan resultatet är pending/failed/unsure och tillåter uttryckligt avbryt efter definitivt fel. Unresolved edit kan inte stängas och typ, datum, tid samt anteckning är låsta så att synlig input förblir samma intent som retry återspelar. Flight-token frigör nästa hund/session omedelbart och hindrar en gammal `finally` från att rensa en ny flight. Pendingstatus ingår i skärmläsaretiketten. Bekräftad insert försonas i listan innan bakgrundsåterläsning. Sparad-toast försvinner efter 2,5 sekunder och en gammal toast kan inte ångra en senare post. Dubblettfrågan använder godkänd exakt text. Toastens avbryt-/retrylayout är vertikal för stora textstorlekar.

## Verifiering och kända begränsningar

Riktade loggtester PASS (log-model och log-screen-policy), inklusive körbara beslut för dubbeltryck/override, single-flight, lifetime, tokenägarbyte/stale finish, utfallsmappning och samma insert-operation/UUID vid readback. Typecheck och edge-function typecheck PASS. Ändrade UI-/flödesfiler ESLint PASS (19 befintliga varningar i den stora workspace-filen); full lint PASS med 214 varningar. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios` PASS och `git diff 37bf93f --check` PASS. `pnpm check` BLOCKED enbart av två befintliga orelaterade testfilfel: oförändrade `notifications.test.mjs` får tom JSON-utdata i sitt spawnade Stockholm-tidszonstest (hela testfilen misslyckas även direkt; det exakta isolerade child-kommandot producerar däremot rätt JSON), och oförändrade `ui-library-policy.test.mjs` förväntar `medical-outline` medan `37bf93f` definierar `bug-outline` i IconChip. Renderad visuell evidens saknas; rendering och visuell QA är NOT TESTABLE. Ingen appkod är pushad eller tillgänglig i TestFlight.

## Tidigare nästa-steg — ersatt av ägarbeskedet nedan

1. Öppna `pnpm start:preview` i Expo Go eller annan native previewmiljö och fånga den specificerade matrisen för liten/stor telefon och stor text.
2. Låt en annan roll göra visuell QA mot målbilden och `docs/design-rules.md` avsnitt 14.
3. Dåvarande plan krävde att LOGGA-EDIT inväntade QUICK:s visuella grind. Detta beroende har senare undantagits av Erik för EDIT:s progression; LOGGA-QUICK behåller sin egen `blocked`-status tills dess visuella evidens är klar.

## Ägarens rapport efter merge till main — 2026-10-10

Erik rapporterar att LOGGA-EDIT är färdig och att Olycka nu sparas; han rapporterar också telefon-QA av hela senaste `main`-pushen/mergen. Build/version, körda scenarier och visuella underlag saknas.

Erik har uttryckligen godkänt att LOGGA-EDIT stängs på det befintliga beteendet i senaste main. Det inkluderar känd avvikelse från UX-spec v6: radering görs från edit-arket med destructive knapp och native alert, i stället för delete-only ActionMenu och delad Dialog. Den fulla screenshotmatrisen levereras inte som underlag för detta ägarbeslut. Dessa punkter redovisas som accepterade av ägaren, inte som visuell QA eller kodmässig överensstämmelse. Separata QA- och Reviewer-checkpointar finns nedan.

### Closeout — LOGGA-EDIT

Queue checkpoint: **DONE** efter Architect APPROVE / Critic PROCEED för owner exception, QA PASS och Reviewer PASS mot nuvarande main-kod. Verifierat i workspace: `pnpm check` PASS (395 tester pass, 1 skip, 0 fail; lint 0 errors, 35 warnings), `EXPO_NO_TELEMETRY=1 pnpm bundle:ios` PASS, `git diff --check` PASS och `python tools/dev_flow.py validate` PASS. QA/Reviewer bekräftade edit/save, failed/unsure retention/retry och confirmed delete/local reconciliation. Olycka live save och telefonprov är fortsatt ägarrapporterat; native alert/screenshotmatris är accepterat undantag, inte visual PASS. LOGGA-QUICK förblir blocked och är inte DONE; Erik accepterade dess telefonrapport endast som LOGGA-EDIT:s progression prerequisite.
