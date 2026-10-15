# MVP EXPERIENCE CONTRACT — vision_rev02

Förslag för godkännande · bas `codex/ux-rethink-2026-10-15` @ `2e230be44c1bdd74e74173064fdce5e60e7e9dbc` · 2026-10-15

## Leveransvillkor

Eriks beslut: leverera alla åtta paneler som fungerande MVP-resor i små checkpoints. En panel är färdig först när en valpägare kan nå den från avsedd ingång, utföra dess centrala uppgift med riktig datakälla, se bekräftat eller ärligt okänt resultat, navigera tillbaka utan att förlora bekräftad data och få motsvarande visuella form. Referensens exempelvärden, hälsoråd, hundkänslor och dekor är inte produktdata.

Checkpoint = avgränsad fungerande resa + verifierat repo-läge + köhistorik med exakt nästa steg. Stäng inte panelen genom att stänga en checkpoint. Status redovisas per nivå: dokumenterat mål / kod / lokal QA / live DB-RLS / native / release. `done` i befintlig kö betyder endast att den gamla taskens uttryckliga acceptans klarats enligt dess historik.

## Paneler och verifierbar slutacceptans

| Panel | Resa och datakälla | Kritisk evidens |
|---|---|---|
| 1 Hem | Inloggad ägare ser vald hund, korrekt lokal dag/ålder, publicerat relevant innehåll, sina dagsuppgifter och tre riktiga genvägar. Markera rutin eller öppna träningskälla; bekräftad status återkommer efter flikresa. | Scopebyte, partial/unknown, dagsgräns, public/review, 375/430/667 och 140 %; live rutin-RPC/RLS separat. |
| 2 Utveckling | Hem → härledd ålder/livsfas → publicerade sakgranskade milstolpar → verklig guide → Hem. Ålder är inte bevisad utveckling. | Saknat/ogiltigt/framtida datum, publiceringsgräns, guideväg, bildroll och skärmläsning. |
| 3 Dagens framsteg | Hem → samma fullständiga dagspopulation/räknare → exakt källaktivitet → uppdaterad ring/lista → Hem. | Inga/partiella/okända läsningar, olänkad logg, återtagen träning, dagsbyte, ring/lista-paritet och ett verifierat veckomål med definierad population/period. |
| 4 Daglig Checklista | Hem → full dagslista → skapa/ändra/ta bort rutin eller markera/ångra → bekräftad Hem-status. Separat från Kunskaps faschecklista. | RPC/RLS, legacy veckodagar, idempotens, pending/failed/unknown, 30-dagars gallring; Idag/Denna vecka/Alla och Kommande måste ha verkliga avgränsningar för full panelacceptans; inga låtsasfilter. |
| 5 Logga | Logg → etttrycks-snabbval eller detaljerad post → bekräftad tidslinje → rätta/radera/ångra → Insikter. | Dublett/unsure, faktisk händelsetid, bevarade typer/Fler/layout, ägarscope och visuell paneljämförelse. |
| 6 Träning | Publicerat program → rätt version/steg → markera/ångra → återuppta samma hunds progress efter flikresa. | 0/halv/klar, okänd ålder, failed/unknown, sakgranskat innehåll, bildmetadata och filtersemantik. |
| 7 Kunskap | Publicerat innehåll → fungerande sök/filter där synligt → läsvy med källa → tillbaka; FAQ och faschecklista kvar. | Review-spärr, tom sökning, begränsat urval märkt, cache-scope och bild/kortjämförelse. |
| 8 Insikter | Logg → periodval → fullständigt inlästa loggar → täckningsmärkt graf och numerisk läsning → Logg. Sömndiagrammet kräver godkänt intervallkontrakt innan full panelacceptans; ofullständiga perioder visas som luckor. | Sidning/period/tidszon, tomt kontra okänt, överlapp/luckor, skärmläsning och inga medicinska slutsatser. |

Hälsa, Tassla-pass, onboarding/profil, notifieringar, kontoradering, samtycken, distribution och mätning kvarstår enligt `docs/mvp.md` och får inte tappas genom rev02-arbete. Nya dataändamål, migrationskörningar, externa tjänster och release följer separata beslut.

## Risk och prioritering

P0: återuppta befintliga köposter UX-FIX-BASELINE-MOTION-01 och HOME-ROUTINE-CHECKLIST-01 (nu QA), därefter HOME-ROUTINE-CHECKLIST-RUNTIME-VERIFY-01 och FOUNDATION-DB-VERIFY i utvecklingsmiljö. P1: Hem/daglig Checklista och onboarding; dessa ger riktiga källor för panelerna 2/3. P2: Logga/Träning/Kunskap med fungerande filter och bildroller. P3: Utveckling, Dagens framsteg och Insikter. Prioritet ändrar inte kravet att alla åtta blir funktionella före MVP-klar.

L = lokal presentation utan dataskrivning; M = förändrad användarresa eller befintlig datalogik; H = auth/RLS/migration/radering/hälsa/notifiering/nya ändamål/oklar integration. Dokumentera skälet och höj vid osäkerhet. Riskbaserad QA avser val av bevis; `pnpm check`, Git-hookar, sanningsenlighet, tillgänglighet och oberoende slutgranskning består. Ett lokalt PASS säger inget om live Supabase eller native om detta inte uttryckligen provats.
