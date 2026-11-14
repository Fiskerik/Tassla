# Telefonprov för GAP-arbetet

Detta är en levande testlista. Ändringarna måste först ingå i en signerad build som har distribuerats till TestFlight. Buildnummer och datum är ännu okända. Kontrollerna nedan är inte utförda och ska inte tolkas som godkännanden. Använd syntetiska testuppgifter där det är möjligt.

## Osäker snabblogg

1. Öppna Logg och logga exempelvis Mat. Kontrollera att en sparad post visas en gång och att Hem/framsteg enbart räknar bekräftade uppgifter.
2. Om ett osäkert svar kan framkallas: ingen särskild statusruta, kontrollknapp, osäker rad eller avslutsdialog ska visas. Appen gör en automatisk läsning. Om samma post bekräftas ska den visas en gång. Om läsningen inte kan bekräfta den ska loggen bli tillgänglig igen utan automatisk ny insättning; kontrollera listan innan du själv registrerar samma händelse på nytt.
3. Prova föregående dag och tillbaka och kontrollera att en bekräftad post syns en gång. Testa inte genom att upprepa samma registrering förrän du kontrollerat dagens logg; en läsning som inte kan bekräfta posten utesluter inte att första skrivningen ändå nådde servern.
4. Upprepa med VoiceOver och större text: den vanliga loggen ska gå att använda utan den borttagna kontrollrutan. Flygplansläge kan ge ett definitivt fel; ett kontrollerat server-/nätverksavbrott krävs för att pröva svarsförlust.

## Osäker träning på Hem

1. Om ett osäkert svar på en träningsändring kan framkallas, gå till Hem. Texten ska säga ”Vi kunde inte se om ändringen sparades. Kontrollera den igen.” Den får inte säga att ändringen är sparad eller misslyckad.
2. Kontrollera samma ändring igen och verifiera att rätt program/steg visas när svaret är bekräftat. Prova VoiceOver och större text. Ett rent flygplansläge bevisar inte att det osäkra svarsfallet har uppstått.

## Rapportera

Ange TestFlight-buildnummer, telefonmodell och iOS-version, scenario, förväntat och faktiskt resultat. Rapportera inga verkliga person- eller hälsouppgifter i skärmbilder. Lokal RN Web med syntetisk fixture har verifierat delar av presentationen och återförsökskopplingen, men bevisar inte native beteende, verklig server eller TestFlight-distribution.

## Pausad träningsresa

1. Starta en träningsresa och pausa den. Öppna Träning och kontrollera att kortet ”Fortsätt där ni var” visar ”Pausad”, rätt övning och tidigare bekräftade framsteg.
2. Tryck på kortet: programöversikten ska öppnas utan att resan automatiskt återupptas. Återuppta via den avsedda kontrollen och kontrollera därefter aktiv status.
3. Slå på VoiceOver och kontrollera att kortet säger pausad och senast vald övning, inte aktivt steg. Prova stor text och att innehåll och knappar är nåbara utan att döljas av nedre navigeringen.

## Snabblogg efter bekräftelse

1. Logga två olika händelser med några sekunders mellanrum. När den första är bekräftad ska den andra kunna loggas även om listan fortfarande läser om data; båda ska sedan synas en gång.
2. Logga och ångra en händelse medan listan uppdateras. Kontrollera att den inte återkommer vid nästa uppdatering. Prova gärna på långsam uppkoppling.
3. Prova ett snabbt dubbeltryck och samma kategori upprepade gånger: kontrollera att befintlig spärr/dubblettfråga fungerar och att bara en avsedd händelse sparas. Testa inte kontoradering med ett konto som innehåller data du vill behålla.

Detta är inte ett offlineprov: ändringen frigör nästa handling först efter serverbekräftelse.

## Lokal buildstatus

Public iOS JavaScript-export via `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false EXPO_NO_TELEMETRY=1 CI=1 pnpm bundle:ios` passerade lokalt 2026-11-13 efter de senaste ändringarna (1 638 JavaScript-moduler). Det är inte en signerad native build och har inte publicerats till TestFlight. Expo-native lagring och den föreslagna offlinekön ingår inte som verifierad funktion i exporten.

## Rak ålderstidslinje i Utveckling

1. Öppna Hem → Utveckling. Under hundbilden ska åldern visas på en rak horisontell linje med grön del fram till markören och faserna Valp/Unghund under.
2. Tryck på åldersetiketten för att dölja den, och på markören för att visa den igen. Bekräfta att den gröna delen och markören ligger kvar under tiden.
3. Prova med större text och VoiceOver: hela etiketten och fastexterna ska kunna läsas, markören ska vara nåbar även nära ändarna och knapparna ska beskriva visa/dölj. Med en testhund nära 6 månader respektive 24 månader: kontrollera att kronologisk ålder/fas är rimlig och att vuxenläget visas från 24 månader.

### Åldersetikett på bilden

Kontrollera att åldern visas på fotots nedre del med genomskinlig bakgrund och att avstånden mellan bilden, tidslinjen och korten känns luftiga. Tryck för att dölja och på linjens markör för att visa igen. Prova större text och VoiceOver; texten ska vara läsbar mot bilden, fokus ska vara begripligt och inget ska kapas.

## Förhandsvisning av nästa träningsövning

Öppna ett program med minst två övningar, logga ett pass och bekräfta aktuellt delmål. Innan du trycker Nästa ska namnet på nästa övning synas ovanför knappen. Tryck Nästa och kontrollera att just den övningen öppnas efter bekräftad sparning. Prova sista steget och en pausad resa; någon missvisande nästa titel ska inte visas. Testa med större text och VoiceOver samt gärna långsam uppkoppling. Den syntetiska webbfixturen bevisar inte verklig server eller native.

## Osäker sparning i Träning

Om ett osäkert svar kan framkallas i programöversikt eller öppen övning: kontrollera att texten beskriver osäkerheten och att «Kontrollera samma ändring igen» finns och fungerar. Ett operationsspecifikt meddelande kan visas i stället för den generella reservtexten. Vid bekräftad sparning får vyn inte felaktigt säga att resultatet fortfarande är okänt. Verklig svarsförlust kan kräva ett kontrollerat nätverksprov.

## Rutinförslag

Öppna dagens aktiviteter från Hem eller Checklista och välj ”Förslag: Lugn stund”. Kontrollera att ett redigerbart utkast öppnas och att ingenting sparas förrän du väljer Spara rutin. Ändra gärna texten, prova Tillbaka och välj att fortsätta redigera; kontrollera sedan att sparad rutin och dagens punkt visas korrekt. Prova stor text och VoiceOver. Om ett osäkert svar kan framkallas, kontrollera status och återförsök innan du gör en ny rutin; mallens sparning och valet för dagen är två separata steg.

## Hälsouppgifternas ursprung

Öppna Hälsa och kontrollera att texten under rubriken är lätt att läsa och förklarar att det är en plats för egna uppgifter, inte en veterinärjournal. Växla mellan Översikt, Vaccinationer och Veterinär och öppna även Vikt, där egna viktuppgifter beskrivs separat. Prova större text och VoiceOver.

## Personligt hundfoto — ingår inte i nuvarande prov

Den nuvarande exporten/TestFlight-builden saknar fotoväljare och lokal fotolagring. Hem visar fortfarande den generiska porträttbilden. Leta inte efter en kontroll för att lägga till hundfoto; detta är inte en felaktig TestFlight-resa. Fotofunktionen kräver separat godkännande av information, lagring/retention och dependency, Compliance-granskning samt native iOS-verifiering innan en senare build kan provas. Se [integrationsplanen](../tasks/dev/GAP-DOG-PHOTO-INTEGRATION-01.md).
