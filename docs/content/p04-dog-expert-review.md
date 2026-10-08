# P04 dog_expert förgranskning — 2026-10-06
> Historisk arbetsgranskning. Erik bekräftade 2026-10-08 att MVP-bundlen är godkänd och att hundexperten verifierat den. Bekräftelsen och omfattningen finns i `mvp-content-approval-v1.md`; anteckningarna nedan beskriver den tidigare reviewrundan.
Faktisk oberoende read-only review p04_dog_expert, enligt konfigurerad roll gpt-5.6-sol medium. Verdict NEEDS CAVEAT före publicering, inget direkt UNSAFE. 11 items, 30 claim-trace-påståenden och 9 steg granskade. Mänsklig sakgranskning väntar. Detta dokument är reviewunderlag, inte publiceringsapproval.
## Källor verifierade
AVSAB Humane Dog Training 2021 och aktuella positionssidan; RSPCA puppycare och kroppsspråk; Blue Cross separation anxiety. Äkta organisationsriktlinjer/positionsdokument, inte primär empirisk forskning. Appguider jämförda med citerad repositoryimplementation. Tillägg: https://avsab.org/wp-content/uploads/2024/12/Puppy-Socialization-Position-Statement-FINAL.pdf för socialiseringsdefinition/individanpassning.
## Claim-resultat
OK: bhc-quiet-rest, bhc-familiar-item, fw-rest, fw-positive-intro, fw-reward, dl-events, dl-history, dl-no-interpretation, hg-reward, hg-help, ec-gradual, ec-manage, ba-safe-area, ba-backoff, wh-record, wh-limit, wh-vet, hr-event, hr-limit, hr-vet, hp-method, ep-positive (lägg starkare AVSAB-socialiseringkälla), ep-management, bp-positive-area, bp-gradual.
NEEDS CAVEAT: hg-discomfort, hp-stop, ep-signs: kroppsspråk bedöms i sammanhang och flera signaler tillsammans; enstaka signal inte diagnos. Nämn stelhet där steget använder det. ba-help och bp-support: Blue Cross stödjer kvalificerad beteendehjälp, veterinärhänvisning kräver AVSAB-H-tillägg. Vid kvarstående/kraftig oro kontakta veterinär först; bedöm medicinska faktorer och hänvisa vid behov till kvalificerad belöningsbaserad beteendehjälp.
## Brödtext och steg — konkreta korrigeringar
- Byt rubriken valpens ja till Trygg hantering bygger på frivillighet; undvik säkert samtyckespåstående.
- Lägg kontextcaveat i handling-guide/handling-program/environment-program och handling steg2.
- Bestäm vilka vuxna som ansvarar är osourcat: gör tydligt praktiskt förslag Planera gärna vem som ansvarar…
- Håll de första dagarna förutsägbara stöds RSPCA-P men behöver egen trace eller koppling till rutinclaim.
- Kroppsspråk är individuellt och enstaka signaler säger inte allt stöds RSPCA-B men behöver egen trace.
- Introducera en ny vardagssak i taget osourcat: skriv hanterbara steg eller tillägg socialiseringkälla.
- Socialiseringsdefinition: AVSAB-S som direktstöd; tryggt, positivt, gradvis och individanpassat, hunden behöver inte hälsa på allt.
- Professionell hänvisning även environment steg3: veterinär först vid återkommande/kraftig/svår oro, sedan vid behov kvalificerad belöningsbaserad beteendehjälp. Lägg AVSAB-H-ref.
Steg OK: handling1 frivilligt närmande och3 fortsattkontakt utan fasthållning, environment1 observation på avstånd och2 frivilligutforskning, alone1 positivviloplats,2 litetavstånd och3 kortursikte/backoff. NEEDS CAVEAT handling2 och environment3 enligt ovan.
## Slutgrind
Behåll draft och pending review tills korrigeringar införda och förnyad faktisk specialistreview; mänsklig reviewerstatus förblir pending tills Eriks sakkunniga faktiskt granskat. Needs human/vet review: yes. Ingen klinisk kalender, dos, aversiv metod eller behandlingsgaranti hittad. Generellt och individuellt belöningsbaserat innehåll med stopp/backoff är i övrigt rimligt.

## Förnyad faktisk expertreview — correction1
NEEDS CAVEAT, inte PASS. Fyra kvarvarande detaljer: handling-guide saknar synlig kroppsspråkscaveat trots trace; before-homecoming Bestäm-text ännu inte praktiskt förslag; socialiseringkälla har missvisande 2024-id trots copyright2008; 8–null-program och 0–null-appguider säger fortfarande valpen trots äldre fallback. Correction2 beställd exakt body+trace+steps, yearless källa-id och hunden/hundens. All-age ensamhetskälla faktiskt läst 2026-10-06: https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/leftalone (Training your dog to be left alone). Stöd gradvisa individuella steg, belöning, backoff och veterinärhänvisning; inga UK-tidsgränser eller garantier importeras. Förnyad slutreview återstår; mänsklig reviewer pending.
