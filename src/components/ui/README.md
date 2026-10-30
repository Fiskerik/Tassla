# Delade UI-komponenter

BottomSheet är appens centrerade, svepbara modal med bevakad stängning. `headerContent` är ett opt-in område mellan titel/handtag och den rullbara kroppen; använd för fasta segment eller tillbaka. `footer` ligger utanför scroll för nåbar primär handling. `keyboardAware` använder befintlig stabil90%-ram och KeyboardAvoidingView; andra anrop behåller tidigare storlek. `scrollContent=false` används bara när innehållet själv äger scrollningen. Döljd indikator tar inte bort scrollning.

Alla nya delar använder samma tokens, disabled-/reduced-motion-/swipeguard och minst44pt. Modalens caller äger bekräftelser och skrivstatus. Testa små skärmar, större text och tangentbord; RN Web är inte native VoiceOver/Dynamic Type. `pnpm check` verifierar typer/befintliga kontrakt; taskernas riktade browserprov visar verklig layout/resa.
