# Kunskap: FAQ-katalog v1 — innehållsgranskning

Status: **Dog Expert PASS WITH CONDITIONS** för exakt aktuell payload. Bundle: `docs/content/knowledge-faq-v1.json`. Första payload SHA-256: `74b0a80923c60683251ef63f4d5ff40802c9dccf31a959cf92183154acb49156` fick CHANGES. Andra payload SHA-256: `ddeed5eff7ecc2aeaa14d24c8dbb17be3f02e228e13d2304333dfa9e19b412bd` fick CHANGES enbart på valpkursvaret. Aktuell payload SHA-256: `170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288` (sorterad UTF-8-JSON av `sources` + `faqs`, exklusive arbetsstatus). Inget av innehållet är importerat eller publicerat.

## Granskningsomfång

Dog Expert ombeds granska de fyra exakta svenska frågorna/svaren och varje claim→source-mappning i JSON-bundlen. Granskningen ska särskilt bedöma om varje svar faktiskt besvarar frågan, om något råd är osäkert eller för precist, om barnkontakten behöver tydligare vuxennärvaro och om valpkursvaret undviker ett påhittat generellt startintervall. Föreslå minsta säkra copyändring och ange `PASS`, `PASS WITH CONDITIONS`, `CHANGES` eller `UNSAFE` per FAQ och totalt.

## Källunderlag som tidigare öppnats

Koordinatorns dokumenterade källgranskning 2026-10-26 finns i [`knowledge-phase-checklists-review-v1.md`](knowledge-phase-checklists-review-v1.md). Källsammanfattningarna där och i bundle är referensutdrag för denna bedömning; de ersätter inte oberoende läsning av URL:erna av Dog Expert. Ingen veterinär har godkänt FAQ-copy.

| Käll-ID | Granskad relevans för dessa utkast |
|---|---|
| `rspca-puppy-care` | Allmän valpvård, lugn/ostörd vila, positiva upplevelser, gradvis hantering, valpkurser och kontakt med veterinär. Brittisk sida anger egna ålders-/vaccinationsrekommendationer; dessa återanvänds inte som svensk rekommendation. |
| `rspca-environment` | Ostörd viloplats, trygg plats att dra sig undan till och säker hemmiljö. |
| `rspca-left-alone` | Individuell, gradvis ensamhetsträning, undvika oro och backa till enklare steg; inget fast schema. |
| `dogstrust-children` | [Dogs Trust — Getting a dog when you have children](https://www.dogstrust.org.uk/dog-advice/getting-dog/dog-ready/when-you-have-children), öppnad 2026-10-28. Vuxen ska aktivt övervaka barn och hund; introduktion hålls kort, lugn och positiv; hunden får gå undan och vila ostört. |
| `avsab-humane-2021` | Professionellt ställningstagande för belöningsbaserad träning; inte individuell behandlingsplan. |
| `avsab-socialization` | Säkra, positiva, gradvisa upplevelser utan överstimulering. Amerikanska vaccin-/kursintervall används inte som svensk rekommendation. |

## Payload och spårbarhet

De granskade frågorna är `faq-first-night` / `first_days`, `faq-alone-time` / `first_days`, `faq-child-contact` / `before_homecoming` och `faq-puppy-course` / `by_age`. Varje svar har stabila claim-ID:n, och varje claim refererar till lokala käll-ID:n som i sin tur pekar på exakt URL och titel. Katalogvisningen avser sammanhangsflik, inte hundens ålder eller medicinsk rekommendation.

Nuvarande copy och källreferenser finns exakt i [`knowledge-faq-v1.json`](knowledge-faq-v1.json). Statusen `reviewed` avser exakt den digest som har fått Dog Expert PASS WITH CONDITIONS; varje FAQ-version är fortfarande `draft` i bundle och opublicerad tills separat SQL-import och publicering.

## Resultat

| FAQ | Verdict | Kommentar |
|---|---|---|
| Första natten — digest 2 | PASS | Konkreta nattförberedelser passar de granskade källorna. |
| Ensamhetsträning — digest 2 | PASS | Gradvis individuell takt och enklare steg vid oro är källstödda; inget fast schema. |
| Barnkontakt — digest 2 | PASS | Aktiv vuxentillsyn, lugnt första möte och reträttmån anges; Dogs Trust-källan tillagd. |
| Valpkurs — digest 2 | CHANGES | Inget universellt ålders-/vaccinationsintervall, men svaret beskrev inte tydligt lämpligt tempo. Reviderad copy nämner deltagande i lugn takt och belöningsbaserade metoder. |

De två tidigare payloads gav totalt **CHANGES** och är ersatta. Exakt aktuell payload SHA-256 `170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288` fick totalt **PASS WITH CONDITIONS** den 2026-10-28; alla fyra FAQ-poster fick PASS och inga copyändringar återstår. Dog Expert läste koordinatorns källsammanfattningar men öppnade inte själv URL:erna. Koordinatorn öppnade Dogs Trust-sidan direkt 2026-10-28. RSPCA-sidans brittiska kurs-/vaccinationsålder används inte som svensk rekommendation. Detta är inte veterinärsignoff eller ägarens publiceringsbeslut. Bundle-statusen är därför `reviewed` med `dog_expert_status=passed_with_conditions`; enskilda versioner ligger kvar som `draft` i JSON och SQL-importen skapar dem som opublicerade `reviewed`-rader.
