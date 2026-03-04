-- ============================================
-- LOG_WHEEL_SPIN RPC Function
-- Widget spin kaydı için fonksiyon
-- ============================================

DROP FUNCTION IF EXISTS log_wheel_spin(TEXT, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION log_wheel_spin(
  p_shop_uuid TEXT,
  p_prize_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_spin_id UUID;
  v_prize RECORD;
  v_coupon_code TEXT;
BEGIN
  -- Shop aktif mi kontrol et
  IF NOT EXISTS (SELECT 1 FROM shops WHERE id = p_shop_uuid AND active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Geçersiz veya aktif olmayan shop');
  END IF;

  -- Ödül bilgilerini al
  SELECT * INTO v_prize
  FROM prizes
  WHERE id = p_prize_id
    AND shop_id = p_shop_uuid
    AND active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Geçersiz ödül');
  END IF;

  -- Spin kaydı oluştur
  INSERT INTO wheel_spins (shop_id, full_name, email, phone, created_at)
  VALUES (p_shop_uuid, p_full_name, p_email, p_phone, NOW())
  RETURNING id INTO v_spin_id;

  -- Coupon kodu oluştur
  IF v_prize.coupon_codes IS NOT NULL AND v_prize.coupon_codes != '' THEN
    -- İlk kupon kodunu al
    v_coupon_code := split_part(v_prize.coupon_codes, E'\n', 1);
  ELSE
    -- Rastgele kupon kodu oluştur
    v_coupon_code := UPPER(SUBSTR(MD5(v_spin_id::TEXT), 1, 8));
  END IF;

  -- Wheel wins kaydı oluştur (ödül bilgisiyle)
  INSERT INTO wheel_wins (spin_id, prize_id, shop_id, coupon_code, created_at)
  VALUES (v_spin_id, p_prize_id, p_shop_uuid, v_coupon_code, NOW());

  RETURN json_build_object(
    'success', true,
    'spin_id', v_spin_id,
    'coupon_code', v_coupon_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anonim erişime izin ver (widget kullanımı için)
GRANT EXECUTE ON FUNCTION log_wheel_spin(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION log_wheel_spin(JSONB) TO authenticated;

-- GÜVENLİK NOTLARI:
-- 1. Bu fonksiyon SECURITY DEFINER ile çalışır
-- 2. Shop ve prize active kontrolü yapar
-- 3. Hem wheel_spins hem de wheel_wins tablosuna kayıt ekler
