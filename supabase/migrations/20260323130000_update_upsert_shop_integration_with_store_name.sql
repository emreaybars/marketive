-- ============================================
-- UPSERT_SHOP_INTEGRATION - STORE_NAME ile güncelle
-- ============================================

CREATE OR REPLACE FUNCTION upsert_shop_integration(
  p_shop_id UUID,
  p_platform_type TEXT,
  p_api_username TEXT DEFAULT NULL,
  p_api_password TEXT DEFAULT NULL,
  p_store_name TEXT DEFAULT NULL
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
    INSERT INTO shop_integrations (shop_id, platform_type, api_username, api_password, store_name)
    VALUES (p_shop_id, p_platform_type, p_api_username, p_api_password, p_store_name)
    RETURNING * INTO v_integration;
  ELSE
    -- Mevcut entegrasyonu güncelle
    UPDATE shop_integrations
    SET
      api_username = COALESCE(p_api_username, api_username),
      api_password = COALESCE(p_api_password, api_password),
      store_name = COALESCE(p_store_name, store_name),
      updated_at = NOW()
    WHERE id = v_integration.id
    RETURNING * INTO v_integration;
  END IF;

  RETURN json_build_object(
    'id', v_integration.id,
    'shop_id', v_integration.shop_id,
    'platform_type', v_integration.platform_type,
    'store_name', v_integration.store_name,
    'is_active', v_integration.is_active,
    'created_at', v_integration.created_at,
    'updated_at', v_integration.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
