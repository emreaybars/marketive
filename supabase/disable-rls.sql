-- ============================================
-- RLS POLICY FIX - Force Disable RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL policies first
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('shops', 'widget_settings', 'prizes', 'won_prizes', 'wheel_spins', 'widget_views')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 2: Force disable RLS on all tables
ALTER TABLE IF EXISTS shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widget_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS won_prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wheel_spins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widget_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wheel_wins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify
SELECT
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('shops', 'widget_settings', 'prizes', 'won_prizes', 'wheel_spins', 'widget_views')
ORDER BY tablename;
