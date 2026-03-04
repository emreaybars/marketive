-- ============================================
-- BASITLEŞTIRILMIŞ WIDGET SPIN RPC (Geçici)
-- Token doğrulamasız, doğrudan shop_uuid ile
-- ============================================

DROP FUNCTION IF EXISTS widget_log_spin_simple(UUID, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION widget_log_spin_simple(
  p_shop_uuid UUID,
  p_contact TEXT,
  p_prize_id UUID,
  p_full_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_shop RECORD;
  v_prize RECORD;
  v_spin_id UUID;
  v_coupon_code TEXT;
  v_contact_type TEXT;
  v_existing_spin INTEGER;
BEGIN
  -- 1. SHOP AKTİFLİK KONTROLÜ
  SELECT * INTO v_shop FROM shops WHERE id = p_shop_uuid AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Geçersiz shop';
  END IF;

  -- 2. ÖDÜL KONTROLÜ
  SELECT * INTO v_prize FROM prizes WHERE id = p_prize_id AND shop_id = p_shop_uuid AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Geçersiz ödül';
  END IF;

  -- 3. İLETİŞİM TİPİ
  v_contact_type := v_shop.contact_info_type;

  -- 4. 24 SAAT RATE LIMITING
  IF v_contact_type = 'email' THEN
    SELECT COUNT(*) INTO v_existing_spin
    FROM wheel_spins
    WHERE shop_id = p_shop_uuid AND email = p_contact
      AND created_at > NOW() - INTERVAL '24 hours';
  ELSE
    SELECT COUNT(*) INTO v_existing_spin
    FROM wheel_spins
    WHERE shop_id = p_shop_uuid AND phone = p_contact
      AND created_at > NOW() - INTERVAL '24 hours';
  END IF;

  IF v_existing_spin > 0 THEN
    RAISE EXCEPTION 'Bu iletişim bilgisi ile zaten çark çevirdiniz';
  END IF;

  -- 5. SPIN KAYDI (result kolonu dahil)
  INSERT INTO wheel_spins (shop_id, full_name, email, phone, result, created_at)
  VALUES (
    p_shop_uuid,
    p_full_name,
    CASE WHEN v_contact_type = 'email' THEN p_contact ELSE NULL END,
    CASE WHEN v_contact_type = 'phone' THEN p_contact ELSE NULL END,
    'win',  -- result kolonu: win/lose/etc
    NOW()
  ) RETURNING id INTO v_spin_id;

  -- 6. COUPON KODU
  IF v_prize.coupon_codes IS NOT NULL AND v_prize.coupon_codes != '' THEN
    v_coupon_code := split_part(v_prize.coupon_codes, E'\n', 1);
  ELSE
    v_coupon_code := UPPER(SUBSTR(MD5(v_spin_id::TEXT), 1, 8));
  END IF;

  -- 7. WHEEL WINS KAYDI
  INSERT INTO wheel_wins (spin_id, prize_id, shop_id, coupon_code, created_at)
  VALUES (v_spin_id, p_prize_id, p_shop_uuid, v_coupon_code, NOW());

  RETURN json_build_object('success', true, 'spin_id', v_spin_id, 'coupon_code', v_coupon_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION widget_log_spin_simple(UUID, TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION widget_log_spin_simple(UUID, TEXT, UUID, TEXT) TO authenticated;
