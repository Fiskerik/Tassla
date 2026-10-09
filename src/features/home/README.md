# Hem och arbetsyta

`AppFlow` väljer inloggning/profil och därefter `ProductWorkspace`. Arbetsytan äger befintliga Supabase-läsningar, mutationslås, livstider och återhämtning. `HomeScreen` är en presentationsvy: hundprofil, fem dagars datumremsa, faktiska loggar/planer och genvägar. Hundfoto saknas i datamodellen; en tass används som platshållare. Rasnamn hämtas från befintliga `breeds`.

Hem öppnar exakt vald publicerad innehållsversion i Kunskap. Inget syntetiskt innehåll ersätter saknade nätdata. Historiska dagar visar endast inlästa loggposter (arbetsytans paginerade urval), inte ett garanterat komplett arkiv. Full logghistorik nås i Logg. Förfallna hälsoplaner syns i Hälsa.

Delad `BottomNav` har Hem, Logg, Träning, Hälsa, Mer. `ScreenTransition` animerar innehåll medan navigationen består; `AppScreen.scrollKey` återställer scrollpositionen vid sidbyte. Reducerad rörelse respekteras.

`DevelopmentPreview` är den äldre flaggade RAM-previewen, inte visuell referens för nya produktionsvyer. Aktuell reproducerbar UI-verifiering finns i [tools/visual-check](../../../tools/visual-check/README.md). Kör `pnpm check` och `pnpm bundle:ios`. Verkliga konton, RLS, native PDF och TestFlight verifieras separat. Se [UI-RESET](../../../docs/releases/UI-RESET.md).
