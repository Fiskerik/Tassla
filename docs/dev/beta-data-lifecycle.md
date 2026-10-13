# Betadata — livscykel och gallringscheckpunkter
Datum: 2026-10-07. P10. Förberedd driftinstruktion; inga riktiga konton har raderats eller jobb aktiverats.

## 1. Före verklig beta
Bekräfta utvecklingsmiljö, utförda migrationer och ägarisolering med två syntetiska konton. Inventera relationer från auth-användare till hundar, medlemskap, logg, hälsoplaner, träningsprogress, attribution, produktmått och dagliga aktiviteter mot faktiskt schema. Kontrollera transaktionsrollback vid fel. P10- och R02-2-SQL-prober är förberedda, inte körda. Eventuella framtida Storage-objekt kräver separat raderingshantering.

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


## KNOW-02 – privata checklistor, 2026-10-11

Inventeringen ska även omfatta dog_checklist_progress, dog_checklist_custom_items och dog_checklist_preferences. Koppling via dog_id gör konto-/hundradering till avsedd cascade; verifiera faktiskt tvåägarskydd och cascade i syntetisk utvecklingsdatabas innan liveaktivering. Egna texter max160 Unicode-tecken är personuppgifter kopplade till konto. Rättighetsförfrågningar/export behöver ta med bockar, egna texter och fasval; de ingår inte automatiskt i Tassla-pass PDF. Ändamålet är endast ägarens privata progression, ingen partnerdelning/profilering/analytics. Ingen faktisk SQL/gallrings-/exportrutin är genomförd genom detta dokument. Katalognycklar innehåller inte personuppgifter.

## R02-2 – privata dagsaktiviteter, 2026-10-13

Inventeringen omfattar `dog_daily_routines`, `dog_daily_routine_days` och `dog_daily_training_selections`. Rutinens label är en ägarägd mall som ligger kvar tills den tas bort eller hund/konto raderas. Daterade rutin-/träningsval och serverstämplade rutinmarkeringar visas endast för vald dag; purge-funktionen gör dem gallringsbara när lagrat lokalt datum är minst 30 dagar gammalt i just den sparade IANA-zonen. Daglig körning tar bort dem vid nästa körning, normalt inom 24 timmar efter gränsen. Träningsmarkering dupliceras inte: den härleds från befintlig `training_progress.completed_at` och lagras inte i nya dagsrelationer. Åtkomst-/kopiebegäran omfattar rutinmallar/labels, dagsval och rutinmarkeringar; ingen ny export i appen. Ändamålet är privat dagsplanering för ägaren, ingen partnerdelning, analytics, profilering eller Tassla-pass. Hund-/kontoradering cascade-raderar aktiviteter. Migration, RLS, syntetiska SQL-prov, scheduler och verklig retention måste verifieras innan beta; inget jobb aktiveras genom denna guide.

## Hundprofil — valbar åldersvisning lokalt implementerad; Mix väntar på katalog

Den beställda profilutökningen innehåller två valfria ras-ID:n för en Mix och valet `weeks/months/years` för ålderspresentation. Slice A-koden och migrationen `202610130002_dog_age_display_unit.sql` finns och har statisk QA-PASS, Reviewer PASS och Security APPROVE; verklig migration/RLS-runtime återstår. Åldersenheten är en presentationsinställning som formaterar ålder i Hem, Hundprofil och ägarinitierat Tassla-pass och dess valda profilavsnitt i PDF. Den påverkar inte innehållsurval, analytics eller profilering. Åtkomst-/kopieuttag ska innehålla råfältet `dogs.age_display_unit` tillsammans med hundens övriga profiluppgifter. Delraserna är ägaruppgift för visning endast i Hundprofil och följer befintlig konto-/hundradering och åtkomst-/kopieinventering. Själva raskatalogen är gemensam referensdata och innehåller inte ägaruppgifter; Erik har valt Wikidata CC0, men daterat snapshot och verifierad återanvändningsmetadata saknas. Raslista/Mix är därför fortsatt blockerad. Se [profilplanen](../tasks/dev/vision-rev02-dog-profile-v2.md) och [renderingsunderlaget](../design/evidence/vision-rev02/dog-profile/README.md).
