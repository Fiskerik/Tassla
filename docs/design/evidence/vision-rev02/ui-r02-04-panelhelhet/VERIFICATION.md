# UI-R02-04 — GAP-slutrunda och lokal verifiering

Uppdaterad **2026-10-24**. Actionplanen är fortsatt den från **2026-10-23**. Branch: `2026-10-23-ui-04-panelhelhet`. Kodcommit: `fe1c834f9ff99c6ba19ab9e269406195d3ae7b0e`, pushad 2026-10-24. Bas före paketet: `13f48bf`. Aktuell visuell referens: [vision_rev02.jpg](../../../../../vision_rev02.jpg).

Detta är verifiering av produktionens skärmkomponenter med syntetiska data i RN Web. Public/review anger byggflaggan, inte att fixtureinnehåll har publicerats eller hämtats från Supabase. Ingen ny live-data, native- eller signerad build-verifiering påstås.

## Huvudleveransen: GAP-paketen

| Paket | Leverans / hållbar checkpoint | Status |
|---|---|---|
| 01 Profil | Sökbar, rullbar rasväljare i skapa/ändra; kompakt profil och skyddad avslutning. Pushad branch `2026-10-23-ui-01-profil`, `d7f4d9b`. | 01A lokalt QA/Reviewer-godkänd. 01B klar enligt ägarens godkännande. |
| 02 Checklistor | Samma 20 ikoner vid skapande och ändring av rutin/egen Kunskapspunkt, en Spara-footer, fokuserad rutin, dirty-close/recovery. Pushad `2026-10-23-ui-02-checklistor`, `4f91364`. | Lokal QA/Reviewer/Security klar. Ny egen-punkt-migration D1 har separat live-grind. |
| 03 Logg/Hälsa | Samma editor/spara/radera-mönster för logg, vikt, utförd och planerad hälsa; exakt plan/retur; säker vikt-readback. Pushad `2026-10-23-ui-03-logg-halsa`, `13f48bf`. | Oberoende QA PASS, Reviewer PASS, Security APPROVE. V7 nedan rättar två ytterligare fynd i integrerad slutrunda. |
| 04 Panelhelhet | Bildbärande Kunskap, jämnhöga träningskort med mindre metadata, delade val, kompakta detaljhuvuden och påminnelser. Meny-/ikonbeställningen ingår som tillägg. | Lokal fryst v7: QA PASS, Reviewer PASS, Security APPROVE. Separata innehålls-/data-/telefonberoenden nedan. |

GitHub `main` hämtades 2026-10-24 och är fortfarande `eea0984aba44ef17707e7d583b3f9bf6b165c7ee`. Ovanstående arbete ligger på paketbrancherna. UI04 är staplad ovanpå 01–03 och är den samlade byggbranchen; den är inte automatiskt integrerad i main eller distribuerad via TestFlight.

## Vad 04 ändrar

- **Träning:** två lika stora rekommendationskort med fulla rubriker, mindre och lättare programetikett, två olika foton och separat fortsättningskort. Hela textblockets naturliga höjd mäts om vid ändrad bredd, textskala eller innehåll. Översikten upprepar inte instruktionen.
- **Kunskap:** stort bildkort och mindre bildkort utan duplicerad teasertext; samma versionsbundna bilder och guideidentiteter. FAQ/lista har egna betydelseriktiga symboler. Guide/FAQ/checklistdetaljer har kompakt tillbakaheader.
- **Påminnelser:** en informationsikon öppnar förklaringen. Kompakta checkboxval och tidfält; appens Spara och telefonens OS-behörighet är fortsatt separata handlingar.
- **Delat UI:** FAQ, Träning och Insikter använder Tabs med egna tillgängliga namn. Delete-ingångar använder röd `trash-outline`, edit `create-outline`, Ångra `arrow-undo-outline`. Minus för att ta bort från idag behåller sin separata betydelse. Bekräftelser behåller text.
- **Huvudmeny:** alla fem hela namn får plats på en rad vid 320/375/430 pt och 140 % text. Endast menyetiketterna har en 140 %-gräns; sidinnehåll fortsätter följa systemtext. Fulla VoiceOver-namn och 44 pt mål består.
- **Copy:** layout-/exempelfyllnad tas bort ur berörda aktiva och preview-vyer. Kort sanningsenlig `Granskningsdata` och bildrollen `Standardbild` behålls där data/bild är syntetiska. Tomlägen, verkliga fel, källor och nödvändiga upplysningar finns kvar.

## Två konkreta fel hittade och rättade i GAP-slutrundan

1. **Logg:** en raderingsbekräftelse låg bakom edit-sheetet. Delete- och discard-dialogen monteras nu vid behov inuti sin ägande BottomSheet. Samma keyed editor, rå draft och handlers består. Faktiska klick utan force provar Avbryt, dirty-close/discard och endast vald posts radering på 375×667/844.
2. **Träning:** en dold gammal resetdialog kunde återkomma om samma program återladdades. Ogiltigt target rensas före fokusvyns tidiga returer. Ta bort/återför, versionsbyte/återställ och fokusvy/retur återupplivar varken dialog eller callback. Fingerprint och single-flight består.

## Faktiska kontroller

| Kontroll | Resultat | Bevis |
|---|---|---|
| UI04 public / review | **18/18 / 19/19 PASS** | [public](public/RESULTS.json), [review](review/RESULTS.json) |
| Samma, oberoende QA | **18/18 / 19/19 PASS** | Oberoende egna körningar under `/tmp/ui04-qa-final-panel/{public,review}`; verdict sparad nedan och sammanfattade egna resultat i [INDEPENDENT-QA.json](INDEPENDENT-QA.json). |
| Gemensamma handlingar, båda lägen | **9/9 vardera PASS**, även oberoende QA | [public](actions/public/RESULTS.json), [review](actions/review/RESULTS.json) |
| Träningens befintliga scenario-/reskontroller | **14/14 vardera PASS** | [public](training/public/RESULTS.json), [review](training/review/RESULTS.json) |
| Logg: kalender/snabbval/tidslinje och textproxy | **13/13 vardera PASS** | [public](log/public/browser-results.json), [review](log/review/browser-results.json) |
| Integrerad Hälsa | **9/9 vardera PASS** | [public](health/public/browser-results.json), [review](health/review/browser-results.json) |
| Bred panel-/returrunda | Public **52/52 PASS**; review **72/74**, endast två tidigare separata Home-marginalavvikelser | [public](panels/public/RESULTS.json), [review](panels/review/RESULTS.json) |
| Bildintegration | Public **2/2**, review **16/16 PASS**; tre guidebilder, rätt guide/steg och retur | [public](images/public/RESULTS.json), [review](images/review/RESULTS.json) |
| Framsteg, regression av godkänd panel | Public **2/2**, review **15/15 PASS** | [public](progress/public/RESULTS.json), [review](progress/review/RESULTS.json) |
| Sökbar rasväljare | **13/13 vardera PASS**, skapa/ändra, sök/retur, legacy-ID och 140 % | [public](breed/public/RESULTS.json), [review](breed/review/RESULTS.json) |
| Profilens täthet | **9/9 vardera PASS** | [public](profile/public/RESULTS.json), [review](profile/review/RESULTS.json) |
| `pnpm check` | **PASS: app/edge TypeScript, ESLint, 76/76 testfiler** | Full körning upprepad efter v7; hooks upprepar före commit/push. |
| Offentlig iOS JS-export | **PASS, 1 585 moduler** | Lokal Expo-export, separat från signerad build. |
| Public content guard, diff-check, Python-kompilering, kövalidering | **PASS** | Inga SQL-/dependency-/serviceändringar. |

Den breda reviewrundans två avvikelser är mätta **4 pt fri marginal** mellan Hem-genvägar och meny vid 375/430 pt, mot kontraktets 16 pt. De står kvar som FAIL i resultatfilen, med den tidigare ägaraccepterade separata avgränsningen; de räknas inte om till PASS. Inga nya överlappningar eller ytterligare resefel återstod. Den äldre scrollproben utgick från en platshållare för Logg; den provar nu faktisk Träning som flik utan bevarad underresa, eftersom nyare Logg har egen bevarad vy. Inget produktbeteende ändrades för att uppfylla proben.

UI04-bilder täcker 375×844, 430×844, 375×667 och 140 % CSS-proxy. Menyn mäts dessutom med **direkt 140 % förstoring av texten** vid 320/375/430: faktisk textbredd ryms, en rad, inget ellipstecken behövs, alla mål minst 44 pt. Träningskortens korta/långa titlar provas på samma sätt med både storlek och vikt jämförd. Native motsvarighet ingår i telefonrundan.

### Oberoende granskning

- **Architect:** v6 APPROVE; v7 APPROVE 2026-10-24. V7:s fokusvy→retur provades enligt granskarens precisering.
- **UX Critic:** v6 PROCEED WITH CHANGES endast statusreferenser, rättade; v7 PROCEED.
- **Security:** v6 APPROVE; v7 APPROVE. Konto behåller två Alerts; kennelclear/saveAttribution, exakt reset och notiscallbacks är oförändrade. Inga nya datafält, ändamål, lagring, delning, schema-/RLS-/authändringar.
- **QA:** v7 PASS efter egna UI04 18/19, actions 9/9 per läge, åtta riktade Node-filer och bildjämförelse. V6:s två buggar reproducerades först, sedan verifierades korrigeringarna. Ingen fil ändrades av QA.
- **Reviewer:** v7 PASS efter faktisk API-/glyph-/handlerkontroll, frysta korrigeringar, färska resultat och bilder mot rev02. Inga kvarvarande fynd inom den lokala slicen.

## Designregler §14 — avgränsad bedömning

| Nr | Resultat | Belägg / avgränsning |
|---|---|---|
| 1 | Ja | En Spara-footer i berörda editorer; kompakt ikon för kontextuella handlingar. |
| 2 | Ja | Träningskort mäts lika även med långa rubriker; delade knappar/Tabs. |
| 3 | Ja | Röd soptunna och verklig avbryt/bekräfta; account två steg oförändrade. |
| 4 | Ja, bevarat | Hem har pil, checkboxrader och tre färgade genvägar. |
| 5 | Delvis | Ändrade formulär/meny har nåbara mål; Hem-fixturens tidigare ägaraccepterade separata marginalavvikelse nedan kvarstår. Fysisk safe area ej provad. |
| 6 | Ja | Befintliga tokens/Button/Tabs/AppBar/BottomSheet/Dialog; inga nya stylingbibliotek. |
| 7 | Ja | Installerad Ionicons-familj och verifierade glyphnamn. |
| 8 | Ja för granskad presentation | Varm bas, färgade destinationsytor och dämpad metadata syns i bilder; detta är inte en ny full kontrastcertifiering. |
| 9 | Ja | Trash/edit/undo/FAQ/lista och faktisk handling stämmer; minus behåller dagsurval. |
| 10 | Ja | Ingen ny normalstatusbadge. `Standardbild`/reviewstatus anger faktisk bild-/dataroll. |
| 11 | Ja | Exempelfyllnad borttagen; inget nytt hälsopåstående eller uppmuntranslöfte. |
| 12 | Ja inom scope | Kortare svensk UI-copy; fel, källor, konto-/OS-beslut kvar. |
| 13 | Ja inom 04 | Bildbärande Kunskap/Träning, mindre programetikett; full guide öppnas separat. |
| 14 | Ja inom körda fall | Public/review, tomma FAQ, fel, reset, stale data, sparfel och recovery renderade; inte alla backendtillstånd. |
| 15 | Lokal Ja / native NOT TESTABLE | Mätta 44 pt, roller, stor text och fungerande webbklick; nya native-kontroller provas i telefon. |
| 16 | Ja för fryst 04-slice | QA/Reviewer jämförde färska bilder mot rev02. Full åttapanelsacceptans är separat enligt matrisen nedan. |
| 17 | Ja lokalt | Valda tabs/returer, exakt hälsoplan och profil-/Logg-Insikter i syntetiska produktkomponenter. |
| 18 | Ja för bild-/hundroll | Luna, versionsbundna guidebilder, standardbild märkt. Produktionsinnehåll/dataleverans är separat. |

## Åtta paneler — vad som är kvar

| Panel | UI-/funktionscheckpoint | Kvar för full leverans |
|---|---|---|
| 1 Hem | Befintlig komposition, pil/tre genvägar; kopystädning och gemensam meny i 04. | Den tidigare ägaraccepterade separata Home-fixturavvikelsen ger 4 pt fri marginal, under kontraktets 16 pt. Ingen ny full Hem-acceptans påstås. |
| 2 Utveckling | Ålders-/fasvy, halvcirkel, luft mellan faser och ålderstoggle finns; riktad panelrunda. | Publicerade och granskade milstolpskällor saknas, D5. Inga påhittade åldersråd läggs in. |
| 3 Dagens framsteg | Ägaren har bekräftat intern/extern QA och manuella iOS-prov. | Tidigare godkännande bevaras. Inga nya mål eller hälsotolkningar tillkommer. |
| 4 Daglig checklista | A03/rutinikoner/migration och iOS är senare ägargodkända; 02 ger kompakt UI och gemensamt ikonval. | D1 gäller **nya** egna Kunskapspunkters ikonmetadata; äldre routine-migration är inte samma migration. Äldre rapporterat rutin-sparfel återöppnas inte över senare godkännande. |
| 5 Logga | 03 QA/Reviewer/Security klar; 04 rättar dialogägande, ger röd trash/Ångra-pil och färsk 13/13. | Ny telefonkontroll av ändrade modalresor och slutlig build; inte ett nytt generellt RLS-/VoiceOver-stopp. |
| 6 Träning | Jämna kort, olika bilder, fulla titlar, tre val, exakt steg och bekräftad/säker reset har lokala bevis. | Faktiskt publicerat träningsinnehåll och berörd live-data/native-build är separata från reviewfixture. |
| 7 Kunskap | Sökning, bildhierarki, guideidentitet, FAQ-/listsymboler och kompakta returer; 02 ikonformulär. | **G17/D3 öppet:** publik, sakgranskad versionsmärkt FAQ-/faschecklistkatalog. D1 för ikonpersistens. Reviewflaggan kringgås inte. |
| 8 Insikter | Samma befintliga modell/routes från profil och Logg, periodval; ingen ny adapter/RPC i 04. | **D2:** specifik `dog_event_insights`-RPC/RLS-prob. **D5:** sömnregistreringar är inte verifierade sömnintervall; tidsband/varaktighet hittas inte på. |

## Kvarvarande beroenden — i prioriterad ordning

1. **D1:** applicera/prova `202610230001_checklist_custom_item_icons.sql` i avsedd utvecklingsmiljö; kontrollera write/readback, äldre klient och ägarscope. Ingen migration kördes här.
2. **D2:** kontrollera just `202610220002_dog_event_insights_read.sql` och den riktade RPC-/RLS-proben i disponibel utvecklingsmiljö. Generellt tidigare RLS-godkännande kvarstår; just ny RPC saknar runtimebevis här.
3. **D3 / G17:** sakgranska/publicera relevanta FAQ-/faslistversioner. Bevara egna punkter/progress och versionsidentitet när review ersätts av publicerat material.
4. **D5:** publicerade milstolpskällor och faktiskt sömnintervallkontrakt behövs för hela referensinnehållet.
5. Bygg **UI04-branchen** och prova nedan på telefon. Ingen signerad Codemagic/TestFlight-build har producerats eller verifierats av denna körning.

Ägarens tidigare godkännanden för A03, panel 3, allmän Supabase/RLS, VoiceOver/Dynamic Type och Compliance FLOW-INSIGHTS-01A gäller. De begärs inte om igen.

## Manuell iPhone-runda för denna byggbranch

Anteckna buildnummer och commit.

1. **Profil:** öppna/stäng rasväljaren, sök en ras, välj och spara; kontrollera samma skapa/ändra-mönster. Kennelavsnittet kan vara hopfällt.
2. **Checklistor:** skapa en egen punkt och välj ikon direkt. Ändra titel/ikon, spara och återöppna; prova daglig rutin och, om faslistan finns tillgänglig, egen punkt under Kunskap efter D1. Publik faslista förutsätter även D3. X med osparad text ska erbjuda trygg avslutning, inte kasta tyst.
3. **Logg/Hälsa:** ändra en anteckning och tryck soptunnan. Bekräftelsen ska ligga över formuläret; Avbryt behåller text. Prova även X→Avbryt respektive kasta. Använd syntetisk post för slutlig radering. Öppna två olika hälsoplaner från respektive ingång och kontrollera rätt plan/retur.
4. **Träning/Kunskap:** kontrollera jämna kort, fulla rubriker, mindre programetikett och olika bilder. Öppna/rör dig tillbaka. Prova reset Avbryt och bekräfta endast på testprogress.
5. **Påminnelser:** (i) öppnar förklaringen. Ändra och spara appval; begär telefonbehörighet separat. Det ena ska inte automatiskt utföra det andra.
6. **Meny/ikoner:** större systemtext: Kunskap och övriga namn förblir enradiga. Trash är röd, edit ruta/penna och Ångra svängpil. Kontrollera särskilt nya dialogernas fokus/åtkomst; tidigare generell accessibilityacceptans återöppnas inte.
7. **Insikter:** öppna från Hundprofil och Logg, byt period och gå tillbaka till rätt källa. Kontrollera innehåll efter D2, utan att tolka registreringsräknare som sömnlängd.
