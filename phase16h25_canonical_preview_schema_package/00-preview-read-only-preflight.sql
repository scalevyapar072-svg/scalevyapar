-- PHASE 16H.11 READ-ONLY PREVIEW PREFLIGHT
-- Expected before application:
-- tables=0, functions=0, policies=0

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
        'public_policies', (
            select count(*)
            from pg_catalog.pg_policy pol
            join pg_catalog.pg_class c on c.oid = pol.polrelid
            join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
        )
    )
) as phase16h11_preflight;
