# Byggen med granskningsinnehåll

Syntetiska checklistor, FAQ och träningsutkast styrs av den explicita byggvariabeln `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT`. Appen använder inte `__DEV__` för att avgöra om exemplen visas.

Codemagic-flödet `tassla-ios` sätter flaggan till `true` och kanalen till `review`. Det skapar en TestFlight-build och skickar inte appen till App Store. Det separata flödet `tassla-ios-public` sätter flaggan till `false` och kanalen till `public`; det skapar en signerad artefakt utan automatisk publicering.

`tools/check-content-release.cjs` avvisar alla andra kombinationer och skriver `codemagic-logs/content-build-metadata.json`. `pnpm bundle:ios` kör samma grind före Expo-exporten. Behåll metadata tillsammans med IPA-filen. Före publik release ska utkasten granskas och revideras eller tas bort. Använd ett nytt publikt buildnummer och välj endast en artefakt vars metadata visar `channel: public` och `reviewContentEnabled: false`. En review-build får inte promoveras till publik release. Val av artefakt och publicering i App Store Connect är manuella steg; scriptet styr inte Apples konsol.

För lokal export i granskningsläge: sätt `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true` och `TASSLA_BUILD_CHANNEL=review` i kommandots miljö före byggscriptet. För verifiering utan tillfälligt innehåll: använd `false` och `public`. Appen måste byggas om när värdena ändras.
