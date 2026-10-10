# remove-ai-slop – telefonchecklista

Datum: 2026-10-10
Testbas före MOTION-01: `bec6971` (`feat: refine UI-08 spacing and feedback`)
MOTION-01-commit: `70612e9` (`feat: add motion feedback and progress cues`), ovanpå de 11 commits som tillkom efter `a44ba16`
Status: väntar på Eriks telefonprov; ingen signerad build eller telefonkörning är gjord av Codex.

Den här checklistan beskriver den samlade branchen så att telefonprovet fångar både den befintliga UI-uppdateringen och MOTION-01. Fyll gärna i enhet, iOS-version, build/commit och PASS/PROBLEM för varje del.

## Vad branchen innehåller före MOTION-01

| Område | Implementerat | Telefonprov |
|---|---|---|
| Hem och hundprofil | Profilbaserad hundålder, HeroCard, relevanta hemkort och carousel med befintliga logg-, tränings-, kunskaps- och hälsodata; dagens poster visas utan dubblerade mål. | Kontrollera namn/ålder, kortens öppning, datumval och `Logga nu`. |
| Logga | Snabbval för Kiss, Bajs, Mat, Sömn, Promenad, Vaken, Olycka och Vatten; fler-val och personlig snabbvalslayout; senaste poster, rättning och radering. | Lägg till och rätta en post; prova långtryck för att flytta snabbval; kontrollera att Olycka/Vatten finns vid tillägg och rättning. |
| Skrivfeedback | Radstatus, bekräftad sparad-feedback, Ångra när det gäller en ny post, retry/osäker feedback och dubblettskydd. | Prova snabbtryck och dubblettflödet; kontrollera sparad, fel och osäkert resultat om de kan framkallas säkert. |
| Hälsa och påminnelser | Planerad hälsa skiljer sig från genomförd historik; påminnelsetid accepterar giltig tid från 00:00 till 23:59. | Spara en plan med påminnelse vid 00:00 och 23:59; kontrollera feltext för ogiltig tid. |
| Navigation och layout | Centrerat Tassla-varumärke, bottennavigation med safe-area-inset och justerad spacing i Hem, Kunskap, Mer och Träning. | Prova alla flikar, bakåt/close, liten skärm, stor text och nederkant med safe area. |
| Toast-utseende | Befintliga toaster har tokeniserad ram och semantiska färger. | Kontrollera att ram/färg inte skymmer text eller knappar. |

Övriga commits i basen innehåller build-/checkrättningar och dokumentation; de tillför inte egna telefonflöden.

## MOTION-01 som lagts ovanpå basen

- **Toast:** visas med kort entré och utgång efter att ägaren begär stängning; initialt synlig toast visas direkt. Auto-dismiss börjar efter entrén. Kontrollera sparat, fel och osäker feedback samt att text/åtgärd finns kvar tills utgången är klar.
- **Stale feedback:** visa en viktbekräftelse för en post och sedan för en annan; den första toastens utgång ska inte rensa den senare. Misslyckad loggredigering ska visa feltoast inne i redigeringsrutan.
- **Progress:** börja på ett befintligt framstegsvärde och ändra det genom att slutföra ett sparat träningssteg. Stapeln ska fyllas mjukt; text och tillgängligt värde ska vara rätt.
- **ChecklistItem:** bockrörelse ska ske först när ändringen är bekräftat sparad. Förhandsvisning, obekräftat värde och avmarkering ska ändras direkt utan framgångsrörelse.
- **Reducerad rörelse:** slå på systeminställningen och upprepa toast, framsteg och bock. Lägena ska uppdateras direkt utan rörelse.
- **Tillgänglighet/layout:** kontrollera VoiceOver, stor text och att dolda toaster inte lämnar tomma mellanrum.

## Kodändringar i MOTION-01

Tokeniserade React Native `Animated`-övergångar i `Toast`, `Progress` och `ChecklistItem`; stabila toast-platser på berörda skärmar; samma OS-rekommenderade visningstid behålls för planerad hälsa. Misslyckad loggredigering behåller felåterkoppling i BottomSheet. Ingen ny dependency, sparlogik eller analytics-händelse.

## Resultat

Fyll i efter provet:

- Enhet/iOS/build/commit:
- Hem, navigation och safe area:
- Logga, snabbval, dubblett och rättning:
- Hälsa/påminnelsetid:
- Toast, progress och checklistbock:
- Reducerad rörelse, VoiceOver och stor text:
- Problem och skärmdumpar/video:

Se även [MOTION-01-tasken](MOTION-01.md) och [release-loggen](../../releases/MOTION-01.md).
