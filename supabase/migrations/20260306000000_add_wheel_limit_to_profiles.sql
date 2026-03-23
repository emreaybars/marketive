-- ============================================
-- Add wheel_limit column to profiles table
-- Default value is 0 (no wheels allowed)
-- Admins can update this value per user
-- ============================================

-- Add wheel_limit column to profiles table (if profiles table exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wheel_limit INTEGER DEFAULT 0 NOT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_wheel_limit ON profiles(wheel_limit);

-- Alternatively, if there's a users table or auth.users table that we need to add this to
-- Check if we need to add to auth.users (managed by Supabase)
-- Note: We cannot directly add columns to auth.users, so we use profiles table

-- ============================================
-- Optional: Create a function to get user's wheel limit
-- ============================================
DROP FUNCTION IF EXISTS get_user_wheel_limit(TEXT);

CREATE OR REPLACE FUNCTION get_user_wheel_limit(p_customer_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Try to get from profiles table
  SELECT COALESCE(p.wheel_limit, 0) INTO v_limit
  FROM profiles p
  WHERE p.id::text = p_customer_id;
  
  -- If not found, return 0
  IF v_limit IS NULL THEN
    v_limit := 0;
  END IF;
  
  RETURN v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_wheel_limit(TEXT) TO authenticated;

-- ============================================
-- Update existing profiles with wheel_limit = 1
-- (For existing users, give them 1 free wheel)
-- ============================================
UPDATE profiles 
SET wheel_limit = 1 
WHERE wheel_limit = 0 AND EXISTS (
  SELECT 1 FROM auth.users WHERE id::text = profiles.id
);
