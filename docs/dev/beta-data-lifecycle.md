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

## R02-2 – privata dagsaktiviteter och R02-2 v4 – upprepade rutiner, 2026-10-14

Inventeringen omfattar `dog_daily_routines`, `dog_daily_routine_days`, `dog_daily_routine_day_skips` och `dog_daily_training_selections`. Rutinnamn, ordnade checklistor och valfri upprepningsregel/ankare är ägarägda mallar som ligger kvar tills de tas bort eller hund/konto raderas. Veckoregelns valda ISO-veckodagar ingår i samma rutinmetadata; de kopieras inte till dagsrader. Dagens rutinrad och ett eventuellt skip-tombstone fryser namn, checklisttext, bockar och status från valtillfället. Daterade rutin-/träningsval, skip-tombstones och serverstämplade rutinmarkeringar visas endast för vald dag; purge-funktionen gör dagskopior och tombstones gallringsbara när lagrat lokalt datum är minst 30 dagar gammalt i just den sparade IANA-zonen. Daglig körning tar bort dem vid nästa körning, normalt inom 24 timmar efter gränsen. Träningsmarkering dupliceras inte: den härleds från befintlig `training_progress.completed_at` och lagras inte i nya dagsrelationer. Åtkomst-/kopiebegäran omfattar rutinmallar, checklistor, upprepningsregler, valda veckodagar/ankare, dagsnamn, punkter, val, bockar och skip-state; ingen ny export i appen. Ändamålet är privat dagsplanering för ägaren, ingen partnerdelning, analytics, profilering eller Tassla-pass. Hund-/kontoradering cascade-raderar aktiviteter. Migration, RLS, syntetiska SQL-prov, scheduler och verklig retention måste verifieras innan beta; inget jobb aktiveras genom denna guide.

## Hundprofil — valbar åldersvisning lokalt implementerad; Mix väntar på katalog

Den beställda profilutökningen innehåller två valfria ras-ID:n för en Mix och valet `weeks/months/years` för ålderspresentation. Slice A-koden och migrationen `202610130002_dog_age_display_unit.sql` finns och har statisk QA-PASS, Reviewer PASS och Security APPROVE; verklig migration/RLS-runtime återstår. Åldersenheten är en presentationsinställning som formaterar ålder i Hem, Hundprofil och ägarinitierat Tassla-pass och dess valda profilavsnitt i PDF. Den påverkar inte innehållsurval, analytics eller profilering. Åtkomst-/kopieuttag ska innehålla råfältet `dogs.age_display_unit` tillsammans med hundens övriga profiluppgifter. Delraserna är ägaruppgift för visning endast i Hundprofil och följer befintlig konto-/hundradering och åtkomst-/kopieinventering. Själva raskatalogen är gemensam referensdata och innehåller inte ägaruppgifter; Erik har valt Wikidata CC0, men daterat snapshot och verifierad återanvändningsmetadata saknas. Raslista/Mix är därför fortsatt blockerad. Se [profilplanen](../tasks/dev/vision-rev02-dog-profile-v2.md) och [renderingsunderlaget](../design/evidence/vision-rev02/dog-profile/README.md).

## FLOW-INSIGHTS-01A — privat loggöversikt, dokumentgrind 2026-10-22

Detta inventerar den planerade ägarvyn `Insikter`, som kan öppnas från Logga → Översikt eller från Hundprofil. Båda vägarna visar samma ändamål och samma underlag; profilvägen är inte en separat behandling. Erik rapporterar att Compliance har godkänt FLOW-INSIGHTS-01A. Detta är ägarens rapport om godkännandet; en separat Compliance-rapport finns inte i denna checkout. Godkännandet innebär inte att en RPC eller migration är driftsatt eller att live-RLS har provats här.

- **Ändamål och källa:** privat, sammanräknad översikt av ägarens befintliga dagliga loggar för den aktiva hunden, så att ägaren kan se loggantal över en vald period. Källtabellen är `public.dog_events`; den föreslagna läsfunktionen använder endast `dog_id`, `event_type`, `occurred_at` och `accident_kinds`. Den använder inte `actor_id`, `description`, `duration_minutes`, `weight_kg`, health-event-datum eller hälsotyper för Insikter. Ingen slutsats om hälsa, beteende eller fullständig verklig täckning dras.
- **Kontosamband och mottagare:** loggarna är knutna till hunden och ägarkontot enligt befintliga hund-/ägarsamband och RLS. Resultatet är avsett endast för den autentiserade användare som har rätt att läsa den valda hundens loggar. Profilens Insikter-knapp ändrar inte konto, mottagare eller datakälla. Föreslagen RPC tar `p_dog_id`, `p_period` och `p_timezone`; hundbehörighet kontrolleras och befintlig RLS gäller. Detta beskriver planerat kontrakt, inte en genomförd livekontroll.
- **Härledda värden och svar:** samma statement-snapshot används för lästid, gränser och alla räknare. Det planerade svarets exakta metadata är `period`, `timezone`, `asOf`, `periodStartLocal`, `periodEndExclusiveLocal`, `observedThroughLocal`, `firstLogDay`, `bucket` och `days`. `periodEndExclusiveLocal` är en exklusiv lokal datumgräns. `days` är en ordnad lista med `date`, `peeCount`, `poopCount`, `unclassifiedAccidentCount`, `sleepCount` och `awakeCount`; datumformatet är dag för Vecka/Månad och månad för Sedan första loggen. Perioderna är Vecka, Månad och Sedan första loggen. Olycka räknas som kiss/bajs endast om olycksposten uttryckligen har motsvarande `accident_kinds`; annars visas den som oklassificerad olycka. En post räknas inte som en medicinsk bedömning.
- **Åtkomst och lagring:** aggregeringen beräknas vid läsning i databasen från råposter. Inget separat aggregat eller historik över aggregerade resultat sparas. Anrop och resultat hålls endast i scope-bundet skärmminne för aktivt konto, hund och vald period; byte av konto/hund eller stängning/invalidering rensar det. Ingen lokal diskcache skapas. Ingen delning, extern analys, profilering eller ny datainsamling införs.
- **Rättelse, utdrag och gallring:** ägaren rättar eller tar bort de underliggande loggposterna via loggflödet. Rättighets-/kopieunderlag bygger på maskinläsbara råposter och beskriver att Insikter räknas fram från dem; eftersom inget separat aggregat lagras finns ingen separat aggregatpost att exportera. Råposter följer befintlig hund-/kontoradering och cascade. Beta-slutets redan dokumenterade gallring efter 30 dagar gäller rådata enligt avsnitt 3; den föreslagna läsningen ändrar inte retentionen och lämnar inga nya aggregat efter sig. Befintliga backuper och driftloggar följer leverantörernas ännu ej verifierade tider och omfattas av de publiceringsöppna punkterna ovan.
- **Telemetri:** RPC-parametrar och resultat, konto-/ägare-ID, hund-ID, tidszon, antal och råa felobjekt får inte skickas till apptelemetri eller felrapportering. Tekniska fel kan endast rapporteras utan den privata payloaden.

Insikter är ännu en planerad lokal UI-/datakontraktscheckpoint. Implementerad migration/RPC, faktisk åtkomst, tvåkontosisolering, anon/auth-gräns, live-Supabase/RLS och drift är inte verifierade genom denna dokumentändring.


## DRIVE-ARTICLES-01 — profil för artikelurval och tilltal

Ägarbeställt: `dogs.expected_homecoming_date` (`date`, nullable) för förberedande artikelurval och fortsatt ägarredigerbar planeringsuppgift; `dogs.sex` (`male/female/null`) enbart för han/hon i artiklar. Båda samlas frivilligt i befintlig registrering/profil, kan ändras/tömmas och ärver hundens owner-RLS och konto-/hundradering. Erik valde uttryckligen att behålla planeringsdatumet efter att det passerat tills han/användaren rättar/raderar uppgiften; gammalt datum aktiverar aldrig en faktisk hemkomst eller rekommendation utanför metadatafönstret. Befintlig betagallring gäller. Dessa två råfält ingår i rättighets-/kopieuttag. De ingår inte i Tassla-pass/PDF, telemetri, externa felpayloads eller partnerdata.

Gemensamma artiklar lagras utan hunduppgifter. Namn/pronomen fylls i lokalt vid visning, inte i sparad artikelbody eller en personlig serverkopia. Hundbyte/kontobyte rensar det tidigare urvalet; köns-/namnbyte påverkar presentation direkt. Google-importen läser bara redaktionella dokument och kan aldrig anropas med hundprofil genom klienten. Riktat artikelurval är automatisk innehållsanpassning; tidigare svepande formuleringar om att profiluppgifter aldrig används för profilering får inte användas för att dölja detta faktiska ändamål. Ingen hälso-/beteendeprofil eller automatiskt beslut med rättslig effekt skapas.

Live databasåtkomst och identiteter är inte verifierade genom lokal implementation; verifiera tvåkontosisolering, nullable skrivning, radering och driftkonfiguration före berörd aktivering.
