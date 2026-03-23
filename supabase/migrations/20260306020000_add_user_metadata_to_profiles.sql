-- ============================================
-- Add phone and full_name to profiles table
-- ============================================

-- Add phone column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add full_name column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- ============================================
-- Create trigger to sync auth.users metadata to profiles
-- ============================================

CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles table when user metadata changes
  UPDATE profiles
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phoneNumber', phone),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata();

-- Create trigger for user update
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata();
