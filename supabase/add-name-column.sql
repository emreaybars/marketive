-- ============================================
-- Add Full Name Support
-- Add full_name column to won_prizes and wheel_spins tables
-- ============================================

-- Add full_name column
ALTER TABLE won_prizes ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- Add index for name searches
CREATE INDEX IF NOT EXISTS idx_won_prizes_full_name ON won_prizes(full_name);

COMMENT ON COLUMN won_prizes.full_name IS 'Full name of the user';
COMMENT ON COLUMN wheel_spins.full_name IS 'Full name of the user';
