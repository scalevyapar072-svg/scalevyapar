-- Record the WhatsApp table privilege hardening that was applied manually in
-- Production after the initial table-creation migration.
--
-- These tables inherited browser-role table privileges from existing public
-- schema default ACLs. Service-role access must remain available for future
-- server-only Admin APIs.
--
-- RLS and existing policy state are intentionally left unchanged here.
-- Future WhatsApp table migrations must explicitly revoke browser-role access
-- on newly created tables and any owned sequences.
--
-- This migration is safe to run when the privileges are already absent.

revoke all privileges on table
  public.labour_whatsapp_consents,
  public.labour_whatsapp_consent_events,
  public.labour_whatsapp_suppressions,
  public.labour_whatsapp_inbound_events,
  public.labour_whatsapp_template_inventory,
  public.labour_whatsapp_settings
from anon, authenticated, public;
