# UX-spec — ägarfeedback 2026-10-19 v15

## A — Rasfält

I både skapa hundprofil och redigera hundprofil ersätts den långa listan med ett enda kompakt TextInput-rasfält. Fältet visar vald ras eller Välj ras när det är stängt. När det fokuseras öppnas en begränsad dropdown direkt under samma fält; det går att välja ett alternativ i listan eller skriva sökningen i just det fältet. Sparat ras-ID hålls separat från sökutkastet: fokus på ett valt rasfält nollställer utkastet och visar katalogen, så första tecknet söker från tomt i stället för att läggas till rasnamnet. Det finns ingen separat sökruta och ingen modal. En tom sökning visar katalogalternativen; text filtrerar endast serverhämtade BreedOption-objekt lokalt. Etiketten är presentation, ID är sparat värde. Stängning, utanförtryck, Escape eller Android-back utan nytt val kastar bort söktexten och behåller föregående val. Skapaflödet startar utan valt ID; detta följer ägarens aktuella instruktion att implementera planen och ersätter den äldre Blandras-defaulten för nya hundprofiler. Uppdatera befintlig picker-källassertion till inline-fält/dropdown samt det befintliga standardvärdestestets namn/assertion så att ett giltigt ras-ID måste väljas; inga nya tester eller sviter. Redigeringsflödet visar befintlig ras även när den saknas från katalogen enligt nuvarande varningskontrakt.

Pickerkomponenten återanvänds mellan båda formulären. Dropdownlistan har begränsad höjd, minst 44 pt rader, tangentbord-/fokus- och tomtillstånd samt skärmläsarsemantik. Den får inte visa hela katalogen som en lång sida eller lägga en omodifierad vertikal FlatList inuti formulärets aktiva ScrollView. Lösningen ska hålla scrollning och korta skärmar användbara. Formens save/readback/kennel/account-lifetime guards behålls.

## A-uppföljning — visuell kant på rasfältet

Den separata korrigeringen efter A:s v12-checkpoint tar bort den vita innerrektangeln som fick kontrollen att se ditlagd ut. Det enradiga sökfältet förblir transparent och utan egen ram; den gemensamma yttre containern äger bakgrund, grön kant och klippning. Dropdownkanten ligger direkt mot fältet. Sökning, val och datakälla ändras inte. Public/review-bevis ska visa skapa och redigera, relevanta viewportar och 140 % proxy. RN Web-fixturen använder lokala syntetiska alternativ; produktionsflödet hämtar `breeds.id,name` genom `fetchBreeds` från Supabase. Native rendering och enhetstangentbord är NOT TESTABLE. Fokuserad QA PASS och oberoende Reviewer PASS är sparade; köspårbarhet kompletteras innan tasken stängs.

## B — Övningsblad

Öppnat övningssteg visar den befintliga assets/images/puppy-training.png över innehållet, med tokens för form och spacing. Därefter kommer faktisk ordinal från stegets index i den visade `steps`-arrayen plus ett, övningens titel, hela instruktionen och befintlig anpassningsnotis/åtgärd. Bilden är dekorativ och göms i tillgänglighetsträdet. Innehåll och progress ändras inte. Hemmets fortsättningskort behåller den kompakta breddtokenen för miniatyren, beskär med `cover` och fyller kortets vänster-, över- och underkant; kortet klipper bilden inom yttre radier och högertexten behåller tokenpadding.

För reproducibel jämförelse sparas ägarens detaljbild i `docs/design/evidence/vision-rev02/training-detail-2026-10-19/reference/owner-training-detail.jpg`. Eviderna ska omfatta: nästa genomförbara ofärdiga steg med full instruktion och åtgärd; låst senare steg med förkravstext/inaktiverad åtgärd; genomfört steg med Avmarkera; programinformation utan övningsbild/ordinal; samt väntande/inaktiverad åtgärd och felåterkoppling. Vid 375×667 och 140 % textproxy ska instruktion och åtgärd för genomförbart och genomfört steg nås genom bladets vanliga scrollning. Fortsättningskortet fångas normalt, med lång titel och vid 140 % textproxy; den högre helbildsbeskärningens täthet bedöms separat.


Ägarens tillägg efter v14, 2026-10-19: rekommendationskorten ska ha samma fasta höjd i logiska punkter över skärmbredder och oavsett titelns längd. Grundhöjden är 260 pt vid systemets standardtext; den skalar med systemets fontScale för att ge större systemtext utrymme. Korttiteln visas på högst tre rader, medan hela programnamnet behålls i knappens tillgängliga namn. Implementeringen använder HeroCard och en gemensam träningstoken. Opt-in-egenskapen fill används endast av rekommendationskorten i PublishedTrainingScreen; korten i komponentgalleriet behåller sin naturliga höjd. Architect APPROVE och Critic PROCEED för den avgränsade v15-korrigeringen är sparade i arbetsrapporten.

## C — PDF

Knappens avsedda namn är Visa PDF. Ett tryck ska öppna PDF:en, utan att direkt dela. Dela och Stäng väljs efter att dokumentet visas. Ändra inte snapshots, readiness, PDF-fält eller vilken data som väljs. Plattformarnas faktiska kontroller, extern Android-hantering, unsupported state och cachelivscykel saknar ännu godkänt kontrakt; ingen kod ändras innan de är beslutade och oberoende granskade.

## Bild 2 — hundval

Ingen hundväljarskärm finns i aktuell produktkod. Kontot kan ha en hund och profildata innehåller inte foto. Screenshot-önskemålet kräver därför ett tydligt scopebeslut om hundantal och bildkälla innan UI/data ändras.

## Visuell verifiering och status

UI-bedömning följer docs/design-rules.md §14. Syntetiska RN Web-skärmbilder styrker endast sina vyer. `vision_rev02.jpg` finns i repo-roten; jämför fortsättningskortet sida vid sida med Panel 6. Jämför detaljbladet med den sparade ägarreferensen ovan. Om filen inte kan läsas ska just den detaljjämförelsen rapporteras NOT TESTABLE. Webbproxy styrker inte native Dynamic Type eller VoiceOver. Ingen visuell helhetsacceptans påstås utifrån fungerande interaktion ensam.

## Ägarens efterföljande roadmap — statusbild 2026-10-19

Det här avsnittet lägger in arbetsordningen från ägarens bifogade statusbild.

- **Paket 3 — Sök i Kunskap:** visa publicerade artiklar som redan filtrerats för den aktiva hunden. Träffar, tomt resultat, laddning och fel ska ha tydliga lägen. Behåll befintlig åldersfiltrering och publiceringsregler.
- **Paket 4 — Dra för att uppdatera:** inför på Hem och Logg, samordnat med automatisk uppdatering. Skydda vyn mot gamla svar efter byte av hund eller konto.
- **Paket 5 — Tom-, laddnings- och felåterkoppling:** börja med Hem och Logg och fortsätt sedan med Kunskap och Träning. Fel ska ha ett eget synligt läge och okänd data ska inte visas som noll.
- Statusbilden anger att Paket 2a och 2b är implementerade, committade och pushade. VoiceOver, större systemtext, reducerad rörelse och tangentbord där relevant återstår som manuella iPhone-kontroller; de blockerar inte start av Paket 3.
- Övergångsanimationen mellan huvudflikarna är ett separat, blockerat arbete i lokal ocommittad ändring. Den väntar på visuell kontroll och kontroll av reducerad rörelse.

Arbetsföljd enligt statusbilden: Paket 2a/2b → Paket 3 → Paket 4 → Paket 5. Paketens exakta task- och köposter fastställs när respektive paket tas upp.
