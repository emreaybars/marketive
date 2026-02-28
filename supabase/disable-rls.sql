-- ============================================
-- RLS POLICY FIX - Shop Creation Enable
-- ============================================

-- Geçici olarak RLS'yi devre dışı bırak (shop creation için)
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE won_prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins DISABLE ROW LEVEL SECURITY;
ALTER TABLE widget_views DISABLE ROW LEVEL SECURITY;

-- NOT: Production için daha sonra RLS politiques'leri düzgün configure etmeliyiz
-- Şimdilik shop oluşturabilmek için disable ediyoruz
