# Tillfälliga bildassets

Två dekorativa AI-genererade foton, skapade 2026-10-04 med inbyggda imagegen-verktyget. De är inte foton av användarens hund och ska användas på välkomst-/innehållskort, inte som ett påstått profilfoto. Originalen sparas i Codex generated_images; kopiorna här följer projektet. Inga fjärrbilder eller användaruppgifter används.

## Prompter
dog-welcome.png: photorealistic-natural, landscape 3:2 editorial photo of a calm healthy adult beagle beside a cream knitted blanket in a bright Scandinavian home, sage-green/warm beige background, natural window light, dog on right with left space for UI text. Correct anatomy; no people, text, logos or watermark. Decorative photo, not a real user pet or training instruction.

dog-resting.png: photorealistic-natural, landscape 3:2 editorial photo of a healthy beagle peacefully curled up asleep on an oatmeal cream blanket in a naturally lit Scandinavian home, centered for mobile crop, sage and cream palette, believable anatomy. No people, medicine, text, logos or watermark. Decorative photo, not medical advice or a real user pet.

Visuellt granskade i verktygsresultatet. React Native Image kan använda filerna lokalt. Profilen ska använda neutral hundikon tills användaren själv väljer ett foto i ett separat godkänt uppladdningsflöde.

## Tassla-markör

`tassla-logo.svg` är en repo-native, textfri Tassla-markör för små ytor. ImageGen var inte tillgängligt vid UX-02-körningen, därför skapades `tassla-icon.png` lokalt som en ogenomskinlig 1024×1024 rastermarkör med samma tass-/bladmotiv. Expo använder PNG-filen som appikon; den är inte en användares hundbild och innehåller ingen användardata.

## UI-06: dekorativa Hem-bilder

Originalgenererade med inbyggda imagegen-verktyget 2026-10-10; kopiorna här används lokalt. De är illustrationer i fotostil, inte användarens hund, verifierade händelser eller hälsoråd. Inga användarbilder eller BabyJourney-tillgångar användes.

- `puppy-training.png` (2,4 MB): valp och ägare tränar lugnt sitt i solbelyst svensk äng, gräddvit/mörkgrön palett, liggande 3:2, ingen text eller logotyp. Dekor till Träning-kort.
- `puppy-resting-carousel.png` (2,1 MB): sovande valp på beige filt i lugnt skandinaviskt hem, liggande 3:2, ingen text eller logotyp. Dekor till Kunskap-kort.
- `puppy-water.png` (2,0 MB): valp dricker ur keramisk skål i solbelyst hem, liggande 3:2, ingen text eller logotyp. Allmän vardagsdekor till valfritt Hälsa-kort; kortets text anger faktisk plan, bilden visar inte sjukdom eller behandling.
- `dog-placeholder.png` (1,2 MB): enkel grön generisk hundsilhuett mot gräddvit bakgrund, kvadratisk och läsbar vid liten cirkulär beskärning. Platshållare för hundkort, inte varumärkeslogotyp eller hundfoto.

Originalen ligger under `/workspace/generated_images/` i Codex-arbetsmiljön. Bilderna har visuellt granskats i verktygsresultatet. Den lokala iOS-bundlingen och mobilskärmdumpar ska granskas för slutlig beskärning och paketstorlek.
