-- ============================================
-- ANONIM WIDGET INSERT POLICIES
-- Widget kullanıcılarının anonim olarak insert yapabilmesi için
-- ============================================

-- wheel_spins tablosu için anonim insert politikası
DROP POLICY IF EXISTS "Anonymous can insert wheel_spins" ON wheel_spins;

CREATE POLICY "Anonymous can insert wheel_spins"
  ON wheel_spins FOR INSERT
  TO anon
  WITH CHECK (true);

-- wheel_wins tablosu için anonim insert politikası
DROP POLICY IF EXISTS "Anonymous can insert wheel_wins" ON wheel_wins;

CREATE POLICY "Anonymous can insert wheel_wins"
  ON wheel_wins FOR INSERT
  TO anon
  WITH CHECK (true);

-- widget_views tablosu için anonim insert politikası
DROP POLICY IF EXISTS "Anonymous can insert widget_views" ON widget_views;

CREATE POLICY "Anonymous can insert widget_views"
  ON widget_views FOR INSERT
  TO anon
  WITH CHECK (true);

-- GÜVENLİK NOTLARI:
-- 1. Bu politikalar widget kullanıcılarının anonim olarak insert yapmasına izin verir
-- 2. Dashboard'da görüntüleme için authenticated kullanıcının kendi shop'ların verilerini görmesi için ayrı politikalar mevcut
-- 3. Veri bütünlüğü için shop_id ve shop aktiflik kontrolleri uygulama katmanında yapılmalı
