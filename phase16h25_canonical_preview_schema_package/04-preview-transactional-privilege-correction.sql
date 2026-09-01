-- PHASE 16H.16 LOCAL CORRECTIVE CANDIDATE
-- FUTURE AUTHORIZED TARGET ONLY: rtftsavrplygvvdsrmrp
-- STATIC REVIEW ONLY. DO NOT EXECUTE WITHOUT SEPARATE PREVIEW APPROVAL.
-- Purpose: remove confirmed direct and default object privileges from anon and authenticated.
-- Preserves object ownership, postgres privileges, service_role privileges, schema objects, RLS, and data.

begin;

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all privileges on functions from anon, authenticated;

revoke all privileges on all tables in schema public
  from anon, authenticated;

revoke all privileges on all sequences in schema public
  from anon, authenticated;

revoke all privileges on all functions in schema public
  from anon, authenticated;

commit;
