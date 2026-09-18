begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.labour_plans
  add column display_order integer;

with ranked_plans as (
  select
    id,
    row_number() over (
      partition by audience
      order by created_at asc, id asc
    )::integer as display_order
  from public.labour_plans
)
update public.labour_plans as plans
set display_order = ranked_plans.display_order
from ranked_plans
where ranked_plans.id = plans.id;

alter table public.labour_plans
  alter column display_order set not null,
  add constraint labour_plans_display_order_positive
    check (display_order > 0),
  add constraint labour_plans_audience_display_order_key
    unique (audience, display_order)
    deferrable initially deferred;

create or replace function public.assign_labour_plan_display_order()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if
    (tg_op = 'INSERT' and new.display_order is null)
    or
    (tg_op = 'UPDATE' and new.audience is distinct from old.audience)
  then
    perform pg_advisory_xact_lock(hashtextextended('public.labour_plans.display_order', 0));

    select coalesce(max(plan.display_order), 0) + 1
    into new.display_order
    from public.labour_plans as plan
    where plan.audience = new.audience;
  end if;

  return new;
end;
$$;

create trigger assign_labour_plan_display_order
before insert or update of audience on public.labour_plans
for each row
execute function public.assign_labour_plan_display_order();

revoke all on function public.assign_labour_plan_display_order() from public;
revoke all on function public.assign_labour_plan_display_order() from anon;
revoke all on function public.assign_labour_plan_display_order() from authenticated;
revoke all on function public.assign_labour_plan_display_order() from service_role;

create or replace function public.move_labour_plan(
  p_plan_id text,
  p_direction text
)
returns table (
  plan_id text,
  plan_audience text,
  previous_display_order integer,
  display_order integer,
  moved boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_plan public.labour_plans%rowtype;
  adjacent_plan public.labour_plans%rowtype;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'Plan direction must be up or down.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('public.labour_plans.display_order', 0));

  select plan.*
  into current_plan
  from public.labour_plans as plan
  where plan.id = p_plan_id
  for update;

  if not found then
    raise exception 'Labour plan % was not found.', p_plan_id using errcode = 'P0002';
  end if;

  if p_direction = 'up' then
    select plan.*
    into adjacent_plan
    from public.labour_plans as plan
    where plan.audience = current_plan.audience
      and plan.display_order < current_plan.display_order
    order by plan.display_order desc
    limit 1
    for update;
  else
    select plan.*
    into adjacent_plan
    from public.labour_plans as plan
    where plan.audience = current_plan.audience
      and plan.display_order > current_plan.display_order
    order by plan.display_order asc
    limit 1
    for update;
  end if;

  if adjacent_plan.id is null then
    return query
    select
      current_plan.id,
      current_plan.audience,
      current_plan.display_order,
      current_plan.display_order,
      false;
    return;
  end if;

  update public.labour_plans as plan
  set display_order = case
    when plan.id = current_plan.id then adjacent_plan.display_order
    else current_plan.display_order
  end
  where plan.id in (current_plan.id, adjacent_plan.id);

  return query
  select
    current_plan.id,
    current_plan.audience,
    current_plan.display_order,
    adjacent_plan.display_order,
    true;
end;
$$;

revoke all on function public.move_labour_plan(text, text) from public;
revoke all on function public.move_labour_plan(text, text) from anon;
revoke all on function public.move_labour_plan(text, text) from authenticated;
grant execute on function public.move_labour_plan(text, text) to service_role;

comment on column public.labour_plans.display_order is
  'Stable, administrator-controlled order within each plan audience.';

comment on function public.move_labour_plan(text, text) is
  'Atomically swaps a labour plan with its adjacent plan in the same audience.';

comment on function public.assign_labour_plan_display_order() is
  'Trigger-only function that appends new plans and audience changes to the saved audience order.';

commit;
