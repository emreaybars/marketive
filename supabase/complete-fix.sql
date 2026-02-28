-- ============================================
-- COMPLETE FIX - Run this in Supabase SQL Editor
-- This fixes everything at once
-- ============================================

-- Step 1: Check and fix customer_id type if needed
DO $$
BEGIN
  -- Check if customer_id is still UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops'
    AND column_name = 'customer_id'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'Converting customer_id from UUID to TEXT...';

    -- Drop all dependencies
    DROP POLICY IF EXISTS "Users can %" ON shops;
    DROP POLICY IF EXISTS "Allow %" ON shops;
    DROP POLICY IF EXISTS "Enable %" ON shops;

    -- Drop foreign key if exists
    ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_customer_id_fkey;

    -- Change column type
    ALTER TABLE shops ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

    RAISE NOTICE 'customer_id converted to TEXT';
  ELSE
    RAISE NOTICE 'customer_id is already TEXT type';
  END IF;
END $$;

-- Step 2: Drop all existing RPC functions
DROP FUNCTION IF EXISTS get_user_shops(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_wheel_spins_simple(TEXT) CASCADE;

-- Step 3: Create get_user_shops with explicit type handling
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
  WHERE s.customer_id::text = p_customer_id::text  -- Explicit cast for safety
  ORDER BY s.created_at DESC;
END;
$$;

-- Step 4: Create get_user_wheel_spins with explicit type handling
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
  WHERE wp.shop_id IN (
    SELECT s.id::uuid FROM shops s WHERE s.customer_id::text = p_customer_id::text
  )
  ORDER BY wp.won_at DESC;
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_shops(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_shops(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO anon;

-- Step 6: Show results
SELECT '✓ customer_id type' as check_item,
       (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'shops' AND column_name = 'customer_id') as result
UNION ALL
SELECT '✓ get_user_shops function',
       (SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'get_user_shops')
UNION ALL
SELECT '✓ get_user_wheel_spins function',
       (SELECT COUNT(*)::text FROM pg_proc WHERE proname = 'get_user_wheel_spins');
