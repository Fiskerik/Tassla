-- Run once in the target Supabase project after enabling pg_cron.
-- The job invokes the service-only purge function daily at 03:15 UTC.
select cron.schedule(
  'tassla-beta-metrics-retention-v1',
  '15 3 * * *',
  $$select public.purge_expired_product_events();$$
)
where not exists (
  select 1 from cron.job where jobname = 'tassla-beta-metrics-retention-v1'
);
