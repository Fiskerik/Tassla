# FLOW-HOME-CHECKLIST-IDAG-01 — renderbevis

Datum: 2026-10-16<br>
Utgångspunkt: `main` @ `00d4d4a3e38c08a6bb7d4c541cc509457126276f`<br>
Källa: produktionskomponenter via React Native Web; endast syntetiska lokala data. Testklockan är 2026-10-11 15:00 UTC och checklistans test körs med reduced motion så att skärmövergången inte fastnar på en frusen browserklocka.

Public och review är renderade separat. `browser-results.json` i respektive mapp innehåller verifierarens faktiska PASS-resultat och upplyser om syntetisk data och verifieringsgränser.

## Skärmar

- [Public: Idag, 375×844](public/checklist-ready-375x844.png), [430×844](public/checklist-ready-430x844.png) och [375×667](public/checklist-ready-375x667.png).
- [Review: Idag, 375×844](review/checklist-ready-375x844.png), [430×844](review/checklist-ready-430x844.png) och [375×667](review/checklist-ready-375x667.png).
- [Public: tom dag](public/checklist-entry-checklist-empty-375.png), [laddning](public/checklist-loading-375.png) och [läsfel](public/checklist-error-375.png); motsvarande reviewbilder finns i `review/`.
- [Public: 140 % textproxy, 375 px](public/checklist-large-text-375.png) och [430 px](public/checklist-large-text-430.png); reviewbilder finns i `review/`.

I normalstorlek visar Hem och checklistan samma bekräftade dagsprogress. Bara aktiviteter med tillgänglig källa ingår i bekräftad täljare och nämnare; unavailable redovisas separat. Public/review verifierar `3 av 5 bekräftade klara · 1 status kan inte bekräftas`, och Hemmets progressbar använder samma summering i sitt tillgängliga namn. Rutinpunkterna har bock och separat `Visa`-detalj; träningsraden saknar rutincheckbox. Om träningskällan saknas visas `Status kan inte bekräftas`; vyn påstår inte att steget är ogjort och erbjuder ingen öppningshandling. Reviewversionen visar det egna syntetiska träningssteget och sin tydliga fixturebanner. Stor text ger avsiktlig vertikal scroll; verifieraren kontrollerar att innehållet inte klipps i sidled och att checklistans scroll samt en 100 px icke-noll Home-position återställs efter resan.

Checklistans rutinhantering öppnas direkt från checklistan; [public](public/checklist-manager-375x844.png) och [review](review/checklist-manager-375x844.png) visar sheeten. En syntetisk saknad-källa-skärm finns i [public](public/checklist-training-unavailable-375.png) och [review](review/checklist-training-unavailable-375.png). Hemmets progressbevis finns i [public](public/home-progress-unavailable-375.png) och [review](review/home-progress-unavailable-375.png).

## Jämförelse med vision_rev02, §14

Visionens Panel 4-markeringsrad väljer `Logg`. Checklistan här är en underordnad detaljresa från Hem, så `Hem` förblir vald i huvudmenyn på checklistan. När ett träningssteg öppnas aktiveras befintliga huvudfliken `Träning`; stängning går tillbaka till checklistan med `Hem` aktiv och scrollen återställd. Detta är ett dokumenterat visuellt delta för att checklistan inte ska bete sig som en egen huvudflik. Inträdet är alltid synligt på Hem vid tom, kort och lång lista samt under laddning och fel.

Denna checkpoint färdigställer endast Idag-resan. `Alla` med samtliga aktiva rutinmallar, oavsett dagsval, ligger i `FLOW-HOME-CHECKLIST-ALL-01`; Vecka och Kommande har egna senare grindar. Bilderna är inte bevis för native VoiceOver/Dynamic Type, fysisk tillbaka-gest, Supabase/RLS eller användarens verkliga data.
