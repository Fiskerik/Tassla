# Betainformation — arbetsutkast
Datum: 2026-10-07. P10. Inte färdig information för publicering eller godkännande av verklig betadrift.

## Fastställda uppgifter
Av Erik angiven ansvarig: EriMali AB. Rollen som personuppgiftsansvarig ska bekräftas mot faktisk drift före publicering. Postadress: Stenvallavägen 1, 18634 Vallentuna. Support: erimali.ab@gmail.com. Erik har valt egna konton och sparade hunduppgifter. Betakonton och hunddata ska gallras 30 dagar efter avslutad beta. Individuell kontoradering är ett separat flöde och ska inte vänta till denna tidsfrist.

## Funktioner som informationen behöver beskriva
Kontouppgifter, hundprofil (inklusive vald åldersvisningsenhet i Slice A:s lokala kod och planerade Mix-delras-ID:n), vikt, utförda och planerade hälsohändelser samt träningsprogress och privata checklistor (bockar, egna punkter och valt fasläge per hund/konto) används i ägarens appflöden. R02-2 omfattar ägarens namngivna rutinmallar med separata checklistpunkter, valfria dagliga eller egna dags-/vecko-/månadsintervall och ankardatum. Veckoschemat kan innehålla en eller flera valda veckodagar och ingår i rutinens schemauppgifter. Dagsval med frysta namn/checklistor, skip-tombstones och serverbekräftade punktmarkeringar samt träningsval används i ägarens privata planering; träningsstatus härleds från befintlig sparad träningsprogress. Mix-delraserna visas endast i Hundprofilen; åldersvisningsenheten formaterar åldern i Hem, Hundprofil, Tassla-pass preview och ägarinitierad PDF när hundprofilen delas. Hundens ålder, ras och frivilliga planerade hemkomstdatum används för automatiskt artikelurval; namn och frivilligt kön används för tilltal i artiklar. Profiluppgifterna skickas inte till analytics; passet delas endast genom ägarens val i systemets delningsdialog. Rutinmallar, schema, valda veckodagar/ankare, namn, checklistor, dagskopior och skip-state omfattas av åtkomst-/kopiebegäran och konto-/hundradering. Daterade val, skip-tombstones och rutinmarkeringar visas bara för vald dag och gallras när deras datum är 30 dagar gammalt i den lagrade IANA-zonen; nästa dagliga jobb tar bort dem, normalt inom 24 timmar efter gränsen. Scheduler och verklig databasretention måste verifieras före beta. Raskatalogen är referensdata utan ägaruppgifter, och importen väntar på verifierat Wikidata CC0-snapshot. Åldersmigrationens RLS-runtime är inte verifierad. Lokala påminnelser är frivilliga och har generisk text. Tassla-passet skapas på begäran som lokal PDF. Delade kopior hos mottagaren kan inte återkallas av appens lokala städning.

Åtkomst- och kopiebegäran ska omfatta hundprofilens råvärde `dogs.age_display_unit` tillsammans med övriga profilfält. Konto- och raderingskandidaten är lokalt implementerad under P10. Serverfunktionen måste driftsättas och verifieras innan flödet kan beskrivas som tillgängligt i en betaversion. Ett okänt serversvar är inte bevis på radering. Appen ska visa supportväg och skilja serverradering från problem med lokal städning.

## Öppet före publicering
- Dokumentera slutliga ändamål och rättslig grund för varje behandling. Individuell attribution och pilotmätning väntar på Eriks beslut; inget samtycke antas.
- Bekräfta faktisk tjänsteleverantör, ansvarsfördelning, avtal, lagringsregion, underleverantörer och eventuella överföringar.
- Bekräfta faktisk lagringstid och hantering av backuper, driftloggar och autentiseringsuppgifter. Påstå inte att alla kopior försvinner direkt.
- Beskriv rättigheter, kontaktväg och klagomålsväg efter granskning mot faktiska rutiner.
- Ange betans slutdatum och verifiera gallringsrutinen i utvecklingsmiljö med syntetiska konton.
- Verifiera R02-2:s schema/RLS, åtkomst-/kopieprocess för rutinmallar och dagsval samt att retention-jobbet är schemalagt och har lyckad körning. Detta utkast publicerar inte ändamålet eller godkänner live-beta.
- Granska texten mot den slutliga appen och backend innan informationen visas som komplett.

Ingen uppgift om juridisk efterlevnad, EU-lagring, avtal eller genomförd radering bekräftas genom detta utkast. Underlag och tidigare granskning finns i docs/tasks/dev/beta-account.md.

## Insikter — planerad privat loggöversikt

Insikter är en planerad funktion för att visa dig sammanräknade antal från din hunds befintliga loggar per vald vecka, månad eller sedan första loggen. Du kan öppna samma vy från Logga → Översikt eller Hundprofil. Profilgenvägen ändrar inte vilka uppgifter som används eller vem som får se dem. Vyn är privat för den inloggade ägare som har åtkomst till hundens loggar. Den bedömer inte hundens hälsa eller beteende och visar inte hur fullständigt du har registrerat verkliga händelser.

Översikten beräknas vid läsning från loggarnas händelsetyp, tidpunkt och eventuell olycksklassificering. Den visar lokala datum och antal för kiss, bajs, oklassificerade olyckor, sömn och vakenhet. En olycka räknas som kiss eller bajs endast när du uttryckligen valt den typen; annars visas den separat som oklassificerad. Loggtext, vikt, varaktighet, hälsouppgifter och exakta händelsetider visas inte i aggregatet. Resultatet hålls tillfälligt i skärmens minne för vald hund och period. Ett separat aggregat sparas inte, det exporteras inte separat och det delas inte med andra, används för profilering eller skickas till analysverktyg.

Du rättar eller tar bort enskilda uppgifter i loggen. En begäran om kopia utgår från de underliggande maskinläsbara loggposterna; Insikter räknas från dessa poster och skapar därför inget separat lagrat aggregat att lämna ut. Hund- och kontoradering följer appens befintliga raderingsflöde. Den redan angivna gallringen av betakonton och hunddata 30 dagar efter avslutad beta gäller fortsatt; Insikter inför ingen ny lagringstid. Hantering av leverantörsbackuper och driftloggar beskrivs i de öppna punkterna ovan.

Denna beskrivning gäller den planerade funktionen och ska stämmas av mot den färdiga appen och backend före beta. Erik rapporterar Compliance-godkännande för FLOW-INSIGHTS-01A; den separata granskningstranskriptionen finns inte i denna checkout. Funktionen, backend-RPC:n och live-åtkomstkontrollerna är inte driftsatta eller verifierade genom denna dokumentuppdatering.


## Artiklar — frivilliga profiluppgifter

Du kan ange förväntad hemkomst och kön när du registrerar eller redigerar hundprofilen. Datumet styr förberedande artikelurval; det räknas aldrig fram från födelsedatum och blir inte automatiskt faktisk hemkomst. Erik har valt att behålla datumet som en redigerbar planeringsuppgift även när det passerat. Det visas i profilen tills du ändrar/tar bort det eller hunden/kontot raderas; rekommendationsfönstret upphör enligt artikelns metadata. Denna fortsatta användning är visning och rättelse av din egen planering, inte en slutsats om flyttdatum.

Kön används bara för han/hon i artikeltexten. Utan kön används hundens namn. Namn/pronomen fylls i lokalt när texten visas; ingen artikelkopia per hund sparas. Hunduppgifterna skickas inte till Drive, artikelimporten, AI, partners eller analysverktyg och läggs inte till i Tassla-pass/PDF genom denna funktion. Alla publicerade artiklar kan fortfarande läsas även när de inte rekommenderas.

Åtkomst-/kopieinventeringen omfattar råfälten `dogs.expected_homecoming_date` och `dogs.sex`. Båda kan tömmas och följer befintlig hund-/kontoradering samt betans beslutade gallring. Live-RLS och verklig aktivering måste verifieras separat; denna text ändrar inte arbetsutkastets övriga öppna driftfrågor.
