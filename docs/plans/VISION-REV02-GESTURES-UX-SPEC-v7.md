# Svep för veckoremsa och huvudflikar — UX-spec v7

Datum: 2026-10-13 · Status: Architect APPROVE och Critic PROCEED för v7.

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

## Acceptans och verifiering

Öppna artikel/checklistmall → sidgest byter inte huvudflik; tillbaka → sidgest fungerar igen. Öppna checklistmall → bottenmeny till Hem → bottenmeny till Kunskap visar översikten och återaktiverar sidgest. FAQ-expansion, segmenterade tabs, veckoremsa, scroll, tryck och Loggs textfält behåller kontraktet. Körningarna anges i plan v7. Browser/native-svep och visuellt underlag får endast anges som PASS efter faktisk interaktion; annars skriv NOT TESTABLE.

## Spårbarhet

v5 QA-fynd: `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v5.md`. Denna version utökar inte användarens ursprungliga scope; den förtydligar hur redan specificerade detaljflöden interagerar med huvudsidgesten.
