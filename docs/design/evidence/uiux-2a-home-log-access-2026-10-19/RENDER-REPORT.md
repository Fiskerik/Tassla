# 2a — Render- och semantikrapport

Datum: 2026-10-19 · Status: lokal webbverifiering, oberoende QA och Reviewer av korrigering 1 PASS. Native VoiceOver/Dynamic Type/reducerad rörelse återstår.

## Genomfört

- Produktionskomponenterna renderades via den befintliga RN Web-harnessen i separata public- och review-byggen med syntetiska fixturedata.
- Home renderades i public och review vid 375×844 och 430×844 i standardskala samt 375×844, 430×844 och 375×667 vid simulerad 140 % fontScale. Standardskalan behåller två rader för aktivitetsnamn; större fontScale släpper klämningen.
- Bottenmenyn behåller en rad vid standardskala och använder två rader över 120 % textskala. Alla fem svenska namn får plats på en rad vid 375/430 px och 140 %; renderkontrollen verifierade etiketter, ordning, fulla textrutor, fem tabs och ingen horisontell/vertikal klippning i public/review.
- Review Home med osäker rutinändring annonserar att ingen ny bock visas och exponerar samma kontroll-/retry-handling.
- Public och review Logg: snabbregistreringens `Ångra` är fortfarande synlig efter 3,2 sekunder i RN Web och kan användas. RN Webs fixture rapporterar skärmläsare aktiv; detta verifierar komponentens webbsemantik och timergren, inte faktisk VoiceOver.
- TypeScript, riktad ESLint (inklusive BottomNav), `git diff --check` och `dev_flow.py validate` passerade.

## QA-korrigering 1

- Home pending-kontroller exponerar nu den aktuella statusen i tillgängliga namn och anger `busy` för native samt `aria-busy` för web. Den syntetiska review-renderingen verifierade checkboxens och detaljknappens statusnamn samt `aria-busy=true`.
- Logg-editorn renderades i public och review vid 375×667 med simulerad 140 % text. Innehållet kan scrollas medan `Spara ändring` förblir nåbar.
- Både `failed` och `unsure` behåller anteckningsutkastet och visar en synlig `Försök igen`-handling. Retry- och utkastläget fångades separat eftersom de inte ryms samtidigt i den korta vyn.
- Korrigeringsrenderingarna kördes mot ombyggda public/review-fixtures från aktuell källkod; TypeScript, riktad ESLint och `git diff --check` passerade.
- Detta är RN Web med syntetiska data. Det bevisar inte native VoiceOver eller fysisk iOS Dynamic Type.

## Fynd och begränsning

- `BottomNav`-layouten lades till efter Architect APPROVE task v1.5/spec v1.3 och Critic PROCEED för det avgränsade navigationsdeltat. Vid textskala över 120 % används en balanserad 3+2-radslayout med bibehållen tabordning och navigation.
- 140 % är en RN Web-proxy där tillfällig harnesk-konfiguration anger `fontScale=1.4` och CSS förstorar text. Den bevisar inte iOS Dynamic Type eller VoiceOver.
- Native VoiceOver, fysisk Dynamic Type och OS-inställningen för reducerad rörelse är **NOT TESTABLE** i den här renderingen.

## Kort iPhone-kontroll

1. Slå på större systemtext, öppna Hem och Logg och kontrollera att bottenmenyn visar Hem, Logg, Träning, Kunskap och Mer utan klippning. Kontrollera att valt läge markeras och att varje flik fortfarande öppnar rätt vy.
2. På Hem, prova en lång dagsaktivitet och en rutin med osäkert sparresultat. Namnet ska växa vid större text; osäkert läge ska inte visa en obekräftad bock och retry ska vara nåbar.
3. Slå på VoiceOver, snabbregistrera en logghändelse och svep till Ångra. Vänta minst fyra sekunder före aktivering; just Ångra ska fortfarande finnas och återställa den senaste snabbregistreringen.
4. Slå på iOS reducerad rörelse och expandera fler loggtyper samt gör en loggåtgärd. Förändringen ska ske utan dekorativ radanimation, medan status och knappar fungerar.

## Filer

- `public/home-375-standard.png`
- `public/home-375x844-tabs.png`, `public/home-430x844-tabs.png`, `public/home-375x667-tabs.png`
- `public/home-375x844-standard-tabs.png`, `public/home-430x844-standard-tabs.png`
- `public/log-undo-after-3s.png`
- `review/home-375-standard.png`
- `review/home-375-font-scale-140.png`
- `review/home-375x844-tabs.png`, `review/home-430x844-tabs.png`, `review/home-375x667-tabs.png`
- `review/home-375x844-standard-tabs.png`, `review/home-430x844-standard-tabs.png`
- `review/home-uncertain-retry.png`
- `review/log-undo-after-3s.png`
- `public/log-editor-375x667-140.png`, `review/log-editor-375x667-140.png`
- `public/log-edit-failed-375x667-140.png`, `public/log-edit-failed-draft-375x667-140.png`
- `public/log-edit-unsure-375x667-140.png`, `public/log-edit-unsure-draft-375x667-140.png`
- motsvarande `review/log-edit-failed-*` och `review/log-edit-unsure-*` bilder
- `review/home-pending-busy.png`
