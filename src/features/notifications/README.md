# Lokala påminnelser

`NotificationSettingsScreen` visar kontots lokala påminnelseval och enhetens separata notisbehörighet. Skärmen finns under `Mer → Påminnelser` och tar emot state samt callbacks från `ProductWorkspace`.

Ägarvalen ligger i SecureStore under en nyckel bunden till kontoägaren. `notification-service.ts` planerar och stämmer av endast Tasslas egna lokala notiser för aktiv konto-/hundkontext. Systembehörighet efterfrågas bara efter ett uttryckligt tryck på `Tillåt påminnelser på telefonen`; permission, sparning och schemaläggning är olika tillstånd. En bekräftad lokal sparning betyder inte att en notis kommer att levereras.

En enda informationsikon samlar förklaringarna om lokala scheman, vald tid och telefonens separata behörighet. Checkboxlistan visar bara de korta valnamnen; deras konsekvenser ligger under informationsknappen och i respektive tillgänglighetshint. Layoutändringen förändrar inte preferenser, callbacks, behörighetstidpunkt eller servicebeteende.

Kontrollera med `node --experimental-strip-types --test tests/notifications.test.mjs tests/home-today.test.mjs`. `pnpm check` täcker den fulla lokala Node-sviten. Webbrendering använder en syntetisk lokal fixture; native permission-dialog, VoiceOver, Dynamic Type på iPhone och faktisk notisleverans kräver enheten och är separata kontroller. UI-R02-04:s renderbevis ligger i `docs/design/evidence/vision-rev02/ui-r02-04-panelhelhet/`.
