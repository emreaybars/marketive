-- ============================================
-- GET_USER_WHEEL_SPINS - Limit parametresi ekle
-- ============================================

-- RPC fonksiyonunu güncelle - limit parametresi ile
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT);

CREATE OR REPLACE FUNCTION get_user_wheel_spins(
  p_customer_id TEXT,
  p_limit INTEGER DEFAULT 1000000
)
RETURNS SETOF JSON AS $$
BEGIN
  -- GÜVENLİK: Sadece kendi verilerinizi isteyebilirsiniz
  IF p_customer_id IS NULL OR p_customer_id != auth.uid()::text THEN
    RAISE EXCEPTION 'Yetkisiz erişim';
  END IF;

  RETURN QUERY
  SELECT json_build_object(
    'spin_id', ws.id,
    'shop_id', ws.shop_id,
    'full_name', ws.full_name,
    'email', ws.email,
    'phone', ws.phone,
    'prize_name', COALESCE(p.name, 'Bilinmeyen Ödül'),
    'coupon_code', ws.coupon_code,
    'won_at', ws.created_at,
    'order_amount', COALESCE(ws.order_amount, 0)
  )::json
  FROM wheel_spins ws
  JOIN shops s ON s.id = ws.shop_id
  LEFT JOIN prizes p ON p.id::text = ws.result
  WHERE s.customer_id = p_customer_id
  ORDER BY ws.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT, INTEGER) TO authenticated;
