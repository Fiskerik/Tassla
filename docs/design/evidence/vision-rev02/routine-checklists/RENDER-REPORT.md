# Egna dagsrutiner med checklistor — renderunderlag

Datum: 2026-10-14 · Bas: `56bf224` · Källa: lokal workspace på `work` · Renderer: React Native Web + Chromium · Extern data: ingen

## V5 — implementation och delvis renderunderlag

v5-implementationen använder en pennknapp `Redigera` vid rutinens namn och samlar namn, checklista och upprepning i samma utkast/sparning. Plus lägger till en rad sist med ett stabilt punkt-ID; minus tar bort vald rad. Läs-vyn har inga punktvisa redigeringsknappar eller long-press. Ett aktivt utkast blockerar övriga rutin- och dagsval, inklusive träningsval och hel-rutin-radering. Ändrat utkast kräver bekräftelse innan det kastas vid stängning/bakåt. Under pending/unknown behålls och låses fälten tills den befintliga retry/readback-vägen har löst resultatet.

Tre redan fångade reviewbilder finns i `review-v5/`: `manager-read-375x844.png`, `manager-edit-375x844.png` och `discard-confirm-375x844.png`. De visar läsvy, samlat edit mode och discard-bekräftelse vid 375×844. Detta är ett begränsat renderunderlag, inte en fullständig visuell QA eller acceptans av v5.

Försök att fortsätta Playwright-renderingen stoppades innan fler vyer kunde fångas: Chromium avslutades vid start med `SIGTRAP`; loggen visade `setsockopt: Operation not permitted` från crashpad. Samma fel uppstod med projektets headless/no-sandbox/disable-crash-reporter-argument och vid direkt headless Chromium-start. Därför saknas färska v5-renderingar för 430×844, 375×667, 140 %-textproxy, create, sparat, failed/unknown/retry och andra tillstånd. Inga visuella QA-slutsatser görs från dessa vyer; fortsätt capture när en fungerande browser-session finns.

Senast körda statiska kontroller efter källändring: `pnpm typecheck`, riktad ESLint på `DailyActivityManagerSheet.tsx` och `tools/visual-check/app.tsx`, `git diff --check` för v5-paths samt `python3 tools/dev_flow.py validate` — PASS. Public- och reviewbundle byggdes tidigare i samma v5-arbete — PASS. Inga testsviter eller databasoperationer kördes. Oberoende QA/Reviewer och native-/backendverifiering återstår.

## V4 — historical implementation and render record

- `pnpm typecheck`, ändrade TS/TSX-filers `eslint`, `git diff --check` och `python3 tools/dev_flow.py validate` — PASS. En lintvarning om saknat `dailyTimeZone`-beroende rättades; slutlig lint är omkörd.
- Public- och reviewbundle byggda på nytt med `tools/visual-check/build.cjs` — PASS.
- Manuell Chromium-render med syntetiska fixturedata; inga page errors. Aktuella reviewbilder: `review/manager-v4-375x844.png`, `review/manager-info-v4-375x844.png`, `review/item-actions-pencil-v4-375x844.png`, `review/create-routine-repeat-v4-375x844.png`, `review/create-routine-repeat-actions-v4-375x844.png`, `review/manager-v4-430x844.png`, `review/manager-v4-375x667.png` och `review/manager-v4-140-percent-proxy.png`.
- Renderingen visar pennikoner utan synlig `Hantera`-text, en `(i)`-knapp med kompakt hjälp och formulärets val för aldrig/dagligen/eget dags-, vecko- eller månadsintervall. 140 %-proxybilden kontrollerades efter att sektionsrubriker och namnknapp fick radbrytas i smal vy; inget innehåll klipps horisontellt.
- Ingen testsvit kördes och migrationen kördes inte. Oberoende UI QA/Reviewer och ny statisk Security-review av v4 återstår. Runtime/RLS-verifiering finns fortsatt i en separat planerad releasepost.

Föregående bilder och bedömning nedan är v3 och ska inte användas som v4-godkännande.

## V3 — historiska kontroller, gäller inte v4

- `pnpm typecheck` — PASS.
- `pnpm lint` — PASS.
- Public och syntetiskt review-bygge via `tools/visual-check/build.cjs` — PASS.
- Manuell Chromium-granskning av Home och rutinhanteringen — PASS; inga browser page errors.
- Oberoende statisk Security-granskning av migrationskälla/dataåtkomst — PASS 2026-10-14. Runtime DB/RLS ingick inte.
- `git diff --check` och `python3 tools/dev_flow.py validate` — PASS efter synkning av rapport och kö.
- Inga testsviter kördes. Migrationen kördes inte.

## V3 — historisk render- och interaktionsmatris

| Läge | Render | Vad den visar |
|---|---|---|
| Public | `public/home-empty-375x844.png` | Home med synlig `Hantera`-ingång utan syntetiska rutiner. |
| Public | `public/create-routine-375x844.png` | Skapaformulär med `Namn på rutin`, obligatorisk första punkt, `Checklista`, ikon/text för punktläggning och Spara/Avbryt. |
| Review | `review/home-375x844.png` | Kompakt Hemkort, synlig pennknapp och checklisttext som huvudrad. |
| Review | `review/manager-375x844.png` | Flera separata rutinmallar, punktåtgärdernas `Hantera` och borttagning från dagens hemskärmslista. |
| Review | `review/create-routine-375x844.png` | Namn-först-formulär med egen första checklistepunkt. |
| Review | `review/item-actions-375x844.png` | Penna `Redigera`, plus `Lägg till efter`, papperskorg `Ta bort`. |
| Review | `review/item-longpress-375x844.png` | Samma tre åtgärder efter 450 ms långtryck på en punkt. |
| Review | `review/add-to-homescreen-375x844.png` | Icke vald rutin med exakt `Lägg till på Hemskärmen`-knapp. |
| Review | `review/home-430x844.png`, `review/manager-430x844.png` | Bredare telefonlayout. |
| Review | `review/manager-375x667.png` | Kort viewport; scrollinnehåll och fast `Klar`-knapp hålls åtkomliga. |
| Review | `review/manager-140-percent-proxy.png` | Textstorleksproxy på 140 %; panelen scrollar och texten radbryts. Detta är inte OS Dynamic Type. |

Browsern bekräftade en synlig `Hantera`-ingång som öppnar sheeten. Skapaflödet visar namn före lista. Långtryck och `Hantera` visar samma tre punktåtgärder, och det valda/ovalda dagsläget använder de exakta tilläggs-/borttagningstexterna. Fixturedata finns endast i review-bygget och är syntetisk.

## V3 — historiska begränsningar

Detta bevisar lokal källkod och webbrender, inte iOS/Android-layout, native long-press, tangentbord, VoiceOver, riktig Dynamic Type eller sparning mot Supabase. `202610140002_routine_checklists.sql` finns i källan men kördes inte. Backfill, owner-RLS, public RPC/PostgREST-grants, gamla klienter, samtidiga writes, CAS/readback, cascade och 30-dagars purge kräver separat syntetisk verifiering i godkänd disposable utvecklingsdatabas. Statisk Security-review gav PASS 2026-10-14. Oberoende QA/Reviewer återstår innan den lokala köposten kan stängas.
