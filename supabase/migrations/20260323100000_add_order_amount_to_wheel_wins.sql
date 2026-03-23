-- ============================================
-- WHEEL_WINS - ORDER_AMOUNT EKLE
-- Çarkıfelek ile kazanılan ödüllerin sipariş tutarı
-- ============================================

-- order_amount sütunu ekle
ALTER TABLE wheel_wins
ADD COLUMN IF NOT EXISTS order_amount NUMERIC(12, 2) DEFAULT 0;

-- Yorum ekle
COMMENT ON COLUMN wheel_wins.order_amount IS 'Bu ödül kullanılarak yapılan siparişin tutarı (TL)';

-- Index ekle (sorgular için)
CREATE INDEX IF NOT EXISTS idx_wheel_wins_order_amount ON wheel_wins(order_amount);
