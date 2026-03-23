-- ============================================
-- WHEEL_SPINS TABLOSUNA PRIZE_NAME EKLE
-- ============================================

-- 1. Prize name kolonu ekle (varsa atla)
ALTER TABLE wheel_spins 
ADD COLUMN IF NOT EXISTS prize_name TEXT;

-- 2. Mevcut kayıtları güncelle (wheel_wins tablosundan çekerek)
UPDATE wheel_spins ws
SET prize_name = COALESCE(
    (SELECT p.name 
     FROM wheel_wins ww 
     JOIN prizes p ON p.id = ww.prize_id 
     WHERE ww.spin_id = ws.id
     LIMIT 1),
    ws.result,
    'Bilinmeyen Ödül'
)
WHERE prize_name IS NULL;

-- 3. Gelecekteki spin'ler için DEFAULT değer
ALTER TABLE wheel_spins 
ALTER COLUMN prize_name SET DEFAULT 'Bilinmeyen Ödül';

-- 4. get_user_wheel_spins RPC fonksiyonunu güncelle
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
    'coupon_code', ww.coupon_code,
    'won_at', ws.created_at
  )::json
  FROM wheel_spins ws
  JOIN shops s ON s.id = ws.shop_id
  LEFT JOIN wheel_wins ww ON ww.spin_id = ws.id
  WHERE s.customer_id = p_customer_id
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_wheel_spins(TEXT) TO authenticated;

-- ============================================
-- LOG_WHEEL_SPIN RPC GÜNCELLEME
-- ============================================

CREATE OR REPLACE FUNCTION log_wheel_spin(
    p_shop_uuid UUID,
    p_contact TEXT,
    p_prize_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_is_email BOOLEAN;
    v_email TEXT;
    v_phone TEXT;
    v_prize RECORD;
    v_spin_id UUID;
    v_coupon_code TEXT;
    v_codes TEXT[];
BEGIN
    -- Email mi telefon mu?
    v_is_email := p_contact LIKE '%@%';
    v_email := CASE WHEN v_is_email THEN LOWER(p_contact) ELSE NULL END;
    v_phone := CASE WHEN NOT v_is_email THEN p_contact ELSE NULL END;

    -- Ödül bilgisi
    SELECT * INTO v_prize 
    FROM prizes 
    WHERE id = p_prize_id AND shop_id = p_shop_uuid;

    -- Kupon kodu seç
    IF v_prize.coupon_codes IS NOT NULL AND v_prize.coupon_codes != '' THEN
        v_codes := string_to_array(v_prize.coupon_codes, '\n');
        IF array_length(v_codes, 1) > 0 THEN
            v_coupon_code := trim(v_codes[1]);
        END IF;
    END IF;

    -- Spin kaydı (prize_name ile birlikte)
    INSERT INTO wheel_spins (
        shop_id, full_name, email, phone, result, 
        user_agent, created_at, prize_name
    ) VALUES (
        p_shop_uuid, p_full_name, v_email, v_phone, 
        v_prize.name, p_user_agent, NOW(), v_prize.name
    )
    RETURNING id INTO v_spin_id;

    -- Wheel wins kaydı
    INSERT INTO wheel_wins (shop_id, spin_id, prize_id, coupon_code)
    VALUES (p_shop_uuid, v_spin_id, p_prize_id, v_coupon_code);

    RETURN json_build_object(
        'spin_id', v_spin_id,
        'coupon_code', v_coupon_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_wheel_spin(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated, anon;
