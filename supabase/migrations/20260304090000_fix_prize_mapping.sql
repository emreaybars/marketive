-- ============================================
-- GET_USER_WHEEL_SPINS - Result kolonu prize_id olarak kullanarak
-- ============================================

DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT);

CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS SETOF JSON AS $$
BEGIN
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
    'coupon_code', ww.coupon_code,
    'won_at', ws.created_at
  )::json
  FROM wheel_spins ws
  JOIN shops s ON s.id = ws.shop_id
  LEFT JOIN wheel_wins ww ON ww.spin_id = ws.id
  LEFT JOIN prizes p ON p.id = ww.prize_id
  WHERE s.customer_id = p_customer_id
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO authenticated;

-- ============================================
-- ESKİ SPİNLER İÇİN WHEEL_WINS BACKFILL
-- ============================================

-- Eski spinler için wheel_wins kayıtları (prize_id olmadığı için rastgele)
INSERT INTO wheel_wins (spin_id, prize_id, shop_id, coupon_code, created_at)
SELECT DISTINCT
  ws.id as spin_id,
  (SELECT id FROM prizes p WHERE p.shop_id = ws.shop_id AND p.active = true ORDER BY RANDOM() LIMIT 1)::UUID as prize_id,
  ws.shop_id,
  UPPER(SUBSTR(MD5(ws.id::TEXT), 1, 8)) as coupon_code,
  ws.created_at
FROM wheel_spins ws
WHERE ws.result = 'win'
  AND NOT EXISTS (
    SELECT 1 FROM wheel_wins ww WHERE ww.spin_id = ws.id
  )
  AND EXISTS (
    SELECT 1 FROM shops s WHERE s.id = ws.shop_id AND s.customer_id = p_customer_id
  );
