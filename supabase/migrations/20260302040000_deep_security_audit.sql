-- ============================================
-- DERİN RLS GÜVENLİK DENETİMİ
-- ============================================
-- Bu dosyayı Supabase SQL Editor'de çalıştırarak
-- tüm güvenlik açıklarını tespit edebilirsiniz

-- ============================================
-- 1. RLS ENABLED OLMAYAN TABLOLARI BUL
-- ============================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables pt
LEFT JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
  AND (pc.relrowsecurity IS NULL OR pc.relrowsecurity = false)
ORDER BY pt.tablename;

-- ============================================
-- 2. TABLO BAŞINA POLICY SAYISI
-- ============================================
SELECT
  schemaname,
  tablename,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
GROUP BY t.schemaname, t.tablename
ORDER BY policy_count ASC, t.tablename;

-- ============================================
-- 3. POLİTİKASI OLMAYAN TABLOLAR
-- ============================================
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- ============================================
-- 4. "USING (true)" İÇEREN POLİTİKALAR (TEHLIKELI)
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE (qual = 'true' OR qual IS NULL)
  AND cmd IN ('SELECT', 'ALL')
  AND schemaname = 'public';

-- ============================================
-- 5. SERVICE ROLE POLİTİKALARINI LİSTELE
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE 'service_role' = ANY(roles)
  AND schemaname = 'public';

-- ============================================
-- 6. SECURITY DEFINER FONKSİYONLAR
-- ============================================
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;

-- ============================================
-- 7. FOREIGN KEY İLİŞKİLERİ
-- ============================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================
-- 8. PUBLIC ROLE'ÜN YETKİLERİ
-- ============================================
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'PUBLIC'
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- ============================================
-- 9. ANONİM KULLANICININ YETKİLERİ
-- ============================================
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- ============================================
-- 10. POTANSİYEL GÜVENLİK SORUNLARI
-- ============================================

-- 10.1 DELETE politikası olmayan tablolar
SELECT DISTINCT
  t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND t.tablename NOT IN (
    SELECT DISTINCT p.tablename
    FROM pg_policies p
    WHERE p.cmd IN ('DELETE', 'ALL')
  )
ORDER BY t.tablename;

-- 10.2 INSERT politikası olmayan tablolar
SELECT DISTINCT
  t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND t.tablename NOT IN (
    SELECT DISTINCT p.tablename
    FROM pg_policies p
    WHERE p.cmd IN ('INSERT', 'ALL')
  )
ORDER BY t.tablename;

-- 10.3 UPDATE politikası olmayan tablolar
SELECT DISTINCT
  t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND t.tablename NOT IN (
    SELECT DISTINCT p.tablename
    FROM pg_policies p
    WHERE p.cmd IN ('UPDATE', 'ALL')
  )
ORDER BY t.tablename;

-- ============================================
-- 11. auth.uid() KULLANAN POLİTİKALAR
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- GÜVENLİK RAPORU
-- ============================================
/*
 Bu sorguların sonuçlarını kontrol edin:

 1. RLS Enabled Olmayan Tablolar: Hiçbiri olmalı
 2. Policy Sayısı 0 Olan Tablolar: Hiçbiri olmalı
 3. "USING (true)" Politikaları: Sadece service_role olmalı
 4. PUBLIC Role Yetkileri: REVOKE ALL yapılmalı
 5. ANON Yetkileri: Sadece gerekli tablolarda INSERT olmalı

 EĞER SORUN VARSA AŞAĞIDAKİ DÜZELTMELERİ UYGULAYIN:
*/

-- ============================================
-- DÜZELTME: Tüm tablolarda RLS etkinleştir
-- ============================================

-- RLS olmayan tablolar için (varsa)
-- ALTER TABLE tablo_adi ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DÜZELTME: PUBLIC yetkilerini kaldır
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', r.table_name);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DÜZELTME: Eksik DELETE politikaları
-- ============================================

-- wheel_spins için delete policy (sadece shop sahibi silebilir)
DROP POLICY IF EXISTS "Users can delete own wheel_spins" ON wheel_spins;
CREATE POLICY "Users can delete own wheel_spins"
  ON wheel_spins FOR DELETE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- widget_settings için delete policy
DROP POLICY IF EXISTS "Users can delete own widget_settings" ON widget_settings;
CREATE POLICY "Users can delete own widget_settings"
  ON widget_settings FOR DELETE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- DÜZELTME: Eksik INSERT politikaları
-- ============================================

-- users tablosu için insert policy zaten var, kontrol edelim

-- ============================================
-- DÜZELTME: UUID validasyonu
-- ============================================

-- auth.uid() NULL kontrolü için güvenli fonksiyon
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.uid() matching için güvenli fonksiyon
CREATE OR REPLACE FUNCTION matches_user_id(p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL AND auth.uid()::text = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DÜZELTME: shop_id değişimini önle
-- ============================================

-- Prizes tablosunda shop_id değişimini önle
CREATE OR REPLACE FUNCTION protect_prizes_shop_id()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.shop_id != NEW.shop_id THEN
    RAISE EXCEPTION 'shop_id değiştirilemez';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_prizes ON prizes;
CREATE TRIGGER protect_prizes
  BEFORE UPDATE ON prizes
  FOR EACH ROW EXECUTE FUNCTION protect_prizes_shop_id();

-- Wheel spins tablosunda shop_id değişimini önle
CREATE OR REPLACE FUNCTION protect_wheel_spins_shop_id()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.shop_id != NEW.shop_id THEN
    RAISE EXCEPTION 'shop_id değiştirilemez';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_wheel_spins ON wheel_spins;
CREATE TRIGGER protect_wheel_spins
  BEFORE UPDATE ON wheel_spins
  FOR EACH ROW EXECUTE FUNCTION protect_wheel_spins_shop_id();

-- ============================================
-- DÜZELTME: user_id değişimini önle (WhatsApp tabloları)
-- ============================================

CREATE OR REPLACE FUNCTION protect_whatsapp_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'user_id değiştirilemez';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_whatsapp_campaigns ON whatsapp_campaigns;
CREATE TRIGGER protect_whatsapp_campaigns
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW EXECUTE FUNCTION protect_whatsapp_user_id();

DROP TRIGGER IF EXISTS protect_whatsapp_contacts ON whatsapp_contacts;
CREATE TRIGGER protect_whatsapp_contacts
  BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION protect_whatsapp_user_id();

DROP TRIGGER IF EXISTS protect_whatsapp_messages ON whatsapp_messages;
CREATE TRIGGER protect_whatsapp_messages
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION protect_whatsapp_user_id();

-- ============================================
-- SON KONTROL
-- ============================================
-- Bu sorguyu çalıştırarak tüm düzeltmelerin uygulandığını kontrol edin:

SELECT
  'RLS Security Audit' as audit_name,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as tables_without_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND qual = 'true') as dangerous_policies,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public' AND p.prosecdef = true) as security_definer_functions;
