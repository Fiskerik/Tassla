-- Run once in the approved Supabase project after enabling pg_cron and applying
-- migrations/202610130001_daily_activities.sql. This does not run automatically.
select cron.schedule(
  'tassla-daily-activities-retention-v1',
  '15 3 * * *',
  $$select private.purge_expired_daily_activity_selections();$$
)
where not exists (
  select 1 from cron.job where jobname = 'tassla-daily-activities-retention-v1'
);
