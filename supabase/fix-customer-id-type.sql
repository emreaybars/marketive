-- ============================================
-- Fix customer_id type for Clerk compatibility
-- Clerk user IDs start with 'user_' prefix (e.g., user_xxx)
-- PostgreSQL UUID type doesn't accept this format
-- ============================================

-- Supabase SQL Editor'da çalıştırın:

-- 1. DROP ALL RLS POLICIES FIRST
DROP POLICY IF EXISTS "Users can view own shops" ON shops;
DROP POLICY IF EXISTS "Users can insert own shops" ON shops;
DROP POLICY IF EXISTS "Users can update own shops" ON shops;
DROP POLICY IF EXISTS "Users can delete own shops" ON shops;
DROP POLICY IF EXISTS "Users can view own shop widget_settings" ON widget_settings;
DROP POLICY IF EXISTS "Users can modify own shop widget_settings" ON widget_settings;
DROP POLICY IF EXISTS "Users can view own shop prizes" ON prizes;
DROP POLICY IF EXISTS "Users can modify own shop prizes" ON prizes;
DROP POLICY IF EXISTS "Users can view own shop wheel_spins" ON wheel_spins;
DROP POLICY IF EXISTS "Users can insert own shop wheel_spins" ON wheel_spins;
DROP POLICY IF EXISTS "Users can view own shop wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Users can view own shop won_prizes" ON won_prizes;
DROP POLICY IF EXISTS "Users can view own shop widget_views" ON widget_views;
DROP POLICY IF EXISTS "Users can insert own shop widget_views" ON widget_views;
DROP POLICY IF EXISTS "Users can view own shop analytics" ON analytics_cache;
DROP POLICY IF EXISTS "Users can view own shop coupons" ON coupons;

-- 2. Drop all foreign key constraints
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

-- 3. Change the column type from UUID to TEXT
ALTER TABLE shops ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

-- 4. Make the column nullable
ALTER TABLE shops ALTER COLUMN customer_id DROP NOT NULL;

-- 5. Add comment
COMMENT ON COLUMN shops.customer_id IS 'Clerk user ID (user_xxx format)';

-- 6. Disable RLS on ALL tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Then immediately DISABLE since we use app-level filtering with Clerk
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins DISABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_wins DISABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE widget_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache DISABLE ROW LEVEL SECURITY;
