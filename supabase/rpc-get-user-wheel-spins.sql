-- ============================================
-- RPC Function: Get User's Wheel Spins
-- Returns spin data for user's own shops only
-- ============================================

CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS TABLE (
  id UUID,
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
    wp.id,
    wp.shop_id,
    wp.full_name,
    wp.email,
    wp.phone,
    wp.coupon_code,
    wp.won_at,
    p.name as prize_name
  FROM won_prizes wp
  JOIN prizes p ON wp.prize_id = p.id
  WHERE wp.shop_id IN (
    SELECT id FROM shops WHERE customer_id = p_customer_id
  )
  ORDER BY wp.won_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_wheel_spins TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wheel_spins TO anon;

-- ============================================
-- Alternative simpler version without JOIN if needed
-- ============================================

CREATE OR REPLACE FUNCTION get_user_wheel_spins_simple(p_customer_id TEXT)
RETURNS SETOF won_prizes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT wp.*
  FROM won_prizes wp
  WHERE wp.shop_id IN (
    SELECT id FROM shops WHERE customer_id = p_customer_id
  )
  ORDER BY wp.won_at DESC;
END;
$$;
