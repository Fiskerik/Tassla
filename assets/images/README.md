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

## MOTION-04: valpfigur

`dog-mascot.png` skapades 2026-10-10 med Codex `image_gen` (transparent PNG). Den genererade originalfilen ligger i `/workspace/generated_images/exec-157ebdd9-b161-4238-8428-e7daef9d7320.png` och var 1254×1254. Den granskades visuellt och skalades lokalt med ImageMagick till kvadratisk RGBA 512×512 utan beskärning eller palettkvantisering. Slutfilen är 161,690 bytes; bildbudget 300,000 bytes. Originalet behålls i generated_images.

Exakt prompt:

> A clean, charming flat 2D editorial mascot illustration for a calm puppy-care app: a small generic puppy sitting, full body, three-quarter view, one paw raised slightly in a gentle acknowledgment. Distinctly hand-drawn cartoon illustration with simple curved shapes, solid muted honey-brown and warm cream fur patches, small dark brown eyes and nose, a few fine fur tufts, restrained palette, confident dark umber linework. Friendly and quiet, not excited, not anthropomorphic. Centered with generous padding on a genuinely transparent background. Precisely clean anti-aliased silhouette edges with neutral edge pixels: absolutely no red/green fringe, no glow, no colored outline halo, no shadow. No gradients, no 3D rendering, no photorealism, no text, no logo, no props. Square 512x512 PNG, transparent alpha.

ImageMagick-kommandot för den spårade nedskalningen var `magick <original> -resize 512x512 -strip -define png:compression-level=9 dog-mascot.png`. Den slutliga appfilen har PNG RGBA-kanaler och visas endast vid bekräftade loggningar/träningssteg; VoiceOver/TalkBack ignorerar den dekorativa figuren. Fysisk beskärnings- och renderings-QA görs i Eriks samlade mobil-QA.

## VISION-R02-2: generisk Home-platshållare

`home-dog-portrait-placeholder.png` är AI-genererad, fotoestetisk hundbildkonst skapad 2026-10-13. Den föreställer inte en identifierad verklig hund, är inte ett foto av Tassla-ägaren och får inte kopplas till hundens namn eller ras. Originalet är 1254×1254 px och ligger kvar i Codex generated_images på `/workspace/generated_images/exec-7d0e0642-b5b5-4a39-9f8b-6f3628fd50f9.png`. Bilden är en generisk dekorativ standardplatshållare i public och review Home; den samlar inte in, lagrar eller påstår personlig hundidentitet. Reviewramen märker den som AI-genererad standardbild. Den beskärs som `cover` i ett runt cirka 112×112 pt fönster; VoiceOver/TalkBack ignorerar den.
