-- ============================================
-- KAPSAMLI GÜVENLİK DENETİMİ VE DÜZELTMELER
-- ============================================

-- ============================================
-- 1. KRİTİK: RPC Fonksiyonlarına Yetkilendirme
-- ============================================

DROP FUNCTION IF EXISTS get_user_shops(TEXT);
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT);

CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT)
RETURNS SETOF JSON AS $$
BEGIN
  -- GÜVENLİK: Sadece kendi verilerinizi isteyebilirsiniz
  IF p_customer_id IS NULL OR p_customer_id != auth.uid()::text THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Bu verileri görme yetkiniz yok';
  END IF;

  RETURN QUERY
  SELECT json_build_object(
    'id', s.id,
    'shop_id', s.shop_id,
    'customer_id', s.customer_id,
    'name', s.name,
    'logo_url', s.logo_url,
    'website_url', s.website_url,
    'brand_name', s.brand_name,
    'contact_info_type', s.contact_info_type,
    'active', s.active,
    'created_at', s.created_at,
    'widget_settings', (
      SELECT json_build_object(
        'title', ws.title,
        'description', ws.description,
        'button_text', ws.button_text,
        'background_color', ws.background_color,
        'button_color', ws.button_color,
        'title_color', ws.title_color,
        'description_color', ws.description_color,
        'show_on_load', ws.show_on_load,
        'popup_delay', ws.popup_delay
      )
      FROM widget_settings ws
      WHERE ws.shop_id = s.id
    )
  )::json
  FROM shops s
  WHERE s.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS SETOF JSON AS $$
BEGIN
  -- GÜVENLİK: Sadece kendi verilerinizi isteyebilirsiniz
  IF p_customer_id IS NULL OR p_customer_id != auth.uid()::text THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Bu verileri görme yetkiniz yok';
  END IF;

  RETURN QUERY
  SELECT json_build_object(
    'spin_id', ws.id,
    'shop_id', ws.shop_id,
    'full_name', ws.full_name,
    'email', ws.email,
    'phone', ws.phone,
    'prize_name', COALESCE(wp.name, 'Bilinmeyen Ödül'),
    'coupon_code', ww.coupon_code,
    'won_at', ww.created_at
  )::json
  FROM wheel_spins ws
  JOIN shops s ON s.id = ws.shop_id
  LEFT JOIN wheel_wins ww ON ww.spin_id = ws.id
  LEFT JOIN prizes wp ON wp.id = ww.prize_id
  WHERE s.customer_id = p_customer_id
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. YÜKSEK: Widget için güvenli anonim erişim
-- Widget token doğrulaması için fonksiyon
-- ============================================

-- Widget token doğrulama fonksiyonu (backend tarafından kullanılır)
CREATE OR REPLACE FUNCTION verify_widget_access(p_shop_id UUID, p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_shop shops%ROWTYPE;
BEGIN
  SELECT * INTO v_shop FROM shops WHERE id = p_shop_id AND active = true;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Token doğrulaması burada yapılabilir
  -- Şimdilik shop aktif mi kontrolü yapıyoruz
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ORTA: Rate limiting için yardımcı fonksiyon
-- ============================================

-- Bir kullanıcının son X dakikadaki spin sayısını kontrol et
CREATE OR REPLACE FUNCTION check_spin_rate_limit(
  p_shop_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_limit INTEGER DEFAULT 3,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM wheel_spins
  WHERE shop_id = p_shop_id
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL
    AND (email = p_email OR phone = p_phone);

  RETURN v_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. ORTA: Güvenli spin kayıt fonksiyonu
-- ============================================

CREATE OR REPLACE FUNCTION safe_insert_wheel_spin(
  p_shop_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_spin_id UUID;
  v_rate_limit_ok BOOLEAN;
BEGIN
  -- Shop aktif mi kontrol et
  IF NOT EXISTS (SELECT 1 FROM shops WHERE id = p_shop_id AND active = true) THEN
    RAISE EXCEPTION 'Geçersiz veya aktif olmayan shop';
  END IF;

  -- Rate limiting kontrolü
  SELECT check_spin_rate_limit(p_shop_id, p_email, p_phone) INTO v_rate_limit_ok;
  IF NOT v_rate_limit_ok THEN
    RAISE EXCEPTION 'Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.';
  END IF;

  -- Spin kaydı oluştur
  INSERT INTO wheel_spins (shop_id, full_name, email, phone, created_at)
  VALUES (p_shop_id, p_full_name, p_email, p_phone, NOW())
  RETURNING id INTO v_spin_id;

  RETURN json_build_object(
    'success', true,
    'spin_id', v_spin_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. DÜŞÜK: Kritik kolonları koruma (Trigger)
-- created_at, id gibi kolonların değiştirilmesini önle
-- ============================================

-- shops tablosu için koruma
CREATE OR REPLACE FUNCTION protect_shops_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- customer_id değiştirilemez
  IF OLD.customer_id != NEW.customer_id THEN
    RAISE EXCEPTION 'customer_id değiştirilemez';
  END IF;

  -- created_at değiştirilemez
  IF OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'created_at değiştirilemez';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_shops ON shops;
CREATE TRIGGER protect_shops
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION protect_shops_columns();

-- ============================================
-- 6. GÜVENLİK: Wheel wins için güvenli insert
-- ============================================

CREATE OR REPLACE FUNCTION safe_insert_wheel_win(
  p_spin_id UUID,
  p_prize_id UUID,
  p_shop_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_coupon_code TEXT;
  v_win_id UUID;
BEGIN
  -- Shop aktif mi ve prize bu shop'a mı ait?
  IF NOT EXISTS (
    SELECT 1 FROM prizes p
    JOIN shops s ON s.id = p.shop_id
    WHERE p.id = p_prize_id
      AND p.shop_id = p_shop_id
      AND s.active = true
      AND p.active = true
  ) THEN
    RAISE EXCEPTION 'Geçersiz ödül veya shop';
  END IF;

  -- Bu spin için zaten kazanç var mı?
  IF EXISTS (SELECT 1 FROM wheel_wins WHERE spin_id = p_spin_id) THEN
    RAISE EXCEPTION 'Bu spin için zaten kazanç kaydedilmiş';
  END IF;

  -- Coupon kodu oluştur (basit örnek)
  v_coupon_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));

  -- Kazancı kaydet
  INSERT INTO wheel_wins (spin_id, prize_id, shop_id, coupon_code, created_at)
  VALUES (p_spin_id, p_prize_id, p_shop_id, v_coupon_code, NOW())
  RETURNING id INTO v_win_id;

  RETURN json_build_object(
    'success', true,
    'win_id', v_win_id,
    'coupon_code', v_coupon_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. EKSİK POLİTİKALAR: Anonim erişim için güvenli policy
-- ============================================

-- wheel_wins için anonim insert'i kaldır, sadece fonksiyon üzerinden
DROP POLICY IF EXISTS "Anonymous can insert wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Widget can insert wheel_wins" ON wheel_wins;

-- wheel_wins tablosuna service_role ile erişim (sadece fonksiyonlar için)
CREATE POLICY "Service role can insert wheel_wins"
  ON wheel_wins FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 8. WHATSAPP TABLOLARI İÇİN EK GÜVENLİK
-- ============================================

-- WhatsApp mesajlarına rate limiting
CREATE OR REPLACE FUNCTION check_whatsapp_rate_limit(
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM whatsapp_messages
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_window_hours || ' hours')::INTERVAL;

  RETURN v_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. GÜVENLİK AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log tablosuna sadece service_role erişebilir
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage audit_log"
  ON security_audit_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 10. ÖNEMLİ: Public şemada gereksiz yetkileri kaldır
-- ============================================

-- REVOKE default privileges from PUBLIC
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

-- Authenticated users için temel yetkiler
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anonim kullanıcılar için minimum yetki (sadece insert)
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON wheel_spins, wheel_wins, won_prizes, widget_views TO anon;

-- ============================================
-- 11. SECURITY DEFINER fonksiyonlarını kontrol et
-- ============================================

-- Tüm SECURITY DEFINER fonksiyonlarını listele
-- SELECT proname, prosrc FROM pg_proc WHERE prosecdef = true;

-- ============================================
-- 12. INDEXLER - Performans için
-- ============================================

CREATE INDEX IF NOT EXISTS idx_wheel_spins_shop_created ON wheel_spins(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_email_phone ON wheel_spins(email, phone);
CREATE INDEX IF NOT EXISTS idx_wheel_wins_spin_id ON wheel_wins(spin_id);
CREATE INDEX IF NOT EXISTS idx_shops_customer_active ON shops(customer_id, active);

-- ============================================
-- 13. GÜVENLİK ÖZETİ
-- ============================================
/*
GÜVENLİK DÜZELTMELERİ:

1. ✅ RPC fonksiyonlarına auth.uid() doğrulaması eklendi
2. ✅ Rate limiting fonksiyonları oluşturuldu
3. ✅ Güvenli spin insert fonksiyonu (safe_insert_wheel_spin)
4. ✅ Güvenli wheel win insert fonksiyonu (safe_insert_wheel_win)
5. ✅ Kritik kolonları koruyan trigger'lar
6. ✅ Audit log tablosu
7. ✅ PUBLIC şemasında gereksiz yetkiler kaldırıldı
8. ✅ Anonim kullanıcılar için minimum yetki

ÖNERİLER:
- Widget tarafında token doğrulaması kullanın
- Rate limiting değerlerini ihtiyaca göre ayarlayın
- Audit log'u düzenli olarak kontrol edin
- Service role key'i asla istemci tarafında kullanmayın
*/
