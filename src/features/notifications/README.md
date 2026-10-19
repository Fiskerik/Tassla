# Lokala påminnelser

`NotificationSettingsScreen` visar kontots lokala påminnelseval och enhetens separata notisbehörighet. Skärmen finns under `Mer → Påminnelser` och tar emot state samt callbacks från `ProductWorkspace`.

Ägarvalen ligger i SecureStore under en nyckel bunden till kontoägaren. `notification-service.ts` planerar och stämmer av endast Tasslas egna lokala notiser för aktiv konto-/hundkontext. Systembehörighet efterfrågas bara efter ett uttryckligt tryck på `Tillåt påminnelser på telefonen`; permission, sparning och schemaläggning är olika tillstånd. En bekräftad lokal sparning betyder inte att en notis kommer att levereras.

Layouten anpassar informationsraden vid smal vy eller `fontScale` minst 1.25. Den förändrar inte preferenser, callbacks, behörighetstidpunkt eller servicebeteende.

Kontrollera med `node --experimental-strip-types --test tests/notifications.test.mjs tests/home-today.test.mjs`. `pnpm check` täcker den fulla lokala Node-sviten. Webbrendering använder en syntetisk lokal fixture; native permission-dialog, VoiceOver, Dynamic Type på iPhone och faktisk notisleverans kräver enheten och är separata kontroller.
