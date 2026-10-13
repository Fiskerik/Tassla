# Hem och arbetsyta

`AppFlow` väljer inloggning/profil och därefter `ProductWorkspace`. Arbetsytan äger befintliga Supabase-läsningar, mutationslås, urvalsnycklar och återhämtning. Hemskärmen följer panel 1 i `vision_rev02.jpg`: tidsanpassad hälsning, hundens ålder och veckoremsa, ett `Just nu`-kort, en sammanhållen dagslista och blå/gröna/lila genvägar.

`home-greeting.ts` ger en testbar tidsanpassad hälsning med `Hej!` som fallback. Public och review Home använder samma runda `home-dog-portrait-placeholder.png` som generisk, AI-genererad bildkonst. Den är en standardplatshållare, inte ett foto av hunden eller en identifierad verklig hund. En synlig `Standardbild`-etikett med solid kontrastbakning visas på porträttet i båda lägena; skärmläsaren kan annonsera etiketten medan själva bilden är dekorativ. Ingen text, data eller tillgänglighetsbeskrivning kopplar bilden till hundens namn eller ras. Personligt hundfoto saknas i datamodellen.

Home öppnar exakt vald publicerad innehållsversion i Kunskap. Inget syntetiskt innehåll ersätter saknade nätdata. `Just nu` prioriterar aktuellt innehåll och använder ett tillgängligt träningssteg som fallback. Konto-/hundurval skyddar mot att gammalt innehåll visas medan ny data laddas. Reviewprogram injiceras endast med `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true` och får en synlig tillfällig markering.

`ProductWorkspace` hämtar dagens rutiner och träningsval. Home visar högst fem rader och räknar hela aktiva mängden. Rutinens checkbox sparar ägarens dagsmarkering; träningsstegets status härleds endast från sparad `training_progress` för rätt hund, versionsbundna steg och lokal dag. Guideöppning, planerad vård och olänkad logg påverkar inte dagsräknaren.

Rutinens checkbox och dess detaljöppning är separata handlingar. Träningsraden öppnar befintliga Träning och har ingen checkbox. Pending, failed och unknown för en rutin visas på samma rad med den befintliga exakta retry-handlingen. `DailyActivityManagerSheet` återanvänder `BottomSheet` och innehåller rutinernas create/edit/delete, val per dag, träningsval, borttagning från dagen och återhämtning. `Visa alla`, rubrikchevron och tomt läge öppnar samma sheet.

`Card`, `DailyActivityItem` och `DestinationTile` har opt-in `home`-varianter. Befintliga standardprops och standardutseenden består för andra skärmar. Home använder semantiska token för varm canvas, varma kort, progress och tipsaccent samt destinationsytor i blått, grönt och lila. Varianterna visas i `ComponentGalleryScreen`.

`main-navigation.ts` definierar ordningen Hem, Logg, Träning, Kunskap, Mer, aktiv flik, svepgränser och riktningslogik. Hälsa, Tassla-pass, profil och inställningar ligger kvar under Mer. FAQ/checklistflödena är fortsatt flikar i Kunskap; deras affärslogik/data ändras inte. `before-homecoming` är fortsatt draft tills onboarding-kontexten kan verifieras.

Reproducerbara React Native Web-renderingar finns i [tools/visual-check](../../../tools/visual-check/README.md). De använder syntetiska data; Supabase/RLS-runtime, native enheter och TestFlight verifieras separat.
