-- ============================================
-- RPC Function: Get User's Shops
-- Works with Clerk user IDs (TEXT type)
-- ============================================

CREATE OR REPLACE FUNCTION get_user_shops(p_customer_id TEXT)
RETURNS TABLE (
  id UUID,
  shop_id TEXT,
  customer_id TEXT,
  name TEXT,
  logo_url TEXT,
  website_url TEXT,
  brand_name TEXT,
  contact_info_type TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  widget_settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.shop_id,
    s.customer_id,
    s.name,
    s.logo_url,
    s.website_url,
    s.brand_name,
    s.contact_info_type,
    s.active,
    s.created_at,
    s.updated_at,
    (
      SELECT jsonb_build_object(
        'id', ws.id,
        'shop_id', ws.shop_id,
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
    ) as widget_settings
  FROM shops s
  WHERE s.customer_id = p_customer_id
  ORDER BY s.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_shops TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_shops TO anon;
