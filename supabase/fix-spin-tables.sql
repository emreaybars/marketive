-- ============================================
-- Fix wheel_spins and won_prizes tables
-- Add missing columns and fix constraints
-- ============================================

-- Fix wheel_spins table
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS prize_id UUID REFERENCES prizes(id);

-- Make email nullable in wheel_spins (for phone-only entries)
ALTER TABLE wheel_spins ALTER COLUMN email DROP NOT NULL;

-- Fix won_prizes table
ALTER TABLE won_prizes ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE won_prizes ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- Make email nullable in won_prizes (for phone-only entries)
ALTER TABLE won_prizes ALTER COLUMN email DROP NOT NULL;

-- Add created_at column if missing
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wheel_spins_phone ON wheel_spins(phone);
CREATE INDEX IF NOT EXISTS idx_won_prizes_phone ON won_prizes(phone);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_full_name ON wheel_spins(full_name);

-- Add comments
COMMENT ON COLUMN wheel_spins.phone IS 'Phone number (alternative to email)';
COMMENT ON COLUMN wheel_spins.full_name IS 'Full name of the user';
COMMENT ON COLUMN won_prizes.phone IS 'Phone number (alternative to email)';
COMMENT ON COLUMN won_prizes.full_name IS 'Full name of the user';
