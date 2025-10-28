# User Approval System

## Overview
Implemented a complete user approval system where admins must approve new signups before users can login.

## Features

### 1. User Status Management
- **Pending**: New signups waiting for approval (cannot login)
- **Approved**: Users can login and access the system
- **Rejected**: Users cannot login (can be re-approved)
- **Disabled**: Previously approved users that have been disabled

### 2. Admin User Management Page
Location: `/admin/users`

**Features:**
- View all users with their status
- Filter by status (All, Pending, Approved, Rejected)
- Approve pending users
- Reject pending users
- Disable approved users
- Delete users permanently
- Change user roles (Staff, Manager, Admin)
- See user join dates and approval status

### 3. Login Flow
1. User signs up → Status set to "pending"
2. User tries to login → Blocked with message "Your account is pending approval"
3. Admin approves user → Status changed to "approved"
4. User can now login successfully

### 4. Database Changes
Added to `user_profiles` table:
- `status` (TEXT): User approval status
- `approved_by` (UUID): Admin who approved the user
- `approved_at` (TIMESTAMP): When user was approved

### 5. Access Control
- Only admins can access `/admin/users`
- Non-admin users are redirected to dashboard
- Admins cannot delete or disable themselves
- Existing users are automatically set to "approved"

## Setup Instructions

### 1. Run Database Migration
Execute the SQL file in Supabase SQL Editor:
```sql
-- File: supabase-user-approval-system.sql
```

### 2. Access Admin Panel
- Login as an admin user
- Navigate to "Manage Users" in the sidebar or user menu
- Approve/reject pending users

## User Experience

### For New Users
1. Sign up with email/password
2. See message: "Your account is pending approval"
3. Wait for admin approval
4. Receive notification (optional - can be added)
5. Login successfully

### For Admins
1. See notification of pending users (count in filter)
2. Review user details
3. Approve or reject with one click
4. Manage existing users (disable, delete, change roles)

## Security Features
- Users cannot bypass approval by directly accessing pages
- Auth check happens on every login attempt
- Disabled users are immediately logged out
- Admins cannot accidentally lock themselves out

## Navigation
- **Sidebar**: "Administration" → "Manage Users"
- **Mobile Menu**: User icon → "Manage Users"

## Future Enhancements
- Email notifications for approval/rejection
- Bulk approve/reject
- User activity logs
- Approval comments/notes
- Self-service password reset for pending users
