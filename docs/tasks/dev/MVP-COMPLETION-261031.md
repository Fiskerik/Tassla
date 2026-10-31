# Färdigställande av användarresor — 2026-10-31

Bas: `f0065da20451d9ef88e4fd46f5c75b8b47d6b046` (main efter PR41). Arbetsbranch: `feature/complete-mvp-journeys`; inga worktrees. Root är ensam skrivare. Mandat: Erik beställde uttryckligen genomförande av de fyra föreslagna stegen och därefter `expo-haptics` samt konsekvent rörelse. Den senare instruktionen kompletterar de fyra stegen.

## Leveransordning och observerbart resultat

0. **Konsekvent respons.** Godkänd Expo-haptics-dependency, lätt återkoppling först efter en användarinitierad bekräftad bock, samma tryckrespons på vanliga kontroller. Progress, dragspel och stegövergångar förbättras i de berörda resorna; inga loopar, ny rörelsemotor eller obligatoriska telefonstopp.
1. **Utveckling och relevant innehåll.** Ersätt tre tillfälliga externa hållpunkter med publicerat fasunderlag och internt läsbara rekommenderade artiklar/guider. Bevara kronologisk ålder. Inga påståenden om individuellt uppnådda milstolpar. `fetchKnowledgeContent` är hela läsbiblioteket: Utveckling måste filtrera rekommendation explicit, medan Kunskaps fulla läsbibliotek kvarstår. Ingen hemkomst antas från födelsedatum. Befintliga granskade 18 fasförslag får återanvändas oförändrade; inga nya medicinska råd eller påhittade artikelrelationer.
2. **Hem som minns.** Prioritera riktiga daterade delmål och sammanhängande egen historik framför enbart senaste loggrad, med exakt källnavigation. Hem, Framsteg och dagslista ska använda samma bekräftade underlag; tomt/fel/unknown får inte fyllas med låtsashistorik. Animation följer bekräftad ändring och rätt hund/dag.
3. **Träning och Kunskap.** Inventera verkliga publiceringsartefakter, gör relevanta granskade texter åtkomliga genom befintligt bibliotek, ge program/övningar spårbart eget bildspråk och begripliga avslut/fortsättvägar. Inga draft- eller review-fixtures blir publik fallback. Förbered saknade import-/verifieringsartefakter där det behövs; faktisk live-publicering redovisas separat.
4. **Hela vardagsresan.** Verifiera skapa rutin → lista/Hem → genomför aktivitet → samma progress/historik → nästa dag/återbesök, inklusive misslyckat/osäkert sparande, hundbyte och retur. Rätta konkreta integrationsglapp. Samlad public iOS-export, oberoende QA/review, push och PR.

Varje del får eget exakt write set, bascommit, riskklass, planreview, bounded cleanup, verkliga kontroller och hållbar commit före nästa överlappande del. Denna roadmap ersätter inte sådana grindar och betyder inte att någon del redan är klar. Mänsklig granskning av nya råd, live Supabase, native SecureStore/haptisk känsla/VoiceOver/Dynamic Type, signerad build och distribution hålls separata. Aktuell miljö har inga Supabase-adminidentiteter eller hemligheter; ingen användardata läses eller live-migration körs härifrån.

## Inledande verifierade fynd

- Utveckling filtrerar enbart `guide` och saknar `recommended`-kontroll; relevanta `article` utesluts samtidigt som läsbara men ej rekommenderade guider kan visas.
- Faschecklistans 18 råd är granskade mot dokumenterade källutdrag (oförändrad payloadhash), men lokala JSON-versioner är draft. Endast runtimevaliderad publicerad katalog får användas i publicläge. Punkterna är frivilliga förslag, inte biologiska milstolpar.
- Drive-original är neutralt, ägarbekräftat underlag. Ingen ny hundnamns-/pronomenpersonalisering i artiklar eller träningsråd.
- Inkallningsutkastet saknar dokumenterad mänsklig slutgranskning; den statusen får inte ändras genom UI-arbete.
- Användarens rörelseinventering är underlag. Aktuella API:er och kontroller verifieras mot repo; scrims och drag-/gestytor behåller nödvändiga grundkontroller.

Nästa aktiva del: `PREMIUM-FEEDBACK-01`. Därefter slutförs steg1–4 i ordning; inget av dessa tappas genom haptikbeställningen.

## Tillägg från Erik — prestanda och Expo, 2026-10-31

Den uttryckliga instruktionen ”Lägg även till dessa punkter i målet, och i beslutsdokumenten inför framtiden. Utför därefter det som föreslagits” kompletterar arbetet. Expo SDK57 behålls. SDK58-uppgradering ingår inte. Paketgodkännandet gäller kompatibla expo-splash-screen, expo-image, expo-haptics och expo-keep-awake för beskrivna ändamål; @expo/ui DatePicker ska utvärderas mot verkligt installerat SDK57-API före eventuell avgränsad integration.

Efter feedbackcheckpointen genomförs: komprimering av använda opaka stora fotografier utan beskärningsändring (bevara transparens/proveniens), varm startskärm utan obegränsad nätverksväntan, gemensam bildhantering med bevarad ansiktspositionering/cache, vaken skärm bara för öppen träningsinstruktion. Native datum-/tidsväljare prövas mot lokal datumsemantik, min/max, avbryt och befintliga tillgänglighets-/gestkontrakt. Exakta versioner tas från Expo57 bundledNativeModules, inte från förslagets uppgifter om SDK58. Dessa delar får egna taskplaner och oberoende review. De fyra innehålls-/vardagsresorna ovan kvarstår.

**Efter MVP, enbart dokumenterat:** widgets kräver separat integritets-/kostnadsbeslut (hundnamn kan synas på låsskärm); store-review övervägs efter betan; updates kräver tjänste-/kostnads-/releasebeslut; foto kräver separat samtycke, lagring, radering och GDPR-granskad vertikal del. Inga sådana paket eller tjänster aktiveras genom denna plan.

Avstå från blur/glaseffekter, ny symbolfamilj, extra gradientpaket, Reanimated och Lottie. Befintlig Animated/LayoutAnimation/SVG räcker. Inga loopar, nya persondataändamål eller automatiska publiceringar.
