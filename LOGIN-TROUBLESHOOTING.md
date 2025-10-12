# Login Troubleshooting Guide

## Quick Diagnosis

### Step 1: Use Debug Page
1. Go to: `http://localhost:3000/login-debug`
2. Enter your email and password
3. Click "Test Login"
4. Check the result

### Step 2: Common Issues & Solutions

#### Issue 1: "Invalid email or password"
**Possible Causes:**
- User doesn't exist in database
- Wrong credentials
- Email not confirmed

**Solutions:**

**A. Check if user exists in Supabase:**
```sql
-- Run in Supabase SQL Editor
SELECT email, role FROM user_profiles;
```

**B. Create a test user:**
```sql
-- Run in Supabase SQL Editor
-- This creates a user with email confirmation bypassed
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',  -- Change this
  crypt('admin123', gen_salt('bf')),  -- Change password
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Then create profile
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@test.com';
```

**C. Reset password for existing user:**
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'your-email@example.com';
```

#### Issue 2: "Email confirmation required"
**Solution:**

**Option A: Disable email confirmation (Development only)**
1. Go to Supabase Dashboard
2. Authentication → Settings
3. Disable "Enable email confirmations"

**Option B: Confirm email manually**
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```

#### Issue 3: "Database connection failed"
**Solutions:**

**A. Check Supabase URL and Key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy Project URL and anon/public key
3. Update `lib/supabase.ts` or create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**B. Check if Supabase project is active:**
- Go to Supabase Dashboard
- Check if project is paused (free tier pauses after inactivity)
- Click "Resume" if paused

#### Issue 4: "RLS Policy Error"
**Solution:**
```sql
-- Run in Supabase SQL Editor
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Or fix the policies:
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### Issue 5: "Session expired" or "Token invalid"
**Solution:**
```javascript
// Clear browser storage
localStorage.clear();
sessionStorage.clear();

// Then try logging in again
```

Or run this in browser console:
```javascript
localStorage.removeItem('supabase.auth.token');
location.reload();
```

### Step 3: Create Admin User (Quick Setup)

If you need to create an admin user quickly:

```sql
-- Run ALL of these in Supabase SQL Editor

-- 1. Create auth user
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@maharaj.com',
    crypt('Admin@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;

  -- Insert into user_profiles
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (new_user_id, 'admin@maharaj.com', 'Admin User', 'admin');
  
  RAISE NOTICE 'Admin user created successfully!';
END $$;
```

**Login with:**
- Email: `admin@maharaj.com`
- Password: `Admin@123`

### Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for errors like:
   - "Failed to fetch"
   - "Network error"
   - "CORS error"
   - "Invalid JWT"

### Step 5: Verify Supabase Setup

**Checklist:**
- [ ] Supabase project is active (not paused)
- [ ] URL and API key are correct
- [ ] Email confirmation is disabled (for testing)
- [ ] RLS policies are set up correctly
- [ ] At least one user exists in database
- [ ] User's email is confirmed

### Step 6: Test with cURL

Test authentication directly:
```bash
curl -X POST 'https://YOUR-PROJECT.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

## Quick Fixes

### Fix 1: Reset Everything
```sql
-- WARNING: This deletes all users!
TRUNCATE auth.users CASCADE;
TRUNCATE user_profiles CASCADE;

-- Then create new admin user (see Step 3 above)
```

### Fix 2: Disable All Security (Testing Only!)
```sql
-- Disable RLS on all tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable after testing!
```

### Fix 3: Check Network
```bash
# Test if Supabase is reachable
curl https://YOUR-PROJECT.supabase.co/rest/v1/

# Should return: {"message":"The server is running"}
```

## Still Not Working?

### Option 1: Use Debug Page
1. Go to `/login-debug`
2. Click "Check Config" to see configuration
3. Click "Check Users" to see if users exist
4. Try test login with credentials

### Option 2: Check Supabase Logs
1. Go to Supabase Dashboard
2. Logs → Auth Logs
3. Look for failed login attempts
4. Check error messages

### Option 3: Contact Support
Provide this information:
- Error message from browser console
- Result from `/login-debug` page
- Supabase project URL (without keys!)
- Steps you've tried

## Prevention

### For Production:
1. ✅ Enable email confirmation
2. ✅ Enable RLS on all tables
3. ✅ Use environment variables for keys
4. ✅ Set up proper password policies
5. ✅ Enable 2FA for admin accounts
6. ✅ Regular backups

### For Development:
1. ✅ Disable email confirmation
2. ✅ Create test users with known passwords
3. ✅ Keep RLS enabled but with permissive policies
4. ✅ Use `.env.local` for configuration
5. ✅ Document test credentials

## Test Credentials Template

Create a `TEST-CREDENTIALS.md` file (add to .gitignore):
```markdown
# Test Credentials (DO NOT COMMIT)

## Admin User
- Email: admin@test.com
- Password: Admin@123
- Role: admin

## Staff User
- Email: staff@test.com
- Password: Staff@123
- Role: staff
```
