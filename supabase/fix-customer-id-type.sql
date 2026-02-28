-- ============================================
-- Fix customer_id type for Clerk compatibility
-- Clerk user IDs start with 'user_' prefix (e.g., user_xxx)
-- PostgreSQL UUID type doesn't accept this format
-- ============================================

-- Supabase SQL Editor'da çalıştırın:

-- 1. First, drop all RLS policies that depend on customer_id
DROP POLICY IF EXISTS "Users can view own shops" ON shops;
DROP POLICY IF EXISTS "Users can insert own shops" ON shops;
DROP POLICY IF EXISTS "Users can update own shops" ON shops;
DROP POLICY IF EXISTS "Users can delete own shops" ON shops;

-- 2. Drop the foreign key constraint if exists
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_customer_id_fkey;

-- 3. Change the column type from UUID to TEXT
ALTER TABLE shops ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

-- 4. Make the column nullable (for existing rows)
ALTER TABLE shops ALTER COLUMN customer_id DROP NOT NULL;

-- 5. Add comment
COMMENT ON COLUMN shops.customer_id IS 'Clerk user ID (user_xxx format)';

-- 6. Disable RLS (we use app-level filtering with Clerk)
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;

-- 7. Disable RLS on related tables too
ALTER TABLE widget_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check the column type
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'shops'
  AND column_name = 'customer_id';

-- Sample data
SELECT id, customer_id, name FROM shops LIMIT 5;
