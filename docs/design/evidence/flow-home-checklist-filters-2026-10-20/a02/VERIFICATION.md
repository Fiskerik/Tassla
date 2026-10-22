# A02 — ikonval och kompakta rutinhandlingar

Datum: 2026-10-22
Branch: `2026-10-22-fix-main-checklist-build`
Status: lokal käll-/UI-checkpoint verifierad; hela panel 4 är fortsatt under implementation.

## Resultat

- Ikonval per rutinpunkt är återställt. Skapa/redigera visar 20 tillgängligt namngivna Ionicons; long-press på en punkt öppnar rätt rutinredigerare med just den punktens ikonväljare öppen. Valet sparas på rutinmallen och läses tillbaka i den syntetiska fixture:n.
- Checklistan visar den sparade ikonen och en stabil, semantiskt tydlig legacy-fallback. Hemmets kompakta dagsrader förblir ikonfria. Ändring av rutinmall skriver inte om dagens frysta checkliststatus.
- De två rutinåtgärderna är ikonknappar. Tryck öppnar en separat bekräftelse med rätt text för att ta bort rutinen från Hem respektive radera rutinen; avbryt gör inget och bekräfta utför respektive handling.
- V5:s presentation använder befintliga kategori-token endast för entydiga ämnesmatchningar. Generiska symboler och neutral fallback saknar kategoribakning. Den gröna valramen och bocken markerar val separat från ikonfärgen. Lägsta uppmätta ikonkontrast är 4,97:1.

## Render- och interaktionsbevis

Public och syntetisk review verifierades separat vid 375×844, 430×844 och 375×667. Hela 20-alternativsgridden har tillgängliga namn och minst 44×44 pt mål. Verifieraren provade fokus på exakt rutinpunkt, val/readback, skapande med vald ikon, oförändrad dagsstatus samt avbryt/bekräfta för båda ikonhandlingarna. Inga browserfel rapporterades.

- [Public resultat](public/browser-results.json) · [Review resultat](review/browser-results.json)
- [Public skärmbilder](public/) · [Review skärmbilder](review/)
- Verifierare: `tools/visual-check/verify-checklist-icons.py`

## Checks och granskning

- `pnpm check`: PASS (65/65 tester; TypeScript, edge TypeScript och ESLint ingår).
- `pnpm bundle:ios` med public build-flaggor: PASS, 1 460 moduler.
- `git diff --check`: PASS.
- `python -X utf8 tools/dev_flow.py validate`: PASS.
- SQL/TypeScript allowlist, installerade Ionicons-glyphs, tonmappning och kontrastkontroll: PASS.
- UX Critic implementation review: **PROCEED**; oberoende QA: **PASS**; frozen Reviewer efter v5-korrigering: **PASS**.
- Erik rapporterar att manuella tester 1–4 i senaste bygget gick igenom. Dessa tester har inte körts om och hålls stängda.

## Inte verifierat i denna checkpoint

Native iOS Alert-utseende, VoiceOver, Dynamic Type och fysisk long-press; live Supabase/RLS och verklig create/replace/readback; migrationsapply; äldre klienters runtime; TestFlight och full panel-4-§14-acceptans. SQL-migrationen finns endast som granskad källkod. Äldre klienter kan avvisa ikonbärande checklistdata, så produktionsskrivningar förblir spärrade tills separat kompatibilitets-/versionsgrind är granskad och verifierad.

Panel 4 har fortfarande öppet `Kommande`, källnavigation/retur och fullständig §14-acceptans. Denna verifiering stänger endast A02:s ikon-/handlingsslice.
