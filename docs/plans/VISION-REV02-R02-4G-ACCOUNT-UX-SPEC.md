# UX-spec — rev02 R02-4G: Konto och betainformation

Datum: 2026-10-13 · Version: 1 · Status: implementing · Ägardirektiv: fortsätt med återstående skärmar.

## Användaruppgift

Ägaren ska hitta betainformation och support, kunna styra frivillig användningsmätning, samt förstå status för en uttrycklig kontoradering och lokal utloggning.

## Avgränsning och skyddade beteenden

Endast presentationen i befintliga `AccountSettingsScreen` och `BetaInfoScreen`. Behåll supportens mailto-länk, betatextens begränsningar och gallringsformulering, analytics-consent, deletion-marker, tvåstegsbekräftelse, serverutfall, lokal cleanup, signout, marker/retry och samtliga statuslägen. Inga provider-, API-, SecureStore-, datalagrings- eller policyändringar.

## Visuell riktning

- Vänsterställda rubriker med blå opt-in kontoaccent och varm rev02-canvas.
- Konto, beta/support och analytics presenteras som separata navigerings-/inställningskort.
- Kontoradering och associerad status samlas i ett tydligt destruktivt område med en sekundär lokal utloggningsväg endast när befintliga regler visar den.
- Beta-information grupperas med rubriknivå och kortyta; textens sakliga omfattning och begränsningar behålls ordagrant.
- Behåll kontrast, switchens checked/disabled-status och minst 44 pt åtgärder.

## Filer och render

- `src/features/account/AccountSettingsScreen.tsx`, `src/features/account/BetaInfoScreen.tsx`
- `src/features/account/README.md`, `tools/visual-check/app.tsx`
- Denna spec, R02-4-plan, queue, rapport och `docs/design/evidence/vision-rev02/r02-4g/`.

Rendera public/review vid 375×844, 430×844, 375×667 och 140 % browserzoom. Inkludera analytics loading/true/false/error, raderings idle/failed/unknown/unavailable/confirmed/cleanup/signout lägen, beta och mailfel där harnessens fixture kan framställa dem. Verklig serverradering, SecureStore, supportmail och native Alert är NOT TESTABLE.

## §14 jämförelse

Ingen konto- eller betainformationspanel finns i `vision_rev02.jpg`. Jämför närmaste kort-/ikon-/rubrikmönster och markera §14 punkt 16 Nej för exakt panelmatch.
