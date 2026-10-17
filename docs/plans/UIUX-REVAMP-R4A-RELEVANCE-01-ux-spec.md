# R4a — relevans och kontextuell apphjälp

UX-spec v7 · `UIUX-REVAMP-R4A-RELEVANCE-01`

## Ytor

- **Hem / Just nu:** hundrådsrekommendationsslotten visar bara en kandidat med grant för version, målgrupp, sammanhang, yta och prioritet. Första listobjektet får aldrig gestaltas som rekommendation. Saknas grantad kandidat visas ett tomläge i just den slotten; FAQ, planerade hälsohändelser och annat opåverkat innehåll i karusellen bevaras.
- **Kunskap / För dig:** tomt rekommendationsläge; ingen första artikel med rekommendationsetikett.
- **Kunskap / Artiklar:** endast explicita versionsgrants visas. Alla nuvarande hundguider saknar godkänd artikelyta i R4a, så tomläget säger att godkända artiklar saknas här. “Checklistor” och FAQ fortsätter sin separata befintliga läsresa.
- **Logg:** en tydlig “Hjälp om Logg och rutiner”-kontroll utanför eventeditor. Den öppnar exakt `daily-log-routines` v1 som läsning. Hjälpen är dold när add/edit-sheet är aktiv. Tillbaka återställer tidigare datum.
- **Hälsa / Vikt:** “Hjälp om viktregistrering” utanför aktiv vikteditor; öppnar endast `weight-history-guide` v1. Tillbaka återställer undertab Vikt.
- **Hälsa / Översikt / Genomfört:** “Hjälp om registrering” utanför add/edit-sheet; öppnar endast `health-records-guide` v1. Tillbaka återställer Översikt. Texten beskriver appregistrering, inte vård eller rekommenderat schema.
- **Träning / Rekommenderat och Alla övningar:** inget program visas utan både exakt grant och valt behov/sammanhang. Ärligt tomläge skiljs från fel/okänd källa.
- **Träning / Mina och dagliga val:** befintliga markeringar finns kvar per hund/version/steg. När versionen inte är tillåten visas en read-only status utan instruktioner eller handlingar. Hem/Checklista visar det exakta dagliga valet som otillgängligt/okänt, aldrig klart och aldrig som om det saknades.

## Tillstånd och interaktion

Loading, serverfel, tomt godkänt urval och okänt resultat är separata. Ingen tom state kan dölja ett läsfel. Hjälp öppnas och stängs utan att avbryta en editor eller tappa ett utkast. Samma komponenter/typografi som nuvarande Knowledge-läsning återanvänds; inga nya dependencies eller dekorativa rekommendationsbilder läggs till.

## Oförändrade delar

Ingen kalender-/fasväljare, ingen ny innehållspublicering, sökning/filter, FAQ-ändring, `PuppyChecklistScreen`-migrering, progressradering, träningsbehovsväljare eller vuxenrekommendation ingår. R4a-tomlägen är ett korrekt interimläge men stänger inte MVP:ns vuxenresa.

## Verifiering

Funktions-/fel-/retur-/scopekontroller dokumenteras i taskrapporten. Skärmbevis enligt designregler §14 sparas endast efter faktisk kontroll. Testsvit, live Supabase/RLS och fysisk native-beteende kräver separat faktisk verifiering; NOT TESTABLE redovisas uttryckligen.