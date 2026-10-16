# R2b — Loggs redigerarsheet med dragstängning (UX-spec v2)

Datum: 2026-10-16\
Status: v2 godkänd av Architect/Critic; lifecycle-cleanup och uppåtvändningsfix QA v5 PASS; slutlig Reviewer-recheck PASS

## Användaruppgift

Hundägaren kan dra Loggs redigerarsheet nedåt från rubriken för att lämna den. En diskret synlig dragindikator visar att rubriken kan dras. En oavsiktlig dragning ska återgå, och osparad redigering ska fortsätta skyddas av Loggs befintliga discard-val.

## Interaktionskontrakt

| Tillstånd / handling | Förväntat beteende |
|---|---|
| Drag börjar i minst 44 pt-höga rubrikytan och går nedåt | Sheeten följer fingret; gesten ägs inte av innehålls-ScrollView. |
| Uppåt-/horisontell rörelse, kort drag eller cancel/terminate | Ingen stängning; sheeten återgår. |
| Reducerad rörelse | Återställ positionen direkt utan fjädring. |
| Nedåtdrag över 120 pt, clean editor | Samma ägarcallback begär stängning en gång. Ägaren ändrar visible/remount state; BottomSheet döljer inte sig själv. Accepterad fingerposition består till stateändring/unmount utan separat exit-animation. |
| Nedåtdrag över 120 pt, dirty editor | Samma Osparade ändringar-prompt som övriga oavsiktliga utträden; utkastet ligger kvar tills användaren väljer. |
| Stanna kvar | Samma editor och värden ligger kvar. |
| Lämna utan att spara | Befintlig explicita discard-handler stänger editorn; draggesten skriver eller raderar inget. |
| Pending/failed/unsure, låst mutation eller redan öppen prompt | Callback nekar omedelbar stängning och sheeten återgår; befintlig retry/readback, status, utkast, fokus och scroll består. |
| Fokuserat textfält/tangentbord | Rubrikdrag får inte fånga scroll eller tangentbordsinput från editorn; fast footer och innehållet ska fortsatt nås. |

## Avgränsning

Gesten aktiveras endast via opt-in på Loggs redigerarsheet. Stängknapp, backdrop, Android back, save/retry/delete och datalivscykel behåller nuvarande API-/ägarregler. Alla andra BottomSheet-konsumenter har fortsatt dragToDismiss av; då skapas varken PanResponder-handlers eller gestwrapper. Dragindikatorn är dekorativ och hjälpmedel får fortsatt den befintliga Stäng-knappen. En diskret dekorativ dragindikator visas i opt-in-rubrikytan; den befintliga rubriken är gestytan.

Använd RN 0.86.3:s installerade PanResponder och Animated.spring, befintliga rörelsetokens och useReducedMotion. Inga nya bibliotek eller egna motion-system. Trösklar är gemensamma namngivna tokens: minst 8 pt nedåtrörelse för att hävda gesten och 120 pt nedåtdistans för close. Hastighet kan inte ensam stänga. Drag är nedåtriktat och endast den tillfälliga presentationen rör sig.

## Verifierbar acceptans

Kör samma användarresa i public och review: öppna en loggrad, dra kort och släpp, verifiera återgång; dra längre medan editor är clean, verifiera close; öppna igen, ändra anteckning, dra över tröskel, verifiera discard-dialog och oförändrat utkast efter Stanna kvar; verifiera uttryckligt discard; simulera pending/locked och verifiera återgång utan extra write; scrolla editor/fokusera fält, använd tangentbordsläget och prova drag endast i rubriken. Kontrollera 375×844, 430×844, 375×667 samt 140 % web-textproxy. Spara screenshots och verifieringsresultat.

RN Web-interaktioner är syntetiska browserbevis. De bevisar inte riktig iOS-/Android-touch, systemtangentbord, safe area, native Modal/back-prioritet, VoiceOver eller Dynamic Type på enhet; dessa anges separat som NOT TESTABLE tills de faktiskt kontrollerats.

## Stängningsägarskap och bevis

BottomSheet använder en typad propvariant: utan opt-in behåller onRequestClose sin void-signatur; med dragToDismiss krävs en boolean-retur. Returnerat true rapporterar endast ägarens accepterade beslut. BottomSheet ändrar aldrig visible eller avmonterar sig själv. Vid false återgår sheeten; vid true består accepterad fingerposition tills den kontrollerade ägarstate:n döljer/avmonterar den, och värdet återställs till nästa öppning.

Verifieraren ska under aktiv dragning läsa den riktiga sheetens bounding box/translation och jämföra med pekarens nedåtförflyttning; även avslutat/nekad/cancel/terminate-läge, callback-count och skrivräknare mäts. dragToDismiss utelämnat kontrolleras separat så att inga responders/wrappers finns. Failed och unsure måste fortsätta visa befintlig retry/readback, draft, focus och scroll efter nekad gest. Screenshots dokumenterar komposition och tillstånd men ersätter inte dessa assertions.

I v1 gav Architect CHANGES för API-typning, accepted-release lifecycle och runtime assertions; Critic PROCEED WITH CHANGES för upptäckbarhet, kortsnabba gester, failed/unsure och close ownership. Dessa ändringar ingår i denna v2; båda reviews förnyas.

## Implementationsutfall

Uppföljningen efter första QA-fynden bekräftar draftbevarande, noll writes vid gest, denied close, explicit discard, opt-out och avbruten gestures fokusåterställning i RN Web (before=true, after=true). Browserresultatet säger inget om fysisk native-tangentbordsrespons; den delen förblir NOT TESTABLE tills den kontrollerats i appen. Se evidens-README för fullständig §14-checklista och screenshots.
