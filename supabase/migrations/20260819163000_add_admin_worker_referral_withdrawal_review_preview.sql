-- Preview-only Phase 12B migration.
-- Adds atomic admin review for referral withdrawal requests.

create or replace function public.review_worker_referral_withdrawal(
  p_request_id text,
  p_action text,
  p_rejection_reason text default ''
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_request public.worker_referral_withdrawal_requests%rowtype;
  v_now timestamptz := now();
  v_request_id text := trim(coalesce(p_request_id, ''));
  v_action text := lower(trim(coalesce(p_action, '')));
  v_reason text := trim(coalesce(p_rejection_reason, ''));
begin
  if v_request_id = '' then
    return jsonb_build_object(
      'success', false,
      'code', 'request-required',
      'message', 'Withdrawal request ID is required.'
    );
  end if;

  if v_action not in ('approve', 'reject') then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid-action',
      'message', 'Select a valid review action.'
    );
  end if;

  select *
    into v_request
    from public.worker_referral_withdrawal_requests
   where id = v_request_id
   for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'request-not-found',
      'message', 'Withdrawal request was not found.'
    );
  end if;

  if v_request.status <> 'requested' then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid-status-transition',
      'message', 'Only requested withdrawals can be reviewed in this phase.'
    );
  end if;

  if v_action = 'approve' then
    update public.worker_referral_withdrawal_requests
       set status = 'approved',
           approved_at = v_now,
           rejected_at = null,
           rejection_reason = '',
           updated_at = v_now
     where id = v_request.id
     returning * into v_request;
  else
    if v_reason = '' then
      return jsonb_build_object(
        'success', false,
        'code', 'rejection-reason-required',
        'message', 'Rejection reason is required.'
      );
    end if;

    update public.worker_referral_withdrawal_requests
       set status = 'rejected',
           rejected_at = v_now,
           rejection_reason = v_reason,
           approved_at = null,
           updated_at = v_now
     where id = v_request.id
     returning * into v_request;
  end if;

  return jsonb_build_object(
    'success', true,
    'withdrawal', to_jsonb(v_request)
  );
end;
$$;

revoke execute on function public.review_worker_referral_withdrawal(text, text, text) from public;
revoke execute on function public.review_worker_referral_withdrawal(text, text, text) from anon;
revoke execute on function public.review_worker_referral_withdrawal(text, text, text) from authenticated;
grant execute on function public.review_worker_referral_withdrawal(text, text, text) to service_role;
