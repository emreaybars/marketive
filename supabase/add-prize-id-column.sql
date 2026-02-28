-- ============================================
-- Add prize_id column to wheel_spins table
-- This links spin records to the actual prize won
-- ============================================

-- Add prize_id column to wheel_spins
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS prize_id UUID REFERENCES prizes(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_wheel_spins_prize_id ON wheel_spins(prize_id);

-- Add comment
COMMENT ON COLUMN wheel_spins.prize_id IS 'Reference to the prize that was won';

-- Note: This column needs to be added before the RPC function will work
-- Run this migration in Supabase SQL Editor, then update the RPC function
