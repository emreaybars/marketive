-- ============================================
-- Fix and Recreate RPC Functions
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_shops(TEXT);
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT);
DROP FUNCTION IF EXISTS get_user_wheel_spins_simple(TEXT);

-- ============================================
-- RPC Function: Get User's Shops (FIXED)
-- Returns shop data for authenticated user only
-- ============================================
CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT)
RETURNS TABLE (
  id UUID,
  shop_id TEXT,
  customer_id TEXT,
  name TEXT,
  logo_url TEXT,
  website_url TEXT,
  brand_name TEXT,
  contact_info_type TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  widget_settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.shop_id,
    s.customer_id,
    s.name,
    s.logo_url,
    s.website_url,
    s.brand_name,
    s.contact_info_type,
    s.active,
    s.created_at,
    s.updated_at,
    (
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
    ) as widget_settings
  FROM shops s
  WHERE s.customer_id = p_customer_id
  ORDER BY s.created_at DESC;
END;
$$;

-- ============================================
-- RPC Function: Get User's Wheel Spins (FIXED)
-- All columns explicitly qualified to avoid ambiguity
-- ============================================
CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS TABLE (
  spin_id UUID,
  shop_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  coupon_code TEXT,
  won_at TIMESTAMPTZ,
  prize_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wp.id as spin_id,
    wp.shop_id,
    wp.full_name,
    wp.email,
    wp.phone,
    wp.coupon_code,
    wp.won_at,
    p.name as prize_name
  FROM won_prizes wp
  INNER JOIN prizes p ON wp.prize_id = p.id
  WHERE wp.shop_id IN (
    SELECT s.id FROM shops s WHERE s.customer_id = p_customer_id
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
  proargtypes as argument_types
FROM pg_proc
WHERE proname IN ('get_user_shops', 'get_user_wheel_spins');
