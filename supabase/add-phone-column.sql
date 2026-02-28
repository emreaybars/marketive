-- ============================================
-- Add Phone Number Support
-- Add phone column to won_prizes and wheel_spins tables
-- ============================================

-- Add phone column to won_prizes
ALTER TABLE won_prizes ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add phone column to wheel_spins
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_won_prizes_shop_phone ON won_prizes(shop_id, phone);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_phone ON wheel_spins(phone);

-- Add comment
COMMENT ON COLUMN won_prizes.phone IS 'Phone number (alternative to email)';
COMMENT ON COLUMN wheel_spins.phone IS 'Phone number (alternative to email)';
