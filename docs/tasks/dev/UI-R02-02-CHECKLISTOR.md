# UI-R02-02 — Checklistor med samma redigeringsupplevelse

Datum: 2026-10-23. Plan v1. Branch: `2026-10-23-ui-02-checklistor`. Beroende: UI-R02-01B, stängd på ägarens bekräftelse 2026-10-23. Segmentmandat: Eriks direkta beställning 2026-10-23 att göra klart punkterna enligt daterad actionplan, i ordningen 02 → 03 → 04.

## Mål och risk

Leverera actionplan §4: samma ikonmodell/picker för egna faschecklistepunkter och rutiner, kompakt redigering, fokuserad rutin och samma rad-/bekräftelsegrammatik. Risk H eftersom ny nullable kolumn/grants på hundägd tabell och radering berörs. Ingen live migration körs här.

UX-spec: [UI-R02-02-checklistor-ux-spec.md](../../plans/UI-R02-02-checklistor-ux-spec.md). UI-källa: `vision_rev02.jpg`, panel 4/7. GAP: G02–G07, G14, G16. Äldre före-16-oktober taskar är historik och ändrar inte scope.

## Checkpoints

1. **Gemensam ikon och beständig egen punkt.** Skapa en neutral gemensam modul för den befintliga 20-symbolslistan, labels, ton och picker. Flytta befintlig rutinpresentation dit utan beteendeförlust. Lägg `icon` nullable på `dog_checklist_custom_items`, lås allowlist och smala grants i ny migration. Lägg ikon i checkliste-modell/läsning/insert/update/readback/intent/cache/draft. Bevara legacy rows och äldre client updates; bockning får inte ta bort ikonen. Exakt verifiering: riktade data-/intenttester och SQL probe två ägare, foreign-owner reject, legacy insert/update och whitelist reject.
2. **Kompakt punktformulär.** Visa titel och ikontrigger intill varandra. En primär Spara-footer; status bockas kompakt; kontextuell penn-/soptunneknapp. Radera går via bekräftelsedialog med objekt-/konsekvenstext. Samla X/backdrop/annan stängning; dirty utkast frågar, pending/unknown blockerar. Behåll failed/unknown/conflict semantiskt separerade. Följ 01:s formulärkontrakt där befintlig komponent faktiskt passar.
3. **Fokuserad rutin och gemensam radgrammatik.** Vanligt tryck på rutin visar bara vald rutin. Lägg en kompakt, namngiven ingång från Checklistor till läget hantera alla/skapa rutin. Träningsval ska inte visas under en enskild rutin. Longpress/penn-alternativ, checkbock, dagsval, skip, radering och A04 recovery behåller betydelser och retur.
4. **Riktad helkontroll.** Public/review rendera Kunskaps add/edit, selected/fallback icon, dirty confirm, delete confirm, failed/unknown/conflict; rutin add/edit/focused/manage-all. 375×667, 375×844, 430×844 och större textproxy. Mät höjd mot auditens 260 px / fyra helhöga rader och granska §14. Rerun befintliga checklist-, Home, Knowledge och shared-button tests.

## Skrivytor

- `src/features/checklists/checklist-icons.ts` och `ChecklistIconPicker.tsx` (ny delad ikonmodell/presentation)
- `src/features/home/daily-routine-checklist-icons.ts` (bakåtkompatibel re-export plus eventuell legacy suggestion)
- `src/features/home/DailyActivityManagerSheet.tsx`, `src/features/home/DailyChecklistScreen.tsx`
- `src/features/knowledge/PuppyChecklistScreen.tsx`, `checklist-model.ts`, `checklist-data.ts`, `checklist-intent.ts`, `README.md`
- `src/components/ui/{Button,Dialog,Field,ChecklistItem}.tsx` (opt-in tätare layout/ikonnyans)
- `supabase/migrations/202610230001_checklist_custom_item_icons.sql`, `supabase/tests/checklist-custom-item-icons.sql`
- `tests/checklist-{model,data,intent,ui}.test.mjs`, `tests/daily-activity-ui.test.mjs`, ikon-/dialogtester vid behov
- `tools/visual-check/verify-checklist-icons.py`, `verify-checklist-custom-icons.py`, berörda aktiva harness fixtures och `tools/visual-check/README.md`
- evidens under `docs/design/evidence/vision-rev02/ui-r02-02-checklists/`
- denna plan, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md` och actionplanens status

Skyddade ytor: `HomeScreen.tsx` och panel 3 ring/status; rutin-/checklistors databetydelse och befintliga writes utanför iconfältet; auth/RLS-policyer; Knowledge public content/sökning; Logg, Hälsa, Träning, Profil och migration deployment. Om nya faktiskta skrivfiler behövs uppdateras planen före ändringen.

## Acceptanskriterier

- Båda checklisttyperna använder exakt samma ikonlista, labels, selected-state, ton och pickerkomponent. Ingen andra allowlist.
- Faskontrollpunktens titel+ikon väljs innan första save, kan ändras, stängas/öppnas och visas efter re-read. Null/legacy använder neutral ikon. Ogiltig DB-symbol avvisas.
- Insert/update/readback/CAS och unknown intent omfattar rätt iconvärde. Retry återanvänder samma ID och ändringspayload. Conflict jämför föregående/postimage inklusive icon. Scope byte tar inte gammalt utkast till annan hund/konto.
- Vanlig completion toggle ändrar endast `completed`-semantik och bevarar ikon. Äldre klientens update utan ikonkolumnfält ändrar inte sparat icon. Nya klientens migration saknar alltför bred tabellgrant.
- Add/edit sheet visar title + ikon, en permanent primär Spara-rad, kontextuell delete icon med popup; inga fullstora klara/radera/avbryt-rader. Alla kontroller minst 44 pt; långa titlar/stor text får växa.
- X/backdrop delar samma avslutningspolicy. Clean stänger; dirty frågar; pending och unknown kan inte kasta intent. Failed behåller fält. Delete confirmation har tydlig Avbryt/Radera och tar bort bara namngiven punkt.
- Rutintryck öppnar endast angiven rutin. Separat manage-all/create går att hitta utan knappvägg. Träningsval döljs i rutinens fokuserade vy. A04 recovery och vanlig daglig checklista fungerar oförändrat.
- Migrationens lokala SQL-probe visar ägarisolering, nullable legacy, värdeallowlist, smala grants och gammal-klient update. Ingen live migration eller live RLS PASS påstås utan riktig miljö.
- Kör `pnpm check`, `pnpm bundle:ios`, `git diff --check`, `python -X utf8 tools/dev_flow.py validate`; visuella bevis märks syntetiska. Ingen full panel-4/7 acceptans utan oberoende jämförelsegranskning.

## Review och leveransstatus

Ägaren beställde 02→03→04 och bekräftade att 01B redan var godkänd. Architect APPROVE och Critic PASS gäller den korrigerade implementationen; Security APPROVE gäller statisk migration-/dataflödesgranskning; oberoende Reviewer PASS gäller kod och aktuella småvyer. QA:s fulla `pnpm check` passerade oberoende med 75/75 tester. Public/review rutinrenderingen är 16/16 vardera och Kunskapens riktade flöde 7/7. Dessa resultat stänger inte full panel-4/7 §14-jämförelse eller riktig databas-/native-verifiering.

Den äldre breda `tools/visual-check/verify-know02.py` startades av QA men stannade före första assertionen eftersom den väntar på en flik/route som inte finns i den aktuella fixturen. Den är NOT TESTABLE och har inte ändrats eller använts som oracle; riktad verifiering av ändrat Kunskapsflöde finns i `verify-checklist-custom-icons.py`.

## Beslut/antaganden

- Ikonfältet heter `icon`, är nullable och använder exakt rutinernas nuvarande 20-valsliste; generisk fallback är endast presentation och skrivs inte automatiskt.
- Dialog används för destruktiv bekräftelse; huvudformulärets X ersätter en ytterligare fullbredds Avbryt-rad.
- Gemensam hanteringsingång byggs i Checklistor, inte Hem-panelens kort; Hem behåller pil-only regeln.
- Inte alla rutiner innebär inte alla träningsval: fokuserad rutinläge visar bara den valda rutinen och dess relevanta dags-/rutinhandlingar.
