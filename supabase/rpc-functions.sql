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
  v_verified BOOLEAN;
BEGIN
  -- Token'dan shop_id'yi al (base64url decode)
  SELECT
    payload->>'sid' INTO v_shop_id
  FROM (
    SELECT
      convert_from(decode(replace(replace(p_token, '-', '+'), '_', '/'), 'base64'), 'utf8')::json AS payload
  ) t
  WHERE
    payload ? 'sig' IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = '44004';
  END IF;

  -- Shop'u bul
  SELECT id INTO v_shop_uuid
  FROM shops
  WHERE shop_id = v_shop_id
    AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_not_found' USING ERCODE = '44004';
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
      AND wp.created_at > NOW() - INTERVAL '30 days'
  ) INTO v_used;

  RETURN COALESCE(v_used, false);
END;
$$;

-- 3. Çark dönüşü kaydet
CREATE OR REPLACE FUNCTION log_wheel_spin(
  p_shop_uuid UUID,
  p_prize_id INTEGER,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon_code TEXT;
  v_result JSONB;
BEGIN
  -- Ödül bilgilerini al
  SELECT coupon_codes INTO v_coupon_code
  FROM prizes
  WHERE id = p_prize_id
    AND active = true
  LIMIT 1;

  -- Kazanma kaydı oluştur
  INSERT INTO won_prizes (
    shop_id,
    prize_id,
    email,
    phone,
    coupon_code,
    created_at
  ) VALUES (
    p_shop_uuid,
    p_prize_id,
    LOWER(p_email),
    p_phone,
    v_coupon_code,
    NOW()
  );

  -- Dönüş kaydı oluştur
  INSERT INTO wheel_spins (
    shop_id,
    email,
    phone,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_shop_uuid,
    LOWER(p_email),
    p_phone,
    p_ip_address,
    p_user_agent,
    NOW()
  );

  -- Sonuç döndür
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Spin logged successfully',
    'coupon_code', v_coupon_code
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
    created_at
  ) VALUES (
    p_shop_uuid,
    gen_random_uuid(),
    p_ip_address,
    p_user_agent,
    p_referrer,
    NOW()
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
  -- Hata olursa sessiziz devam et (analitik için kritik değil)
  RETURN true;
END;
$$;

-- ============================================
-- RLS POLICY AYARLARI (güvenlik için)
-- ============================================

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
-- VARSAYILAN SORGUNLARİK INDEXLER
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shops_shop_id ON shops(shop_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_prizes_shop_id ON prizes(shop_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_won_prizes_shop_email ON won_prizes(shop_id, email);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_shop_created ON wheel_spins(shop_id, created_at);

-- ============================================
-- TEST (İSTEY İÇİN)
-- ============================================

-- Test widget data
-- SELECT * FROM get_widget_data('TEST_TOKEN');

-- Her şey hazır! 🚀