# Copy-städning — lokal verifiering 2026-10-24

Branch `2026-10-24-ui-copy-cleanup`, bas `69251d2`. Ägarbeställningen ersätter tidigare synliga Test/Preview/gransknings- och Standardbild-markeringar. Målbild fortsatt `vision_rev02.jpg`.

## Implementerat

- Borttagna Granskningsdata/Granskningsinnehåll-banners, Standardbild-badges och tomma wrappers/styles på Hem, Utveckling, Framsteg, Träning, Kunskap/FAQ och utvecklingspreview.
- Borttagen extra Läs mer-/granskningsinformation i faschecklistans översikt och detalj, inklusive dess oanvända toggle. Själva checklistinnehållet och formulären består.
- Naturlig, kort copy i auth-preview, loggens raderingsbekräftelse och passets dokument-/otillgänglighetsläge. Menybeskrivningen Visuell grund tas bort.
- Inga tillfälliga toppremsor i motsvarande renderharness. Syntetiska data och generiska bilders proveniens anges i resultatmetadata utanför användarvyn.
- FAQ-svar, råd, källor, riktiga tom-/fel-/sparstatusar, dedikerad utkast-säkerhetsvarning, AI-/samtyckes-/betaupplysningar behålls. Flaggor, callbacks, data/auth/notiser/schema/RLS är oförändrade.

## Körda kontroller

| Kontroll | Public / review | Bevis |
|---|---|---|
| 14 huvud-/stödvyer, fyra format per vy | **14/14 / 14/14 PASS** | [main/public](main/public/RESULTS.json), [main/review](main/review/RESULTS.json) |
| Hem/Utveckling/Framsteg/profil/Insikter | **5/5 / 5/5 PASS** | [panels/public](panels/public/RESULTS.json), [panels/review](panels/review/RESULTS.json) |
| Kunskap/Träning/Påminnelser/Insikter + FAQ/faslista | **5/5 / 5/5 PASS** | [ui04/public](ui04/public/RESULTS.json), [ui04/review](ui04/review/RESULTS.json) |
| Befintlig sammanhängande UI04-interaktion | **18/18 / 19/19 PASS** | [interactions/public](interactions/public/RESULTS.json), [interactions/review](interactions/review/RESULTS.json) |
| Oberoende QA | **5/5 per läge + 8/8 riktade testfiler PASS** | Egen körning `/tmp/copy-cleanup-qa-ui04/{public,review}`; sammanfattning nedan. |
| Full `pnpm check` | **PASS: app/edge typecheck, lint, 77/77 testfiler** | Även obligatoriska Git-hooks upprepar kontrollen. |
| Public iOS JS-export | **PASS, 1 585 moduler** | Lokal export; ingen signerad build påstås. |
| Public content guard, Python-kompilering, diff-check och kövalidering | **PASS** | Inga nya dependencies eller SQL-filer. |

Format: 375×844, 430×844, 375×667 och direkt140% text på kort skärm. Varje renhetskontroll kontrollerar synlig text och avsaknad av horisontellt sidöverflöde. Interaktionsprovet behåller verklig FAQ-expanded-label `fäll ihop`; den första felaktiga verifierarassertionen `dölj svar` rättades till befintlig komponent-API utan produktändring.

## Granskning och §14

Architect **APPROVE**, Critic **PROCEED** för städplanen. Oberoende **QA PASS**, **Reviewer PASS**, **Security APPROVE** för fryst lokal presentation. QA körde egna prover och jämförde färska bilder, ändrade inga filer. Stale beskrivningar om synliga markeringar rättades i Home README och kanoniska designregler.

| §14 | Bedömning för denna slice |
|---|---|
| 1–4 Handlingar/format/radering/Hem-rader | Ja, oförändrade primärhandlingar, ikoner och bekräftelser; redundant reviewtoggle borttagen. |
| 5–8 Avstånd/tokens/ikoner/färg | Ja för borttagna ytor: inga reserverade luckor; befintliga tokens, fotoformat och ikonfamilj består. Inga nya färger eller kontrastanspråk. |
| 9–13 Betydelse/status/copy/bildhierarki | Ja: temporär märkning borta, FAQ/råd/källor och riktig status kvar. Generiska bildroller/proveniens kvar i dokumentation, inga nya personliga fotoanspråk. |
| 14 Relevanta tillstånd | Ja lokalt: public/review, tom FAQ/lista, läsning/retur, reset/stale, sparfel och behörighetsseparation. |
| 15 Tillgänglighet | Roller, kvarvarande mål och140%text lokalt kontrollerade; native ej omprovat. Tekniskt `Hem. Granskningsdata.`-namn är ersatt av Hem. |
| 16 Visuell jämförelse | QA/Reviewer jämförde rena produktkomponentbilder mot rev02; inga nya layoutavvikelser inom slice. Det är inte full åttapanelsacceptans. |
| 17–18 Navigation/hund/innehåll | Ja lokalt, samma rutter, bilder, innehållsurval och hundscope. |

## Begränsningar och telefonprov

Renderdata är syntetiska; verklig Supabase/RLS, native VoiceOver/Dynamic Type och signerad TestFlight-build har inte körts av denna ändring. Ägarens tidigare godkännanden gäller; inga nya generella telefon-/datastopp införs. D1/D2/D3/D5 från huvud-GAP-planen ändras inte.

I nästa telefonbuild: titta igenom Hem/Utveckling/Framsteg, Träning, Kunskap/FAQ och faschecklistans detalj. Kontrollera att inga temporära rutor/etiketter eller tomma mellanrum finns och att FAQ-svar, egna punkter, Spara och tillbakaresor fungerar. PDF-förhandsvisningens funktion och verkliga fel/statusar ska vara kvar.

## Nästa plan

Ägarens efterföljande önskemål om en levande användbar app besvaras i [användarplanen2026-10-24](../../../../plans/UI-UX-ANVANDARPLAN-2026-10-24.md). Product/UX-underlag och Critic-review har genomförts. Criticens enda beroenderättelse är införd: D1 gäller paket2:s egna faslist-ikoner, inte paket1:s dagsrutiner. Planen föreslår nästa prioritering men startar ingen ny featureimplementation.
