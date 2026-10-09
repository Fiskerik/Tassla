# HEM – UX-specifikation

## User goal

På några sekunder ska hundägaren förstå vad som är relevant idag och kunna välja nästa lilla handling för hunden.

## Entry

Hem öppnas efter inloggning och via Hem i den befintliga bottennavigationen. Appbaren visar Tassla och öppnar befintliga notisinställningar. Ingen ny navigation eller ny data introduceras.

## Happy path

1. Appbaren etablerar varumärket och ger tillgång till notiser.
2. Hundkortet visar hundens vänliga platshållarbild, namn, ålder och ras.
3. Veckoremsan orienterar i veckan och markerar dagens vardagskolumn.
4. Listan “Idag för [hundnamn]” visar måltid, promenad, träning, vila och tips.
5. Hundägaren väljer en rad för att fortsätta i befintlig Logg, Träning eller Kunskap.

## States

- Loading: innehålls-/tipsraden visar skeleton medan publicerat innehåll hämtas.
- Ready: tipsraden visar första publicerade tipset när det finns.
- Empty: tipsraden behåller sin plats men förklarar lugnt att inga nya tips finns.
- Error/offline-kompatibelt: tipsraden och ett återförsöksläge säger att tipset inte kunde visas och erbjuder “Försök igen”. Den befintliga content-state-modellen har ingen separat offline-flagga, så ingen ny state- eller datamodell läggs till.
- Profile loading/error: befintligt överordnat flöde behåller sina nuvarande profileringsstates; denna revision ändrar inte dataflödet.

## Feedback

Rader och notisknapp har befintlig pressed/disabled-feedback från komponentbiblioteket. Ingen “Sparat”-feedback läggs till eftersom Hem inte skriver data. Inga drift- eller tekniska statusetiketter visas i normalvyn.

## A11y

Appbaren är header med namngiven notisknapp. Hundkortet har en sammanfattande label. Veckoremsan exponeras som en orienterande tablist med markerad dag. Varje ListRow har tydlig label, kategoriikon och chevron; tryckbara rader exponeras som knappar. Färg är inte ensam bärare av information. Befintliga tokens och touch-minimum återanvänds.

## Avvikelser från målbild

- Målbildens hundfoto ersätts av den befintliga vänliga platshållaren eftersom Home-modellen inte har något fotofält.
- Rastexten använder befintligt `breed_id`; Home har ingen upplöst raslabel i sitt nuvarande dataflöde.
- Målbildens exempeldata för tider och aktiviteter finns inte som schema. Raderna använder därför lugna, icke-falska beskrivningar och befintligt nästa träningssteg/tips där det finns.
- På helg visas fredag som aktiv vardagskolumn för att behålla målbildens Mån–Fre-remsa.
- Visuell verifiering: NOT TESTABLE tills skärmdumpar finns.
