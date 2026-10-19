# UIUX-2B-SUPPORT-ACCESS-01 — render- och knappinventering

Datum: 2026-10-19 · Plan v1.6 · Footerfix implementerad och RN Web-verifierad; oberoende QA PASS och Reviewer PASS; lokal checkpoint klar.

## Rendermetod och gränser

Produktkomponenterna byggdes med `tools/visual-check/build.cjs` till separata public- och review-fixtures. Chrome-renderingar använder syntetiska data och sparas i mapparna `public/` och `review/`. 375×844 och 430×844 täcker Hälsa, planerad Hälsa, Notiser, Profil, Tassla-pass, Passport-avsnitt och Rutinhanteraren vid standard och 140 %-CSS-proxy. Sheet-footer kontrolleras dessutom vid 375×667. Passport- och rutinsheetens aktuella captures täcker public/review, 375×667, 375×844 och 430×844, standard/140 %. Rutinredigering finns bara i review-fixturen eftersom public-fixturen saknar syntetiska rutiner.

Review-banner, fixturedata och den syntetiska standardbildsflaggan kommer från harnessen; de är inte produkt-UI. Public och review använder samma produktkomponenter, med respektive fixture-innehåll.

140 %-proxy förstorar RN Web-text via CSS men ändrar inte React Native `useWindowDimensions().fontScale`. Därför verifierar webbrenderingen inte Loggs eller Viktens `fontScale > 1.2`-gren. Koden väljer staplad layout över 1.2; fysisk iPhone/Dynamic Type måste bekräfta att 1.0 behåller en rad och 1.4 staplar fälten. VoiceOver, faktisk iOS-tangentbordsgeometri och iPhone-layout är NOT TESTABLE här.

## Knappinventering och beslut

| Vy/åtgärd | Tidigare synlig text | Nu synlig text | Tillgängligt namn / motiv |
|---|---|---|---|
| Delade datumfält | Kalender | Kalenderikon | Fullt namn, exempelvis `Välj datum i kalender`; 44×44 pt-minimum |
| Delade tidsfält | Välj tid | Klockikon | Fullt namn, exempelvis `Välj tid från tider`; 44×44 pt-minimum |
| Rutiner, skapa | Skapa rutin | Skapa | `Skapa en ny rutin`; sektionsrubriken ger resten av kontexten |
| Rutiner, dagsval | Lägg till/Ta bort från Hemskärmen | Lägg till idag/Ta bort idag/Lägg tillbaka idag | Namnger fortfarande den valda rutinen och Hemskärmen |
| Rutin, redigera/radera | Redigera/Ta bort rutin | Penn-/soptunneikon | Fullt namn med rutinens namn; bekräftad radering är oförändrad |
| Rutin, spara | Spara rutin | Spara | Fullt `Spara rutin [namn]`-namn |
| Hälsa, lägg till | Lägg till händelse | Lägg till | Skärmläsarnamn `Lägg till hälsohändelse` |
| Hälsa/Vikt/Plan, spara | Spara vikt/Spara rättning/Spara händelse/Spara plan | Spara | Fullt åtgärdsnamn lämnas separat från kort synlig etikett |
| Hälsa, radera | Radera vikt/Radera händelse | Radera | Tillgängligt namn anger viktpost eller händelse |
| Hälsa, avbryt rättning | Avbryt rättning | Avbryt | Tillgängligt namn behåller `Avbryt rättning` |
| Notiser, enhetsval | Tillåt Tasslas påminnelser på den här enheten | Tillåt påminnelser | Fullständigt namn och beskrivning behålls |
| Notiser, träningsval | Lägg till en frivillig träningspåminnelse | Träningspåminnelse | Fullständigt checkbox-namn behålls |
| Notiser, spara/behörighet | Spara val/Tillåt påminnelser på telefonen | Spara/Tillåt påminnelser | Namnen anger sparning respektive telefonbehörighet |
| Profil | Spara profil/Spara kennelkoppling/Ta bort kennelkoppling | Spara/Ta bort | Fulla tillgängliga namn anger profil/kennelkoppling och tillstånd |
| Tassla-pass | Välj vad som delas | Välj avsnitt | Tillgängligt namn `Välj avsnitt att dela` |

Längre återhämtnings- och konflikthandlingar samt händelsetyper behåller sin text när den behövs för att undvika tvetydighet, exempelvis `Kontrollera samma ändring igen`, `Använd aktuell historik och börja om`, Vaccination och Veterinärbesök. Infoåtgärderna visar en tydlig informationsikon med fullständigt tillgängligt namn.

## Renderobservationer

- Kalender-/klockikoner och de kortare, begripliga knappetiketterna syns i public och review. 140 %-proxyn bekräftar kompaktare etiketter men förstorar CSS-text utan att ändra RN `fontScale`; därför kan den inte bekräfta den fontScale-styrda staplingen. Loggdatumet klipps fortfarande i just den webproxyn, vilket är väntat och ska verifieras på iPhone vid Dynamic Type 1.4. Delade datum-/tidsfält och deras 44 pt-tryckytor ryms i övriga stödvyerna.
- Rutinsheeten använder `Skapa`, en penna för Redigera och en soptunna för radering. Rutinformulärets synliga `Spara` är kort medan dess tillgängliga namn anger rutinen. Efter v1.6 visar `Klar` helt vid 375×667 (y=595–651) och 375×844/430×844 (y=772–828), i standard och 140 %-proxy, public och review. Review-rutinlistan scrollades till botten vid alla storlekar; `Klar` låg kvar helt inom viewporten. Formulärets Spara var nåbar vid 375×667.
- Viktredigering visar `Spara`, `Avbryt` och `Radera`; 375×667-bilderna visar att hela posten går att nå genom scroll. Native stapling vid fontScale >1.2 är inte styrkt av CSS-proxyn.
- Hälsans formulär använder keyboard-aware scroll. Passport-avsnittsvalets `Klar`-knapp är nu helt synlig vid 375×667, 375×844 och 430×844 i standard/140 %-proxy, public/review. De tre Passport-valen ryms i test-fixturen; listan har ändå en separat vertikal scroll-yta. RN Web-mätningarna bekräftar knappens viewportläge efter att öppningsanimationen stannat.
- 140 %-proxyts bottenmeny kan radbryta tabnamn i RN Web; den native skalstyrda 2a-menylayouten bedöms separat och ersätts inte av detta stödvy-underlag.

## Manuell iPhone-kontroll som återstår

1. Sätt Dynamic Type till standard, öppna Logg och redigera en händelse: datum och tid ska ligga på samma rad.
2. Öka Dynamic Type över fontScale 1.2 (kontrollera gärna 1.4): Loggs datum och tid ska staplas och hela `ÅÅÅÅ-MM-DD` synas; Viktens Spara/Avbryt ska staplas.
3. Med VoiceOver kontrolleras namn på kalender-/klockikoner, infoikon, penn-/soptunneknappar och kortade Spara/Tillåt-val.
4. På 375×667 kontrolleras att tangentbordet inte döljer primärknappen i rutin- och utförd-hälsoformulär.

Inga testsviter kördes. `pnpm typecheck`, riktad ESLint inklusive `BottomSheet.tsx`, `git diff --check` och `python tools/dev_flow.py validate` (UTF-8-läge) passerar. Public/review RN Web-captures visar att Passport- och rutinsheetens `Klar` är helt inom viewporten vid samtliga tre storlekar och båda skalorna; review-rutinlistan scrollas separat och rutinens redigerings-Spara nås vid 375×667. Oberoende QA v1.6 PASS och Reviewer v1.6 PASS; lokal checkpoint klar utan commit/push. 140 %-CSS-proxy ändrar inte RN `fontScale`, och native VoiceOver, faktisk Dynamic Type och tangentbord kontrolleras manuellt på iPhone.
