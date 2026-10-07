# Betadata — livscykel och gallringscheckpunkter
Datum: 2026-10-07. P10. Förberedd driftinstruktion; inga riktiga konton har raderats eller jobb aktiverats.

## 1. Före verklig beta
Bekräfta utvecklingsmiljö, utförda migrationer och ägarisolering med två syntetiska konton. Inventera relationer från auth-användare till hundar, medlemskap, logg, hälsoplaner, träningsprogress, attribution och produktmått mot faktiskt schema. Kontrollera transaktionsrollback vid fel. P10:s SQL-prober är förberedda, inte körda. Nya tabeller i P08/P09 kräver förnyad inventering och prov. Eventuella framtida Storage-objekt kräver separat raderingshantering.

Driftsätt den granskade serverfunktionen först i godkänd utvecklingsmiljö. Verifiera autentisering, endast verifierad användare som mål, bekräftat resultat, fel och okänt svar. Hemlig servernyckel får aldrig hamna i appen eller testutdata. Kontrollera appflödet mot den faktiska funktionen innan betaaktivering.

## 2. Individuell kontoradering
Ägaren bekräftar åtgärden i två steg. Den driftsatta och verifierade serverfunktionen ska verifiera identiteten och radera endast detta konto. Bevara skillnaden mellan bekräftad radering, definitivt fel och okänt utfall. Ingen automatisk upprepning efter okänt utfall. Support kontrollerar status med behörig administratör innan eventuell ny åtgärd.

Efter bekräftelse städas ägarens lokala påminnelser, inställningar och session med kontoskydd. PDF-filer hanteras endast inom appens egna säkra cacheprefix. Gammal asynkron åtgärd får inte städa ett nytt konto. Lokal städning kan misslyckas även när serverraderingen lyckats och ska redovisas separat. Redan delade PDF-kopior omfattas inte av denna lokala rutin.

## 3. Beta slut + 30 dagar
Eriks beslut: betakonton och hunddata gallras 30 dagar efter avslutad beta. Slutdatum saknas ännu; inget aktivt gallringsjobb ska skapas.

När slutdatum finns ska ansvarig administratör:
1. Dokumentera exakt slutdatum, tidszon och beräknad deadline samt betakohortens avgränsning.
2. Köra en läsande förhandskontroll i rätt miljö och bekräfta kandidatlistan utan att exponera personuppgifter för AI-verktyg.
3. Bekräfta vilka konton som omfattas och att övriga konton undantas.
4. Utföra avgränsad administrativ radering med möjlighet att återuppta efter delvis fel. Ett redan borttaget konto ska hanteras utan ny destruktiv sidoeffekt.
5. Verifiera kvarvarande relationer och isolering samt dokumentera resultat och avvikelser med minsta nödvändiga granskningsuppgifter.
6. Hantera leverantörernas backuper och loggar enligt separat verifierad rutin. Dokumentera eventuell senare fysisk borttagning; påstå inte omedelbar totalradering.

Denna instruktion är inte ett genomfört driftprov eller ett schemalagt jobb. Faktiska avtal, backup- och loggtider samt slutlig informationsgranskning återstår.

## Krav innan runbook får användas
Dokumentera exakt godkänt miljö-/projekt-ID, namngiven ansvarig operatör, minsta nödvändiga behörighet och autentiseringsväg. Kandidatlistan ska hanteras endast i den godkända administrativa miljön; ange åtkomst och raderingstid även för listan och granskningsloggen. Dokumentera per körning kandidatantal, verifierat utfall, avvikelser och hur misslyckade poster återupptas utan att redan lyckade raderingar upprepas. Bekräfta hur 30-dagarsfristen tillämpas på aktiva data, leverantörskopior, backuper och loggar samt eventuella granskade undantag. Dessa uppgifter saknas ännu; ingen körning godkänns genom utkastet.
