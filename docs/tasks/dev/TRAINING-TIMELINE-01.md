# TRAINING-TIMELINE-01 — tydligare träningsresa med historik

Status: `done` lokalt, plan v2.

## Uppgiftskontrakt

| Fält | Värde |
|---|---|
| Bas | `knowledge/d3-catalog-delivery@0723cd3` |
| Mål | Göra träningsprogrammens steg begripliga som en klickbar tidslinje med synligt aktivt steg, nedtonade förhandsvisningar av framtida steg och datum för uttryckligen bekräftade delmål. |
| Mandat | Eriks uttryckliga träningsresebeställning och referensbild 2026-10-26: visa dåtid–nu–framtid som en tidslinje, ignorera kalenderhuvudet, låt historik och kommande steg gå att öppna, markera aktivt steg tydligt och visa när steg blev klara. Bevara `docs/tasks/Training-progression-mvp.md` v4:s skillnad mellan pass, äldre aktivitetsmarkering och ägarbekräftat delmål. |
| Planversion | v2; ägarens tillägg om mindre upprepning och visuella ankare utökar v1. Modaländringen levereras först via `UI-MODAL-CENTER-01`. UX Critic granskar v2 före kod. |
| Skrivägare | Codex-koordinatorn ensam. QA och Reviewer är skrivskyddade. |
| Risk | M — befintlig träningsvy och fördjupning ändras, men datamodell, persistens, skrivrättigheter och träningsinnehåll förblir oförändrade. |
| Beroenden | `UI-MODAL-CENTER-01` ska vara klar före träningsmodalens UI-review. Lokala träningsprogressionsmodellen och publicerade program som redan matas till `PublishedTrainingScreen`. Inget beroende på ny migration, publicering eller live-databas. |

## Beslut som ska bevaras

- Ett loggat pass är inte ett färdighetsmål. Endast en ägarbekräftad rad i `training_milestones` gör steget till ett bekräftat delmål.
- `training_milestones.confirmed_at` är datumkällan för delmål. Äldre `training_progress.completed_at` visas endast som datum för en markerad aktivitet, aldrig som bekräftad färdighet. `training_sessions.performed_at` är passhistorik och får inte bli färdigdatum.
- Framtida steg får öppnas för läsning, men får inte loggas eller bekräftas innan de är aktiva. Färgsättning kommunicerar framtida status men stegen behåller kontrast, skärmläsarnamn och minst 44 pt tryckyta.
- Befintliga återuppta-, pausa-, underhålls-, upprepa-, backa-, fel-, retry- och okänd-skrivstatus bevaras. Ingen automatiskt avancerad progression införs.
- Svensk träningscopy och publicerade stegtexter ändras inte. Ingen hunds namn eller personligt pronomen skrivs in i redaktionella instruktioner.
- Återanvänd befintliga tokens, Ionicons och den befintliga generiska träningsbilden `training-recommendation-puppy-black-tan-park.jpg` i en låg bildyta på cirka 112 pt. Bilden är dekorativ och generisk; den får inte beskrivas som ägarens hund. Eftersom ansiktet sitter något ovanför bildens mittlinje ska slutrendering kontrolleras med faktisk `cover`-beskärning; höjd eller bildplacering justeras inom befintliga bildresurser om ansiktet/öronen klipps. Ingen ny bildkälla eller dependency tillkommer.
- Granska träningsresans text mot uppgiften: ta bort upprepade förklaringar och visa bara status, aktuell övning och nästa handling i översikten. Full instruktion finns kvar när en övning öppnas. Tidslinjens noder får statusikoner med tillgängliga textetiketter; ikoner får aldrig vara enda statussignalen.
- Vänta in den separata uppgiften `UI-MODAL-CENTER-01`, som centrerar delade modal- och popupytor. Den här träningsuppgiften ändrar inte delade modalkomponenter.
- D2/D5, live RLS/JWT och native-/iPhone-prov är separata verifieringsgränser. De rapporteras sanningsenligt och utökar inte denna lokala UI-task.

## UX-kontrakt

1. Programvyn börjar med en låg, varm hundbild och en kompakt statusrad. Den upprepar inte aktiv övnings titel, text eller primärhandling i ett separat sammanfattningskort.
2. Stegen visas i ordning längs en lodrät tidslinje. Tidigare steg har en läsbar status och bekräftelsedatum när sådant finns. Det aktiva steget har högst visuell vikt och visar titel, kort förhandsvisning och en enda primär handling.
3. Framtida steg är visuellt nedtonade med tillräcklig kontrast och förblir tydliga tryckytor. Tryck öppnar en läsbar förhandsvisning utan spar-/progressionshandlingar.
4. Historiska steg kan öppnas utan att skriva om historik. Ett bekräftat delmål visar exempelvis `Delmål bekräftat · 15 augusti`. En äldre aktivitetsmarkering visar i stället `Aktivitet markerad · 15 augusti`. Datum visas i enhetens lokala tidszon; årtal visas när händelsen inträffade ett annat kalenderår än nu. Saknat eller ogiltigt datum utelämnas; aldrig något uppskattat eller syntetiskt datum.
5. När steget öppnas visas full instruktion. Bara aktivt steg får pass-/delmålsåtgärder i träningsresan. Historik/förhandsvisning döljer alla skrivkontroller även om äldre `completed_at`-data finns för ett framtida steg. Gammal engångsmarkering behåller sitt befintliga kontrakt där den redan är tillåten.
6. Stöd för smal skärm, 140 % text, reducerad rörelse och naturlig vertikal scrollning. Träningsdetaljens modaler använder den separat levererade centrerade modalytan. Ingen kalender, schemalagd framtid eller påhittad träningsdag läggs till.

Individuella passdatum (`performed_at`) visas inte i tidslinjens stegstatus; befintliga passräknare ligger kvar separat. Ett pass får aldrig se ut som datum då ett steg blev klart.

## Ingår och skrivvägar

- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/training/training-timeline-model.ts` (ny, datum-/statuspresentation utan databasåtkomst)
- `src/features/training/README.md`
- `assets/images/README.md`
- `tests/training-timeline-model.test.mjs` (ny)
- `tests/training-progression-ui.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-flow-training.py`
- `tools/visual-check/README.md`
- `docs/tasks/Training-progression-mvp.md` (kort UI-amendment med verifieringsgräns)
- `docs/tasks/dev/TRAINING-TIMELINE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/design/evidence/training-timeline-01`

Utanför scope: migrationsfiler/SQL, datahämtning/RLS, träningsinnehåll och källor, ombyggnad av Hem/Logg/Kunskap, delade modalkomponenter, nya bildassets, native-kod och publicering. Centrerade delade modalytor tillhandahålls av det separata beroendet `UI-MODAL-CENTER-01`.

## Acceptans och bevis

| Kriterium | Bevis / kontroll | Status |
|---|---|---|
| Tidslinjen skiljer tidigare, aktivt och framtida steg; framtida steg går att öppna men saknar skrivhandlingar även när gammal aktivitetsdata finns. | Riktade UI-tester och verklig RN Web-render för program med tidigare, aktivt och framtida steg; noll mutationsanrop vid framtida förhandsvisning. | PASS — browserverifiern visar read-only-kommande steg även med gammal aktivitetsmarkering; noll progressionsoperationer. |
| Aktiv övning visas en gång med en tydlig primär handling; den dubblerade sammanfattningen är borta. | UI-policytest och skärmbild för startad resa; kontrollera knappantal och textduplikat. | PASS — en aktiv titel och en enda handling visas i tidslinjen; verifierat på 375 och 430 pt. |
| Delmålsdatum kommer från `confirmed_at`; gammal aktivitetsmarkering använder separat `completed_at`-copy; passdatum ger aldrig färdigstatus. | Modelltester för enhetens lokala tidszon, datumgräns, årtal över kalenderår, saknat/ogiltigt datum och varje källa; fixtures med skilda pass-/delmålsdatum. | PASS — modelltester skiljer confirmed_at och completed_at; performed_at används inte som färdigdatum. |
| Historik är endast läsbar och aktiv progression behåller spar-/retry-/okändbeteende. | Interaktionstest för historik/förhandsvisning, aktiv handling, fel och okänt tillstånd. | PASS — historik/förhandsvisning är skrivskyddad; back till ett bekräftat aktivt steg behåller datum och fortsättningsväg. |
| Bildytan är låg och hundansiktet syns; layouten fungerar vid 375×844, 430×844, 375×667 och 140 % text. | Public/review RN Web-render, skärmdumpsgranskning, bildfokus och harnesstest. | PASS — hundansiktet syns; verifierat 375×844, 430×844, 375×667 och 140 % textproxy. |
| Träningsresans översikt undviker repetitiv copy och använder bild/statusikoner med begripliga textalternativ. | UI- och innehållstest samt granskad programöversikt och detaljvy vid standard/stor text. | PASS — låg bildyta, statusikoner och kompakt översikt; full instruktion och pausråd finns i detaljvyn. |
| Befintliga skrivkontrakt, programversioner och användartexter är oförändrade; inga nya dependencies. | Diffgranskning, `pnpm check`, fokuserad verifierare, `python -X utf8 tools/dev_flow.py validate`, `git diff --check`. | PASS — inga migrations-/dependencyändringar; fulla kontroller och godkända sökvägar verifieras vid handoff. |

Native iOS, VoiceOver/Dynamic Type på enhet, live Supabase/PostgREST/JWT/RLS, samtidiga databasoperationer och TestFlight anges separat som `NOT TESTABLE` om de inte faktiskt körs. Dessa luckor får inte rapporteras som PASS.

## Checkpoint — lokal leverans klar

- Implementeringen ligger inom de 14 godkända skrivvägarna. Den befintliga breda progressionverifieraren är bevarad och utökad med tidslinjens visuella/interaktionskontroller.
- Efter verifieringen av backning upptäcktes att en redan bekräftad milstolpe kunde bli resaaktiv igen. Tidslinjen prioriterar nu sparad aktiv position, visar ändå `Delmål bekräftat · <datum>` på raden och behåller åtgärderna för aktivt steg. Modelltest och RN Web-flow verifierar detta.
- UX Critic 2026-10-26: **PROCEED** för plan v2; regler om lokala datum, separat legacy-aktivitet och lässkydd för framtida steg kvarstår.
- UI Critic 2026-10-26: **PASS** efter slutlig korrigering. Skärmbilden `journey-back-to-confirmed-step-375x844.png` visar aktivt steg, sparat bekräftelsedatum och nåbar träningshandling; ansiktet syns i bannerbilden.
- Architect 2026-10-26: **APPROVE** för v2; befintliga timestampkällor och skrivkontrakt används utan migration, ny dependency eller innehållsändring.
- Verifiering: `pnpm check` PASS (typecheck, edge typecheck, lint, 87/87 testfiler); `tools/visual-check/verify-flow-training.py` PASS (24 befintliga progressionskontroller och 7 tidslinjekontroller, noll browserfel); RN Web-vyerna visar 375×844, 430×844, 375×667 och 140 % textproxy. Se `docs/design/evidence/training-timeline-01/`.
- Live Supabase/RLS, native iOS/Android, VoiceOver/TalkBack, Dynamic Type på enhet och TestFlight är **NOT TESTABLE** i denna checkpoint.
- Oberoende QA 2026-10-26: **PASS**. Plan/kö och 14 skrivvägar matchar; verifieraren 24+7 och `pnpm check` 87/87 bekräftade; backad, bekräftad aktiv rad behåller datumet.
- Frozen Reviewer 2026-10-26: **PASS**, inga fynd. Verifierade 14 skrivvägar, full progressionregression, tidslinjens nya tillstånd och gränser för native/live.
- Lokalt färdig. Ingen commit eller push har gjorts i denna uppgift.
