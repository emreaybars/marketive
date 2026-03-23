-- ============================================
-- API Key Pattern Migration
-- Shops tablosuna api_key kolonu ekle
-- ============================================

-- API Key kolonu ekle
ALTER TABLE shops ADD COLUMN IF NOT EXISTS api_key UUID UNIQUE DEFAULT gen_random_uuid();

-- API Key kolonuna indeks ekle (hızlı lookup için)
CREATE INDEX IF NOT EXISTS idx_shops_api_key ON shops(api_key);

-- RLS Policy: API Key ile okuma (Widget için)
DROP POLICY IF EXISTS "Widget can read by api_key" ON shops;
CREATE POLICY "Widget can read by api_key"
  ON shops FOR SELECT
  USING (api_key IS NOT NULL);

-- ============================================
-- Örnek: Mevcut shop'lara api_key ata
-- ============================================
UPDATE shops SET api_key = gen_random_uuid() WHERE api_key IS NULL;

-- ============================================
-- Shops tablosundaki api_key için fonksiyon
-- ============================================
CREATE OR REPLACE FUNCTION get_shop_by_api_key(p_api_key UUID)
RETURNS TABLE (
  id UUID,
  shop_id VARCHAR,
  name VARCHAR,
  logo_url TEXT,
  website_url TEXT,
  brand_name VARCHAR,
  contact_info_type VARCHAR,
  allowed_domains TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.shop_id,
    s.name,
    s.logo_url,
    s.website_url,
    s.brand_name,
    s.contact_info_type,
    s.allowed_domains
  FROM shops s
  WHERE s.api_key = p_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;