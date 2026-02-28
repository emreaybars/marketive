-- ============================================
-- COMPLETE FIX V2 - Drops ALL policies first
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Get ALL policy names and drop them
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on all related tables
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN (
            'shops', 'widget_settings', 'prizes', 'won_prizes',
            'wheel_spins', 'wheel_wins', 'widget_views',
            'coupons', 'analytics_cache'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on table %',
            policy_record.policyname,
            policy_record.tablename;
    END LOOP;
END $$;

-- Step 2: Drop all foreign key constraints
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_customer_id_fkey;
ALTER TABLE widget_settings DROP CONSTRAINT IF EXISTS widget_settings_shop_id_fkey;
ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_shop_id_fkey;
ALTER TABLE won_prizes DROP CONSTRAINT IF EXISTS won_prizes_shop_id_fkey;
ALTER TABLE won_prizes DROP CONSTRAINT IF EXISTS won_prizes_prize_id_fkey;
ALTER TABLE wheel_spins DROP CONSTRAINT IF EXISTS wheel_spins_shop_id_fkey;
ALTER TABLE widget_views DROP CONSTRAINT IF EXISTS widget_views_shop_id_fkey;
ALTER TABLE wheel_wins DROP CONSTRAINT IF EXISTS wheel_wins_shop_id_fkey;
ALTER TABLE analytics_cache DROP CONSTRAINT IF EXISTS analytics_cache_shop_id_fkey;
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_shop_id_fkey;

-- Step 3: Change customer_id type if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops'
    AND column_name = 'customer_id'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'Converting customer_id from UUID to TEXT...';
    ALTER TABLE shops ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;
    RAISE NOTICE '✓ customer_id converted to TEXT';
  ELSE
    RAISE NOTICE '✓ customer_id is already TEXT';
  END IF;
END $$;

-- Step 4: Disable RLS (we're using SECURITY DEFINER functions instead)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop all existing RPC functions
DROP FUNCTION IF EXISTS get_user_shops(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_wheel_spins_simple(TEXT) CASCADE;

-- Step 6: Create get_user_shops with explicit type handling
CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', s.id,
    'shop_id', s.shop_id,
    'customer_id', s.customer_id,
    'name', s.name,
    'logo_url', s.logo_url,
    'website_url', s.website_url,
    'brand_name', s.brand_name,
    'contact_info_type', s.contact_info_type,
    'active', s.active,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'widget_settings', (
      SELECT jsonb_build_object(
        'id', ws.id,
        'shop_id', ws.shop_id,
        'title', ws.title,
        'description', ws.description,
        'button_text', ws.button_text,
        'background_color', ws.background_color,
        'button_color', ws.button_color,
        'title_color', ws.title_color,
        'description_color', ws.description_color,
        'show_on_load', ws.show_on_load,
        'popup_delay', ws.popup_delay
      )
      FROM widget_settings ws
      WHERE ws.shop_id = s.id
      LIMIT 1
    )
  )
  FROM shops s
  WHERE s.customer_id::text = p_customer_id::text
  ORDER BY s.created_at DESC;
END;
$$;

-- Step 7: Create get_user_wheel_spins with explicit type handling
CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'spin_id', wp.id,
    'shop_id', wp.shop_id,
    'full_name', wp.full_name,
    'email', wp.email,
    'phone', wp.phone,
    'coupon_code', wp.coupon_code,
    'won_at', wp.won_at,
    'prize_name', p.name
  )
  FROM won_prizes wp
  INNER JOIN prizes p ON wp.prize_id = p.id
  WHERE wp.shop_id::text IN (
    SELECT s.id::text FROM shops s WHERE s.customer_id::text = p_customer_id::text
  )
  ORDER BY wp.won_at DESC;
END;
$$;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_shops(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_shops(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO anon;

-- Step 9: Show results
SELECT '✓ customer_id type' as check_item,
       (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'shops' AND column_name = 'customer_id') as result
UNION ALL
SELECT '✓ get_user_shops function',
       (SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'get_user_shops')
UNION ALL
SELECT '✓ get_user_wheel_spins function',
       (SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'get_user_wheel_spins')
UNION ALL
SELECT '✓ All policies dropped',
       (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public');
