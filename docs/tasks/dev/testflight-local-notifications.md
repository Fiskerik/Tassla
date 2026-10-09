# TestFlight-kandidat – lokala påminnelser

Datum: 2026-10-08. Paket-ID: TF-LOCAL-NOTIFICATIONS. Status: konfiguration och kontrollunderlag förberedda; signerad build och enhetsprov återstår.

## Omfattning

- Konfigurera `expo-notifications` config-plugin för Androids `tassla-reminders-v1`-kanal.
- Behåll befintligt lokalt schemaflöde: tillstånd begärs endast från användarens knapp i Påminnelser; schemaläggning använder lokala native requests.
- Ingen APNs/Expo push-tokenregistrering, nätverksleverans eller EAS-identifierare läggs till. Push identifier på Apple-kontot krävs inte för dessa lokala påminnelser.
- Verifiera att iOS bundle ID överensstämmer mellan Expo-konfiguration och Codemagic.

## Acceptans och verifiering

- `app.json` har notifications-plugin och samma Android-kanal-ID som tjänsten skapar.
- Riktat test kontrollerar plugin, lokal behörighetsknapp, frånvaro av fjärrtokenregistrering och bundle-ID.
- Enhetstest på riktig TestFlight-installation krävs fortfarande för OS-dialog, schemaläggning, visning och trycköppning.

## Erik – bygg och installera

1. Pusha/merga den godkända koden till den branch Codemagic ska bygga.
2. I Codemagic väljer du workflow `tassla-ios`, rätt branch och trycker **Start new build**. YAML lämnar App Store-publicering avstängd och laddar upp till TestFlight.
3. Vänta tills App Store Connect har behandlat bygget, lägg till ditt Apple-ID som intern TestFlight-testare och installera appen.
4. På iPhone: öppna Mer → Påminnelser. Bekräfta att systemdialogen inte visas före tryck på **Tillåt påminnelser på telefonen**. Tillåt, schemalägg en testpåminnelse inom några minuter och verifiera låst skärm/Notiscenter.
5. Stäng av Tasslas huvudval och kontrollera att Tasslas schemalagda notiser försvinner. Återaktivera, testa en träningspåminnelse och tryck notisen både med appen stängd och öppen.
6. Upprepa nekad behörighet via iOS-inställningar: appen ska fortsätta fungera och förklara hur tillståndet ändras. Logga ut/kontobyte ska inte lämna kvar Tasslas ägarbundna notiser.

Spara Codemagic build-ID, buildnummer, TestFlight-version och varje utfall i P11-checklistan. Om bygget misslyckas, hämta `codemagic-logs/check-application.log`, `codemagic-logs/xcode-build-ipa.log` och rå Xcode-logg innan en ny körning.

## Kända gränser

- Ingen Codemagic-körning, Apple-uppladdning eller fysisk enhetsleverans utförd av denna uppgift.
- EAS project ID används inte i projektets beslutade Codemagic/TestFlight-flöde. Apple Push Notifications capability/APNs-nyckel behövs först om produkten senare inför fjärrpush.
- Testerna bevisar inte OS-dialog eller faktisk leverans.
