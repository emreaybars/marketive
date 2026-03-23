-- ============================================
-- SHOP_INTEGRATIONS - STORE_NAME EKLE
-- Mağaza adı bilgisini saklamak için
-- ============================================

-- store_name sütunu ekle
ALTER TABLE shop_integrations
ADD COLUMN IF NOT EXISTS store_name TEXT;

-- Yorum ekle
COMMENT ON COLUMN shop_integrations.store_name IS 'Mağaza adı (API için gerekli)';
