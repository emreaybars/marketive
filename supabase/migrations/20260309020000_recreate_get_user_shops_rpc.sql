-- ============================================
-- RECREATE GET_USER_SHOPS RPC - DROP ALL VERSIONS
-- ============================================

-- Drop ALL versions of get_user_shops function
DROP FUNCTION IF EXISTS get_user_shops(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_shops() CASCADE;

-- Create the function with proper signature
CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT DEFAULT NULL)
RETURNS SETOF JSON AS $$
BEGIN
  -- If no customer_id provided, use auth.uid()
  IF p_customer_id IS NULL THEN
    p_customer_id := auth.uid()::text;
  END IF;

  -- SECURITY: User must be logged in
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Giriş yapmalısınız';
  END IF;

  -- SECURITY: User can only access their own data
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
        'button_text_color', COALESCE(ws.button_text_color, '#ffffff'),
        'title_color', ws.title_color,
        'description_color', ws.description_color,
        'show_on_load', ws.show_on_load,
        'popup_delay', ws.popup_delay,
        'widget_position', ws.widget_position
      )
      FROM widget_settings ws
      WHERE ws.shop_id = s.id
      LIMIT 1
    )
  )::json
  FROM shops s
  WHERE s.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_shops(TEXT) TO authenticated;
