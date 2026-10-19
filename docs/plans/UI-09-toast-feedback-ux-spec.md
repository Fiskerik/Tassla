# UI-09 — Kompakt loggbekräftelse

Status: RN Web-rendering verifierad för avgränsad toast-resa; full rev02/nativeacceptans och oberoende slutgranskning är öppna
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

## Renderad QA-uppföljning 2026-10-19

RN Web-evidens vid 375×667 finns nu i `docs/design/evidence/ui-09/VERIFICATION.md`: bekräftad sparning med Fler stängt/öppet, success/error samt 140 %-webbstresstest. Bock och Ångra är synliga på rätt plats även när Fler är öppet; fel visar Retry/Avbryt utan grön bekräftelse. Harnessens saknade `global`-alias gav tidigare ett falskt pressanimationsfel; aliaset lades till endast i den temporära harnessen och ny fångst avslutades utan page errors.

Detta verifierar inte native Dynamic Type, screen reader, fysisk target size eller rörelse. Den sparade Logga-jämförelsen mot aktuell rev02-panel visar att helskärmskompositionen fortsatt avviker; UI-09-rapporten avser därför den fokuserade toastresan, inte full rev02-acceptans. Oberoende QA/Reviewer ska granska evidens och fryst diff innan checkpoint.


## Plan amendment v4 — current visual authority and evidence boundary (2026-10-20)

**Architect review:** APPROVE WITH CONDITIONS. The conditions are incorporated here: use the canonical `vision_rev02.jpg` reference; assess the focused toast journey separately from full-screen Logga composition; preserve explicit evidence limits and the historical v3 reviewer block.

**Current comparison target:** `docs/design-rules.md` §1 makes `vision_rev02.jpg` the current visual authority and treats `vision_rev01.jpg`/older package specs as history. This amendment supersedes v3's active comparison target without rewriting its historical review notes. Compare only the focused toast journey (confirmed/error state, placement, readability, `Ångra`, and `Fler` visibility) with the Logga panel in `vision_rev02.jpg` and the applicable §14 rules.

**Focused acceptance boundary:** v4 does not approve the whole Logga screen or MVP panel. The saved full-screen comparison currently records **No** against the rev02 Logga panel; that composition mismatch remains open for its own rev02 work. UI-09 may close only its bounded toast behavior/layout gate after independent QA and Reviewer pass. The selection action after expanding `Fler` is covered by policy test but has no dedicated after-selection screenshot; retain that limitation.

**Current rendered evidence:** normal and 140%-web-stress captures cover success with `Fler` closed/open and error/retry/cancel at 375×667 plus 360/430×844. A scroll check covers 360×844/140% with `Fler` open. The measurement record and image index are in `docs/design/evidence/ui-09/VERIFICATION.md` and `responsive-matrix-2026-10-20.json`. The 140% treatment is post-layout DOM scaling, not native Dynamic Type. Physical targets, safe area, VoiceOver/TalkBack, reduced motion and native behavior remain NOT TESTABLE.

**Reopen decision (historical sequence; status 2026-10-20):** the v3 Reviewer BLOCK was solely for absent rendered evidence. RN Web evidence now exists; independent QA and Reviewer have returned PASS for this bounded scope. This v4 closeout contains no toast implementation code changes.
