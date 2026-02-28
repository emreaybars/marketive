-- ============================================
-- Fix customer_id type for Clerk compatibility
-- Clerk user IDs start with 'user_' prefix (e.g., user_xxx)
-- PostgreSQL UUID type doesn't accept this format
-- ============================================

-- Supabase SQL Editor'da çalıştırın:

-- 1. Drop the foreign key constraint if exists
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_customer_id_fkey;

-- 2. Change the column type from UUID to TEXT
ALTER TABLE shops ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

-- 3. Add comment
COMMENT ON COLUMN shops.customer_id IS 'Clerk user ID (user_xxx format)';

-- 4. Since Clerk handles auth, disable RLS for now (app-level filtering)
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;

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
