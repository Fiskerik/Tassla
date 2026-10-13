# UX-spec — rev02 för befintliga skärmar efter Hem

Datum: 2026-10-13 · Version: 3 · Status: godkänd inom VISION-R02-3 v6.1; R02-3B implementerad och inväntar oberoende granskning

## Användarmål

En ny hundägare ska känna igen Tasslas lugna, varma visuella språk när hen lämnar Hem, men fortfarande förstå skillnaden mellan att logga en händelse, träna, läsa kunskap, hantera hälsa och sköta konto. Färg, form och bild hjälper till att skilja uppgifter åt utan att ändra vad knappar gör eller vad data betyder.

## Inträde och navigation

- Fem huvudflikar är oförändrade: Hem, Logg, Träning, Kunskap, Mer.
- Logg, Träning och Kunskap är huvuddestinationer. Hälsa, Tassla-pass, profil, notiser och konto ligger kvar under Mer.
- Detaljskärmar använder samma tillbakahandling och återvänder till sin befintliga föräldervy. Ingen ny destination skapas.
- Skärmar med egna underflikar behåller sina datakällor. Träningens segmentnamn matchar panel 6: `Rekommenderat`, `Alla övningar`, `Mina`. Rekommenderat bygger på det befintliga ålders-/rasurvalet; Alla övningar listar alla redan hämtade steg; Mina begränsas till program med bekräftade befintliga completion-markeringar. Ingen favorit-/saved-modell tillkommer.

## Lyckat flöde per huvudvy

### Logg

Ägaren ser dagens datum, kan bläddra till föregående/nästa lokala dag och ser bara valda dagens händelser i tidslinjen. Äldre sidor läses via befintlig paginering tills den äldsta inlästa händelsen ligger på en lokal dag strikt före vald dag, eller historiken är uttömd; då är även en tom dag komplett. Vid läsfel förblir dagen ofullständig och befintligt återförsök finns kvar. Ingen framtida dag väljs. En synlig snabbvalsknapp fortsätter att logga aktuell tid med ett tryck; om ägaren står på en äldre dag återgår vyn till idag när snabbvalet trycks. Ägaren ser `Sparar…` på rätt post och får först efter bekräftad skrivning diskret positiv återkoppling med befintligt ångra. Tidslinjen gör det lätt att hitta och öppna en post för rättning. `Fler` och ordningshantering är tydliga men underordnade snabbregistreringen. Idag/Översikt-segmentet visas först när Översikt leder till den fungerande Insikter-vy som kontraktet kräver.

### Träning

Ägaren ser vilket publicerat program som visas, läser instruktionen för nästa tillåtna steg och kan välja att markera genomförandet. Status ändras först vid bekräftad progress. Återställning är separat/destructive. Reviewmaterial förblir märkt och tillfälligt.

Panelens `Passar just nu ({ålder})` visar endast den ålder som redan används i programurvalet. Public-lägets `Mina` visar bara program med minst en bekräftad befintlig progressrad; annars visas ett ärligt tomt läge. Reviewläget visar tillfälliga lokala reviewmarkeringar, inte server-sparad progress, och behåller sin märkning. `Fortsätt där ni var` kräver verklig public progress och öppnar samma version/steg som nuvarande resa.

### Kunskap

Ägaren väljer en av de fyra befintliga sektionerna, öppnar en verklig artikel/FAQ/checklista och kan hitta källor eller ändra en befintlig checklistmarkering. Läsvyn visar hela copy och källor. Detaljens tillbakahandling återgår till en relevant Knowledge-sektion.

### Stödskärmar

Mer är en grupperad meny till befintliga destinationsvyer. Hälsa och planering skiljer tydligt mellan registrerat, planerat och utfört. Profil, konto, notisval och PDF-export behåller sina egna bekräftelser, formulär och återhämtningsvägar.

## Fel-, laddnings-, tom- och osäkra lägen

- Återanvänd respektive skärms befintliga tillståndstext och komponent. Ett läsfel är aldrig ett tomt resultat eller noll.
- Pending/failed/unsure förblir nära aktuell handling. Behåll formulärvärden och idempotens/UUID-regler.
- Exportfel, permission-denied, callbackfel, konto-/hundbyte, konflikt och delete-bekräftelser måste vara läsbara och nåbara i sina befintliga resor.
- När datakälla eller publicerat innehåll saknas används den nuvarande sakliga fallbacken. Inga exempelpresenteras som publicerade personliga resultat.

## Tillgänglighet och layout

- Skärmbredd 375 och 430 pt, kort höjd 667 pt, svensk copy med längre texter och 140 % text.
- Naturlig scroll på alla listor och formulär; inget innehåll göms bakom bottennav eller safe area.
- Tryckytor minst 44 pt; textkontrast 4.5:1 och kontroll-/statuskontrast 3:1; semantik annonserar vald sektion, status, värde och handling.
- Färg är aldrig enda bärare av kategori, status eller vald vy. Ikon och synlig text kompletterar färg.
- Reducerad rörelse respekteras. Ingen ny loop eller dependency.

## Visuell utgångspunkt och gränser

Gemensam gräddvit canvas, varma nästan vita kort, rundade men tydliga grupper, systematisk rubrikhierarki och dämpad relevant metadata. Färgerna är semantiska för skärmen: exempelvis blå kiss/vatten, brun avföring/mat, lila sömn i Logg; Träning visar bilder och progress; Kunskap visar redaktionella hundbilder och läsning. Hemmets destinationstiles är inte ett generellt färgschema för andra vyer.

Panel 5–7 i `vision_rev02.jpg` styr Logg/Träning/Kunskap. Loggs datumrad använder verklig lokal händelsedag och befintlig sidladdning; den skapar ingen ny datakälla. Stödskärmar saknar egen panel och använder närmast besläktad mönsterfamilj från panelerna plus befintligt beteende. Ingen nionde panel eller ny funktion modelleras.

## Mått på framgång

1. Ägaren kan hitta samma befintliga handlingar som före omdesignen.
2. Färg och gruppering hjälper till att särskilja huvudsyftet utan att felaktigt signalera slutförd/planerad hälsa, publicerat innehåll eller personlig hundidentitet.
3. Vid visuell jämförelse syns panelens ordning, färgfördelning, typografi, kort-/radformer, bildandel och innehållstäthet.
4. Samtliga slice-rapporter skiljer uttryckligen på visualitet, användarresa och produktionsdata; ej renderade/lokalt otillgängliga tillstånd får status NOT TESTABLE.
