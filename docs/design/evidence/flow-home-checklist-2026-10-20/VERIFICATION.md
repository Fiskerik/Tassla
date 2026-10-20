# FLOW-HOME-CHECKLIST-01 — QA och §14

Datum: 2026-10-20
Plan: [v9](../../../plans/FLOW-HOME-CHECKLIST-01-ux-spec.md) — Architect APPROVE
Omfattning: Hem → Checklista (Idag) → rutin eller exakt träningssteg → tillbaka. Detta är inte full acceptans av panel 4.

## Verifiering

- Riktade scope-/route-regressioner: 8/8 PASS. De täcker callback från hund A under hund B-scope, kontoradering, gammal `finally` mot ny mutation, faktisk route-invalidation och A → B → A.
- Public och review RN Web: båda PASS. Verifieraren täcker 0/1/5/7, loading/error, 375/430 px, 375×667, 140 % text, reducerad rörelse, synlig tillbakaåtgärd vid toppen av träningsdetaljen samt samma nedre källrad efter bekräftad retur. Lämna→öppna på nytt och hundscopebyte→öppna på nytt återgår båda till toppen.
- Visuella huvudexempel: [Checklistan, 7 aktiviteter, public](public/checklist-7-375.png), [träningsdetalj med synlig bakåtknapp, review](review/checklist-training-detail-375.png), [bekräftad retur till nedre rad, review](review/checklist-training-return-complete-375.png), [ny öppning efter exit](public/checklist-reopen-after-leave-375.png), [ny öppning efter hundscopebyte](review/checklist-reopen-after-scope-change-375.png).
- Public/review-resultat: [public](public/browser-results.json), [review](review/browser-results.json). Synthetic RN Web bevisar inte native-rendering eller backendbeteende.
- QA: fokuserad route/scope/sweep-svit 14/14 PASS; full `pnpm check` (typecheck, edge-typecheck, lint, 611/611 tester) PASS; public `pnpm bundle:ios` exporterade 1 450 moduler; `git diff --check` och `python -X utf8 tools/dev_flow.py validate` PASS. Public/review browser PASS med 12/13 kontroller och 0 sidfel. Slutlig oberoende UX/acceptance Reviewer: PASS. Commit/push återstår.
- Security final: PASS (statisk kontroll av lease, deletion guard, scope-/dagsroute och cleanup). Live Supabase/RLS är NOT TESTABLE här.
- Native VoiceOver/TalkBack, Dynamic Type, fysisk tryckyta/svep, signerad build och TestFlight är NOT TESTABLE; de blockerar inte den lokala kodcheckpointen.

## Designregler §14

| Punkt | Bedömning | Evidens och kvarvarande gräns |
|---|---|---|
| 1. Högst en primary per sammansatt vy | PASS | Hem behåller sin sammanfattning och har en Checklista-ingång; Checklistan använder Hantera som sekundär åtgärd. |
| 2. Enhetliga knappar i samma grupp | PASS | Samma delade knappvarianter används; verifieraren kontrollerar också entry/action-navigering. |
| 3. Tydlig destructive och bekräftelse/ångra | PARTIAL | Rutinhantering återanvänder befintlig bekräftelse/undo-logik. Native Alert-visning och VoiceOver är inte verifierade i RN Web. |
| 4. Inga stora Ändra/Radera-länkar per rad | PASS | Rutinredigering ligger i separat Hantera-sheet; checklistaraderna har inte stora ändra/radera-länkar. |
| 5. Spacingskala och sektionsmarginaler | PASS | Renderad 375/430 och kort viewport utan horisontell overflow; komponenter använder delade tokens. |
| 6. Variabelbindningar, inga lokala stylingvärden | PASS | Befintliga delade tokenvärden används; design-systemets statiska kontraktstester passerar. |
| 7. En ikonuppsättning, ingen emoji | PASS | UI använder projektets Ionicons och inga emoji som ikonersättning. |
| 8. Konsekvent kategoriikon/färg | N/A för denna slice | Idag-listan visar rutin-/träningsstatus, inte Logg-snabbåtgärder. Kiss/vatten-ikon och färgskillnad hanteras separat i `FLOW-LOG-01` och måste verifieras där. |
| 9. Begripliga ikoner | PASS | Tillbaka, checkruta och träningsrad har synlig eller tillgänglig text; skärmläsarnamn är specificerade i testerna. |
| 10. Ingen statusbadge på normal post | PASS | Normala rader saknar statusbadge; progress visas samlat över listan. |
| 11. Högst en nödvändig informationsruta | PASS | Normalvyn visar endast den information som hjälper dagslistan; fel-/återhämtningsrutor visas endast vid behov. |
| 12. Inga förbjudna ord i copy | PASS | Renderad svensk copy granskad i public/review-vyerna. |
| 13. Kort förklarande copy och rätt ton | PASS | Datum, hundnamn, bekräftat antal och tom-/felläge uttrycks kort och konkret. |
| 14. Laddar/tom/fel/normal | PASS | Separata renderprov för loading, tomt, read error och normal lista; fel blir inte falsk 0/0-progress. |
| 15. Minst 44×44 och stor text | PARTIAL | Stor text 140 % renderas utan overflow och relevanta target-kontrakt kontrolleras i kod. Native punktmått/Dynamic Type är NOT TESTABLE. |
| 16. Målbildens struktur och motiverade avvikelser | PARTIAL | Idag-delen är implementerad. Denna vecka/Alla/Kommande saknas avsiktligt tills riktiga urval finns; full panel 4 är öppen till `FLOW-HOME-CHECKLIST-FILTERS-01`. |
| 17. Rätt appbar/flikar/navigation | PASS | Review-bilden visar Träningssteg och tillbakaåtgärd vid toppen; Hem förblir aktiv flik. Route går faktiskt till Hem vid konto/hund/dag/tidszon-byte. |
| 18. Foto/platshållare och hundnamn där tillämpligt | PASS | Checklistan namnger den aktiva hunden i dagsbeskrivningen. Ett porträtt behövs inte i denna uppgiftslista; Home-porträttet ligger kvar på Hem. |

## Reviewhistorik

- UX/acceptance-review v8: FAIL på detaljvy som ärvde scroll och dold child-route efter scopebyte; båda åtgärdades.
- UX/acceptance-review v9: FAIL på offset som låg kvar efter exit och kunde återkomma vid ny öppning.
- Architect plan amendment v9: APPROVE; töm offset vid exit, bevara inom checklistflödet och verifiera leave/reopen samt hundscope/reopen.
- Slutlig oberoende UX/acceptance-review av v9: PASS. Inga blockerande UX-, tillgänglighets- eller acceptansfynd kvar.
- Slutlig statisk Security-review: PASS; live RLS separately NOT TESTABLE.
