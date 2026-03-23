-- Add email, phone, prize_type columns to wheel_wins for order sync
-- Make prize_id nullable since order sync doesn't have it

-- Make prize_id nullable
ALTER TABLE wheel_wins ALTER COLUMN prize_id DROP NOT NULL;

-- Add new columns
ALTER TABLE wheel_wins ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE wheel_wins ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE wheel_wins ADD COLUMN IF NOT EXISTS prize_type TEXT;
