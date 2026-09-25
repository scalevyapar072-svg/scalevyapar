-- Phase 16C.2 Production webhook hardening.
-- Migration classification: FORWARD-ONLY REMEDIATION.
--
-- This migration is safe to apply after the existing WhatsApp persistence
-- migrations. It does not replay or alter historical migration files and it
-- does not send outbound traffic.

create or replace function public.process_labour_whatsapp_inbound_command(
  p_message_id text,
  p_normalized_mobile text,
  p_raw_text text,
  p_normalized_text text,
  p_command_kind text,
  p_command_key text,
  p_received_at timestamptz default null
)
returns table (
  processed boolean,
  duplicate boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_now timestamptz := coalesce(p_received_at, statement_timestamp());
  v_inbound public.labour_whatsapp_inbound_events%rowtype;
  v_inbound_id uuid;
  v_pending_retry boolean := false;
  v_worker_count integer := 0;
  v_worker_id text;
  v_company_count integer := 0;
  v_company_id text;
  v_company_source text;
  v_recipient_type text;
  v_recipient_id text;
  v_resolution_category text := 'unknown_recipient';
  v_recipient_source text := 'none';
  v_suppression public.labour_whatsapp_suppressions%rowtype;
  v_suppression_id uuid;
  v_suppression_created boolean := false;
  v_restoration_requested boolean := false;
  v_reconcile_restoration boolean := false;
  v_processing_outcome text;
  v_consent_type text;
  v_current_consent public.labour_whatsapp_consents%rowtype;
  v_current_consent_found boolean := false;
  v_consent_text_version text;
  v_previous_snapshot jsonb := jsonb_build_object(
    'service_allowed', false,
    'matching_alerts_allowed', false,
    'marketing_allowed', false
  );
  v_metadata jsonb;
begin
  if nullif(btrim(p_message_id), '') is null then
    raise exception using errcode = '22023', message = 'Invalid inbound message identifier.';
  end if;

  if p_normalized_mobile !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception using errcode = '22023', message = 'Invalid normalized mobile.';
  end if;

  if p_command_kind not in ('opt_out_all', 'restore_request') then
    raise exception using errcode = '22023', message = 'Invalid inbound command kind.';
  end if;

  if nullif(btrim(p_raw_text), '') is null
    or nullif(btrim(p_normalized_text), '') is null
    or nullif(btrim(p_command_key), '') is null then
    raise exception using errcode = '22023', message = 'Invalid inbound command text.';
  end if;

  select count(*)::integer, min(worker.id)
  into v_worker_count, v_worker_id
  from public.labour_workers as worker
  where worker.mobile = p_normalized_mobile;

  select
    count(*)::integer,
    min(company_match.id),
    min(company_match.source)
  into v_company_count, v_company_id, v_company_source
  from (
    select distinct on (company.id)
      company.id,
      case
        when company.contact_mobile = p_normalized_mobile then 'contact_mobile'
        else 'mobile'
      end as source
    from public.labour_companies as company
    where company.contact_mobile = p_normalized_mobile
      or company.mobile = p_normalized_mobile
    order by company.id, source
  ) as company_match;

  if v_worker_count = 1 and v_company_count = 0 then
    v_recipient_type := 'worker';
    v_recipient_id := v_worker_id;
    v_resolution_category := 'resolved_worker';
    v_recipient_source := 'direct';
  elsif v_worker_count = 0 and v_company_count = 1 then
    v_recipient_type := 'company';
    v_recipient_id := v_company_id;
    v_resolution_category := 'resolved_company';
    v_recipient_source := v_company_source;
  elsif v_worker_count > 0 or v_company_count > 0 then
    v_resolution_category := 'ambiguous_recipient';
  end if;

  select inbound.*
  into v_inbound
  from public.labour_whatsapp_inbound_events as inbound
  where inbound.message_id = p_message_id
  for update;

  if found then
    if v_inbound.normalized_mobile is distinct from p_normalized_mobile
      or v_inbound.event_kind is distinct from p_command_kind then
      raise exception using errcode = '22023', message = 'Conflicting inbound command retry.';
    end if;

    if coalesce(v_inbound.metadata ->> 'processingState', '') = 'completed' then
      return query select false, true;
      return;
    end if;

    v_inbound_id := v_inbound.id;
    v_pending_retry := true;
  else
    insert into public.labour_whatsapp_inbound_events (
      message_id,
      normalized_mobile,
      matched_recipient_type,
      matched_recipient_id,
      event_kind,
      raw_text,
      normalized_text,
      command_key,
      suppression_applied,
      metadata,
      created_at,
      updated_at
    ) values (
      p_message_id,
      p_normalized_mobile,
      v_recipient_type,
      v_recipient_id,
      p_command_kind,
      p_raw_text,
      p_normalized_text,
      p_command_key,
      p_command_kind = 'opt_out_all',
      jsonb_build_object(
        'classificationKind', p_command_kind,
        'commandType', case when p_command_kind = 'opt_out_all' then 'STOP' else 'START' end,
        'deduplicationOutcome', 'processed_unique_message',
        'maskedMobile', '+91******' || right(p_normalized_mobile, 4),
        'processingState', 'pending',
        'receivedAt', v_now,
        'resolutionCategory', v_resolution_category,
        'matchedRecipientSource', v_recipient_source,
        'matchedRecipientType', v_recipient_type
      ),
      v_now,
      v_now
    )
    on conflict (message_id) do nothing
    returning id into v_inbound_id;

    if v_inbound_id is null then
      select inbound.*
      into v_inbound
      from public.labour_whatsapp_inbound_events as inbound
      where inbound.message_id = p_message_id
      for update;

      if not found then
        raise exception using errcode = '40001', message = 'Inbound command retry could not be resolved.';
      end if;

      if v_inbound.normalized_mobile is distinct from p_normalized_mobile
        or v_inbound.event_kind is distinct from p_command_kind then
        raise exception using errcode = '22023', message = 'Conflicting inbound command retry.';
      end if;

      if coalesce(v_inbound.metadata ->> 'processingState', '') = 'completed' then
        return query select false, true;
        return;
      end if;

      v_inbound_id := v_inbound.id;
      v_pending_retry := true;
    end if;
  end if;

  select suppression.*
  into v_suppression
  from public.labour_whatsapp_suppressions as suppression
  where suppression.normalized_mobile = p_normalized_mobile
    and suppression.active = true
  for update;

  if p_command_kind = 'opt_out_all' then
    if not found then
      if v_recipient_type is not null and v_recipient_id is not null then
        select v_previous_snapshot || coalesce(jsonb_object_agg(consent.consent_type, consent.allowed), '{}'::jsonb)
        into v_previous_snapshot
        from public.labour_whatsapp_consents as consent
        where consent.recipient_type = v_recipient_type
          and consent.recipient_id = v_recipient_id
          and consent.normalized_mobile = p_normalized_mobile;
      end if;

      insert into public.labour_whatsapp_suppressions (
        normalized_mobile,
        suppression_scope,
        trigger_source,
        trigger_command,
        trigger_message_id,
        previous_consent_snapshot,
        active,
        metadata,
        created_at,
        updated_at
      ) values (
        p_normalized_mobile,
        'all_whatsapp',
        'inbound_opt_out',
        p_command_key,
        p_message_id,
        v_previous_snapshot,
        true,
        jsonb_build_object(
          'resolutionCategory', v_resolution_category,
          'matchedRecipientSource', v_recipient_source,
          'matchedRecipientType', v_recipient_type
        ),
        v_now,
        v_now
      )
      on conflict (normalized_mobile) where active = true do nothing
      returning id into v_suppression_id;

      if v_suppression_id is not null then
        v_suppression_created := true;
      else
        select suppression.*
        into v_suppression
        from public.labour_whatsapp_suppressions as suppression
        where suppression.normalized_mobile = p_normalized_mobile
          and suppression.active = true
        for update;
      end if;
    end if;

    if (v_suppression_created or v_pending_retry)
      and v_recipient_type is not null
      and v_recipient_id is not null then
      foreach v_consent_type in array array[
        'service_allowed',
        'matching_alerts_allowed',
        'marketing_allowed'
      ] loop
        select consent.*
        into v_current_consent
        from public.labour_whatsapp_consents as consent
        where consent.recipient_type = v_recipient_type
          and consent.recipient_id = v_recipient_id
          and consent.normalized_mobile = p_normalized_mobile
          and consent.consent_type = v_consent_type
        for update;

        v_current_consent_found := found;
        v_consent_text_version := coalesce(
          nullif(v_current_consent.consent_text_version, ''),
          'rozgar_whatsapp_consent_v1_20260822'
        );

        if not v_current_consent_found or v_current_consent.allowed is distinct from false then
          insert into public.labour_whatsapp_consents as current_consent (
            recipient_type,
            recipient_id,
            normalized_mobile,
            consent_type,
            allowed,
            source,
            consent_text_version,
            consented_at,
            opted_out_at,
            metadata,
            created_at,
            updated_at
          ) values (
            v_recipient_type,
            v_recipient_id,
            p_normalized_mobile,
            v_consent_type,
            false,
            'inbound_opt_out',
            v_consent_text_version,
            case when v_current_consent_found then v_current_consent.consented_at else null end,
            v_now,
            jsonb_build_object(
              'resolutionCategory', v_resolution_category,
              'matchedRecipientSource', v_recipient_source,
              'matchedRecipientType', v_recipient_type,
              'commandType', 'STOP'
            ),
            v_now,
            v_now
          )
          on conflict (
            recipient_type,
            (coalesce(recipient_id, '')),
            normalized_mobile,
            consent_type
          ) do update set
            allowed = false,
            source = excluded.source,
            consent_text_version = excluded.consent_text_version,
            consented_at = current_consent.consented_at,
            opted_out_at = coalesce(current_consent.opted_out_at, excluded.opted_out_at),
            metadata = excluded.metadata,
            updated_at = excluded.updated_at;
        end if;

        if not v_current_consent_found
          or v_current_consent.allowed is distinct from false
          or v_pending_retry then
          insert into public.labour_whatsapp_consent_events (
            recipient_type,
            recipient_id,
            normalized_mobile,
            consent_type,
            previous_allowed,
            new_allowed,
            event_type,
            source,
            consent_text_version,
            event_message_id,
            metadata,
            occurred_at
          ) values (
            v_recipient_type,
            v_recipient_id,
            p_normalized_mobile,
            v_consent_type,
            case when v_current_consent_found then v_current_consent.allowed else null end,
            false,
            'opted_out',
            'inbound_opt_out',
            v_consent_text_version,
            p_message_id,
            jsonb_build_object(
              'resolutionCategory', v_resolution_category,
              'matchedRecipientSource', v_recipient_source,
              'matchedRecipientType', v_recipient_type,
              'commandType', 'STOP',
              'retryReconciliation', v_pending_retry
            ),
            v_now
          )
          on conflict (
            event_message_id,
            normalized_mobile,
            consent_type,
            event_type
          ) where event_message_id is not null do nothing;
        end if;
      end loop;
    end if;

    v_processing_outcome := case
      when v_suppression_created then 'suppression_created'
      else 'suppression_already_active'
    end;
  else
    if not found then
      v_processing_outcome := 'no_active_suppression';
    elsif v_suppression.restoration_requested_at is null
      and v_suppression.restoration_message_id is null then
      update public.labour_whatsapp_suppressions
      set
        restoration_requested_at = v_now,
        restoration_message_id = p_message_id,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'resolutionCategory', v_resolution_category,
          'matchedRecipientSource', v_recipient_source,
          'matchedRecipientType', v_recipient_type
        ),
        updated_at = v_now
      where id = v_suppression.id;

      v_restoration_requested := true;
      v_reconcile_restoration := true;
      v_processing_outcome := 'restoration_requested';
    else
      v_reconcile_restoration := v_pending_retry
        and v_suppression.restoration_message_id = p_message_id;
      v_processing_outcome := 'restoration_already_requested';
    end if;

    if v_reconcile_restoration
      and v_recipient_type is not null
      and v_recipient_id is not null then
      for v_current_consent in
        select consent.*
        from public.labour_whatsapp_consents as consent
        where consent.recipient_type = v_recipient_type
          and consent.recipient_id = v_recipient_id
          and consent.normalized_mobile = p_normalized_mobile
        order by consent.consent_type
        for update
      loop
        insert into public.labour_whatsapp_consent_events (
          recipient_type,
          recipient_id,
          normalized_mobile,
          consent_type,
          previous_allowed,
          new_allowed,
          event_type,
          source,
          consent_text_version,
          event_message_id,
          metadata,
          occurred_at
        ) values (
          v_recipient_type,
          v_recipient_id,
          p_normalized_mobile,
          v_current_consent.consent_type,
          v_current_consent.allowed,
          v_current_consent.allowed,
          'restoration_requested',
          'inbound_restore_request',
          coalesce(
            nullif(v_current_consent.consent_text_version, ''),
            'rozgar_whatsapp_consent_v1_20260822'
          ),
          p_message_id,
          jsonb_build_object(
            'resolutionCategory', v_resolution_category,
            'matchedRecipientSource', v_recipient_source,
            'matchedRecipientType', v_recipient_type,
            'commandType', 'START',
            'retryReconciliation', v_pending_retry
          ),
          v_now
        )
        on conflict (
          event_message_id,
          normalized_mobile,
          consent_type,
          event_type
        ) where event_message_id is not null do nothing;
      end loop;
    end if;
  end if;

  v_metadata := jsonb_build_object(
    'classificationKind', p_command_kind,
    'commandType', case when p_command_kind = 'opt_out_all' then 'STOP' else 'START' end,
    'deduplicationOutcome', case
      when v_pending_retry then 'completed_pending_retry'
      else 'processed_unique_message'
    end,
    'maskedMobile', '+91******' || right(p_normalized_mobile, 4),
    'processingState', 'completed',
    'processingOutcome', v_processing_outcome,
    'receivedAt', v_now,
    'resolutionCategory', v_resolution_category,
    'matchedRecipientSource', v_recipient_source,
    'matchedRecipientType', v_recipient_type,
    'restorationRequested', v_restoration_requested
  );

  update public.labour_whatsapp_inbound_events
  set
    matched_recipient_type = v_recipient_type,
    matched_recipient_id = v_recipient_id,
    suppression_applied = p_command_kind = 'opt_out_all',
    metadata = coalesce(metadata, '{}'::jsonb) || v_metadata,
    updated_at = v_now
  where id = v_inbound_id;

  return query select true, false;
end;
$function$;

comment on function public.process_labour_whatsapp_inbound_command(
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz
) is
  'Atomically records and applies a signed inbound WhatsApp STOP or START command. START records a restoration request and never restores consent.';

create or replace function public.record_labour_whatsapp_status_event(
  p_event_key text,
  p_message_id text,
  p_status text,
  p_summary text,
  p_recorded_at timestamptz default null
)
returns table (
  inserted boolean,
  duplicate boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_inserted_id text;
begin
  if p_event_key !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid WhatsApp status idempotency key.';
  end if;

  if nullif(btrim(p_message_id), '') is null
    or nullif(btrim(p_status), '') is null
    or nullif(btrim(p_summary), '') is null then
    raise exception using errcode = '22023', message = 'Invalid WhatsApp status event.';
  end if;

  insert into public.labour_audit_logs (
    id,
    action,
    entity_type,
    entity_id,
    summary,
    actor,
    created_at
  ) values (
    'audit-whatsapp-status-' || p_event_key,
    'update',
    'jobApplications',
    p_message_id,
    p_summary,
    'WHATSAPP_WEBHOOK',
    coalesce(p_recorded_at, statement_timestamp())
  )
  on conflict (id) do nothing
  returning id into v_inserted_id;

  return query select v_inserted_id is not null, v_inserted_id is null;
end;
$function$;

comment on function public.record_labour_whatsapp_status_event(
  text,
  text,
  text,
  text,
  timestamptz
) is
  'Idempotently records a sanitized inbound Meta WhatsApp status audit using a deterministic non-secret SHA-256 event key.';

-- Reassert server-only access on the persistence tables used by these RPCs.
revoke all privileges on table
  public.labour_whatsapp_consents,
  public.labour_whatsapp_consent_events,
  public.labour_whatsapp_suppressions,
  public.labour_whatsapp_inbound_events,
  public.labour_audit_logs
from public, anon, authenticated;

-- Consent-event history is append-only for the application role.
revoke update, delete, truncate
on table public.labour_whatsapp_consent_events
from service_role;

grant select, insert
on table public.labour_whatsapp_consent_events
to service_role;

revoke all
on function public.process_labour_whatsapp_inbound_command(
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz
)
from public, anon, authenticated;

revoke all
on function public.record_labour_whatsapp_status_event(
  text,
  text,
  text,
  text,
  timestamptz
)
from public, anon, authenticated;

grant execute
on function public.process_labour_whatsapp_inbound_command(
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz
)
to service_role;

grant execute
on function public.record_labour_whatsapp_status_event(
  text,
  text,
  text,
  text,
  timestamptz
)
to service_role;
