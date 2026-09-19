do $test$
begin
  begin
    insert into public.labour_companies (
      id,
      company_name,
      contact_person,
      mobile,
      city,
      status
    ) values (
      'isolated-transaction-rollback-company',
      'Rollback Proof Company',
      'Synthetic Owner',
      '8399999999',
      'Jaipur',
      'active'
    );

    if not exists (
      select 1
      from public.rozgar_internal_notification_outbox
      where event_key = 'rozgar-company-registration-isolated-transaction-rollback-company'
    ) then
      raise exception 'transactional event was not visible inside the business transaction';
    end if;

    raise exception sqlstate 'ZX001' using message = 'force subtransaction rollback';
  exception
    when sqlstate 'ZX001' then null;
  end;

  if exists (
    select 1 from public.labour_companies
    where id = 'isolated-transaction-rollback-company'
  ) or exists (
    select 1 from public.rozgar_internal_notification_outbox
    where event_key = 'rozgar-company-registration-isolated-transaction-rollback-company'
  ) then
    raise exception 'business row or outbox row survived forced rollback';
  end if;
end
$test$;

select
  not exists (
    select 1 from public.labour_companies
    where id = 'isolated-transaction-rollback-company'
  ) as company_rolled_back,
  not exists (
    select 1 from public.rozgar_internal_notification_outbox
    where event_key = 'rozgar-company-registration-isolated-transaction-rollback-company'
  ) as outbox_rolled_back;
