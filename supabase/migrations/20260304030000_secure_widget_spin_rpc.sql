-- ============================================
-- GÜVENLİ WIDGET SPIN RPC FUNCTION
-- Token doğrulaması ve validation ile güvenli spin kaydı
-- ============================================

DROP FUNCTION IF EXISTS widget_log_spin(TEXT, TEXT, UUID, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION widget_log_spin(
  p_token TEXT,
  p_contact TEXT,
  p_prize_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_token_json JSONB;
  v_decoded_text TEXT;
  v_shop_uuid UUID;
  v_shop_id TEXT;
  v_shop RECORD;
  v_prize RECORD;
  v_spin_id UUID;
  v_coupon_code TEXT;
  v_contact_type TEXT;
  v_existing_spin INTEGER;
BEGIN
  -- 1. TOKEN DOĞRULAMA
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RAISE EXCEPTION 'Geçersiz token';
  END IF;

  BEGIN
    v_decoded_text := p_token;
    v_decoded_text := replace(v_decoded_text, '-', '+');
    v_decoded_text := replace(v_decoded_text, '_');

    WHILE length(v_decoded_text) % 4 != 0 LOOP
      v_decoded_text := v_decoded_text || '=';
    END LOOP;

    v_token_json := convert_from(decode(v_decoded_text, 'base64'), 'UTF8')::jsonb;
    v_shop_uuid := (v_token_json->>'uid')::uuid;
    v_shop_id := v_token_json->>'sid';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Token parse hatası';
  END;

  -- 2. SHOP AKTİFLİK KONTROLÜ
  SELECT * INTO v_shop FROM shops WHERE id = v_shop_uuid AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Geçersiz veya aktif olmayan shop';
  END IF;

  -- 3. ÖDÜL KONTROLÜ
  SELECT * INTO v_prize FROM prizes WHERE id = p_prize_id AND shop_id = v_shop_uuid AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Geçersiz ödül';
  END IF;

  -- 4. İLETİŞİM TİPİ BELİRLE
  v_contact_type := v_shop.contact_info_type;

  -- 5. TEKRAR KONTROLÜ (Rate limiting - 24 saatte 1)
  IF v_contact_type = 'email' THEN
    SELECT COUNT(*) INTO v_existing_spin
    FROM wheel_spins
    WHERE shop_id = v_shop_uuid
      AND email = p_contact
      AND created_at > NOW() - INTERVAL '24 hours';
  ELSE
    SELECT COUNT(*) INTO v_existing_spin
    FROM wheel_spins
    WHERE shop_id = v_shop_uuid
      AND phone = p_contact
      AND created_at > NOW() - INTERVAL '24 hours';
  END IF;

  IF v_existing_spin > 0 THEN
    RAISE EXCEPTION 'Bu iletişim bilgisi ile zaten çark çevirdiniz';
  END IF;

  -- 6. SPIN KAYDI OLUŞTUR
  INSERT INTO wheel_spins (shop_id, full_name, email, phone, created_at)
  VALUES (
    v_shop_uuid,
    p_full_name,
    CASE WHEN v_contact_type = 'email' THEN p_contact ELSE NULL END,
    CASE WHEN v_contact_type = 'phone' THEN p_contact ELSE NULL END,
    NOW()
  )
  RETURNING id INTO v_spin_id;

  -- 7. COUPON KODU OLUŞTUR
  IF v_prize.coupon_codes IS NOT NULL AND v_prize.coupon_codes != '' THEN
    v_coupon_code := split_part(v_prize.coupon_codes, E'\n', 1);
  ELSE
    v_coupon_code := UPPER(SUBSTR(MD5(v_spin_id::TEXT), 1, 8));
  END IF;

  -- 8. WHEEL WINS KAYDI
  INSERT INTO wheel_wins (spin_id, prize_id, shop_id, coupon_code, created_at)
  VALUES (v_spin_id, p_prize_id, v_shop_uuid, v_coupon_code, NOW());

  RETURN json_build_object(
    'success', true,
    'spin_id', v_spin_id,
    'coupon_code', v_coupon_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anonim erişime izin ver
GRANT EXECUTE ON FUNCTION widget_log_spin(TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION widget_log_spin(TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- GÜVENLİK ÖZELLİKLERİ:
-- 1. Token doğrulaması (base64url decode + json parse)
-- 2. Shop aktiflik kontrolü
-- 3. Ödül validasyonu (shop'a ait mi, aktif mi)
-- 4. 24 saatlik rate limiting (aynı email/phone ile tekrar spin)
-- 5. SECURITY DEFINER ile RLS politikalarını atlar
-- 6. Hem wheel_spins hem de wheel_wins tablosuna kayıt ekler
