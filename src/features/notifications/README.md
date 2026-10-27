# Lokala påminnelser

`NotificationSettingsScreen` visar kontots lokala påminnelseval och enhetens separata notisbehörighet. Skärmen finns under `Mer → Påminnelser` och tar emot state samt callbacks från `ProductWorkspace`.

Ägarvalen ligger i SecureStore under en nyckel bunden till kontoägaren. `notification-service.ts` planerar och stämmer av endast Tasslas egna lokala notiser för aktiv konto-/hundkontext. Systembehörighet efterfrågas bara efter ett uttryckligt tryck på `Tillåt påminnelser på telefonen`; permission, sparning och schemaläggning är olika tillstånd. En bekräftad lokal sparning betyder inte att en notis kommer att levereras.

Användaren kan också välja en samlad rutinpåminnelse med egen lokal tid och en påminnelse om nästa ungefärliga åldersfas. Fasdatum använder samma 6- och 24-månadersgränser som Utveckling och kl. 09 lokal tid; det är inte en individuell milstolpe. Gamla preferenser behåller sina värden och de nya valen är då av. Engångsnotiser stäms av när appen öppnas; de garanterar inte dagliga leveranser när appen inte öppnas. Låsskärmen visar generisk text och tryck öppnar Checklista respektive Utveckling för den aktiva hunden.

En enda informationsikon samlar förklaringarna om lokala scheman, vald tid och telefonens separata behörighet. Checkboxlistan visar bara de korta valnamnen; deras konsekvenser ligger under informationsknappen och i respektive tillgänglighetshint. Layoutändringen förändrar inte preferenser, callbacks, behörighetstidpunkt eller servicebeteende.

Kontrollera med `node --experimental-strip-types --test tests/notifications.test.mjs tests/home-today.test.mjs`. `pnpm check` täcker den fulla lokala Node-sviten. Webbrendering använder en syntetisk lokal fixture; native permission-dialog, VoiceOver, Dynamic Type på iPhone och faktisk notisleverans kräver enheten och är separata kontroller. UI-R02-04:s renderbevis ligger i `docs/design/evidence/vision-rev02/ui-r02-04-panelhelhet/`.
