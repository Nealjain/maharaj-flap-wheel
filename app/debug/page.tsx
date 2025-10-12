'use client'

import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/optimized-data-provider'

export default function DebugPage() {
  const { user, loading: authLoading, profile } = useAuth()
  const { companies, items, transportCompanies, loading } = useData()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Debug Information</h1>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Authentication</h2>
            <div className="space-y-2">
              <p><strong>User:</strong> {user ? user.id : 'Not logged in'}</p>
              <p><strong>Profile:</strong> {profile ? `${profile.full_name} (${profile.role})` : 'No profile'}</p>
              <p><strong>Auth Loading:</strong> {authLoading ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Loading</h2>
            <div className="space-y-2">
              <p><strong>Companies Loading:</strong> {loading.companies ? 'Yes' : 'No'}</p>
              <p><strong>Items Loading:</strong> {loading.items ? 'Yes' : 'No'}</p>
              <p><strong>Transport Companies Loading:</strong> {loading.transportCompanies ? 'Yes' : 'No'}</p>
              <p><strong>Orders Loading:</strong> {loading.orders ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Counts</h2>
            <div className="space-y-2">
              <p><strong>Companies:</strong> {companies?.length || 0}</p>
              <p><strong>Items:</strong> {items?.length || 0}</p>
              <p><strong>Transport Companies:</strong> {transportCompanies?.length || 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sample Data</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Companies:</h3>
                <pre className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  {JSON.stringify(companies?.slice(0, 2), null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Items:</h3>
                <pre className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  {JSON.stringify(items?.slice(0, 2), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
