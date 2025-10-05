# User Roles & Registration Guide

## User Role System

The application has a hierarchical role system with three levels:

### 1. **Admin** (Highest Level)
- Full access to all features
- Can manage users and change roles
- Can view audit logs and activity history
- Can create, edit, and delete all data
- Access to Users page and Settings

### 2. **Staff** (Default Level)
- Can manage orders, items, companies, and transport companies
- Can view dashboard and reports
- Can create and edit orders
- Cannot manage users or change roles
- Cannot view audit logs

### 3. **User** (Basic Level)
- Limited access (currently same as staff)
- Can be customized for read-only access in future

## Registration Flow

### New User Registration

When a new user registers:

1. **User fills registration form** with:
   - Full Name
   - Email
   - Password

2. **Account is created automatically as "Staff"**
   - Database trigger creates user profile
   - Default role: `staff`
   - User can immediately log in

3. **Admin assigns roles later** (if needed)
   - Admin goes to Users page
   - Selects role from dropdown
   - Can promote to Admin or demote to User

### First Admin Setup

For the first admin account:

1. **Visit `/setup` page** (only works if no users exist)
2. **Fill in admin details**
3. **Account is created with Admin role**
4. **Can now manage all users**

## How It Works

### Database Trigger (Automatic)

The database has a trigger that automatically creates a user profile when someone registers:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'staff');
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

This ensures:
- ✅ Every new user gets a profile automatically
- ✅ Default role is always 'staff'
- ✅ No manual intervention needed for basic registration

### Role Management (Manual)

Admins can change user roles:

1. **Go to Users page** (`/users`)
2. **Find the user** in the table
3. **Select new role** from dropdown:
   - User (basic access)
   - Staff (standard access)
   - Admin (full access)
4. **Role is updated immediately**

## User Registration Process

### For Regular Users:

```
1. User visits /register
   ↓
2. Fills in: Name, Email, Password
   ↓
3. Clicks "Create Account"
   ↓
4. Database trigger creates profile with role='staff'
   ↓
5. User receives success message
   ↓
6. User can log in immediately as Staff
   ↓
7. Admin can change role later if needed
```

### For First Admin:

```
1. Visit /setup (only works if no users exist)
   ↓
2. Fill in admin details
   ↓
3. Account created with role='admin'
   ↓
4. Can now manage all users
```

## Error Handling

### "Account created but failed to set role"

This error is now handled gracefully:

- **Old behavior**: Error message, user couldn't log in
- **New behavior**: 
  - User account is created successfully
  - Profile is created by database trigger
  - User can log in as Staff
  - Admin can adjust role later if needed
  - Success message: "Account created successfully! You can now sign in as a staff member."

### Why This Approach?

1. **Automatic**: Database trigger ensures profile is always created
2. **Secure**: New users can't make themselves admin
3. **Flexible**: Admins can adjust roles anytime
4. **User-friendly**: No confusing error messages
5. **Reliable**: Works even if manual profile creation fails

## Checking User Roles

### In the Application:

```typescript
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { isAdmin, profile } = useAuth()
  
  // Check if user is admin
  if (isAdmin) {
    // Show admin features
  }
  
  // Check specific role
  if (profile?.role === 'staff') {
    // Show staff features
  }
}
```

### In the Database:

```sql
-- View all users and their roles
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC;

-- Count users by role
SELECT role, COUNT(*) as count
FROM user_profiles
GROUP BY role;
```

## Best Practices

### For Admins:

1. ✅ Review new user registrations regularly
2. ✅ Assign appropriate roles based on job function
3. ✅ Use "Staff" for most users
4. ✅ Only promote trusted users to "Admin"
5. ✅ Check audit logs to monitor user activity

### For Users:

1. ✅ Register with your real name and work email
2. ✅ Wait for admin to assign appropriate role if needed
3. ✅ Contact admin if you need elevated permissions
4. ✅ Don't share your login credentials

## Security Features

1. **Row Level Security (RLS)**: Database enforces access control
2. **Role-based permissions**: Features hidden based on role
3. **Audit logging**: All actions tracked with user ID
4. **Session management**: Secure authentication with Supabase

## Troubleshooting

### User can't log in after registration

**Solution**: 
- Check if email verification is required
- Verify user exists in `auth.users` table
- Check if profile exists in `user_profiles` table
- Ensure database trigger is active

### User has wrong role

**Solution**:
- Admin goes to Users page
- Finds the user
- Changes role from dropdown
- Role updates immediately

### Can't create first admin

**Solution**:
- Use `/setup` page (only works if no users exist)
- Or manually update role in database:
  ```sql
  UPDATE user_profiles 
  SET role = 'admin' 
  WHERE email = 'your-email@example.com';
  ```

## Summary

- ✅ **New users**: Automatically created as "Staff"
- ✅ **Role changes**: Only admins can modify roles
- ✅ **First admin**: Use `/setup` page
- ✅ **Secure**: Database trigger ensures consistency
- ✅ **Flexible**: Roles can be changed anytime
- ✅ **User-friendly**: No confusing error messages

The system is designed to be secure by default while remaining flexible for administrators to manage their team effectively.
