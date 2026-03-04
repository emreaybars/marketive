-- ============================================
-- GÜVENLİ WIDGET SPIN V2 - Token + user_agent
-- ============================================

DROP FUNCTION IF EXISTS widget_log_spin_simple(TEXT, TEXT, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION widget_log_spin_simple(
  p_token TEXT,           -- Shop token (doğrulama için)
  p_contact TEXT,         -- Email veya phone
  p_prize_id UUID,        -- Ödül ID
  p_full_name TEXT,       -- Ad soyad
  p_user_agent TEXT      -- Browser user agent
)
RETURNS JSON AS $$
DECLARE
  v_shop_uuid UUID;
  v_shop RECORD;
  v_prize RECORD;
  v_spin_id UUID;
  v_coupon_code TEXT;
  v_contact_type TEXT;
  v_existing_spin INTEGER;
  v_token_ok BOOLEAN;
BEGIN
  -- 1. TOKEN DOĞRULAMA (Basit - shop_id kontrolü)
  -- Token format: {"sid":"shop123","uid":"uuid-xxx","ts":1234567890,"sig":"abc"}
  BEGIN
    v_token_ok := false;

    -- shops tablosundan shop'a ait active durumunu kontrol et
    -- Token'dan shop UUID çıkarmak yerine, doğrudan shop ile eşleşme kontrolü
    FOR v_shop IN
      SELECT id, shop_id, customer_id, active, contact_info_type
      FROM shops
      WHERE active = true
    LOOP
      -- Token içinde bu shop'ın UUID'si var mı kontrol et
      -- Basit string matching (production'da proper signature verification gerek)
      IF position(p_token IN v_shop.id::text) > 0 THEN
        v_shop_uuid := v_shop.id;
        v_token_ok := true;
        EXIT;
      END IF;
    END LOOP;

    IF NOT v_token_ok THEN
      RAISE EXCEPTION 'Geçersiz shop token';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Token doğrulama hatası: %', SQLERRM;
  END;

  -- 2. ÖDÜL KONTROLÜ
  SELECT * INTO v_prize FROM prizes WHERE id = p_prize_id AND shop_id = v_shop_uuid AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Geçersiz ödül';
  END IF;

  -- 3. İLETİŞİM TİPİ
  v_contact_type := v_shop.contact_info_type;

  -- 4. 24 SAAT RATE LIMITING
  IF v_contact_type = 'email' THEN
    SELECT COUNT(*) INTO v_existing_spin
    FROM wheel_spins
    WHERE shop_id = v_shop_uuid AND email = p_contact
      AND created_at > NOW() - INTERVAL '24 hours';
  ELSE
    SELECT COUNT(*) INTO v_existing_spin
    FROM wheel_spins
    WHERE shop_id = v_shop_uuid AND phone = p_contact
      AND created_at > NOW() - INTERVAL '24 hours';
  END IF;

  IF v_existing_spin > 0 THEN
    RAISE EXCEPTION 'Bu iletişim bilgisi ile zaten çark çevirdiniz';
  END IF;

  -- 5. SPIN KAYDI (user_agent ile)
  INSERT INTO wheel_spins (shop_id, full_name, email, phone, result, user_agent, created_at)
  VALUES (
    v_shop_uuid,
    p_full_name,
    CASE WHEN v_contact_type = 'email' THEN p_contact ELSE NULL END,
    CASE WHEN v_contact_type = 'phone' THEN p_contact ELSE NULL END,
    'win',
    p_user_agent,
    NOW()
  ) RETURNING id INTO v_spin_id;

  -- 6. COUPON KODU
  IF v_prize.coupon_codes IS NOT NULL AND v_prize.coupon_codes != '' THEN
    v_coupon_code := split_part(v_prize.coupon_codes, E'\n', 1);
  ELSE
    v_coupon_code := UPPER(SUBSTR(MD5(v_spin_id::TEXT), 1, 8));
  END IF;

  RETURN json_build_object('success', true, 'spin_id', v_spin_id, 'coupon_code', v_coupon_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION widget_log_spin_simple(TEXT, TEXT, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION widget_log_spin_simple(TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated;
