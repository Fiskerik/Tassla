# Ägarfeedback 2026-10-07

Ägaren har provat all implementerad funktionalitet och rapporterar att den ser bra ut. Build/version är okänd; detta är ett användarrapporterat resultat, inte en oberoende verifiering.

## Beställd ordning

UX-rättningar genomförs först, därefter återstående godkänd MVP-plan och innehållspopulering. Ingen rutinmässig ny mandatfråga behövs för redan beställd funktionalitet.

1. Ta bort dubbla `Hämta planer`/`Försök igen`. Första avgränsade slice: [UX-01](ux-01.md).
2. Datum ska kunna öppna native iOS-datumväljare samtidigt som manuell inmatning behålls. Tid ska kunna väljas med systemliknande väljare, inklusive påminnelser. Befintlig `parseTime` i `PlannedHealthScreen` använder `d` i stället för regexens sifferklass och rättas/testas i tidsslicen.
3. Handlingsnotiser ska visas som popup och försvinna efter några sekunder. Olösta skrivresultat ska fortfarande kunna kontrolleras efter stängning.
4. Beige hjälp-/tipsboxar göms bakom informationsknappar och modaler. Konflikter och validering får inte tappa sitt sammanhang.
5. Ta bort synliga `Stäng tangentbord`-knappar. Befintlig dragavvisning och tangentbordets `Klar` används.
6. Använd passande etablerade ikoner i loggen. Sömnens måne behålls. `@expo/vector-icons` finns redan.
7. Skapa och integrera Tasslas logotyp.
8. Tassla-pass ska få hundfoto och ljusa färgblock/avskiljningar. Nuvarande profilmodell saknar foto; en illustration får inte presenteras som hundens foto.
9. Gör befintliga tränings-/hälsoutkast tillgängliga i appen för intern granskning, tydligt märkta som utkast. Sätt inte `reviewed`/`published` eller fabricerad reviewreferens före faktisk granskning.
10. Förbered den tidsstämplade, hundkopplade kiss-/bajsmodellen för senare mönsteranalys. Ingen prognos eller medicinsk rekommendation ingår nu.
11. Fortsätt P08/P09 och samlad beta enligt `mvp-beta-delivery.md` efter berörda data-/compliancegrindar.

## Underlag och egna avgränsningar

De tre bifogade skärmbilderna har granskats visuellt. `UX-01-work-checkpoint.patch` applicerar rent mot bas `8801870`, men används som ändringsunderlag och appliceras inte oförändrad: dess miljöuppgifter avsåg en annan arbetskopia och dess modal-/timertest behöver stärkas enligt Architect review. Aktuell implementation sker direkt i detta skrivbara repository. Inga externa meddelanden, deployer eller publiceringar ingår.
