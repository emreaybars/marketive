-- ============================================
-- RLS POLICY FIX - Tüm Tablolar
-- ============================================

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
-- 4. WHEEL_SPINS
-- ============================================
ALTER TABLE wheel_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wheel_spins" ON wheel_spins;
DROP POLICY IF EXISTS "Widget can insert wheel_spins" ON wheel_spins;

CREATE POLICY "Users can view own wheel_spins"
  ON wheel_spins FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Widget can insert wheel_spins"
  ON wheel_spins FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

-- ============================================
-- 5. WON_PRIZES
-- ============================================
ALTER TABLE won_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own won_prizes" ON won_prizes;
DROP POLICY IF EXISTS "Widget can insert won_prizes" ON won_prizes;
DROP POLICY IF EXISTS "Users can update own won_prizes" ON won_prizes;

CREATE POLICY "Users can view own won_prizes"
  ON won_prizes FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Widget can insert won_prizes"
  ON won_prizes FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

CREATE POLICY "Users can update own won_prizes"
  ON won_prizes FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- 6. WHEEL_WINS
-- ============================================
ALTER TABLE wheel_wins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Widget can insert wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Users can update own wheel_wins" ON wheel_wins;

CREATE POLICY "Users can view own wheel_wins"
  ON wheel_wins FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Widget can insert wheel_wins"
  ON wheel_wins FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE active = true));

CREATE POLICY "Users can update own wheel_wins"
  ON wheel_wins FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- 7. WIDGET_VIEWS
-- ============================================
ALTER TABLE widget_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own widget_views" ON widget_views;
DROP POLICY IF EXISTS "Widget can insert widget_views" ON widget_views;

CREATE POLICY "Users can view own widget_views"
  ON widget_views FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Widget can insert widget_views"
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
DROP POLICY IF EXISTS "System can manage analytics_cache" ON analytics_cache;

CREATE POLICY "Users can view own analytics_cache"
  ON analytics_cache FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Service role için (supabase_service_role_key ile)
CREATE POLICY "Service role can manage analytics_cache"
  ON analytics_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 10. WHATSAPP - Düzeltilmiş Politikalar
-- ============================================

-- Eski yanlış politikaları sil
DROP POLICY IF EXISTS "Users can view own whatsapp_campaigns" ON whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can insert own whatsapp_campaigns" ON whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can update own whatsapp_campaigns" ON whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can delete own whatsapp_campaigns" ON whatsapp_campaigns;

DROP POLICY IF EXISTS "Users can view own whatsapp_contacts" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can insert own whatsapp_contacts" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can update own whatsapp_contacts" ON whatsapp_contacts;
DROP POLICY IF EXISTS "Users can delete own whatsapp_contacts" ON whatsapp_contacts;

DROP POLICY IF EXISTS "Users can view own whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert own whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can update own whatsapp_messages" ON whatsapp_messages;

DROP POLICY IF EXISTS "Users can view own whatsapp_sepet_reminders" ON whatsapp_sepet_reminders;
DROP POLICY IF EXISTS "Users can insert own whatsapp_sepet_reminders" ON whatsapp_sepet_reminders;
DROP POLICY IF EXISTS "Users can update own whatsapp_sepet_reminders" ON whatsapp_sepet_reminders;

DROP POLICY IF EXISTS "Users can view own whatsapp_templates" ON whatsapp_templates;
DROP POLICY IF EXISTS "Users can insert own whatsapp_templates" ON whatsapp_templates;
DROP POLICY IF EXISTS "Users can update own whatsapp_templates" ON whatsapp_templates;

-- Yeni doğru politikalar - whatsapp_campaigns
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

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

-- Yeni doğru politikalar - whatsapp_contacts
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

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

-- Yeni doğru politikalar - whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

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

-- Yeni doğru politikalar - whatsapp_sepet_reminders
ALTER TABLE whatsapp_sepet_reminders ENABLE ROW LEVEL SECURITY;

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

-- Yeni doğru politikalar - whatsapp_templates
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

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
-- 11. USERS (Mevcut doğru, kontrol amaçlı)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());
