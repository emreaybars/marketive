-- ============================================
-- WHEEL_WINS TABLE - Kazanılan ödüller tablosu
-- ============================================

CREATE TABLE IF NOT EXISTS wheel_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spin_id UUID NOT NULL,
  prize_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_wheel_wins_spin_id ON wheel_wins(spin_id);
CREATE INDEX IF NOT EXISTS idx_wheel_wins_shop_id ON wheel_wins(shop_id);
CREATE INDEX IF NOT EXISTS idx_wheel_wins_prize_id ON wheel_wins(prize_id);

-- RLS
ALTER TABLE wheel_wins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wheel_wins" ON wheel_wins;
DROP POLICY IF EXISTS "Service role can manage wheel_wins" ON wheel_wins;

CREATE POLICY "Users can view own wheel_wins"
  ON wheel_wins FOR SELECT
  TO authenticated
  USING (shop_id IN (SELECT id FROM shops WHERE customer_id = auth.uid()::text));

CREATE POLICY "Service role can manage wheel_wins"
  ON wheel_wins FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
