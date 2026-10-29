# Byggen med granskningsinnehåll

Syntetiska checklistor, FAQ och träningsutkast styrs av den explicita byggvariabeln `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT`. Appen använder inte `__DEV__` för att avgöra om exemplen visas.

Codemagic-flödet `tassla-ios` heter `Tassla iOS — public TestFlight build`, sätter flaggan till `false` och kanalen till `public`. Det skapar en TestFlight-build med publicerat innehåll och skickar inte appen till App Store. Det separata flödet `tassla-ios-public` använder samma innehållsinställningar och skapar en signerad artefakt utan automatisk publicering. Workflow-ID:t `tassla-ios` är oförändrat så befintligt workflow-val fortfarande fungerar.

`tools/check-content-release.cjs` avvisar alla andra kombinationer och skriver `codemagic-logs/content-build-metadata.json`. `pnpm bundle:ios` kör samma grind före Expo-exporten. Behåll metadata tillsammans med IPA-filen. Före publik release ska utkasten granskas och revideras eller tas bort. Använd ett nytt publikt buildnummer och välj endast en artefakt vars metadata visar `channel: public` och `reviewContentEnabled: false`. En review-build får inte promoveras till publik release. Val av artefakt och publicering i App Store Connect är manuella steg; scriptet styr inte Apples konsol.

För lokal export i granskningsläge: sätt `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true` och `TASSLA_BUILD_CHANNEL=review` i kommandots miljö före byggscriptet. För verifiering utan tillfälligt innehåll: använd `false` och `public`. Appen måste byggas om när värdena ändras.
