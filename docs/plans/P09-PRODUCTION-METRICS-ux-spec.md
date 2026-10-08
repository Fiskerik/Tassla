# P09 produktmätning — UX- och implementation-spec

Datum: 2026-10-08. Status: implementation pågår. Beslutsgrund: Eriks bekräftelse av frivillig mätning med återkallelse och 30 dagars lagring.

## Mål och användarflöde

Användaren kan välja själv i Kontoinställningar om Tassla får samla in ett litet antal apphändelser för att förstå användning. Valet är av som standard, kan återkallas när som helst och återkallelse raderar mätdata kopplad till kontot. Detta är en separat inställning; appens loggning, träning och övriga kärnflöden ska fungera även om mätningen inte kan nås.

## Copy och tillstånd

- Rubrik: `Hjälp oss göra Tassla bättre`
- Beskrivning: `Frivillig användningsmätning hjälper oss förstå vilka delar av appen som används. Vi sparar bara valda apphändelser i upp till 30 dagar. Du kan stänga av när du vill.`
- Switch-label: `Tillåt användningsmätning`
- Av som standard; laddar, sparar, sparat och fel återges separat.
- Vid påslag visas aktivt läge först efter serverns bekräftelse. Vid fel återställs switchen till tidigare servervärde.
- Vid avslag servern markerar samtycket återkallat och tar bort tidigare events atomärt; UI visar av först efter RPC-svar. Vid fel behålls tidigare värde.
- Saknad nätverks-/Supabaseanslutning stoppar inte andra appflöden.

## Tillgänglighet och målbild

Återanvänd AppPrimitives, theme tokens och befintligt AccountSettings-mönster. Hela raden går att trycka, minst 44 pt, Switch har tydlig svensk accessibilityLabel och accessibilityState. Sektionen är ett diskret kort, utan dekorativ ikonstatus eller extra primärknapp. Inga nya animationer.

## Datainsamling

Tillåt endast befintlig enum: `dog_created`, `home_viewed`, `first_log`, `training_started`, `training_completed`, `meaningful_return`. Klienten får inte skicka konto-, hund-, kennel-, device-, innehålls-, fri text- eller hälsodata. RPC tar identitet och tid från session/databasklockan. Avstängd/okänd consent betyder ingen insamling. RPC-fel sväljs av analytics-adaptern och påverkar inte kärnflödet.

## Filer och avgränsning

- `src/features/account/AccountSettingsScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/analytics/analytics-model.ts`
- `src/analytics/analytics-service.ts`
- `src/analytics/README.md`
- `supabase/migrations/202610080001_beta_metrics.sql`
- `supabase/tests/beta-metrics.sql`
- `tests/analytics.test.mjs`
- `docs/tasks/dev/beta-metrics.md`
- `docs/releases/P09-METRICS.md`

Inte beröra: hundens kärndata/health/training services, Expo dependencies, credentials/secrets eller analyticsrapport med ägar-/kennelidentifierare.

## Acceptans/verifiering

- Explicit opt-in krävs; consent och events är RLS-skyddade.
- Endast RPC:er för consent och allowlist events; inga direkta klientgrants på eventtabell.
- Withdrawal tar bort kontots events och stänger consent i en transaktion.
- Auth-kontoradering cascadar både consent och events.
- Händelseinlägg har serverstyrd tid och kort dedupefönster; återförsök skapar inte oändliga dubbletter.
- Node-tester kör endast syntetiska data. SQL-probe är rollbackad och testar två ägare/anon/allowlist/withdraw/retention.
- `git diff --check` och relevanta tester. Verklig Supabase-körning redovisas separat som NOT TESTABLE tills den körts i utvecklingsprojektet.

## Öppen driftpunkt

30-dagars gallring måste köras automatiskt i Supabase-projektet. Migrationen får inte anta att `pg_cron` redan är tillgängligt; den ska innehålla en begränsad purge-funktion för en schemalagd Supabase-jobbkonfiguration. Projektets verkliga scheduler-status verifieras vid installation.
