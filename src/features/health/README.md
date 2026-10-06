# Hälsa

`HealthScreen.tsx` visas från Hälsa-fliken i det inloggade workspace-flödet. `HealthHistoryScreen.tsx` ligger under den befintliga viktdelen och hanterar endast redan utförda vaccinationer och veterinärbesök. Båda flödena visar ägarregistrerade uppgifter, inte en verifierad journal, och ger inga medicinska råd. Utan data-props visar förhandsvisningen bara sin grund och gör inga anrop.

`ProductWorkspace.tsx` äger separata rader, laddningsstatus, väntande mutationer och återförsök för vikt respektive historik. `workspace-data.ts` läser och skriver det befintliga `dog_events`-schemat. Hälsans historik använder `vaccination`/`vet_visit`, `occurred_on` och frivillig `description`; actor-id sätts av databasens auth-default/RLS. Varje läsning och mutation filtreras efter aktuell hund, typ och vid behov id. Rättningar och raderingar villkoras dessutom av datum och anteckning som lästes före försöket. Ingen offlinekö finns.

Datum måste vara ett verkligt lokalt `ÅÅÅÅ-MM-DD` till och med idag. Vikt måste vara större än 0 och högst 200 kg med högst tre decimaler. Historikanteckningar trimmas, tom text lagras som null och gränsen är 500 Unicode-tecken. Historik sorteras fallande efter datum och id. Den hämtas i en läsning utan separat sidladdning; om listan når serverns svarstak kan äldre poster saknas. Historikens typ låses efter att posten skapats.

Vid osäker sparstatus kontrolleras samma stabila id och avsedda fält före ett återförsök. Vid ändrad post visas den aktuella versionen och ägaren måste uttryckligen välja att använda visad historik innan en ny ändring kan starta. Senare ändringar skrivs inte över av ett gammalt återförsök. Resultat från tidigare hund eller konto ignoreras. Anteckningar skrivs inte till loggar.

Kör `pnpm check` för typkontroll, lint och lokala tester och `pnpm bundle:ios` för iOS-exporten. Dessa kontroller verifierar inte fysisk tangentbords-/skärmläsarupplevelse eller verklig Supabase/RLS-isolering. Tvåsyntetkontoverifiering och native UX redovisas separat när de faktiskt har körts.
