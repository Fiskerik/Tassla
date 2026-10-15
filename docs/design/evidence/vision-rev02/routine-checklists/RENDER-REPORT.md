# Egna dagsrutiner med checklistor — renderunderlag

Datum: 2026-10-14 · Bas: `56bf224` · Källa: lokal workspace på `work` · Renderer: React Native Web + Chromium · Extern data: ingen

## V5 — implementation och delvis renderunderlag

v5-implementationen använder en pennknapp `Redigera` vid rutinens namn och samlar namn, checklista och upprepning i samma utkast/sparning. Plus lägger till en rad sist med ett stabilt punkt-ID; minus tar bort vald rad. Läs-vyn har inga punktvisa redigeringsknappar eller long-press. Ett aktivt utkast blockerar övriga rutin- och dagsval, inklusive träningsval och hel-rutin-radering. Ändrat utkast kräver bekräftelse innan det kastas vid stängning/bakåt. Under pending/unknown behålls och låses fälten tills den befintliga retry/readback-vägen har löst resultatet.

Tre redan fångade reviewbilder finns i `review-v5/`: `manager-read-375x844.png`, `manager-edit-375x844.png` och `discard-confirm-375x844.png`. De visar läsvy, samlat edit mode och discard-bekräftelse vid 375×844. Detta är ett begränsat renderunderlag, inte en fullständig visuell QA eller acceptans av v5.

Försök att fortsätta Playwright-renderingen stoppades innan fler vyer kunde fångas: Chromium avslutades vid start med `SIGTRAP`; loggen visade `setsockopt: Operation not permitted` från crashpad. Samma fel uppstod med projektets headless/no-sandbox/disable-crash-reporter-argument och vid direkt headless Chromium-start. Därför saknas färska v5-renderingar för 430×844, 375×667, 140 %-textproxy, create, sparat, failed/unknown/retry och andra tillstånd. Inga visuella QA-slutsatser görs från dessa vyer; fortsätt capture när en fungerande browser-session finns.

Senast körda statiska kontroller efter källändring: `pnpm typecheck`, riktad ESLint på `DailyActivityManagerSheet.tsx` och `tools/visual-check/app.tsx`, `git diff --check` för v5-paths samt `python3 tools/dev_flow.py validate` — PASS. Public- och reviewbundle byggdes tidigare i samma v5-arbete — PASS. Inga testsviter eller databasoperationer kördes. Oberoende QA/Reviewer och native-/backendverifiering återstår.

## V6 — kompakt rutinhantering, 2026-10-15

Panel-4-listan är nu en gemensam varm yta med tunna avdelare, enkla checklistrader och en kort upprepningsrad per rutin. Namnradens enda `Redigera`-knapp är lågmäld. Dagsvalet `Lägg till på Hemskärmen`/`Ta bort från Hemskärmen` har mjuk grön yta och ligger bredvid röd, bekräftad helradering. Ett aktivt create/edit-utkast visar `Spara rutin` som enda visuella huvudåtgärd; den fasta `Klar`-knappen döljs tills utkastet är sparat eller lämnat. Stängknappen behåller det befintliga discard-flödet.

Public- och reviewbundle byggdes om från aktuell källa. React Native Web/Chromium med syntetiska reviewdata verifierades manuellt. Nya reviewbilder finns i `review-compact-v6/`: `manager-375x844.png`, `manager-430x844.png`, `manager-375x667.png`, `manager-375x844-scrolled.png`, `manager-375x844-text-140.png`, `routine-create-375x844.png`, `routine-created-375x844.png`, `routine-edit-failed-375x844.png`, `routine-edit-unknown-375x844.png`, `routine-edit-retry-saved-375x844.png`, `routine-discard-confirm-375x844.png` och `home-routine-completion-375x844.png`. Jämförelse före ändringen finns i `home-manager-before-compact-375x844.png`.

Manuella kontroller: tre separata rutiner visas inom samma yta; dagsval och helradering har skilda etiketter, färg och ikoner; create och bekräftat saved readback fungerar; failed och unknown behåller utkast och exakta retry; retry bekräftar ändringen; fortsätt redigera och uttryckligt discard fungerar; helradering erbjuder Avbryt och lämnar rutinen kvar; Hemmets punktmarkering ändrar endast bekräftad progress. Inga Chromium page errors. Vid 375×844, 430×844 och 375×667 gick vyn att läsa och scrolla. Vid 140 % textproxy var sidbredden fortsatt 375 px; de tre dagsknapparnas höjd var 86 px och texten höll sig inom knapparna. Webbsemantik och 44 pt målyta kontrollerades. Detta är inte native Dynamic Type/VoiceOver.

### Designregler §14 — panel-4-delta

| # | Bedömning | Underlag |
| --- | --- | --- |
| 1 | Ja | En tydlig huvudåtgärd per läge; `Klar` döljs medan `Spara rutin` är aktiv. |
| 2 | Ja | Dagsval och helradering har olika konsekvens och därmed avsiktligt olika färg; de ligger jämsides. |
| 3 | Ja | Helradering är röd, bekräftad och separat från dagsvalets minusåtgärd. |
| 4 | Ja | En fördjupningsväg från Hem och en Edit-knapp per rutin; inga punktvisa editknappar. |
| 5 | Ja, webb | Alla fyra viewport-/textlägen renderade; innehållet scrollar bakom fast `Klar` när ingen draft är öppen. Native safe area ingår inte. |
| 6 | Ja | Befintliga semantiska färg-, typografi-, avstånds- och touchmålstokens används. |
| 7 | Ja | Ikonerna använder projektets Ionicons-familj och motsvarar tillägg, borttagning, redigering och radering. |
| 8 | Ja, begränsat | Home-bilden visar varm yta, grön status samt blå/grön/lila genvägar och gul tipsaccent; exakt jämförelse med målbilden saknas. |
| 9 | Ja | Synliga etiketter och knapphandlingar skiljer dagsval från radering av rutinmallen. |
| 10 | Ja | Endast bekräftade dagsmarkeringar visas som klara. |
| 11 | Ja | Failed/unknown visar en återhämtningshandling och ingen falsk sparad markering. |
| 12 | Ja | Kort svensk copy; feltexten beskriver nästa steg. |
| 13 | Ja, enligt kontrakt | Namn, checklistpunkter och upprepning har tydlig hierarki och metadata är dämpad. |
| 14 | Ja | Create, saved, failed, unknown, retry, discard, flera rutiner och completion renderades. |
| 15 | Ja, webb | Knappar har minst 44×44 pt, semantik verifierades och 140 % textproxy renderades; native Dynamic Type/VoiceOver är NOT TESTABLE. |
| 16 | NOT TESTABLE | `vision_rev02.jpg` finns, men denna checkpoint implementerar rutinhallen och Hemmets dagskort, inte panelens fullskärmslista med filter. Ingen full visuell matchning hävdas. |
| 17 | Ja | Hemmets fem huvudflikar syns; denna ändring påverkar inte navigationsordning eller returvägar. |
| 18 | Ja, begränsat | Home-fixturen behåller hundidentitet/standardbild med synlig etikett; ingen bildroll ändrades här. |

UI-funktion och lokal webbrender har verifierats; live Supabase/RLS, migrationens runtime och native interaktion är fortsatt separata och ej verifierade. Full panel-4-likhet återstår tills fullskärmslistan är implementerad.

Efter ägarens godkännande att köra obligatoriska Git-hookar passerade `pnpm check`: app- och edge-typecheck, full lint samt 45/45 testfiler. Befintliga assertions/fixturer uppdaterades till redan införda weekday-, review-gating-, Träning-, Logga- och scoped profile-read-kontrakt; inga testfall lades till. Ingen databas- eller migrationsåtgärd kördes.

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

### QA-/Reviewer-rättning — raderingsbekräftelse, 2026-10-15

Oberoende QA hittade att bekräftelsen felaktigt lovade att valda dagskopior överlever helradering. Texten är ändrad till `Rutinen ”…” och alla dess dagskopior och sparade överhoppningar tas bort.` Den destruktiva knappen är den enda som anropar radering; `Avbryt` lämnar rutinen kvar. QA PASS och oberoende Reviewer PASS. Native Alertens faktiska dialogrendering är NOT TESTABLE i RN Web-fixturen; den ändrade copyt påverkar inte de redan fångade skärmlayouterna. App-typecheck, edge-typecheck, full ESLint och Node-testsviten passerade igen: 492/492 tester. Ingen databas- eller migrationsåtgärd kördes.
