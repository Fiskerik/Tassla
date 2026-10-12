# DOG-RHYTHM-01 – UX-specifikation

Version 2.9, 2026-10-12. Ägarbeslut: generell Estimerad rutinvägledning före tio loggar; från tio loggar per kategori en hundanpassad rad märkt Rekommenderad. Copyjustering enligt korrigeringsplan 2; Architect APPROVE för exakt v2.9.

## Användaruppgift

Hundägaren vill se dagens loggade kiss-/bajsstatus och få enkel vägledning om ungefär när en utevistelse kan passa. Kortet visar aktuell hunds dagsfärska information samt historikbaserat mönster. Huvudhandling är att öppna Logg.

## Innehåll och algoritm

- Endast aktiv hunds sparade `pee`/`poop`-händelser används; exempeldata, andra hundar, dubbletter, ogiltiga/framtida tider och övriga kategorier utesluts.
- Kiss och bajs är separata. Dagsantal avser enhetens lokala kalenderdag; datumväljaren på Hem nedanför karusellen påverkar inte summeringskortet.
- Före tio giltiga loggar per kategori: etikett **Estimerad** och separata, villkorade källrader; appen drar ingen livsfas från ålder. Exakta UI-rubriker/källor och copy är: `Ny valp · första veckorna · Källa: Agria` — `Efter sömn, mat, lek – varannan timme när valpen är vaken.`; `Frisk, inaktiv vuxen · Källa: VCA` — `Kan ofta hålla sig 3–4 tim; aktiva hundar kan behöva rastas oftare.`; `Valp efter måltid · Källa: AniCura` — `Kan ofta behöva bajsa cirka 10–20 min efter mat.`; `De flesta hundar · Källa: VCA` — `Bajsar 1–3 gånger om dagen, ofta efter mat.` Rubrik/källa och text ligger i samma kategori. Varje förklarande brödtext får vara högst två rader vid 360 px.
- Från tio unika loggar per kategori inom rullande 30 × 24 timmar, som sträcker sig över minst två lokala datum och 24 timmar: behåll den med lägsta id vid samma tidsstämpel. Beräkna nio angränsande intervall. Uteslut intervall över 12 h kiss/36 h bajs och kräv minst åtta kvarvarande, annars fall tillbaka till Estimerad. Beräkna median och MAD. Medianen presenteras som **”Typiskt intervall mellan loggade händelser”** och beskriver endast registrerad historik. Om MAD överstiger 60 minuter visas medianen med texten ”Tiderna varierar”, men inget projicerat fönster; annars utgår fönstret från senaste händelse + median med halva bredden max(30 minuter, MAD), avrundat utåt till 15 minuter. Behåll etiketten **Rekommenderad** och gruppera tidsfönstret direkt med förklaringen **”Ungefärligt tidsfönster utifrån dina loggar.”** Förklaringen ska vara högst två rader vid 360 px. Om den inte ryms intill fönstret, dölj fönstret. Om fönstret passerat, ge bara historisk summering. Algoritmen är en deskriptiv uppskattning, inte validerad veterinär prognos.
- Hemkortets enda datagrind är `pottyHistoryState === ready` för den kompletta separata 30-dagarshistoriken. `logState` beskriver endast LogScreens feed på 40 rader och får aldrig göra summeringskortet färdigt. Saknat aktivt `dogId`, loading, error eller osäker färskhet döljer både dagsantal och uppskattningar; error får inte visa partiella resultat eller äldre cache som dagsfärsk.
- Hämta separat aktiv hunds `pee`/`poop` inom ett 30 × 24-timmarsfönster med ett fångat `now`, samma serverfilter (`dogId`, typer, `occurred_at >= now - 30*24h`, `occurred_at <= now`) för varje sida och deterministisk keyset-paginering på `(occurred_at DESC, id DESC)`. Stanna när en sida är kortare än `PAGE_SIZE`. Alla sidor måste lyckas innan resultat kan bli `ready`; fel eller abort lämnar ingen partiell lista.
- På Home visar queryfelet den korta texten **”Vi kunde inte visa översikten just nu.”** och en tydlig, skärmläsaråtkomlig **Försök igen**-knapp. Knappen startar en ny komplett query utan att navigera. Under retry visas loadingfeedback och knappen avaktiveras så dubbeltryck inte skapar överlappande queries. Att användaren öppnar Logg räknas inte som retry. Vid konto-/hundbyte rensas data direkt och gammal query avbryts/invalideras; en föråldrad request får inte skriva resultat efter en nyare generation. Refetcha den kompletta historiken vid foreground, lokalt dygnsskifte och efter bekräftad, osäker eller omläst loggmutation.
- Uppdatera lokalt datum vid foreground och nästa lokala midnatt. Kortets dagtal uppdateras från den nyhämtade kompletta listan; historisk datumväljare nedanför påverkar inte kortet.

## Tillstånd

- Loading: befintlig laddningsstil för Hemhistoriken, inga antal eller uppskattningar.
- Otillräckligt: separata Kiss/Bajs-rader med Estimerad rutinvägledning. Dagsantal och historiska tider visas endast när `pottyHistoryState === ready`.
- Personligt: kategorietikett, ungefärlig median av loggintervall och lokalt tidsfönster per kategori med tio loggar.
- Fel: inga gamla eller partiella antal/uppskattningar; visa **”Vi kunde inte visa översikten just nu.”** med **Försök igen**. Retry visar loading, kan inte dubbelstartas och stannar på Hem. Antal/uppskattningar förblir dolda tills hela nya queryn lyckas. Loggvägen är separat och inte en återhämtning av Hemkortets historik.

## Interaktion, a11y och målbild

Tryck på summeringskortet går till Logg. Skärmläsare får kategori, källa/etikett, historik och ungefärlig tidsuppgift. Befintliga komponenter och tokens används; inga nya interaktionsmönster eller animationer. Följ Tasslas kort-/spacing-/färgstil och §14-checklistan. Bild 1 är informationshierarki-inspiration; inga BabyJourney-texter eller visuella kännetecken kopieras.

## Scope och verifiering

Exakta paths och kommandon finns i `docs/tasks/dev/DOG-RHYTHM-01.md` v2.9. Ingen ny dependency, schemaändring, skrivning av loggar, notis eller medicinskt råd. Rendera 360/430 px och 140 % text i loading/otillräckligt/personligt/fel-läge; klicka retry och verifiera att Hem stannar kvar, loading visas, felet försvinner och klar vy återkommer. Saknad renderer betyder NOT TESTABLE.

## Review

V1 fick Architect CHANGES, Critic PROCEED WITH CHANGES och dog_expert UNVERIFIED. V2.5 fick Architect APPROVE, Critic PROCEED och dog_expert APPROVE av källcopy/inramning, med reservation att modellen inte validerar fysiologiskt behov eller prognosprecision.

### v2.9 copygranskning

- Architect: APPROVE för två-radersgräns och kontroller.
- Critic: PROCEED efter ändringar. Bad om vardagligare ”när valpen är vaken”, ”hålla sig” och ”utifrån dina loggar”. Dog_expert re-review APPROVE efter att VCA-ordet ”most” preciserats till ”De flesta hundar”; synlig etikett och brödtext hålls i samma källa. Tvåradsmätningen visade att den längre valpraden blev tre rader, så copy kortades till ”Efter sömn, mat, lek – varannan timme när valpen är vaken.”


## QA-fynd v2.7 och korrigering v2.8

Home fick bara de 40 senaste events från ProductWorkspace. Hemkortets count och 30-dagarsmönster kräver komplett kategorihistorik. v2.8 behåller separat keyset-paginerad kiss-/bajshämtning inom 30×24h och egen status; partiella sidor visas aldrig som dagsfärska. `pottyHistoryState` styr Hemkortet, retry är uttrycklig med vardaglig feltext och LogScreens 40-radersfeed förblir separat. Retry stannar på Hem, visar loading och dubblettskydd. Architect APPROVE och Critic PROCEED för exakt v2.8 är sparade i taskplanen. Architect APPROVE för den avgränsade v2.9 UX-/evidensrättningen är sparad i taskplanen.
