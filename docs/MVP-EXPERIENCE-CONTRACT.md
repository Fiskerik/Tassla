# MVP EXPERIENCE CONTRACT — vision_rev02

Godkänt upplevelsekontrakt för [MVP rev02](mvp.md), bekräftat av Erik 2026-10-20. Ursprungligt underlag: `2e230be44c1bdd74e74173064fdce5e60e7e9dbc` (2026-10-15); detta är historisk bas, inte aktuell acceptanscommit.

## Leveransvillkor

Eriks beslut: leverera alla åtta paneler som fungerande MVP-resor i små checkpoints. En panel är färdig först när hundägaren kan nå den från avsedd ingång, utföra dess centrala uppgift med riktig datakälla, se bekräftat eller ärligt okänt resultat, navigera tillbaka utan att förlora bekräftad data och få motsvarande visuella form. Referensens exempelvärden, hälsoråd, hundkänslor och dekor är inte produktdata.

Checkpoint = avgränsad fungerande resa + verifierat repo-läge + köhistorik med exakt nästa steg. Stäng inte panelen genom att stänga en checkpoint. Status redovisas per nivå: godkänt mål / kod och integration / lokal QA / live DB-RLS / native / visuell acceptans / release. `done` i befintlig kö betyder endast att den gamla taskens uttryckliga acceptans klarats enligt dess historik.

## Gemensamt acceptansbevis

Använd befintlig köpost och dess task-/QA-underlag: krav/beslut → kod och samtliga relevanta komponentanrop → regression → aktuell skärmbild/avvikelse → slutacceptans. Ange exakt branch, granskad commit (eller uttryckligt lokalt checkpoint med diffidentitet), miljö och build-ID. En lokal arbetsdiff är inte en integrerad eller släppt build. Okänd/ej skapad build anges som sådan.

Redovisa separat kod/integration, lokal QA, live DB/RLS, native, visuell likhet och release med PASS/FAIL/NOT TESTABLE eller ej påbörjat där relevant, evidens och nästa steg. För §14.16 bedöms komposition, färger, typografi, former, bildspråk och täthet separat. Samma presentationskomponent ska användas i produkt och fixture; vid delad ändring omfattar regressionen alla berörda anrop. Fulla resor omfattar relevanta v2-scenarier A–F i `docs/mvp.md`, återbesök och konto-/hundbyte.

Detta preciserar dokumentkraven; `dev_flow.py` har ännu ingen automatisk validering av dessa acceptansfält. Koordinator och oberoende granskare kontrollerar dem manuellt. NOT TESTABLE stänger inte ett nödvändigt slutkriterium. Befintlig policy om ägarvalda samlade nativeprov kvarstår.

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

Aktuell ordning enligt Eriks besked 2026-10-20: harmonisera motstridiga dokument först; därefter gemensam sökbar rasväljare som komplett pilot över första profil, lägg till hund och redigering. Övriga resor prioriteras från faktiskt integrerat kodläge och återstående acceptans i kön. Checklistfilterpaketet är ägarstoppat och får inte återupptas automatiskt. Gamla P0-listor eller taskstatusar från 2026-10-15 styr inte dagens arbete. Alla åtta paneler kvarstår som slutmål; DB/native-verifiering är separata bevis, inte rutinmässiga telefonstopp.

L = lokal presentation utan dataskrivning; M = förändrad användarresa eller befintlig datalogik; H = auth/RLS/migration/radering/hälsa/notifiering/nya ändamål/oklar integration. Dokumentera skälet och höj vid osäkerhet. Riskbaserad QA avser val av bevis; `pnpm check`, Git-hookar, sanningsenlighet, tillgänglighet och oberoende slutgranskning består. Ett lokalt PASS säger inget om live Supabase eller native om detta inte uttryckligen provats.
