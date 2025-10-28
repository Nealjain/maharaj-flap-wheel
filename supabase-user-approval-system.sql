-- Add approval status to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Add constraint after column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_status_check'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'disabled'));
  END IF;
END $$;

-- Add approved_by and approved_at columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to approved status (they're already in the system)
UPDATE user_profiles 
SET status = 'approved', approved_at = NOW()
WHERE status IS NULL OR status = 'pending';

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION is_user_approved(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles with pending status
  INSERT INTO user_profiles (id, email, status)
  VALUES (NEW.id, NEW.email, 'pending')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_user_approved(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO service_role;
