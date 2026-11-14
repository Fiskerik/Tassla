# GAP-DOG-PHOTO-JPEG-01

Status: checkpoint; oaktiverad bytepolicy verifierad, bildhantering återstår. Bas `d122622645eefb3f4c44ce488afea7105624d878` med lokala dokumenterade GAP-checkpoints. Ägaren har beställt egen hundbild lagrad lokalt; första säkra, självständiga del är en oaktiverad kontroll av den bearbetade JPEG-kopian. En skrivägare. Risk H: privata bildmetadata och opålitliga bytes. Ingen app-, picker-, lagrings- eller nätkoppling i denna del; ingen dependency eller verklig bilddata.

Skrivvägar: `src/features/dog-photo/jpeg-policy.ts`, `src/features/dog-photo/README.md`, `tests/dog-photo-jpeg-policy.test.mjs`, detta kontrakt. Ingen annan produktändring. Läsunderlag: lokala foto-/säkerhets- och compliance-förhandsgranskningar samt faktiska Expo57-paketkällor. Userns uttryckliga beställning styr; ingen aktivering av verkliga foton förrän resten av lagring, livscykel och nativekontroller är genomförda.

Krav: ren fail-closed kontroll av bytegräns, SOI/EOI, segmentlängder/bounds och en giltig SOF-dimension inom uttrycklig pixelgräns. Avvisa EXIF/XMP/ICC, kommentarer, okända metadata, strukturellt ofullständiga eller felaktiga markörer/segment, inbäddad thumbnail och trailing bytes; tillåt endast en minimal verifierad JFIF APP0 om den behövs. Gå igenom alla scans inklusive byte stuffing och restart-markörer samt progressiva multipla SOS fram till EOI; inte enbart headers före första SOS. Ingen bild eller metadata loggas. Använd tydligt avgränsad policy utan att påstå full JPEG-dekodbarhet eller att bildens pixlar saknar personuppgifter.

Acceptans: beteendetester för giltig baseline och progressiv JPEG-struktur, metadata före/efter första scan, EXIF/GPS/ICC/XMP/COM, thumbnail, trunkerade markörer/segment, felaktiga längder, obalanserad/ogiltig markör, storlek/dimension, stuffing, restart och trailing bytes. Adversarial inputs får inte orsaka undantag eller oändlig loop. Kontrollera relevant SDK-API separat; kör riktade tester, `pnpm check`, oberoende Security, QA och Reviewer. Testbevis gäller endast bytepolicy, inte iOS-kodning, fotoväljare, faktisk EXIF-rensning, lagring, radering, backup eller TestFlight.

## API-kontroll

Installerat: `expo-image` 57.0.5 och `expo-file-system` 57.0.7. `expo-image-picker` och `expo-image-manipulator` finns inte i den installerade uppsättningen. Bytepolicyn anropar inga Expo-API:er; detta bevisar inte en fungerande native picker eller metadatafri omkodning. Nya paket och faktisk fotolagring hör till separata uppgifter.

## Avkodnings- och integrationsgräns

Policyn avkodar inte entropi eller MCU och kan godta en förkortad bildström om dess markörer och segment är strukturellt kompletta. Faktisk native avkodning och omkodning krävs separat; fullständig avkodbarhet kan inte utläsas från denna policy. Kodade pixlar och strukturella data kan fortfarande bära känslig information. Före aktivering ska samma fångade bytes kontrolleras, sparas och visas, eller en kryptografiskt bunden kopia användas: en validerad kopia får inte följas av blind kopiering från en separat URI som kan ha ändrats (TOCTOU).

## Checkpoint

Oaktiverad strukturell bytepolicy och tio syntetiska/adversariala testgrupper är implementerade. Testerna innehåller EXIF/GPS/XMP/ICC/COM före och mellan scans, JFIF-thumbnail/extra bytes, trunkerade markörer/segment, tabeller, gränser, stuffing/restart och trailing bytes. Två befintliga syntetiska repo-JPEG passerar. Oberoende QA rapporterade även lyckade prover på genererade baseline- och progressiva PIL-bilder; tidigare Reviewer-blockerare om avkodningspåståendet löstes och Security APPROVE avser endast oaktiverad policy. `pnpm check` PASS: typecheck, edge-typecheck, lint och 977 tester (976 PASS, 1 skipped). `git diff --check` PASS.

Ingen faktisk bildhantering har aktiverats. Före integration krävs verklig native avkodning/omkodning och minnesprov, samma-byte-/TOCTOU-skydd, filskydd, lagring/radering och backup-/kontolivscykel samt fysisk iOS-verifiering. Tester av bytepolicyn bevisar varken komplett avkodbarhet, helt metadatafri fil, anonyma pixlar eller TestFlight-funktion.
