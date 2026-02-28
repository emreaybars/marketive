-- ============================================
-- Fix customer_id type for Clerk compatibility
-- ============================================

-- DROP ALL policies on shops table (using wildcard)
DROP POLICY IF EXISTS "Users can %" ON shops;
DROP POLICY IF EXISTS "Allow %" ON shops;
DROP POLICY IF EXISTS "Enable %" ON shops;

-- Do the same for all related tables
DROP POLICY IF EXISTS "Users can %" ON widget_settings;
DROP POLICY IF EXISTS "Allow %" ON widget_settings;
DROP POLICY IF EXISTS "Enable %" ON widget_settings;

DROP POLICY IF EXISTS "Users can %" ON prizes;
DROP POLICY IF EXISTS "Allow %" ON prizes;
DROP POLICY IF EXISTS "Enable %" ON prizes;

DROP POLICY IF EXISTS "Users can %" ON wheel_spins;
DROP POLICY IF EXISTS "Allow %" ON wheel_spins;
DROP POLICY IF EXISTS "Enable %" ON wheel_spins;

DROP POLICY IF EXISTS "Users can %" ON wheel_wins;
DROP POLICY IF EXISTS "Allow %" ON wheel_wins;
DROP POLICY IF EXISTS "Enable %" ON wheel_wins;

DROP POLICY IF EXISTS "Users can %" ON won_prizes;
DROP POLICY IF EXISTS "Allow %" ON won_prizes;
DROP POLICY IF EXISTS "Enable %" ON won_prizes;

DROP POLICY IF EXISTS "Users can %" ON widget_views;
DROP POLICY IF EXISTS "Allow %" ON widget_views;
DROP POLICY IF EXISTS "Enable %" ON widget_views;

DROP POLICY IF EXISTS "Users can %" ON coupons;
DROP POLICY IF EXISTS "Allow %" ON coupons;
DROP POLICY IF EXISTS "Enable %" ON coupons;

DROP POLICY IF EXISTS "Users can %" ON analytics_cache;
DROP POLICY IF EXISTS "Allow %" ON analytics_cache;
DROP POLICY IF EXISTS "Enable %" ON analytics_cache;

-- Drop all foreign key constraints
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_customer_id_fkey;
ALTER TABLE widget_settings DROP CONSTRAINT IF EXISTS widget_settings_shop_id_fkey;
ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_shop_id_fkey;
ALTER TABLE won_prizes DROP CONSTRAINT IF EXISTS won_prizes_shop_id_fkey;
ALTER TABLE won_prizes DROP CONSTRAINT IF EXISTS won_prizes_spin_id_fkey;
ALTER TABLE wheel_spins DROP CONSTRAINT IF EXISTS wheel_spins_shop_id_fkey;
ALTER TABLE widget_views DROP CONSTRAINT IF EXISTS widget_views_shop_id_fkey;
ALTER TABLE wheel_wins DROP CONSTRAINT IF EXISTS wheel_wins_shop_id_fkey;
ALTER TABLE analytics_cache DROP CONSTRAINT IF EXISTS analytics_cache_shop_id_fkey;
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_shop_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE shops ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

-- Make the column nullable
ALTER TABLE shops ALTER COLUMN customer_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN shops.customer_id IS 'Clerk user ID';

-- Disable RLS on all tables
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins DISABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_wins DISABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE widget_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache DISABLE ROW LEVEL SECURITY;
