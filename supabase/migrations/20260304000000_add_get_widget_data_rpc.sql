-- ============================================
-- GET_WIDGET_DATA RPC Function
-- Widget için anonim erişim fonksiyonu
-- ============================================

DROP FUNCTION IF EXISTS get_widget_data(TEXT);

CREATE OR REPLACE FUNCTION get_widget_data(p_token TEXT)
RETURNS SETOF JSON AS $$
DECLARE
  v_shop_uuid UUID;
  v_shop_id TEXT;
  v_token_json JSONB;
  v_decoded_text TEXT;
BEGIN
  -- Token doğrulama
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RAISE EXCEPTION 'Geçersiz token';
  END IF;

  BEGIN
    -- Base64URL decode: - yerine +, _ yerine /, padding ekle
    v_decoded_text := p_token;
    v_decoded_text := replace(v_decoded_text, '-', '+');
    v_decoded_text := replace(v_decoded_text, '_', '/');
    -- Padding ekle
    WHILE length(v_decoded_text) % 4 != 0 LOOP
      v_decoded_text := v_decoded_text || '=';
    END LOOP;

    -- Decode ve JSON parse
    v_token_json := convert_from(decode(v_decoded_text, 'base64'), 'UTF8')::jsonb;

    -- Token'dan shop UUID'yi al (uid field)
    v_shop_uuid := (v_token_json->>'uid')::uuid;
    v_shop_id := v_token_json->>'sid';

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Token parse hatası: %', SQLERRM;
  END;

  -- Shop bilgilerini ve ödülleri getir
  RETURN QUERY
  SELECT json_build_object(
    'shop_name', s.name,
    'shop_logo', s.logo_url,
    'shop_url', s.website_url,
    'brand_name', s.brand_name,
    'contact_info_type', s.contact_info_type,
    'widget_title', COALESCE(ws.title, 'Çarkı Çevir<br/>Hediyeni Kazan!'),
    'widget_description', COALESCE(ws.description, 'Hediyeni almak için hemen çarkı çevir.'),
    'widget_button_text', COALESCE(ws.button_text, 'ÇARKI ÇEVİR'),
    'widget_show_on_load', COALESCE(ws.show_on_load, true),
    'widget_popup_delay', COALESCE(ws.popup_delay, 0),
    'widget_background_color', COALESCE(ws.background_color, 'rgba(139, 0, 0, 0.9)'),
    'widget_button_color', COALESCE(ws.button_color, '#d10000'),
    'widget_button_text_color', COALESCE(ws.button_text_color, '#ffffff'),
    'widget_title_color', COALESCE(ws.title_color, '#ffffff'),
    'widget_description_color', COALESCE(ws.description_color, '#ffffff'),
    'prizes', (
      SELECT json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'redirect_url', p.redirect_url,
        'color', p.color,
        'chance', p.chance,
        'coupon_codes', p.coupon_codes,
        'display_order', p.display_order,
        'active', p.active
      ))
      FROM prizes p
      WHERE p.shop_id = s.id
        AND p.active = true
      ORDER BY p.display_order ASC
    )
  )::json
  FROM shops s
  LEFT JOIN widget_settings ws ON ws.shop_id = s.id
  WHERE s.active = true
    AND s.id = v_shop_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anonim erişime izin ver (widget embed kullanımı için)
GRANT EXECUTE ON FUNCTION get_widget_data(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_widget_data(TEXT) TO authenticated;

-- GÜVENLİK NOTLARI:
-- 1. Bu fonksiyon SECURITY DEFINER ile çalışır
-- 2. Token validation production'da strengthen edilmeli (signature verification)
-- 3. Sadece active = true olan shop'lar return edilir
-- 4. Prizes da sadece active = true olanlar return edilir
