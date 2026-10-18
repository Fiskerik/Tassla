# Insikter — sparade Kiss- och Bajsloggar

Panel 8 nås från Logg via **Översikt**. Den visar beskrivande antal av sparade kiss- och bajshändelser för vecka, månad eller sedan start. Vecka börjar måndag. Månad och vecka kan bläddras bakåt; framtida perioder är avstängda. Sedan start grupperas per lokal kalendermånad.

Data läses vid öppning för den valda hunden, med en minimal projektion av händelse-ID, hund-ID, typ, tid och kanoniska olyckskategorier. Alla sidor läses i stabil tidsstämpel-/ID-ordning och kontrolleras mot count och unika ID:n. Fel eller upptäckt drift ger retrybart fel utan delvis diagram. Offset-pagination är en omläsningsbar best-effort-läsning, inte en transaktionssnapshot.

Datum grupperas i enhetens validerade IANA-tidszon, som visas i vyn. Dagar utan sparad post visas som **Ej loggat**, aldrig som noll. En tom period skiljs från tom historik och läsfel. Diagrammet har en numerisk motsvarighet för tillgänglighet.

Loggarna beskriver endast det som finns sparat och bevisar inte att alla verkliga händelser har registrerats. Sömnvaraktighet, vakentid och medicinska/träningsmässiga slutsatser ingår inte. Panel 8 förblir öppen för en separat, godkänd sömnintervallmodell.

När man går tillbaka återställs samma Loggdatum och scrollposition. Varje AppScreen-route behåller sin egen scrollposition.

## Verifiering

- Modell- och querytester: tests/insights-model.test.mjs, tests/workspace-data.test.mjs, tests/log-screen-policy.test.mjs.
- AppScreen route-offset-regression: tests/app-screen-ux.test.mjs.
- Syntetisk public/review-browsermatris och återgångsflöde: docs/design/evidence/vision-rev02/insights/.
- Verklig Supabase/RLS, native iOS/Android, VoiceOver och enhetens Dynamic Type kräver separat appmiljö och är inte bevisade av dessa lokala kontroller.
