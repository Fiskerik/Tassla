# Träning

`training-model.ts` håller de två internt granskade texterna och en ren, fristående modell för registrering per hund, programversion och stabilt steg-ID. `TrainingScreen.tsx` visar program, stopptext, källa, begränsningar, bekräftelse och återställning.

`DevelopmentPreview` äger progressionen i RAM så att den överlever sidbyten. Endast nästa ej registrerade steg kan markeras; efter markeringen krävs ett separat tryck för att fortsätta. Programmet påstår inte att hunden behärskar ett beteende och ökar inte svårigheten. Allt nollställs när appen startas om.

Texten är intern för lokal granskning, inte veterinärgranskad eller publiceringsgodkänd. Programmet om nya intryck är uttryckligen för valpar och inte behandling för vuxna hundars rädsla. Inga råd gäller vaccination, exponeringstider eller dosering. Kör `pnpm check`; ingen serverlagring eller verklig träningsverifiering ingår.
