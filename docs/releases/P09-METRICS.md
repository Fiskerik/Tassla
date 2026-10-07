# Release-log — P09 betamätning
Datum: 2026-10-07. Status: planförberedelse; implementation inte startad. Jämförelsebas: P07 lokal slutcommit36b23d5. Ingen GitHub Release finns enligt verifiering 2026-10-07. Leveranscommit och TestFlight-build: saknas.
## Major changes
Inga implementerade i P09. Planerat förslag: separat frivilligt val, minimerade användningsmått och administrativ kohortrapport för aktivering och återkomst.
## Minor changes
Mätdefinitioner och QA-checkpunkter förberedda i ../tasks/dev/beta-metrics.md. Inga faktiska användningsresultat finns.
## Bug-fixes
Inga.
## Verifiering och begränsningar
Ändamål, rättslig grund och informations-/gallringsupplägg väntar på Eriks beslut. Ingen ny händelseinsamling, samtyckeslagring, rapport eller migration implementerad. Featureflag är inte ensam ett godkännande av databehandling. D1/D7/D30 kan inte valideras före en genomförd pilot med mogna tidsfönster.
## Nästa sprint/paket
Fastställ datavalet och P08-kontrakt → exakt review → samtycke/återkallande/radering → minimerad adapter och servergrind → kohortdefinitioner och syntetisk rapport → QA/isolering och oberoende review. Därefter samlad P11-kandidatkontroll. Om individuell mätning väljs bort måste paketets scope och acceptans revideras innan implementation.
