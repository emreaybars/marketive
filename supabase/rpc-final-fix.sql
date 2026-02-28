-- ============================================
-- FINAL FIX - Recreate RPC Functions with proper types
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing functions completely
DROP FUNCTION IF EXISTS get_user_shops(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_wheel_spins_simple(TEXT) CASCADE;

-- ============================================
-- RPC Function: Get User's Shops
-- Returns shop data for authenticated user only
-- ============================================
CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
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
  WHERE s.customer_id = p_customer_id
  ORDER BY s.created_at DESC;
END;
$$;

-- ============================================
-- RPC Function: Get User's Wheel Spins
-- Returns spin data for user's own shops only
-- Uses JSONB to avoid type issues
-- ============================================
CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'spin_id', wp.id,
    'shop_id', wp.shop_id::text,  -- Cast UUID to text
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
    SELECT s.id::text FROM shops s WHERE s.customer_id = p_customer_id
  )
  ORDER BY wp.won_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_shops(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_shops(TEXT) TO anon;

GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO anon;

-- Verify functions are created
SELECT
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('get_user_shops', 'get_user_wheel_spins');
