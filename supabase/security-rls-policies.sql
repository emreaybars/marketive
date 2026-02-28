-- ============================================
-- SECURITY: Row Level Security Policies
-- Users can only access their own data
-- ============================================

-- IMPORTANT: Run this in Supabase SQL Editor
-- This ensures database-level security even if client code is bypassed

-- First, make sure RLS is enabled
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHOPS TABLE - Users can only see their own shops
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own shops" ON shops;
DROP POLICY IF EXISTS "Users can insert own shops" ON shops;
DROP POLICY IF EXISTS "Users can update own shops" ON shops;
DROP POLICY IF EXISTS "Users can delete own shops" ON shops;

-- Users can view only their own shops
CREATE POLICY "Users can view own shops" ON shops
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Users can insert shops for themselves
CREATE POLICY "Users can insert own shops" ON shops
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Users can update only their own shops
CREATE POLICY "Users can update own shops" ON shops
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Users can delete only their own shops
CREATE POLICY "Users can delete own shops" ON shops
  FOR DELETE
  USING (auth.uid() = customer_id);

-- ============================================
-- WIDGET SETTINGS - Inherit from shops
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own shop widget_settings" ON widget_settings;
DROP POLICY IF EXISTS "Users can modify own shop widget_settings" ON widget_settings;

-- Users can view widget_settings for their shops only
CREATE POLICY "Users can view own shop widget_settings" ON widget_settings
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- Users can modify widget_settings for their shops only
CREATE POLICY "Users can modify own shop widget_settings" ON widget_settings
  FOR ALL
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- ============================================
-- PRIZES - Inherit from shops
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own shop prizes" ON prizes;
DROP POLICY IF EXISTS "Users can modify own shop prizes" ON prizes;

-- Users can view prizes for their shops only
CREATE POLICY "Users can view own shop prizes" ON prizes
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- Users can modify prizes for their shops only
CREATE POLICY "Users can modify own shop prizes" ON prizes
  FOR ALL
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- ============================================
-- WHEEL SPINS - Users can view spins for their shops
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own shop wheel_spins" ON wheel_spins;
DROP POLICY IF EXISTS "Users can insert own shop wheel_spins" ON wheel_spins;

-- Users can view spins for their shops only
CREATE POLICY "Users can view own shop wheel_spins" ON wheel_spins
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- RPC functions handle inserts, but just in case
CREATE POLICY "Users can insert own shop wheel_spins" ON wheel_spins
  FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- ============================================
-- WON PRIZES - Users can view wins for their shops
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own shop won_prizes" ON won_prizes;

-- Users can view won_prizes for their shops only
CREATE POLICY "Users can view own shop won_prizes" ON won_prizes
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- RPC functions handle inserts
-- No insert policy needed - SECURITY DEFINER functions bypass RLS

-- ============================================
-- WIDGET VIEWS - Users can view views for their shops
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own shop widget_views" ON widget_views;
DROP POLICY IF EXISTS "Users can insert own shop widget_views" ON widget_views;

-- Users can view widget_views for their shops only
CREATE POLICY "Users can view own shop widget_views" ON widget_views
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE customer_id = auth.uid()
    )
  );

-- RPC functions handle inserts

-- ============================================
-- VERIFICATION QUERY
-- Run this to verify RLS is working correctly
-- ============================================

-- This should return only YOUR shops when logged in
-- SELECT * FROM shops;

-- This should return YOUR shops' widget_settings
-- SELECT ws.* FROM widget_settings ws
-- JOIN shops s ON ws.shop_id = s.id
-- WHERE s.customer_id = auth.uid();

COMMENT ON POLICY "Users can view own shops" ON shops IS
  'Security: Users can only view their own shops, not others';
COMMENT ON POLICY "Users can insert own shops" ON shops IS
  'Security: Users can only create shops for themselves';
COMMENT ON POLICY "Users can update own shops" ON shops IS
  'Security: Users can only update their own shops';
COMMENT ON POLICY "Users can delete own shops" ON shops IS
  'Security: Users can only delete their own shops';
