-- ============================================
-- RLS Policies for Marketive Çarkıfelek
-- Run these in Supabase SQL Editor
-- This drops existing policies and creates new ones
-- ============================================

-- ============================================
-- DROP EXISTING POLICIES
-- ============================================

-- Drop existing shops policies
DROP POLICY IF EXISTS "Allow authenticated users to insert shops" ON shops;
DROP POLICY IF EXISTS "Allow users to view own shops" ON shops;
DROP POLICY IF EXISTS "Allow users to update own shops" ON shops;
DROP POLICY IF EXISTS "Allow users to delete own shops" ON shops;

-- Drop existing widget_settings policies
DROP POLICY IF EXISTS "Allow authenticated users to insert widget settings" ON widget_settings;
DROP POLICY IF EXISTS "Allow all to view widget settings" ON widget_settings;
DROP POLICY IF EXISTS "Allow users to update widget settings" ON widget_settings;

-- Drop existing prizes policies
DROP POLICY IF EXISTS "Allow authenticated users to insert prizes" ON prizes;
DROP POLICY IF EXISTS "Allow all to view prizes" ON prizes;
DROP POLICY IF EXISTS "Allow users to update prizes" ON prizes;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHOPS TABLE POLICIES
-- ============================================

-- Allow authenticated users to insert shops
CREATE POLICY "Allow authenticated users to insert shops"
ON shops
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own shops
CREATE POLICY "Allow users to view own shops"
ON shops
FOR SELECT
TO authenticated
USING (
  customer_id IS NULL  -- Allow viewing shops without customer (for testing)
  OR customer_id = auth.uid()
);

-- Allow users to update their own shops
CREATE POLICY "Allow users to update own shops"
ON shops
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid() OR customer_id IS NULL)
WITH CHECK (customer_id = auth.uid() OR customer_id IS NULL);

-- Allow users to delete their own shops
CREATE POLICY "Allow users to delete own shops"
ON shops
FOR DELETE
TO authenticated
USING (customer_id = auth.uid() OR customer_id IS NULL);

-- ============================================
-- WIDGET SETTINGS POLICIES
-- ============================================

-- Allow authenticated users to insert widget settings
CREATE POLICY "Allow authenticated users to insert widget settings"
ON widget_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view widget settings for any shop (for widget functionality)
CREATE POLICY "Allow all to view widget settings"
ON widget_settings
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update widget settings
CREATE POLICY "Allow users to update widget settings"
ON widget_settings
FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- PRIZES POLICIES
-- ============================================

-- Allow authenticated users to insert prizes
CREATE POLICY "Allow authenticated users to insert prizes"
ON prizes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view prizes for any shop (for widget functionality)
CREATE POLICY "Allow all to view prizes"
ON prizes
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update prizes
CREATE POLICY "Allow users to update prizes"
ON prizes
FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- TEMPORARY: Disable RLS for testing (OPTIONAL)
-- Uncomment below to disable RLS temporarily for testing
-- WARNING: Do NOT use this in production!
-- ============================================

-- ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE widget_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE prizes DISABLE ROW LEVEL SECURITY;
