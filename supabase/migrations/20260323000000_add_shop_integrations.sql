-- ============================================
-- SHOP INTEGRATIONS TABLOSU
-- Çarkıfelek platform entegrasyonları için
-- ============================================

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS shop_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  platform_type TEXT NOT NULL CHECK (platform_type IN ('ikas', 'ticimax', 'shopify', 'custom')),
  api_username TEXT,
  api_password TEXT,
  api_key TEXT,
  api_secret TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT CHECK (sync_status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_shop_integrations_shop_id ON shop_integrations(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_integrations_platform_type ON shop_integrations(platform_type);
CREATE INDEX IF NOT EXISTS idx_shop_integrations_is_active ON shop_integrations(is_active);

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_shop_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS shop_integrations_updated_at ON shop_integrations;
CREATE TRIGGER shop_integrations_updated_at
  BEFORE UPDATE ON shop_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_integrations_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE shop_integrations ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi shop'larının entegrasyonlarını görebilir
DROP POLICY IF EXISTS "Users can view own shop integrations" ON shop_integrations;
CREATE POLICY "Users can view own shop integrations"
  ON shop_integrations FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Kullanıcı kendi shop'larına entegrasyon ekleyebilir
DROP POLICY IF EXISTS "Users can insert own shop integrations" ON shop_integrations;
CREATE POLICY "Users can insert own shop integrations"
  ON shop_integrations FOR INSERT
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Kullanıcı kendi shop'larının entegrasyonlarını güncelleyebilir
DROP POLICY IF EXISTS "Users can update own shop integrations" ON shop_integrations;
CREATE POLICY "Users can update own shop integrations"
  ON shop_integrations FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- Kullanıcı kendi shop'larının entegrasyonlarını silebilir
DROP POLICY IF EXISTS "Users can delete own shop integrations" ON shop_integrations;
CREATE POLICY "Users can delete own shop integrations"
  ON shop_integrations FOR DELETE
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

-- ============================================
-- RPC FUNCTION - Shop Entegrasyonunu Getir
-- ============================================

CREATE OR REPLACE FUNCTION get_shop_integration(p_shop_id UUID)
RETURNS JSON AS $$
DECLARE
  v_integration JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'shop_id', shop_id,
    'platform_type', platform_type,
    'is_active', is_active,
    'last_sync_at', last_sync_at,
    'sync_status', sync_status,
    'error_message', error_message,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_integration
  FROM shop_integrations
  WHERE shop_id = p_shop_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_integration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC FUNCTION - Entegrasyon Oluştur/Güncelle
-- ============================================

CREATE OR REPLACE FUNCTION upsert_shop_integration(
  p_shop_id UUID,
  p_platform_type TEXT,
  p_api_username TEXT DEFAULT NULL,
  p_api_password TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_integration shop_integrations%ROWTYPE;
BEGIN
  -- Önce mevcut entegrasyon var mı kontrol et
  SELECT * INTO v_integration
  FROM shop_integrations
  WHERE shop_id = p_shop_id AND platform_type = p_platform_type
  LIMIT 1;

  IF v_integration.id IS NULL THEN
    -- Yeni entegrasyon oluştur
    INSERT INTO shop_integrations (shop_id, platform_type, api_username, api_password)
    VALUES (p_shop_id, p_platform_type, p_api_username, p_api_password)
    RETURNING * INTO v_integration;
  ELSE
    -- Mevcut entegrasyonu güncelle
    UPDATE shop_integrations
    SET
      api_username = COALESCE(p_api_username, api_username),
      api_password = COALESCE(p_api_password, api_password),
      updated_at = NOW()
    WHERE id = v_integration.id
    RETURNING * INTO v_integration;
  END IF;

  RETURN json_build_object(
    'id', v_integration.id,
    'shop_id', v_integration.shop_id,
    'platform_type', v_integration.platform_type,
    'is_active', v_integration.is_active,
    'created_at', v_integration.created_at,
    'updated_at', v_integration.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENT'ler
-- ============================================

COMMENT ON TABLE shop_integrations IS 'E-ticaret platformu entegrasyonları (İkas, Ticimax, Shopify, Custom)';
COMMENT ON COLUMN shop_integrations.platform_type IS 'Platform tipi: ikas, ticimax, shopify, custom';
COMMENT ON COLUMN shop_integrations.api_username IS 'API kullanıcı adı (özellikle custom platformlar için)';
COMMENT ON COLUMN shop_integrations.api_password IS 'API şifresi (özellikle custom platformlar için)';
COMMENT ON COLUMN shop_integrations.api_key IS 'API anahtarı (ilave güvenlik için)';
COMMENT ON COLUMN shop_integrations.api_secret IS 'API gizli anahtarı (ilave güvenlik için)';
COMMENT ON COLUMN shop_integrations.is_active IS 'Entegrasyon aktif mi?';
COMMENT ON COLUMN shop_integrations.sync_status IS 'Senkronizasyon durumu: pending, success, failed';
