# VISION-R02-4 — Stödskärmar och återstående rutter

Datum: 2026-10-13 · Version: 1 · Branch: `design/vision-rev02` · Status: R02-4A–H klara lokalt efter owner QA, Reviewer och Security 2026-10-14; externa runtime-gränser kvarstår

## Mandat

Erik har uttryckligen bett att samtliga återstående skärmar uppdateras till den dokumenterade rev02-riktningen. Hans QA-godkännande omfattar arbetet fram till och med R02-3C vid tidpunkten för beskedet; senare R02-4-slices väntar på egen ägar-QA och oberoende review. Detta fortsätter den visuella presentationen för befintliga resor. Data, routes, formulär, skrivsemantik, behörigheter, reviewgates, konto-/hundgränser och produkttexter förblir oförändrade om en separat produktförändring inte godkänns.

R02-3C är nu lokalt checkpointad: owner QA och statisk Security-PASS är registrerade, v6.3:s null-age-copy är implementerad/renderad och färsk Reviewer PASS mottogs 2026-10-14. Eriks uttryckliga fortsättningsdirektiv tillät separata R02-4-implementationsslices; detta ändrar inte dokumenterade §14-avvikelser eller NOT TESTABLE-gränser.

## Planerad uppdelning

Varje slice får egen exakt UX-spec, filscope, render-fixture, §14-bedömning och status i kön.

| Slice | Skärmar | Viktiga bevarade kontrakt |
|---|---|---|
| R02-4A | Mer | Samma fem destinationscallbacks, signoutbekräftelse/busy/fel |
| R02-4B | Hälsa, vikt och utförd historik | Ägarregistrerade poster, redigering/radering, validering, konflikt/pending/error |
| R02-4C | Planerad hälsa | Skild från utförd historik, frivilliga lokala påminnelser, datum/tid och recovery |
| R02-4D | Tassla-pass | Urval, preview, snapshot-PDF, lokal delning och osäkra/avbrutna utfall |
| R02-4E | Hundprofil och profilredigering | Befintliga fält, ras-/åldersurval, attribution, pending/conflict och tillbakaresor |
| R02-4F | Påminnelser | Separat appval/enhetstillstånd, opt-in, schemaläggning utan leveranslöfte |
| R02-4G | Konto och betainformation | Supportlänk, analyticsval, radering, lokal städning, signout/recovery |
| R02-4H | Inloggning och onboarding | OAuth/callback/session, profilskapande och befintliga valideringsflöden |

Ingen gemensam implementation får ändra standardutseendet på skärmar som inte ingår i aktiv slice. Delade tokens ska vara semantiska och opt-in. Inga dependencies, externa tjänster, migrations, nya produktobjekt, mediafält eller aktiveringar införs.

## Sekvensbeslut

R02-4A startar med fokuserad UX-spec `docs/plans/VISION-REV02-R02-4A-MER-UX-SPEC.md`. Nästa slice startar först efter att dess exakta UX- och filspec har lagts in i plan och kö. Ägarens fortsättningsdirektiv ger mandat att implementera; det ersätter inte den senare ägar-QA:n eller oberoende review som behövs för checkpoint.

## Implementeringshandoffs 2026-10-13

Alla åtta skärmgrupper är nu implementerade och renderade i public/review-fixtures. Varje rapport innehåller §14-egenkontroll, synliga NOT TESTABLE-gränser och status som skiljer implementerarbevis från QA-godkännande. Köposterna står blockerade för owner QA plus oberoende Reviewer/Security; fortsättningsdirektivet gav rätt att arbeta sekventiellt men stängde inte dessa checkpoints.

| Slice | Handoff | Status |
|---|---|---|
| R02-4A Mer | `docs/design/evidence/vision-rev02/r02-4a/RENDER-REPORT.md` | QA/reviewer pending |
| R02-4B Hälsa/vikt/historik | `docs/design/evidence/vision-rev02/r02-4b/RENDER-REPORT.md` | QA/reviewer pending |
| R02-4C Planerad hälsa | `docs/design/evidence/vision-rev02/r02-4c/RENDER-REPORT.md` | QA/reviewer pending |
| R02-4D Tassla-pass | `docs/design/evidence/vision-rev02/r02-4d/RENDER-REPORT.md` | QA/reviewer pending |
| R02-4E Profil | `docs/design/evidence/vision-rev02/r02-4e/RENDER-REPORT.md` | QA/reviewer pending |
| R02-4F Påminnelser | `docs/design/evidence/vision-rev02/r02-4f/RENDER-REPORT.md` | QA/reviewer pending |
| R02-4G Konto/Beta | `docs/design/evidence/vision-rev02/r02-4g/RENDER-REPORT.md` | QA/reviewer pending |
| R02-4H Auth/onboarding | `docs/design/evidence/vision-rev02/r02-4h/RENDER-REPORT.md` | QA/reviewer pending |

Manuell RN Web-rendering, public/review-byggen, typecheck, riktad ESLint, diffcheck och kövalidering kördes. Erik rapporterade 2026-10-14 att extern QA godkänt R02-4A–H. Oberoende Reviewer och statisk Security granskade aktuell kod vid `56bf224` och gav PASS utan blockerande fynd. Paketet är klart som lokal UI-leverans; native UI, device-behörigheter, Google-/mailleverans, backend, RLS och verkliga konton är fortsatt NOT TESTABLE enligt `docs/tasks/dev/vision-rev02-r02-4-closeout.md`.
