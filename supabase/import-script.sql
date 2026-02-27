-- Data Import Script for Supabase
-- Use this to migrate existing MySQL data to Supabase

-- IMPORTANT: Run this AFTER running schema.sql

-- =============================================
-- MIGRATE SHOPS DATA
-- =============================================
-- Example: Copy your existing shops data here
INSERT INTO shops (shop_id, customer_id, name, logo_url, website_url, brand_name, contact_info_type, allowed_domains, active, created_at, updated_at)
VALUES
  ('SHOP001', null, 'Example Store', 'https://example.com/logo.png', 'https://example.com', 'ExampleBrand', 'email', '["example.com", "www.example.com"]', true, NOW(), NOW())
ON CONFLICT (shop_id) DO NOTHING;

-- =============================================
-- MIGRATE WIDGET SETTINGS
-- =============================================
-- Widget settings are linked by shop_id (UUID), not shop_id (VARCHAR)
-- First get the UUID for your shop, then insert settings

-- Get shop UUID (run this and note the id):
-- SELECT id, shop_id FROM shops WHERE shop_id = 'SHOP001';

-- Then insert widget settings:
INSERT INTO widget_settings (shop_id, title, description, button_text, show_on_load, popup_delay, title_color, description_color)
VALUES
  ((SELECT id FROM shops WHERE shop_id = 'SHOP001'), 'Çarkı Çevir<br>Hediyeni Kazan!', 'Hediyeni almak için hemen çarkı çevir.', 'ÇARKI ÇEVİR', true, 2000, '#ffffff', '#ffffff')
ON CONFLICT (shop_id) DO NOTHING;

-- =============================================
-- MIGRATE PRIZES
-- =============================================
INSERT INTO prizes (shop_id, name, description, redirect_url, color, chance, display_order, active, created_at, updated_at)
SELECT
  (SELECT id FROM shops WHERE shop_id = 'SHOP001'), -- Replace with your shop_id
  name,
  description,
  redirect_url,
  color,
  chance,
  display_order,
  active,
  created_at,
  updated_at
FROM (VALUES
  ('%10 İndirim', 'Tüm ürünlerde geçerli %10 indirim', 'https://example.com', '#FF6B6B', 30, 1, true, NOW(), NOW()),
  ('Ücretsiz Kargo', 'Siparişlerinizde ücretsiz kargo', 'https://example.com', '#4ECDC4', 25, 2, true, NOW(), NOW()),
  ('5 TL İndirim', 'Minimum 50 TL siparişlerde geçerli', 'https://example.com', '#95E1D3', 20, 3, true, NOW(), NOW()),
  ('Büyük Ödül', %1 şans ile özel hediye', 'https://example.com', '#F38181', 1, 4, true, NOW(), NOW()),
  ('Tekrar Dene', 'Bu sefer olmadı, bir dahaki sefere!', 'https://example.com', '#AA96DA', 24, 5, true, NOW(), NOW())
) AS prizes(name, description, redirect_url, color, chance, display_order, active, created_at, updated_at)
ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRATE COUPONS (optional)
-- =============================================
-- If you have predefined coupon codes
-- INSERT INTO coupons (shop_id, code, discount_type, discount_value, active, created_at)
-- VALUES
--   ((SELECT id FROM shops WHERE shop_id = 'SHOP001'), 'KOD10', 'percentage', 10.00, true, NOW()),
--   ((SELECT id FROM shops WHERE shop_id = 'SHOP001'), 'KARGO0', 'free_shipping', null, true, NOW());

-- =============================================
-- VERIFY DATA
-- =============================================
-- Check imported data
SELECT 'Shops:' as table_name, COUNT(*) FROM shops
UNION ALL
SELECT 'Widget Settings:', COUNT(*) FROM widget_settings
UNION ALL
SELECT 'Prizes:', COUNT(*) FROM prizes;

-- View shop data
SELECT * FROM shops;

-- View prizes with shop info
SELECT
  s.shop_id,
  s.name as shop_name,
  p.name as prize_name,
  p.color,
  p.chance
FROM prizes p
JOIN shops s ON p.shop_id = s.id
ORDER BY s.shop_id, p.display_order;
