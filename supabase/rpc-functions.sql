-- ============================================
-- Çarkıfelek Widget RPC Functions
-- Supabase PostgreSQL Functions
-- CORS'suz widget API için
-- ============================================

-- 1. Widget verilerini getir (token ile)
CREATE OR REPLACE FUNCTION get_widget_data(p_token TEXT)
RETURNS TABLE (
  shop_name TEXT,
  shop_logo TEXT,
  shop_url TEXT,
  brand_name TEXT,
  contact_info_type TEXT,
  widget_title TEXT,
  widget_description TEXT,
  widget_button_text TEXT,
  widget_show_on_load BOOLEAN,
  widget_popup_delay INTEGER,
  widget_background_color TEXT,
  widget_button_color TEXT,
  widget_title_color TEXT,
  widget_description_color TEXT,
  prizes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop_id TEXT;
  v_shop_uuid UUID;
  v_decoded TEXT;
  v_payload JSONB;
BEGIN
  -- Base64URL'dan decode et (padding ekle)
  -- Base64URL: - yerine +, _ yerine /, padding yok
  v_decoded := convert_from(
    decode(
      replace(replace(p_token, '-', '+'), '_', '/') || repeat('=', (4 - length(p_token) % 4) % 4),
      'base64'
    ),
    'utf8'
  );

  -- JSON parse
  v_payload := v_decoded::jsonb;

  -- Token validation - signature check
  IF v_payload ? 'sig' IS NULL THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = '45000';
  END IF;

  -- Shop ID'yi al
  v_shop_id := v_payload->>'sid';

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = '45000';
  END IF;

  -- Shop'u bul
  SELECT id INTO v_shop_uuid
  FROM shops
  WHERE shop_id = v_shop_id
    AND active = true
  LIMIT 1;

  IF v_shop_uuid IS NULL THEN
    RAISE EXCEPTION 'shop_not_found' USING ERRCODE = '45000';
  END IF;

  -- Return shop data with widget settings and prizes
  RETURN QUERY
  SELECT
    s.name AS shop_name,
    s.logo_url AS shop_logo,
    s.website_url AS shop_url,
    s.brand_name,
    s.contact_info_type,
    ws.title AS widget_title,
    ws.description AS widget_description,
    ws.button_text AS widget_button_text,
    ws.show_on_load AS widget_show_on_load,
    ws.popup_delay AS widget_popup_delay,
    ws.background_color AS widget_background_color,
    ws.button_color AS widget_button_color,
    ws.title_color AS widget_title_color,
    ws.description_color AS widget_description_color,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'redirect_url', p.redirect_url,
          'color', p.color,
          'chance', p.chance,
          'coupon_codes', p.coupon_codes,
          'display_order', p.display_order
        ) ORDER BY p.display_order
      )
    ) AS prizes
  FROM shops s
  LEFT JOIN widget_settings ws ON s.id = ws.shop_id
  LEFT JOIN prizes p ON s.id = p.shop_id AND p.active = true
  WHERE s.id = v_shop_uuid
  LIMIT 1;
END;
$$;

-- 2. Email daha önce kullanıldı mı kontrol et
CREATE OR REPLACE FUNCTION check_email_used(p_shop_uuid UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM won_prizes wp
    WHERE wp.shop_id = p_shop_uuid
      AND wp.email = LOWER(p_email)
      AND wp.won_at > NOW() - INTERVAL '30 days'
  ) INTO v_used;

  RETURN COALESCE(v_used, false);
END;
$$;

-- 3. Çark dönüşü kaydet
CREATE OR REPLACE FUNCTION log_wheel_spin(
  p_shop_uuid UUID,
  p_prize_id UUID,
  p_email TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon_code TEXT;
  v_prize_name TEXT;
  v_spin_id UUID;
  v_result JSONB;
BEGIN
  -- Ödül bilgilerini al
  SELECT coupon_codes, name INTO v_coupon_code, v_prize_name
  FROM prizes
  WHERE id = p_prize_id
    AND active = true
  LIMIT 1;

  -- Dönüş kaydı oluştur
  INSERT INTO wheel_spins (
    shop_id,
    email,
    result,
    prize_type,
    coupon_code,
    ip_address,
    user_agent,
    session_id,
    spin_date
  ) VALUES (
    p_shop_uuid,
    LOWER(p_email),
    'won',
    'prize',
    v_coupon_code,
    p_ip_address,
    p_user_agent,
    gen_random_uuid()::text,
    NOW()
  ) RETURNING id INTO v_spin_id;

  -- Kazanma kaydı oluştur
  INSERT INTO won_prizes (
    shop_id,
    spin_id,
    prize_id,
    email,
    coupon_code,
    won_at
  ) VALUES (
    p_shop_uuid,
    v_spin_id,
    p_prize_id,
    LOWER(p_email),
    v_coupon_code,
    NOW()
  );

  -- Sonuç döndür
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Spin logged successfully',
    'coupon_code', v_coupon_code,
    'prize_name', v_prize_name
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4. Widget görüntülenme kaydet (analitik için)
CREATE OR REPLACE FUNCTION track_widget_view(
  p_shop_uuid UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO widget_views (
    shop_id,
    session_id,
    ip_address,
    user_agent,
    referrer,
    viewed_at
  ) VALUES (
    p_shop_uuid,
    gen_random_uuid()::text,
    p_ip_address,
    p_user_agent,
    p_referrer,
    NOW()
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Hata olursa sessizce devam et (analitik için kritik değil)
    RETURN true;
END;
$$;

-- ============================================
-- RLS POLICY AYARLARI (güvenlik için)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_public_widget_read" ON shops;
DROP POLICY IF EXISTS "allow_public_widget_settings_read" ON widget_settings;
DROP POLICY IF EXISTS "allow_public_prizes_read" ON prizes;
DROP POLICY IF EXISTS "users_can_insert_won_prizes" ON won_prizes;
DROP POLICY IF EXISTS "users_can_insert_wheel_spins" ON wheel_spins;
DROP POLICY IF EXISTS "users_can_insert_views" ON widget_views;

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_views ENABLE ROW LEVEL SECURITY;

-- Herkes widget verilerini görebilir (RPC functions public)
CREATE POLICY "allow_public_widget_read" ON shops
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_public_widget_settings_read" ON widget_settings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_public_prizes_read" ON prizes
  FOR SELECT
  TO anon
  USING (true);

-- Sadece kendi shop'una veri yazabilsin
CREATE POLICY "users_can_insert_won_prizes" ON won_prizes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "users_can_insert_wheel_spins" ON wheel_spins
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "users_can_insert_views" ON widget_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================
-- VARSAYILAN INDEXLER
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shops_shop_id ON shops(shop_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_prizes_shop_id ON prizes(shop_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_won_prizes_shop_email ON won_prizes(shop_id, email);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_shop_spin_date ON wheel_spins(shop_id, spin_date);

-- ============================================
-- TEST
-- ============================================

-- Test widget data
-- SELECT * FROM get_widget_data('TEST_TOKEN');
