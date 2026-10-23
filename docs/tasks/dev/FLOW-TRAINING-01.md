# FLOW-TRAINING-01 — Träningens rekommendation och återupptagning

- **Lokal implementation:** klar i aktuell branch.
- **QA:** PASS för public/review-render och 28 pt Miljöträning-status.
- **Oberoende Reviewer:** PASS för exakt versionsurval, identifierbara pausade program och fulla programtitlar.
- **Queue:** `docs/tasks/dev/queue.json` lämnas oförändrad medan den har en annan ägare.
- **Produktionsstatus:** inte fullständigt verifierad. Live Supabase/RLS och faktiskt publicerat träningsinnehåll saknar kontroll här.

## Leverans

- Träning har tre tydliga vyer: Rekommenderat, Alla övningar och Mina.
- Aktuell ålder-/rasmatchad version och varje exakt publicerad, påbörjad version kan finnas samtidigt. De dedupliceras per versions-ID.
- Fortsättningskortet öppnar nästa obekräftade steg i samma programversion; en slutförd version får ingen fortsättningshandling.
- Pausade versioner visar titel och versionsnummer när publicerad metadata finns. Poster utan läsbar titel visas samlat utan exponerade interna ID:n.
- Rekommendationsfoton är skilda, generiska standardbilder. Titlar får radbrytas och kapas inte av en radgräns.
- Panel 3:s Miljöträning använder en rund 28×28 pt statusmarkering med tydlig bock.

## Verifiering

- `CI=1 npm_config_network_concurrency=4 pnpm check` passerade efter den sista kod- och fixturjusteringen: app- och edge-TypeScript, ESLint samt 675 testfall (674 pass, 0 fail, 1 skip).
- React Native Web-verifiering: 13/13 public och 13/13 review, inklusive lång titel, titel-lös pausad status och 140 % layoutproxy.
- Public iOS-export passerade efter senaste källkodsändringen: 1 579 JS-moduler och 59 assets; ingen signerad IPA/TestFlight skapades.
- `python -X utf8 tools/dev_flow.py validate` och `git diff --check` passerade.
- Native VoiceOver/Dynamic Type och live Supabase/RLS är inte verifierade.

## Beslut under arbetet

1. Exakta versions-ID:n styr deduplicering så sparad äldre progress aldrig ersätter dagens rekommendation.
2. En programtitel får ta fler rader för att undvika synlig ellips.
3. Otillgängliga gamla versioner utan publicerad titel grupperas i en ärlig statusrad i stället för att visa en UUID eller hitta på ett programnamn.
4. Metadata utan verklig källa, som tid eller träningskategori, läggs inte till som kortbrickor.

Nästa steg: committa och pusha utan att ändra den delade kön. Redovisa live-data/RLS och native-verifiering som öppna leveranskontroller.
