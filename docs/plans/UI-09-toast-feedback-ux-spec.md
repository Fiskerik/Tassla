# UI-09 — Kompakt loggbekräftelse

Status: lokal implementation verifierad; visuell acceptans blockerad / NOT TESTABLE
Datum: 2026-10-10
Mandat: Erik bad om en mindre grön bekräftelse med bock och placering längre ned från skärmens topp.

## Användaruppgift

Förstå snabbt att en logghändelse verkligen sparats, utan att den gröna återkopplingen tar onödig plats eller hamnar skild från loggen.

## Omfattning

- Komprimera den befintliga bekräftelse-toastens vertikala padding och typografi, med samma svenska meddelande och befintliga `Ångra`-handling.
- Visa en liten grön bockikon för bekräftad framgång. Ikonen är dekorativ och döljs för skärmläsare; statusmeddelandet förblir tillgängligt.
- Flytta samtliga bekräftade LogScreen-resultat (ny post, ändring och radering) från direkt under appbaren till direkt efter de fyra vanliga snabbvalen och före `Fler`. Placeringen ligger i normalt flöde, nära loggen, och förblir synlig även när `Fler` är öppet utan att täcka loggkontroller eller `Ångra`.
- Behåll DogMascot som dekorativ engångsreaktion efter bekräftad ny logg. Ändra inte bekräftelsevillkor, toastlängd, fel/okänt sparläge, ångraflöde eller annan skärmcopy.
- Samma kompakta framgångsutseende gäller befintliga positiva Toast-användningar i Hälsa och Träning; deras placering och beteende ändras inte.

## Användarflöde och tillstånd

- Pending, failed och unsure visar aldrig bock eller grön sparbekräftelse.
- Endast befintligt bekräftat `saved`-läge visar bocken och tidigare spartext. Loggning behåller fungerande `Ångra` när det finns.
- Befintlig automatisk stängning behålls. Fel och osäker status ligger kvar med nuvarande retry/cancel-handling.
- Toasten visas efter de fyra vanliga snabbvalen och före `Fler`, inte under appbaren eller efter hela listan. Den ska vara synlig när den visas i smal mobilhöjd både med `Fler` stängd och öppen och får inte blockera snabbvalen eller `Ångra`.
- Alla bekräftade LogScreen-resultat flyttas, även redigering och radering. Meddelandet för respektive utfall förblir tydligt; `Ångra` visas fortsatt endast för en sparad ny post.

## Tillgänglighet och visuell verifiering

- Bevara toastens alert-semantik; bockikonen är inte en extra skärmläsarfras.
- Undo-knappen behåller minsta tryckyta. Meddelandet får flöda vid smal bredd/stor text; inga fasta höjder eller klippning.
- Jämför Logga-skärmen med `vision_rev01.jpg` och följ `docs/design-rules.md` avsnitt 14. Renderad bild för ny sparning och befintligt fel/undo-läge ska bifogas; saknad rendering markeras NOT TESTABLE.

## Avgränsningar och beroenden

- Ändra inte eventens tid, databasfält, hälsoposter, Hem eller scheman i denna slice.
- Eriks separata önskemål om valbar tid för händelser/hälsa och visning i Hem får ett eget kontrakt efter denna lilla UI-slice. Hem är bekräftad visningsdestination; befintliga loggar har redan tid, utförda vaccinationer/veterinärbesök lagras datum-only och kräver separat arkitektur-/migrationsplan.
- Inga nya dependencies, analytics eller persistent state.

## Planreview

- Architect: APPROVE v1; CHANGES v2 (kort mobilhöjd plus öppet `Fler` kunde placera toast utanför viewport); APPROVE v3 efter placering direkt efter primärsnabbvalen och före `Fler`. Rekommenderade även kontroll efter val ur expanderat `Fler`.
- Critic: PROCEED v2 med krav på synlighet vid smal höjd samt `Ångra` och alla saved outcomes; PROCEED WITH CHANGES v3 efter kriterier för mobilhöjd och samtliga saved outcomes. Förnyad kontroll rekommenderade visuell verifiering i båda tillstånden.

## Implementeringscheckpoint — 2026-10-10

- `Toast` använder nu kompakt vertikal/horizontal padding och caption-token enbart för bekräftad success. Samma success-variant visar en dekorativ `checkmark-circle` i befintlig Ionicons-uppsättning. Ikonen saknar skärmläsarbetydelse; `confirmed`-grinden, alert-labeln, undo-knappen, timeout och övriga fel-/unsure-handlingar är kvar.
- Loggtoastarna för bekräftad add/edit/delete ligger efter primärsnabbvalen och före `Fler`. DogMascot finns kvar vid bekräftad ny logg. När ett snabbval väljs från öppet `Fler` stänger befintlig `selectType`-hantering extrarutorna, och toasten visas på samma plats.
- Lagt till `tests/toast-compact-policy.test.mjs` för bekräftelsegrind, ikon, semantik, placering och stängning av expanderat `Fler`; `tests/README.md` beskriver testets begränsningar.
- Verifierat: fokustest PASS; `pnpm check` PASS (31 testfiler, befintliga lintvarningar); `EXPO_HOME=/tmp/tassla-expo-home EXPO_NO_TELEMETRY=1 pnpm bundle:ios` PASS (1 418 moduler). Initialt exportförsök utan `EXPO_HOME` stoppades av saknad `/home/agent/.expo`; omkörningen med isolerad Expo-home passerade.
- Oberoende QA: kodkontroller PASS — fokustest 4/4, `pnpm check` 31/31 testfiler, `git diff --check` och kövalidering PASS. Inga ändringar gjordes av QA.
- Oberoende Reviewer: **BLOCK för saknad renderad evidens**. Statisk kod/API-granskning PASS: befintlig Ionicons-export/glyph finns i installerad 15.0.2, endast `confirmed` får success och grön bock, error/unsure retry/cancel, undo, timeout och alert-label kvarstår. Native semantics, smal enhetslayout och stor text är ej verifierade.
- Renderad liten/stor layout, stor text och success/error-undo jämförelse är **NOT TESTABLE**. `react-native-web`/`esbuild` saknas i workspace och `/tmp/tassla-ui-tools`; inga screenshots kunde skapas. Ingen visuell PASS görs från statisk kodkontroll.
- Cleanup: inga appberoenden eller out-of-scope-filer lades till. Nästa steg: återuppta renderad visuell kontroll och fyll i avsnitt 14 i `docs/design-rules.md` för success/error/undo, smal/stor bredd, `Fler` öppet/stängt/val därifrån och stor text. Paketet får inte markeras visuellt klart innan dess.
