create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_worker_referral_email_outbox_processor()
returns bigint
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  cron_secret text;
  request_id bigint;
begin
  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'refer_earn_email_cron_secret'
  limit 1;

  if coalesce(cron_secret, '') = '' then
    raise exception 'Refer & Earn email cron secret is not configured in Vault';
  end if;

  select net.http_post(
    url := 'https://www.scalevyapar.in/api/internal/refer-earn-email-outbox/process',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_worker_referral_email_outbox_processor() from public;
revoke all on function public.invoke_worker_referral_email_outbox_processor() from anon;
revoke all on function public.invoke_worker_referral_email_outbox_processor() from authenticated;
grant execute on function public.invoke_worker_referral_email_outbox_processor() to service_role;
