-- ============================================
-- SUPABASE AUTH RLS POLICIES
-- Clerk -> Supabase Auth Migration
-- ============================================

-- ÖNCE ESKI FONKSIYONLARI SİL
DROP FUNCTION IF EXISTS get_user_shops(TEXT);
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT);
DROP FUNCTION IF EXISTS handle_new_user();

-- ============================================
-- 1. SHOPS - Ana tablo
-- ============================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shops" ON shops;
DROP POLICY IF EXISTS "Users can insert own shops" ON shops;
DROP POLICY IF EXISTS "Users can update own shops" ON shops;
DROP POLICY IF EXISTS "Users can delete own shops" ON shops;

CREATE POLICY "Users can view own shops"
  ON shops FOR SELECT
  USING (customer_id = auth.uid()::text);

CREATE POLICY "Users can insert own shops"
  ON shops FOR INSERT
  WITH CHECK (customer_id = auth.uid()::text);

CREATE POLICY "Users can update own shops"
  ON shops FOR UPDATE
  USING (customer_id = auth.uid()::text)
  WITH CHECK (customer_id = auth.uid()::text);

CREATE POLICY "Users can delete own shops"
  ON shops FOR DELETE
  USING (customer_id = auth.uid()::text);

-- ============================================
-- 2. PRIZES
-- ============================================
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prizes" ON prizes;
DROP POLICY IF EXISTS "Users can insert own prizes" ON prizes;
DROP POLICY IF EXISTS "Users can update own prizes" ON prizes;
DROP POLICY IF EXISTS "Users can delete own prizes" ON prizes;

CREATE POLICY "Users can view own prizes"
  ON prizes FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can insert own prizes"
  ON prizes FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can update own prizes"
  ON prizes FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can delete own prizes"
  ON prizes FOR DELETE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- 3. WIDGET_SETTINGS
-- ============================================
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own widget_settings" ON widget_settings;
DROP POLICY IF EXISTS "Users can insert own widget_settings" ON widget_settings;
DROP POLICY IF EXISTS "Users can update own widget_settings" ON widget_settings;

CREATE POLICY "Users can view own widget_settings"
  ON widget_settings FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can insert own widget_settings"
  ON widget_settings FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can update own widget_settings"
  ON widget_settings FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- 4. WHEEL_SPINS - Widget erişimi var
-- ============================================
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wheel_spins" ON wheel_spins;
DROP POLICY IF EXISTS "Widget can insert wheel_spins" ON wheel_spins;
DROP POLICY IF EXISTS "Anonymous can insert wheel_spins" ON wheel_spins;

CREATE POLICY "Users can view own wheel_spins"
  ON wheel_spins FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Widget için anonim insert (aktif shop'lara)
CREATE POLICY "Anonymous can insert wheel_spins"
  ON wheel_spins FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

-- ============================================
-- 5. WON_PRIZES - Widget erişimi var
-- ============================================
ALTER TABLE won_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own won_prizes" ON won_prizes;
DROP POLICY IF EXISTS "Widget can insert won_prizes" ON won_prizes;
DROP POLICY IF EXISTS "Users can update own won_prizes" ON won_prizes;
DROP POLICY IF EXISTS "Anonymous can insert won_prizes" ON won_prizes;

CREATE POLICY "Users can view own won_prizes"
  ON won_prizes FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Widget için anonim insert
CREATE POLICY "Anonymous can insert won_prizes"
  ON won_prizes FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

CREATE POLICY "Users can update own won_prizes"
  ON won_prizes FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- 6. WHEEL_WINS - Widget erişimi var
-- ============================================
ALTER TABLE wheel_wins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Widget can insert wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Users can update own wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Anonymous can insert wheel_wins" ON wheel_wins;

CREATE POLICY "Users can view own wheel_wins"
  ON wheel_wins FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Widget için anonim insert
CREATE POLICY "Anonymous can insert wheel_wins"
  ON wheel_wins FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

CREATE POLICY "Users can update own wheel_wins"
  ON wheel_wins FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- 7. WIDGET_VIEWS - Widget erişimi var
-- ============================================
ALTER TABLE widget_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own widget_views" ON widget_views;
DROP POLICY IF EXISTS "Widget can insert widget_views" ON widget_views;
DROP POLICY IF EXISTS "Anonymous can insert widget_views" ON widget_views;

CREATE POLICY "Users can view own widget_views"
  ON widget_views FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Widget için anonim insert
CREATE POLICY "Anonymous can insert widget_views"
  ON widget_views FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

-- ============================================
-- 8. COUPONS
-- ============================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can insert own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can update own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can delete own coupons" ON coupons;

CREATE POLICY "Users can view own coupons"
  ON coupons FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can insert own coupons"
  ON coupons FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can update own coupons"
  ON coupons FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Users can delete own coupons"
  ON coupons FOR DELETE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- 9. ANALYTICS_CACHE
-- ============================================
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics_cache" ON analytics_cache;
DROP POLICY IF EXISTS "Service role can manage analytics_cache" ON analytics_cache;

CREATE POLICY "Users can view own analytics_cache"
  ON analytics_cache FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Service role için (backend işlemleri)
CREATE POLICY "Service role can manage analytics_cache"
  ON analytics_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 10. WHATSAPP TABLES
-- ============================================

-- whatsapp_campaigns
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own whatsapp_campaigns" ON whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can insert own whatsapp_campaigns" ON whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can update own whatsapp_campaigns" ON whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can delete own whatsapp_campaigns" ON whatsapp_campaigns;

CREATE POLICY "Users can view own whatsapp_campaigns"
  ON whatsapp_campaigns FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own whatsapp_campaigns"
  ON whatsapp_campaigns FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own whatsapp_campaigns"
  ON whatsapp_campaigns FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own whatsapp_campaigns"
  ON whatsapp_campaigns FOR DELETE
  USING (user_id = auth.uid()::text);

-- whatsapp_contacts
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own whatsapp_contacts" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can insert own whatsapp_contacts" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can update own whatsapp_contacts" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can delete own whatsapp_contacts" ON whatsapp_contacts;

CREATE POLICY "Users can view own whatsapp_contacts"
  ON whatsapp_contacts FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own whatsapp_contacts"
  ON whatsapp_contacts FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own whatsapp_contacts"
  ON whatsapp_contacts FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own whatsapp_contacts"
  ON whatsapp_contacts FOR DELETE
  USING (user_id = auth.uid()::text);

-- whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert own whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can update own whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can delete own whatsapp_messages" ON whatsapp_messages;

CREATE POLICY "Users can view own whatsapp_messages"
  ON whatsapp_messages FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own whatsapp_messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own whatsapp_messages"
  ON whatsapp_messages FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own whatsapp_messages"
  ON whatsapp_messages FOR DELETE
  USING (user_id = auth.uid()::text);

-- whatsapp_sepet_reminders
ALTER TABLE whatsapp_sepet_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own whatsapp_sepet_reminders" ON whatsapp_sepet_reminders;
DROP POLICY IF EXISTS "Users can insert own whatsapp_sepet_reminders" ON whatsapp_sepet_reminders;
DROP POLICY IF EXISTS "Users can update own whatsapp_sepet_reminders" ON whatsapp_sepet_reminders;
DROP POLICY IF EXISTS "Users can delete own whatsapp_sepet_reminders" ON whatsapp_sepet_reminders;

CREATE POLICY "Users can view own whatsapp_sepet_reminders"
  ON whatsapp_sepet_reminders FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own whatsapp_sepet_reminders"
  ON whatsapp_sepet_reminders FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own whatsapp_sepet_reminders"
  ON whatsapp_sepet_reminders FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own whatsapp_sepet_reminders"
  ON whatsapp_sepet_reminders FOR DELETE
  USING (user_id = auth.uid()::text);

-- whatsapp_templates
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own whatsapp_templates" ON whatsapp_templates;
DROP POLICY IF EXISTS "Users can insert own whatsapp_templates" ON whatsapp_templates;
DROP POLICY IF EXISTS "Users can update own whatsapp_templates" ON whatsapp_templates;
DROP POLICY IF EXISTS "Users can delete own whatsapp_templates" ON whatsapp_templates;

CREATE POLICY "Users can view own whatsapp_templates"
  ON whatsapp_templates FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own whatsapp_templates"
  ON whatsapp_templates FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own whatsapp_templates"
  ON whatsapp_templates FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own whatsapp_templates"
  ON whatsapp_templates FOR DELETE
  USING (user_id = auth.uid()::text);

-- ============================================
-- 11. USERS (Profil tablosu)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================
-- 12. RPC FUNCTIONS - Supabase Auth uyumlu
-- ============================================

-- Kullanıcının shop'larını getir
CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT)
RETURNS SETOF JSON AS $$
BEGIN
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

-- Kullanıcının wheel spin'lerini getir
CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS SETOF JSON AS $$
BEGIN
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
-- 13. TRIGGER - Yeni kullanıcı için otomatik profil
-- ============================================

-- Yeni Supabase Auth kullanıcısı oluşturulduğunda users tablosuna ekle
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Eğer zaten varsa hata verme
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı kaldır ve tekrar oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
