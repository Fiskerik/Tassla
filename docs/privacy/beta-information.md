# Betainformation — arbetsutkast
Datum: 2026-10-07. P10. Inte färdig information för publicering eller godkännande av verklig betadrift.

## Fastställda uppgifter
Av Erik angiven ansvarig: EriMali AB. Rollen som personuppgiftsansvarig ska bekräftas mot faktisk drift före publicering. Postadress: Stenvallavägen 1, 18634 Vallentuna. Support: erimali.ab@gmail.com. Erik har valt egna konton och sparade hunduppgifter. Betakonton och hunddata ska gallras 30 dagar efter avslutad beta. Individuell kontoradering är ett separat flöde och ska inte vänta till denna tidsfrist.

## Funktioner som informationen behöver beskriva
Kontouppgifter, hundprofil (inklusive vald åldersvisningsenhet i Slice A:s lokala kod och planerade Mix-delras-ID:n), vikt, utförda och planerade hälsohändelser samt träningsprogress och privata checklistor (bockar, egna punkter och valt fasläge per hund/konto) används i ägarens appflöden. R02-2 lägger till ägarens egna rutinmallar, dagsval för rutiner/träningssteg och serverbekräftade rutinmarkeringar. Dagsuppgifter är till för ägarens privata planering; träningsstatus härleds från befintlig sparad träningsprogress. Mix-delraserna visas endast i Hundprofilen; åldersvisningsenheten formaterar åldern i Hem, Hundprofil, Tassla-pass preview och ägarinitierad PDF när hundprofilen delas. Profiluppgifterna används inte för analytics eller profilering; passet delas endast genom ägarens val i systemets delningsdialog. Rutinmallar/namn omfattas av åtkomst-/kopiebegäran och konto-/hundradering. Daterade val och rutinmarkeringar visas bara för vald dag och gallras när deras datum är 30 dagar gammalt i den lagrade IANA-zonen; nästa dagliga jobb tar bort dem, normalt inom 24 timmar efter gränsen. Scheduler och verklig databasretention måste verifieras före beta. Raskatalogen är referensdata utan ägaruppgifter, och importen väntar på verifierat Wikidata CC0-snapshot. Åldersmigrationens RLS-runtime är inte verifierad. Lokala påminnelser är frivilliga och har generisk text. Tassla-passet skapas på begäran som lokal PDF. Delade kopior hos mottagaren kan inte återkallas av appens lokala städning.

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
