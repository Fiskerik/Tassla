# Svep för veckoremsa och huvudflikar — UX-spec v8

Datum: 2026-10-13 · Status: Architect APPROVE och Critic PROCEED för exakt v8.

## Användaruppgift

Som hundägare vill jag kunna bläddra mellan veckorna på Hem och svepa mellan huvudflikar, utan att en öppen artikel eller checklistdetalj stänger sitt eget läsflöde.

## Oförändrat från v5

- Veckoremsan är en ändlig, horisontell lista från vecka 0 till aktuell ålder +12. Vänster visar senare veckor; höger visar tidigare. Den aktuella åldern och sparade uppgifter ändras inte.
- Huvudordningen är Hem → Logg → Träning → Kunskap → Mer. Vänstersvep går framåt, högersvep bakåt, utan rundgång.
- Veckoremsan, Kunskapens/Träningens/Hälsas horisontella `Tabs` och Loggs anteckningsfält äger sina egna gester från touch-start till end/cancel.
- Ingen ny haptik, dependency, innehållslogik, historik eller dataskrivning.

## Korrigering för Kunskap

- Kunskapens artikelvy och checklistmallens detaljvy är underordnade vyer. Med någon av dem öppen ignorerar huvudnavigationen horisontella sidgester; användarens befintliga tillbakahandling fungerar som tidigare.
- När användaren återgår till Kunskapens översikt återaktiveras huvudsidgesten. Om Kunskap lämnas via bottenmenyn medan en detalj är öppen ska detaljflaggan nollställas när `KnowledgeScreen` avmonteras; när användaren går tillbaka ska översikten visas med fungerande sidgest.
- Kunskapsöversikten och FAQ:s inline-expanderade svar är fortsatt del av huvudfliken Kunskap och behåller huvudsidgesten.
- `KnowledgeScreen` meddelar `ProductWorkspace` om artikel-/checklistdetaljens tillstånd. Ändringen är enbart navigationstillstånd och introducerar ingen beständig data.
- Om användaren trycker på den redan aktiva Kunskap-fliken medan en detalj är öppen behålls detaljen och gestspärren. Valet ska inte nollställa parent-flaggan medan den lokala detaljvyn är kvar.
- Varje utträde från Kunskap till en annan huvudflik rensar artikel-/detaljfokus, oavsett om användaren byter med bottenmenyn eller sidgest.
- Återinträde till Kunskap via bottenmeny eller sidgest visar översikten och aktiverar huvudsidgesten; stale fokus får inte återöppna en tidigare artikel.
- Hemmets direkta guide-CTA är separat från main-tab navigation och måste bevara explicit valt artikel-id när den öppnar Knowledge.

## Acceptans och verifiering

Öppna artikel/checklistmall → sidgest byter inte huvudflik; tryck på aktiv Kunskap-flik → detaljen och sidgestspärren består; tillbaka → sidgest fungerar igen. Öppna checklistmall → bottenmeny till Hem → bottenmeny till Kunskap visar översikten och återaktiverar sidgest. Från översikten: svep till annan huvudflik och tillbaka till Kunskap; en gammal artikel återöppnas inte. Hemmets direkta guide-CTA öppnar fortsatt sitt valda innehåll. FAQ-expansion, segmenterade tabs, veckoremsa, scroll, tryck och Loggs textfält behåller kontraktet. Körningarna anges i plan v8. Browser/native-svep och visuellt underlag får endast anges som PASS efter faktisk interaktion; annars skriv NOT TESTABLE.

## Spårbarhet

v5 QA-fynd: `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v5.md`. v7 QA-fynd: `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v7.md`. Denna version utökar inte användarens ursprungliga scope; den preciserar aktiv-flik-beteende och reset över båda navigationsvägarna.
