-- Rollback for 20260918125401_labour_plan_display_order.sql.
-- Run only after stopping application writes that depend on display_order.
-- This removes ordering objects without deleting or recreating any labour plan.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

drop trigger if exists assign_labour_plan_display_order on public.labour_plans;
drop function if exists public.move_labour_plan(text, text);
drop function if exists public.assign_labour_plan_display_order();

alter table public.labour_plans
  drop constraint if exists labour_plans_audience_display_order_key,
  drop constraint if exists labour_plans_display_order_positive,
  drop column if exists display_order;

commit;
