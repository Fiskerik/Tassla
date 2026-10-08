# Release-log — P09 betamätning
Datum: 2026-10-08. Status: syntetisk förberedelse implementerad; produktionsmätning blockerad. Jämförelsebas: P07 lokal slutcommit 36b23d5. Ingen GitHub Release finns enligt verifiering 2026-10-07. Leveranscommit och TestFlight-build: saknas.
## Major changes
Inga nya användarflöden. Planerat förslag: separat frivilligt val, minimerade referralkäll- och användningsmått samt administrativ kohortrapport för aktivering och återkomst. Accepterad kennelkod redovisas som referral-/onboardingattribution, inte som bevisad skanning, nedladdning eller installation.
## Minor changes
Lokal adapter för syntetiska händelser och test av avstängd/consent-gated funktion finns i `src/analytics/`. Den skriver endast i processminne och saknar appkoppling. Ingen UI, backend eller rapport tillkom. Mätdefinitioner och QA-checkpunkter finns i ../tasks/dev/beta-metrics.md. Inga faktiska användningsresultat finns.
## Bug-fixes
Inga.
## Verifiering och begränsningar
`node --experimental-strip-types --test tests/analytics.test.mjs` passerar (3 tester); `git diff --check` passerar. Ingen verklig händelseinsamling, samtyckeslagring, rapport, migration, klientgrant eller nätverksadapter implementerad. Syntetiska grindar i adaptern är inte produktionsconsent eller godkänd featureflag. Ändamål, rättslig grund, informations-/gallringsupplägg och backendkontrakt saknas; P09 är därför inte betaredo. D1/D7/D30 kan inte valideras före en genomförd pilot med mogna tidsfönster.
## Nästa sprint/paket
P08/P09 är sista funktionella MVP-blocket före P11. Fastställ datakontrakt och P08-kontrakt → review → beslutat frivillighets-/återkallande-/raderingsflöde → minimerad adapter och servergrind → separata funnel- och kohortdefinitioner samt syntetisk rapport → QA/isolering och oberoende review. Därefter samlad P11-kandidatkontroll. Om individuell mätning väljs bort måste paketets scope och acceptans revideras innan implementation.
