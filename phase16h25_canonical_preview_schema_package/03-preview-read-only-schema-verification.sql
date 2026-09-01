-- PHASE 16H.11 READ-ONLY POST-APPLICATION VERIFICATION
-- Expected:
-- tables=32
-- functions=4
-- rls_enabled_tables=32
-- policies=0
-- security_definer_functions=0
-- client_table_grants=0

select jsonb_pretty(
    jsonb_build_object(
        'database', current_database(),
        'public_tables', (
            select count(*)
            from pg_catalog.pg_class c
            join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
              and c.relkind in ('r', 'p')
        ),
        'public_functions', (
            select count(*)
            from pg_catalog.pg_proc p
            join pg_catalog.pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public'
              and p.prokind = 'f'
        ),
        'security_definer_functions', (
            select count(*)
            from pg_catalog.pg_proc p
            join pg_catalog.pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public'
              and p.prokind = 'f'
              and p.prosecdef
        ),
        'rls_enabled_tables', (
            select count(*)
            from pg_catalog.pg_class c
            join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
              and c.relkind in ('r', 'p')
              and c.relrowsecurity
        ),
        'public_policies', (
            select count(*)
            from pg_catalog.pg_policy pol
            join pg_catalog.pg_class c on c.oid = pol.polrelid
            join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
        ),
        'client_table_grants', (
            select count(*)
            from information_schema.role_table_grants
            where table_schema = 'public'
              and grantee in ('anon', 'authenticated')
        )
    )
) as phase16h11_verification;
