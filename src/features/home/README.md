# Hem och arbetsyta

`AppFlow` väljer inloggning/profil och därefter `ProductWorkspace`. Arbetsytan äger befintliga Supabase-läsningar, mutationslås, livstider och återhämtning. `HomeScreen` är en presentationsvy: hundsammanfattning, fem dagars datumremsa, faktiska loggar/planer och genvägar. Hundfoto saknas i datamodellen; en generisk hundsilhuett används som platshållare, aldrig som ett påstått foto av hunden. Rasnamn hämtas från befintliga `breeds`.

Hem öppnar exakt vald publicerad innehållsversion i Kunskap. Inget syntetiskt innehåll ersätter saknade nätdata. Historiska dagar visar endast inlästa loggposter (arbetsytans paginerade urval), inte ett garanterat komplett arkiv. Full logghistorik nås i Logg. Förfallna hälsoplaner syns i Hälsa.

Delad `BottomNav` har Hem, Logg, Träning, Hälsa, Mer. De sex MVP-ytorna kan dessutom nås med vänster-/högersvep i ordningen Hem, Valplogg, Träning, Hälsa, Kunskap och Tassla-pass; Mer och undersidor lämnar svepläget. `ScreenTransition` använder kort toning och en liten horisontell förflyttning vid sidbyte, medan reducerad rörelse tar bort förflyttning. `AppScreen.scrollKey` återställer scrollpositionen vid sidbyte.

Hem visar hundkortet, därefter `HomeCarousel` och datumremsan. Dagens vy har en primär `Logga nu` med tokeniserat listavstånd till raderna under. Hem visar högst de tre senaste loggarna för vald dag, sorterade efter `occurredAt` fallande och därefter id fallande vid lika tid. Hälsoplaner visas separat och är inte begränsade av logggränsen. `ProductWorkspace` fortsätter att skicka sitt befintliga urval på högst 40 nyaste loggar; äldre loggar nås via Logg-tabben.

Carouselen visar dekorativa fotokort för Träning och ålders-/rasrelevant Kunskap samt Hälsa när en kommande plan finns. Fotona är inte ägarens hund eller bevis på en händelse; korttexten anger målet. Korten använder befintlig `Card`, färger och avståndstokens. `ProductWorkspace` skickar befintliga filtrerade urval och carouselen visar åldern via `formatDogAge`; den skapar inte nya råd. Horisontell snap stängs av vid reducerad rörelse. `before-homecoming` är fortsatt draft och ska först få en verifierad onboarding-kontext; första veckan hemma kan inte härledas ur ålder ensam.

`DevelopmentPreview` är den äldre flaggade RAM-previewen, inte visuell referens för nya produktionsvyer. Aktuell reproducerbar UI-verifiering finns i [tools/visual-check](../../../tools/visual-check/README.md). Kör `pnpm check` och `pnpm bundle:ios`. Verkliga konton, RLS, native PDF och TestFlight verifieras separat. Se [UI-RESET](../../../docs/releases/UI-RESET.md).
