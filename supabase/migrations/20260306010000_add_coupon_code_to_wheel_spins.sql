-- ============================================
-- WHEEL_SPINS TABLOSUNA COUPON_CODE EKLE
-- ============================================

-- 1. coupon_code kolonu ekle (varsa atla)
ALTER TABLE wheel_spins 
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- 2. Gelecekteki spin'ler için DEFAULT değer
ALTER TABLE wheel_spins 
ALTER COLUMN coupon_code SET DEFAULT NULL;

-- 3. İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_wheel_spins_coupon_code ON wheel_spins(coupon_code);

-- ============================================
-- get_user_wheel_spins RPC FONKSİYONUNU GÜNCELLE
-- Direct olarak wheel_spins'ten coupon_code al
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
    'prize_name', COALESCE(ws.prize_name, 'Bilinmeyen Ödül'),
    'coupon_code', ws.coupon_code,
    'won_at', ws.created_at
  )::json
  FROM wheel_spins ws
  JOIN shops s ON s.id = ws.shop_id
  WHERE s.customer_id = p_customer_id
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO authenticated;
