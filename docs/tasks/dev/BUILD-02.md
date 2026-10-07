# BUILD-02 — fånga Xcodes arkiveringslogg
Plan v4, 2026-10-07. Bas: `a4cdf56`. Erik vill felsöka exitkod 65 från Codemagic. De bifogade byggloggarna bekräftar att dependencyinstallation, Expo-prebuild, `pod install` och val av App Store-profil/certifikat lyckades. `build_signed_application.log` är endast 1 055 byte och innehåller ingen kompilator-/signeringsfelrad. Den generella Hermes-varningen identifierar inte orsaken.

## Mål
Lägg till det användarföreslagna mönstret för Codemagics råa Xcode-loggar (`/tmp/xcodebuild_logs/*.log`) som diagnostiska byggartefakter, i försök att kunna hitta Xcodes första faktiska `error:`-rad om den filen finns och mönstret stöds. Behåll `xcode-project build-ipa`, signering och TestFlight-uppladdning. Stäng tillfälligt av App Store-inlämning för diagnostikkörningen enligt Eriks beslut; byggkörningen startas inte av Codex. Den föreslagna Pods-inställningen `CODE_SIGNING_ALLOWED/REQUIRED=NO` implementeras inte före faktisk diagnostik, eftersom loggen inte visar att Pods-signering orsakar felet. Xcode-version, React Native och Expo ändras inte.

## Omfattning
- `codemagic.yaml`: lägg till `/tmp/xcodebuild_logs/*.log` under `artifacts` tillsammans med befintligt IPA-mönster; behåll TestFlight=true och sätt App Store-submission=false tills Xcode-felet diagnostiserats.
- `docs/dev/codemagic-first-build.md`: lägg till kort vägledning om att ladda ned rålogg/resultat efter Codemagic-arkivering.
- `docs/tasks/dev/BUILD-02.md` och `queue.json`: acceptans, observationer och nästa steg.

## Kontrollpunkter
Architect/Critic granskar plan v4, inklusive användarbeslutet att tillfälligt stänga App Store-submission medan TestFlight behålls. `/tmp/xcodebuild_logs/*.log` är föreslagen av Erik men inte verifierad från molncontainern; denna ändring testar sökvägen som ett diagnostiskt försök, inte en garanterad Codemagic-konvention. Lokalt valideras YAML-syntax och diff. Endast en ny Codemagic-körning kan bekräfta om filen finns och laddas upp. Om artefakten saknas markeras insamlingen EJ VERIFIERAD; nästa steg blir Codemagics fullständiga bygglogg/resultatbundle, inte att på chans ersätta `xcode-project build-ipa` med ett ofullständigt exportflöde. Varken den exakta Xcode-felraden eller framgångsrik arkivering påstås här.

Reviewhistorik: architect bad att v3 skulle beskriva insamlingen som ett oprövat försök; formuleringen rättades och v3 godkändes. För v4 godkände `build02_architect` och `build02_critic` ägarens tillfälliga App Store av / TestFlight på-beslut.

Genomförd förändring: Codemagic artifacts innehåller nu IPA-mönstret och det oprövade `/tmp/xcodebuild_logs/*.log`-mönstret. Arkiverings-/signeringskommandot är oförändrat. Ingen Pods-signeringsoverride är pålagd.


Planreview v4: build02_architect APPROVE, build02_critic PROCEED. Genomfört beslut: `submit_to_testflight: true`, `submit_to_app_store: false` tillfälligt. Codemagic-körning startas inte av Codex.

Lokal kontroll: Python PyYAML tolkar workflow/artifacts/publishing korrekt; IPA-mönstret finns kvar, loggmönstret tillagt, TestFlight=true och App Store=false. `git diff --check` PASS. Build02_qa PASS och build02_reviewer PASS. Den riktiga loggsökvägen kan endast verifieras genom en Codemagic-körning.
