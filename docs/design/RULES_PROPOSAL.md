# Förslag till designregeländringar – FIGMA-DS-02

Datum: 2026-10-08. Status: **FÖRSLAG**, inte ändrad eller antagen policy. Kanoniska docs/design-rules.md är orörd. DS-02 beställer följande i Figma; appändringar kräver ett separat implementeringsuppdrag.

| Avsnitt | Föreslagen precisering | Skäl |
|---|---|---|
| §3 Radius | Behåll sm=8, md=14, lg=20; definiera full=999 endast för cirkulära chips/bockar/pills. | DS-01 har redan radius/full; policyn beskriver tre generella nivåer. Full ska inte bli en godtycklig kortradie. |
| §3 Typografi | Lägg display=28/36 Bold för stora sidrubriker och hero. Label=16/24 Bold, Body=16/24 Regular. Behåll max tre storlekar i varje sammansatt vy. | DS-02 begär Display och tydlig viktsskillnad Label/Body; en Foundations-tavla får visa hela skalan. |
| §4/§5 Layout | Komponentinstanser fyller förälderns tilldelade bredd i auto layout; tvåkolumnsrutor fyller varsin halva efter gap/insets. Kontrollhöjd är minmått när text behöver omflöda. | Undviker textstyrd smal layout och klippning vid 360/430 samt större text. |
| §4 AppBar | Dokumentera Home/Back/Close, normalhöjd 56, centrerad sidtitel i Back/Close och minst 44×44 för stödhandling. Home behåller varumärket till vänster. | Begärd sheet-stängning och balans mellan titel/ikoner utan att ändra målbildens Home. |
| §4 Tabs | Aktiv etikett Bold + primary + fullbrett understreck; inaktiv Regular + textSecondary; minst 44 hög, 12 horisontell padding och gap 8. Fyrfliksrad scrollar horisontellt i 360-viewport. | Etiketterna ska vara hela; flikraden får vara bredare än viewporten och stor text får aldrig krympas. |
| §4 QuickLogTile | Minhöjd 104, chip Large 44 överst, centrerad etikett under, padding 12 och två kolumner. | Tydlig hierarki och användbar tryckyta. |
| §4 Progress | Kontinuerlig track/fill; Value=0/40/60/100 i Figma, Label-text. Koden använder procent av trackbredden när den senare implementeras. | Ersätter fem fasta segment; text beskriver samma värde som fill. |
| §4 Hero | Varm gradient och liten tass som tydlig platshållare när foto saknas; mörk bottengradient med ≥4,5:1 för vit text över hela textområdet; separat Pressed. | Ingen platt grå ruta eller dekor som utges för ägarens hundfoto. |
| §4 Gemensamma komponenter | Lägg Field, CheckboxCard, Dialog, BottomSheet, EmptyState, SectionHeader och StatusBadge till komponentförteckningen; specificera varianter i DS-02-planen. DayStrip/DogCard är budgetberoende Figma-komplement. | Gemensamma mönster för formulär, bekräftelse, fel/tomt och sektioner; inget nytt produktscope. |
| §6 Button | Loading ersätter texten med en centrerad spinner i samma storlek; Icon får ellipsis-horizontal som radmenyexempel. Destructive förblir röd text/kontur. | Undviker överlapp och felaktig handlingshierarki. |
| §7 Ikoner | Lås de beställda Ionicons-namnen enligt DS-02, kontur/fylld-par i BottomNav, 24-rutnät/~2 linje/rundade ändar. Egen tredelad Poop-vektor i samma stil, tydligt märkt som egen. | Samma kategori får samma geometri i alla konsumenter; ingen emoji. |
| §8 Toast | Success Sparat, Error Kunde inte spara + Försök igen, Neutral Påminnelsen är avstängd; Action=None/Undo/Retry. Minhöjd 48, padding 16/12, radius md, åtgärdsyta minst 44. | Rätt återhämtning och svensk copy. En designinstans av Ångra bevisar inte att appåtgärden fungerar. |
| §10 Kontrast | Text ≥4,5:1; betydelsebärande ikoner/kontrollgränser ≥3:1. Behåll dekorativ border men lägg controlBorder som semantisk alias till befintlig mörk token för fält/checkboxar vid behov. Kontrollera gradient/opacitet efter färgblandning. | Befintliga ljusa border/dangerBorder klarar inte 3:1 som ensam kontrollsignal; fg/bg-paren klarar textkravet. |
| §14 QA | Kräv instanstest vid 360/430, Sandbox 390 och stor text; samlad audit och separat renderingsbedömning, minst tre förbättringsförslag och högst två rättningar. Designbibliotekets variantmatris undantas från skärmens max-en-primary-regel; varje sammansatt flödesexempel omfattas. | Biblioteket måste visa flera primary-varianter utan att exemplen blir produktionsskärmar. Saknade skärmdumpar förblir NOT TESTABLE. |

StatusBadge visas bara vid avvikelse: Sparar…, Väntar på uppkoppling eller Kunde inte spara. ListRow visar aldrig SPARAD som normalläge. Färgjusteringar, nya mått och scrim styrs av tokens; inga lokala undantag eller appberoenden införs här.

Avvikelser från äldre exempel är uttryckligt beställda: restaurant-outline för Mat, bug-outline för Avmaskning och medkit-outline för Veterinär enligt DS-02. De är inte en tyst ändring av appen. Placeringen av Promenad/Vaken utöver fyra snabbloggar i produktionsappen avgörs inte i detta Figma-paket.
