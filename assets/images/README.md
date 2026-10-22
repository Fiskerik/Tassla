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

## VISION-R02 panel 2: Utvecklingens standardbild

`development-hero-puppy-black-tan-forest-wide.jpg` skapades med `image_gen` 2026-10-21 för panel 2. Den visar en svart-/tanvalp på en skogsstig med utrymme för åldersbågen. Originalet är 1536×1024 px, 2,414,106 byte och finns kvar i `/workspace/generated_images/exec-8fd4573d-0aa9-46cb-8404-3714b586bc90.png`. Spårad JPEG är 1536×1024 px och 274,640 byte (ImageMagick JPEG kvalitet 86, metadata borttagna). Den generiska standardbilden används endast i Utvecklings hero och märks synligt `Standardbild`; den är inte ägarens hund eller en milstolpskälla. Den tidigare vertikala beskärningen har tagits bort från produkten.

## VISION-R02 panel 3: Dagens framsteg

`daily-progress-hero-puppy-terrier.jpg` skapades med `image_gen` 2026-10-21 för panel 3. Den visar en creme-/rostfärgad strävhårig terriervalp på en varm linnematta i mjukt dagsljus; kvadratutsnittet används i ringporträtt, laddning och tomtillstånd. Originalet är 1254×1254 px, 2,172,067 byte och finns kvar i `/workspace/generated_images/exec-ce16bc56-3b88-44f4-8458-ff1aee635d89.png`. Spårad JPEG är 1254×1254 px och 219,438 byte (ImageMagick JPEG kvalitet 86, metadata borttagna). Den är en generisk dekorativ bild, inte ägarens hund eller ett bevis på utförd aktivitet. Den används bara i panel 3.

## VISION-R02 panel 6: Träning

`training-hero-shiba-park.jpg` skapades med `image_gen` 2026-10-21 för Träning. Den visar en rödvit Shiba Inu i en lugn sittövning i en svensk stadspark. Originalet är 1024×1536 px, 2,487,380 byte och finns kvar i `/workspace/generated_images/exec-4d10ad03-a255-4dfa-87bd-274dc2498514.png`. Spårad JPEG är 1024×1536 px och 266,336 byte (kvalitet 86, metadata borttagna). Generisk dekorativ standardbild, inte användarens hund eller bevis på genomförd träning; reserverad tills panelens bildyta är godkänd.

## VISION-R02 panel 8: Insikter

`insights-hero-senior-schnauzer.jpg` skapades med `image_gen` 2026-10-21 för Insikter. Den visar en äldre grå schnauzer i ett varmt hemmaljus. Originalet är 1024×1536 px, 2,401,566 byte och finns kvar i `/workspace/generated_images/exec-639ebfb6-63b7-4f4d-850a-a327d746cb1f.png`. Spårad JPEG är 1024×1536 px och 266,278 byte (kvalitet 86, metadata borttagna). Generisk dekorativ standardbild, inte en användares hund, hälsodata eller bevis på ett mönster; reserverad tills panelens bildyta är godkänd.

Panel 2 och 3 aktiva bilder väger tillsammans 494,078 byte; de ursprungliga reserverade panel 6/8-bilderna väger 532,614 byte. Summan 1,026,692 byte avser de fyra första JPEG-filerna före Kunskaps-/Träningsbilderna nedan. PNG-originalen är endast arkiverade i `/workspace/generated_images/` och spåras inte i apppaketet.

## VISION-R02 panel 6/7: varierade redaktionella bilder

Fyra fotorealistiska, dekorativa bilder genererades 2026-10-21 med ChatGPT `image_gen`. De är nyskapade motiv utan uppladdade referensfoton eller tredjepartsbilder. Användning av genererat material följer [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/). Motiven föreställer inte en verklig identifierad hund, ägarens hund eller ett verifierat träningsresultat.

| Appfil | Motiv-/promptspårning | Källa → appasset | Roll och crop | Tillgänglighet / avsedd återanvändning |
|---|---|---|---|---|
| `knowledge-featured-puppy-lagotto-forest.jpg` | Fotorealistisk lagotto på nordisk skogsstig, mjukt dagsljus, luftig grön/beige miljö | `exec-c0aaccd7-8d52-4944-a650-6160064fcd9f.png`, 1536×1024, 2,604,029 B → 1536×1024 JPEG, 311,460 B | Kunskaps hero, befintlig höjd 200 pt med `cover`; naturligt horisontellt utsnitt | Dekorativ, VoiceOver/TalkBack ignorerar bilden. Samma guide behåller samma bild i HomeCarousel. |
| `knowledge-card-puppy-sheltie-window.jpg` | Fotorealistisk sheltievalp vid solbelyst fönster, varm skandinavisk hemmiljö | `exec-5a2a21b3-d1a8-4997-af40-852b15cfeba8.png`, 1536×1024, 2,265,793 B → 1536×1024 JPEG, 235,973 B | Kunskapens mindre bildkort, nuvarande 132 pt bildhöjd och responsiv bredd med `cover` | Dekorativ, VoiceOver/TalkBack ignorerar bilden. Stabil guide-ID-/versionsmappning. |
| `knowledge-card-puppy-cocker-coast.jpg` | Fotorealistisk brun cocker spaniel på nordisk kuststig, hav och ljung i bakgrunden | `exec-856c7906-2f8b-40a6-b411-5c2a9f3a2f58.png`, 1536×1024, 2,683,164 B → 1536×1024 JPEG, 316,271 B | Kunskapens mindre bildkort, nuvarande 132 pt bildhöjd och responsiv bredd med `cover` | Dekorativ, VoiceOver/TalkBack ignorerar bilden. Stabil guide-ID-/versionsmappning. |
| `training-next-step-puppy-corgi-home.jpg` | Nära fotorealistiskt corgiporträtt på neutral träningsmatta i lugnt hem; tydliga ögon och öron i litet utsnitt | `exec-302611d4-5547-491a-983a-f7d8ac5bb58c.png`, 1254×1254, 2,318,108 B → 1254×1254 JPEG, 242,738 B | Träningens nästa-övning-miniatyr 88×88 pt (`tokens.size.trainingImage`) och HomeCarousel-bilden för samma nästa träningssteg; `cover` | Dekorativ, VoiceOver/TalkBack ignorerar bilden. Delas endast mellan samma träningssteg i Träning och dess HomeCarousel-genväg. |

Alla JPEG-filer konverterades från angivna original med `magick <source.png> -strip -quality 86 <asset.jpg>`. Samlad storlek är 1,106,442 B; varje fil understiger 350 KB och summan 1.4 MB. Metadata tas bort. Bildkällorna är AI-genererade och ska inte märkas som personliga hundfoton, utbildningsbevis eller hälsopåståenden. Motiven är bedömda separat; faktisk React Native `cover`-rendering i appen kvarstår **NOT TESTABLE** tills fungerande renderer finns.
