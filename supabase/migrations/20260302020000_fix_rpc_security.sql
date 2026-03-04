-- ============================================
-- RPC FONKSIYON GÜVENLİK DÜZELTMESİ
-- ============================================
-- ÖNCEKI SÜRÜMDE: Herhangi bir kullanıcı başka kullanıcının customer_id'sini
-- geçirerek onun verilerini görebilirdi.
-- DÜZELTME: auth.uid() ile doğrulama eklendi

-- Eski fonksiyonları sil
DROP FUNCTION IF EXISTS get_user_shops(TEXT);
DROP FUNCTION IF EXISTS get_user_wheel_spins(TEXT);

-- ============================================
-- GÜVENLI get_user_shops
-- Sadece kendi verilerinizi getirebilir
-- ============================================
CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT)
RETURNS SETOF JSON AS $$
BEGIN
  -- GÜVENLİK: Sadece kendi verilerinizi isteyebilirsiniz
  IF p_customer_id != auth.uid()::text THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Başka kullanıcının verilerini göremezsiniz';
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
        'title_color', ws.title_color,
        'description_color', ws.description_color,
        'show_on_load', ws.show_on_load,
        'popup_delay', ws.popup_delay
      )
      FROM widget_settings ws
      WHERE ws.shop_id = s.id
    )
  )::json
  FROM shops s
  WHERE s.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GÜVENLI get_user_wheel_spins
-- Sadece kendi verilerinizi getirebilir
-- ============================================
CREATE OR REPLACE FUNCTION get_user_wheel_spins(p_customer_id TEXT)
RETURNS SETOF JSON AS $$
BEGIN
  -- GÜVENLİK: Sadece kendi verilerinizi isteyebilirsiniz
  IF p_customer_id != auth.uid()::text THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Başka kullanıcının verilerini göremezsiniz';
  END IF;

  RETURN QUERY
  SELECT json_build_object(
    'spin_id', ws.id,
    'shop_id', ws.shop_id,
    'full_name', ws.full_name,
    'email', ws.email,
    'phone', ws.phone,
    'prize_name', COALESCE(wp.name, 'Bilinmeyen Ödül'),
    'coupon_code', ww.coupon_code,
    'won_at', ww.created_at
  )::json
  FROM wheel_spins ws
  JOIN shops s ON s.id = ws.shop_id
  LEFT JOIN wheel_wins ww ON ww.spin_id = ws.id
  LEFT JOIN prizes wp ON wp.id = ww.prize_id
  WHERE s.customer_id = p_customer_id
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ALTERNATIF: auth.uid() kullanan versiyon
-- Parametre gerektirmez, otomatik olarak giriş yapmış kullanıcıyı kullanır
-- ============================================

CREATE OR REPLACE FUNCTION get_my_shops()
RETURNS SETOF JSON AS $$
BEGIN
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
        'title_color', ws.title_color,
        'description_color', ws.description_color,
        'show_on_load', ws.show_on_load,
        'popup_delay', ws.popup_delay
      )
      FROM widget_settings ws
      WHERE ws.shop_id = s.id
    )
  )::json
  FROM shops s
  WHERE s.customer_id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_wheel_spins()
RETURNS SETOF JSON AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'spin_id', ws.id,
    'shop_id', ws.shop_id,
    'full_name', ws.full_name,
    'email', ws.email,
    'phone', ws.phone,
    'prize_name', COALESCE(wp.name, 'Bilinmeyen Ödül'),
    'coupon_code', ww.coupon_code,
    'won_at', ww.created_at
  )::json
  FROM wheel_spins ws
  JOIN shops s ON s.id = ws.shop_id
  LEFT JOIN wheel_wins ww ON ww.spin_id = ws.id
  LEFT JOIN prizes wp ON wp.id = ww.prize_id
  WHERE s.customer_id = auth.uid()::text
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
