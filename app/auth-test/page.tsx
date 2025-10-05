'use client'

import { useAuth } from '@/lib/auth'

export default function AuthTestPage() {
  const { user, loading, profile } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Auth Test Page</h1>
      <div className="mt-4 space-y-2">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? user.id : 'Not logged in'}</p>
        <p><strong>Profile:</strong> {profile ? `${profile.full_name} (${profile.role})` : 'No profile'}</p>
      </div>
    </div>
  )
}
