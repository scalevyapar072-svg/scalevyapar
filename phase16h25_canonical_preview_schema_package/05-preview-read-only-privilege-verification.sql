-- PHASE 16H.16 READ-ONLY POST-CORRECTION VERIFICATION
-- FUTURE AUTHORIZED TARGET ONLY: rtftsavrplygvvdsrmrp
-- Expected after a separately approved correction:
-- tables=32; functions=4; rls_enabled_tables=32; policies=0
-- direct_client_table_privileges=0
-- direct_client_sequence_privileges=0
-- direct_client_function_privileges=0
-- unsafe_client_default_privileges=0
-- service_role_tables_with_direct_privileges=32

with
client_roles as (
  select oid
  from pg_catalog.pg_roles
  where rolname in ('anon', 'authenticated')
),
service_role_oid as (
  select oid
  from pg_catalog.pg_roles
  where rolname = 'service_role'
),
public_tables as (
  select c.oid, c.relacl
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
),
public_sequences as (
  select c.oid, c.relacl
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'S'
),
public_functions as (
  select p.oid, p.proacl
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
),
direct_client_table_privileges as (
  select count(*)::bigint as items
  from public_tables t
  cross join lateral pg_catalog.aclexplode(t.relacl) a
  where a.grantee in (select oid from client_roles)
),
direct_client_sequence_privileges as (
  select count(*)::bigint as items
  from public_sequences s
  cross join lateral pg_catalog.aclexplode(s.relacl) a
  where a.grantee in (select oid from client_roles)
),
direct_client_function_privileges as (
  select count(*)::bigint as items
  from public_functions f
  cross join lateral pg_catalog.aclexplode(f.proacl) a
  where a.grantee in (select oid from client_roles)
),
unsafe_client_default_privileges as (
  select count(*)::bigint as items
  from pg_catalog.pg_default_acl d
  join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
  cross join lateral pg_catalog.aclexplode(d.defaclacl) a
  where pg_catalog.pg_get_userbyid(d.defaclrole) = 'postgres'
    and n.nspname = 'public'
    and d.defaclobjtype in ('r', 'S', 'f')
    and a.grantee in (select oid from client_roles)
),
service_role_tables_with_direct_privileges as (
  select count(distinct t.oid)::bigint as items
  from public_tables t
  cross join lateral pg_catalog.aclexplode(t.relacl) a
  where a.grantee = (select oid from service_role_oid)
),
rls_enabled_tables as (
  select count(*)::bigint as items
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and c.relrowsecurity
),
public_policies as (
  select count(*)::bigint as items
  from pg_catalog.pg_policy pol
  join pg_catalog.pg_class c on c.oid = pol.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
)
select jsonb_pretty(
  jsonb_build_object(
    'database', current_database(),
    'public_tables', (select count(*) from public_tables),
    'public_functions', (select count(*) from public_functions),
    'rls_enabled_tables', (select items from rls_enabled_tables),
    'public_policies', (select items from public_policies),
    'direct_client_table_privileges', (select items from direct_client_table_privileges),
    'direct_client_sequence_privileges', (select items from direct_client_sequence_privileges),
    'direct_client_function_privileges', (select items from direct_client_function_privileges),
    'unsafe_client_default_privileges', (select items from unsafe_client_default_privileges),
    'service_role_tables_with_direct_privileges', (select items from service_role_tables_with_direct_privileges)
  )
) as phase16h16_verification;
