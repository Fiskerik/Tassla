# Traction P1 — nästa steg på Hem

Status: lokal implementation och verifiering; UX/UI Critic PASS för den renderade Hemvyn. Hela upplevelseplanen är inte färdig.

Ett kompakt kort visar ett faktiskt ålders- och rasanpassat tillgängligt träningsprogram och dess nästa steg när ingen resa finns. Rubriken ”Förslag på nästa steg” skiljer detta från en redan startad resa. Tryck öppnar samma program i Träning, där resan kan startas. Pågående resa behåller sin egen sparade position. Förslaget visas inte vid läsfel eller osäker/pågående progressionsändring. Inga påhittade steg, tidsuppskattningar eller träningsresultat skapas.

Källkod: `src/features/home/HomeScreen.tsx`, `src/features/home/ProductWorkspace.tsx`, `src/features/home/home-training-suggestion.ts`. Kontroll: `tests/home-training-suggestion.test.mjs`, `tools/visual-check/verify-traction-home.py`, `tools/visual-check/app.tsx` och `docs/design/evidence/traction-home-next-step-01/`.

En pågående resa visas som ett kompakt klickbart kort med sparat steg samt separata pass- och delmålsräknare. Dagsöversikten visar högst tre rader men behåller det fullständiga antalet och chevronen till alla aktiviteter i checklistan. UX Critic rekommenderade komprimeringen och tre rader efter en granskad full dagsvy.

Den lokala browserkontrollen visar korrekt programöppning, åtskilda fall för läsfel, okänt resultat och pågående resa, samt 375/430 px och tillgänglig tryckyta. Full dagsvy med sju aktiviteter visar tre rader, hela antalet och samtliga tre genvägar ovanför bottenmenyn; hela checklistan öppnas via chevronen. Vid 375×667 med 140 % textproxy kan kortet scrollas fram ovanför bottennavigeringen. UX/UI Critic gav slutligt PASS efter rättning av singularformerna. `pnpm check` passerar med 89/89 testfiler; träningsregressionen passerar 24 + 7 kontroller. En äkta iOS-enhet, VoiceOver, Dynamic Type och TestFlight är inte verifierade. En full dag med stor text behöver ytterligare samlad visuell kontroll.
