-- ============================================
-- ESKİ SPINLER İÇİN WHEEL_WINS KAYITLARI OLUŞTUR
-- ============================================

-- Eski spin'ler için wheel_wins kayıtlarını oluştur
INSERT INTO wheel_wins (spin_id, prize_id, shop_id, coupon_code, created_at)
SELECT
  ws.id as spin_id,
  (SELECT id FROM prizes p WHERE p.shop_id = ws.shop_id ORDER BY RANDOM() LIMIT 1)::UUID as prize_id,
  ws.shop_id,
  UPPER(SUBSTR(MD5(ws.id::TEXT), 1, 8)) as coupon_code,
  ws.created_at
FROM wheel_spins ws
WHERE NOT EXISTS (
  SELECT 1 FROM wheel_wins ww WHERE ww.spin_id = ws.id
);
