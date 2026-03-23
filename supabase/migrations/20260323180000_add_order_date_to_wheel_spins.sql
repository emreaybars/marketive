-- ============================================
-- WHEEL_SPINS - ORDER_DATE sütunu ekle
-- ============================================

-- Sipariş tarihi sütunu ekle
ALTER TABLE wheel_spins
ADD COLUMN IF NOT EXISTS order_date TIMESTAMPTZ;

COMMENT ON COLUMN wheel_spins.order_date IS 'Eşleşen siparişin tarihi (ButikSistem API)';

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_wheel_spins_order_date ON wheel_spins(order_date);
