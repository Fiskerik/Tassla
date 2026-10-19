# UI-08 visuell QA

Datum: 2026-10-20
Status: **UI-08 v5-matris och oberoende QA PASS; Reviewer väntar.** Samtliga footeretiketter är enradiga utan horisontellt overflow vid 360/430 px och fontScale 1.0/1.3/1.4. Full visuell acceptans mot rev02 är fortsatt öppen.

## Metod och begränsningar

Skärmarna renderades från aktuell produktionskod med syntetisk Luna-fixtur i en tillfällig React Native Web-harness, headless Chrome, safe-area-inset 0 och en viewport på 360×844 respektive 430×844. 140 %-bilderna förstorar renderade textnoder och deras radavstånd efter layout. Det är ett reproducerbart webbstresstest, inte iOS Dynamic Type eller Androids native font scaling. Figma Toast-komponenten öppnades inte på nytt i denna körning; tidigare komponentmetadata finns dokumenterad i `docs/tasks/dev/ui-08.md`.

## Skärmbilder

| Vy | 360×844 | 430×844 | 140 % text, 360×844 |
|---|---|---|---|
| Hem | [PNG](home-360x844.png) | [PNG](home-430x844.png) | [PNG](home-360x844-font140.png) |
| Kunskap | [PNG](knowledge-360x844.png) | [PNG](knowledge-430x844.png) | [PNG](knowledge-360x844-font140.png) |
| Mer | [PNG](more-360x844.png) | [PNG](more-430x844.png) | [PNG](more-360x844-font140.png) |
| Träning | [PNG](training-360x844.png) | [PNG](training-430x844.png) | [PNG](training-360x844-font140.png) |
| Toast: sparat | [PNG](toast-success-360x844.png) | [PNG](toast-success-430x844.png) | [PNG](toast-success-360x844-font140.png) |
| Toast: kunde inte spara | [PNG](toast-error-360x844.png) | [PNG](toast-error-430x844.png) | [PNG](toast-error-360x844-font140.png) |

Rev02-jämförelserna visar både målpanel och aktuell 360 px-rendering i samma bredd:

- [Hem mot rev02](home-rev02-comparison.png)
- [Träning mot rev02](training-rev02-comparison.png)
- [Kunskap mot rev02](knowledge-rev02-comparison.png)

## Historisk v4-verifiering — 2026-10-19/20, ersatt av v5 nedan

Resultaten i detta avsnitt beskriver v4-läget före den adaptiva breddändringen. De ska inte läsas som aktuell status; se v5-matrisen nedan.

- Den aktiva, fetstilade footerfliken **Träning** radbröts vid 140 % när nav-raden hade `tokens.spacing.xs` som gap. Planens tillåtna fallback provades: endast nav-gapet togs bort. Varje flik får då 72 px vid 360 px och den aktiva etiketten ryms på en rad; 430 px ger 86 px per flik. Minsta mätta footer-mål är 72×58 px i normal text och 72×104 px i webbstresstestet.
- Footer-spacingens gap utgår därför; flikarnas separering sker med lika breda klickytor, samma ordning och aktiv/inaktiv ikon-/textstil. Ingen fontstorlek eller tryckyta krymptes.
- Oberoende QA bekräftade att aktiv **Träning** nu är en rad, men att **Kunskap** fortfarande bryts till `Kunska` / `p` i samma 360×844/140 %-stresstest. Queue-acceptansen kräver enradiga etiketter för alla flikar; den delen är därför **inte godkänd**. Se [Träning 140 %](training-360x844-font140.png) och [Kunskap 140 %](knowledge-360x844-font140.png).
- Normalvy, sparat-toast och fel-toast renderades. Loading, tom, partiell data, native safe area, native reducerad rörelse och skärmläsare ingick inte i den här fångsten.

## UI-08 v5 footer-matris — 2026-10-20

Den tillfälliga headless RN Web-harnessen injicerade `fontScale` till `useWindowDimensions()` **före React-renderingen**. För 1.3/1.4 skalades även renderad text och radavstånd före mätning/skärmbild. Samtliga fem aktiva flikar testades vid 360×844 och 430×844 samt skalorna 1.0, 1.3 och 1.4: **30 renderingar, 150 etikettmätningar, inga radbrytningar, inget horisontellt overflow och inga tryckmål under 44×44 px**.

Vid fontScale 1.0 är flikarna lika breda: 72 px vid 360 och 86 px vid 430. Vid 1.3/1.4 blev bredderna cirka 62.4 px för Hem/Logg/Mer och 86.4 px för Träning/Kunskap vid 360; vid 430 blev de 74.5 respektive 103.2 px. Matrisens separata axelminima är **62.39 px i bredd** och **58 px i höjd**; de kan komma från olika celler. Detta är webbreferenser, inte fysiska pt-mått. Fulla mått och radresultat finns i [JSON-matrisen](footer-matrix-2026-10-20.json); alla 30 skärmbilder heter `footer-*.png` i denna katalog.

`fontScale`-injektionen är en testshim och post-layoutskalningen ett RN Web-stresstest. Resultatet verifierar inte iOS/Android Dynamic Type, fysisk punktstorlek, safe area, VoiceOver/TalkBack eller reducerad rörelse; de kontrollerna förblir NOT TESTABLE utan native-enhet.

**Oberoende QA PASS 2026-10-20 för den avgränsade v5-footergrinden:** QA verifierade 30 renderingar/150 etiketter, enradiga labels, ingen horisontell overflow, lika breda flikar vid 1.0 och tryckmål på minst 44×44 px. **Reviewer väntar.** §14 #16–17 och native-kontrollerna förblir öppna; detta är inte ett fullständigt rev02- eller native-PASS.

## Checklista enligt `docs/design-rules.md` §14

| # | Resultat | Motivering |
|---:|---|---|
| 1 | Ja | Hem-fixturen visar en tydlig huvuduppgift och separata genvägar utan två konkurrerande primärknappar. |
| 2 | Delvis | Flikarna har samma höjd, ikon-/textstil och lika bredd vid normal text. Vid fontScale 1.3/1.4 får Träning/Kunskap medvetet större bredd för att bevara fulla enradiga etiketter. |
| 3 | Ej tillämpligt | De fångade vyerna har ingen raderingshandling. |
| 4 | Ja | Hemraderna visar namn/handling och fördjupningsväg utan upprepade Ändra/Radera-länkar. |
| 5 | Delvis | Sektioner och yttre marginaler syns; safe area med verkligt device-inset är inte verifierad. |
| 6 | Delvis | Bottennav och färg-/typografitokens återanvänds; v5 använder godkända komponentlokala flexvikter för adaptiv bredd vid större text, inte nya färg- eller fontmått. |
| 7 | Ja | Ikonerna kommer från Ionicons i fångade vyer; inga emoji används som UI-ikoner. |
| 8 | Delvis | Hem visar blå, grön och lila genväg samt varm tipsaccent. Numerisk kontrastmätning saknas. |
| 9 | Ja | Etiketterna Hem, Logg, Träning, Kunskap och Mer motsvarar respektive destination i källan. |
| 10 | Ja | Bock visas endast för avslutad dagsrutin eller bekräftad sparning. |
| 11 | Ja | Hem-fixturen innehåller en informations-/tipsruta. |
| 12 | Ja | Synlig copy är vardaglig svensk text och saknar intern driftcopy. |
| 13 | Delvis | Hierarkin fungerar i fixturen, men text-/bildandel och innehållstäthet avviker från rev02-panelerna. |
| 14 | Delvis | Normal-, sparat- och fel-läge finns. Loading, empty, partial och retry-interaktioner fångades inte här. |
| 15 | Delvis | Alla etiketter ryms i RN Web v5-matrisen; separata axelminima är 62.39 px bredd och 58 px höjd (de kan komma från olika celler, och är webbreferenser). Layouten växer vid 1.3/1.4. Native Dynamic Type, VoiceOver/TalkBack, reducerad rörelse och device-insets är NOT TESTABLE. |
| 16 | Nej | Jämförelsebilderna visar kvarstående skillnader i komposition, innehållstäthet, bildandel och kort-/filterstruktur mot rev02. |
| 17 | Nej | Bottenmenyn finns, men sidans rubrik-/filterhierarki i Kunskap och Träning motsvarar inte rev02-panelerna. |
| 18 | Ja | Hem använder hundens namn och porträtt; Kunskap och Träning visar hundrelevant innehåll. |

## Beslut

v5 korrigerar footerbredden med lika flikar vid normal text och extra flexutrymme för Träning/Kunskap vid större text. Den fokuserade 360/430 × 1.0/1.3/1.4-matrisen och den oberoende QA-grinden passerar; Reviewer för checkpointen återstår. Kriterierna 16–17 är fortsatt Nej mot rev02; native och ej fångade tillstånd är delvis eller NOT TESTABLE. Ingen full visuell acceptans hävdas.
