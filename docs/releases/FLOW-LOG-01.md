# FLOW-LOG-01 — Logga kalender, snabbval och luft

Datum: 2026-10-21
Status: v6 kod- och browser-QA checkpoint på arbetsbranchen; fullskärmsmatchning mot `vision_rev02.jpg`, live RLS, native och signerad TestFlight-build accepteras separat. Tidigare v5-checkpoint `b03eaeb` är historik.

## Levererat i kodcheckpointen

Svensk månadskalender i befintlig BottomSheet, aktiva hundens dagmarkörer, laddnings-/tom-/fel-/återförsökstillstånd, Logga-specifik amber för Kiss samt tydligare tryckfeedback. Markörfrågan läser endast `occurred_at`, filtrerar logghändelsetyper och traverserar lokala månadsgränser med rå timestamp-keyset. Den tidigare höga snabbvalsgridden ersattes med befintliga etttryckskontroller i en horisontell remsa; `Fler` öppnar en andra remsa. Överflödiga snabbvals- och tidslinjerubriker togs bort. Befintliga logg-, spar-, edit- och undo-kontrakt bevaras.

## Verifierat

- Fokusregressioner för datumkalender, scope/livslängd och LogScreen-komposition passerar. RN Web-verifieraren kör public och review vid 375×844, 430×844 och 375×667 och täcker Fler, etttryck/undo, long-press-layout, kalenderns markör-/tom-/loading-/error-/retrytillstånd, datumval, tidslinje, redigering, radering och CTA.
- Slutliga branch-/commit-/bundle-/verifierarhashar och skärmbilder registreras i [FLOW-LOG-01 verifiering](../design/evidence/flow-log-01/VERIFICATION.md). Planbeslut och handoff finns i [granskningsjournalen](../tasks/dev/FLOW-LOG-01.md).

## Öppna blockerare och gränser

- Browserbilderna visar faktisk LogScreen i AppScreen med syntetiska data; de bekräftar inte pixelidentitet eller helskärmsacceptans mot visionbilden.
- Live tvåägar-RLS/anon-denial, native runtime, telefon och signerad TestFlight-build redovisas separat och är NOT TESTABLE tills sådan miljö används.
- Ingen schema-, auth-, service-role-, lagrings-, analytics- eller dependencyändring.
- Den här lokala checkpointen är inte en signerad TestFlight-build.

## Nästa steg

Fortsätt till FLOW-INSIGHTS-01. Oberoende Reviewer är uppskjuten till MVP-closeout enligt ägarens GO. TestFlight-prov görs efter att public build är exporterad och distribuerad.
