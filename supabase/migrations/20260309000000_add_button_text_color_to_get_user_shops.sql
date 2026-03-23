-- ============================================
-- ADD button_text_color TO GET_USER_SHOPS RPC
-- ============================================

-- Mevcut fonksiyonu sil ve yeniden oluştur
DROP FUNCTION IF EXISTS get_user_shops(TEXT);

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
        'button_text_color', ws.button_text_color,
        'title_color', ws.title_color,
        'description_color', ws.description_color,
        'show_on_load', ws.show_on_load,
        'popup_delay', ws.popup_delay,
        'widget_position', ws.widget_position
      )
      FROM widget_settings ws
      WHERE ws.shop_id = s.id
    )
  )::json
  FROM shops s
  WHERE s.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
