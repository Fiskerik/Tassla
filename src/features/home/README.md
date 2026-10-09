# Hem och arbetsyta

`AppFlow` väljer inloggning/profil och därefter `ProductWorkspace`. Arbetsytan äger befintliga Supabase-läsningar, mutationslås, livstider och återhämtning. `HomeScreen` är en presentationsvy: hundprofil, fem dagars datumremsa, faktiska loggar/planer och genvägar. Hundfoto saknas i datamodellen; en tass används som platshållare. Rasnamn hämtas från befintliga `breeds`.

Hem öppnar exakt vald publicerad innehållsversion i Kunskap. Inget syntetiskt innehåll ersätter saknade nätdata. Historiska dagar visar endast inlästa loggposter (arbetsytans paginerade urval), inte ett garanterat komplett arkiv. Full logghistorik nås i Logg. Förfallna hälsoplaner syns i Hälsa.

Delad `BottomNav` har Hem, Logg, Träning, Hälsa, Mer. De sex MVP-ytorna kan dessutom nås med vänster-/högersvep i ordningen Hem, Valplogg, Träning, Hälsa, Kunskap och Tassla-pass; Mer och undersidor lämnar svepläget. `ScreenTransition` använder kort toning och en liten horisontell förflyttning vid sidbyte, medan reducerad rörelse tar bort förflyttning. `AppScreen.scrollKey` återställer scrollpositionen vid sidbyte.

`HomeCarousel` ligger direkt under hundens profilkort och visar fyra eller fem kompakta genvägar: nästa träningssteg, senaste valplogg, ålders- och rasrelevant Kunskap, kommande Hälsa när en sådan finns och `Logga nu`. Korten använder `Card`, `IconChip` och tokens. `ProductWorkspace` skickar redan ålders- och rasfiltrerade tränings-/kunskapsurval från de befintliga läsningarna; carouselen presenterar samma urval och visar åldern via `formatDogAge`. Carouselens horisontella snap stängs av vid reducerad rörelse.

`DevelopmentPreview` är den äldre flaggade RAM-previewen, inte visuell referens för nya produktionsvyer. Aktuell reproducerbar UI-verifiering finns i [tools/visual-check](../../../tools/visual-check/README.md). Kör `pnpm check` och `pnpm bundle:ios`. Verkliga konton, RLS, native PDF och TestFlight verifieras separat. Se [UI-RESET](../../../docs/releases/UI-RESET.md).
