'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginDebugPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult({ status: 'Testing connection...' })
    
    try {
      // Test 1: Check Supabase connection
      const { data: healthCheck, error: healthError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
      
      if (healthError) {
        setResult({
          status: 'error',
          message: 'Database connection failed',
          error: healthError
        })
        setLoading(false)
        return
      }

      // Test 2: Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult({
          status: 'error',
          message: 'Login failed',
          error: error,
          details: {
            message: error.message,
            status: error.status,
            name: error.name
          }
        })
      } else {
        setResult({
          status: 'success',
          message: 'Login successful!',
          user: {
            id: data.user?.id,
            email: data.user?.email,
            role: data.user?.role
          },
          session: {
            access_token: data.session?.access_token?.substring(0, 20) + '...',
            expires_at: data.session?.expires_at
          }
        })
      }
    } catch (err: any) {
      setResult({
        status: 'error',
        message: 'Unexpected error',
        error: err.message || err.toString()
      })
    } finally {
      setLoading(false)
    }
  }

  const checkUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email, role')
        .limit(10)

      if (error) {
        setResult({
          status: 'error',
          message: 'Cannot fetch users',
          error: error
        })
      } else {
        setResult({
          status: 'success',
          message: 'Users in database',
          users: data
        })
      }
    } catch (err: any) {
      setResult({
        status: 'error',
        message: 'Unexpected error',
        error: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSupabaseConfig = () => {
    setResult({
      status: 'info',
      message: 'Supabase Configuration',
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set in environment',
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        clientInitialized: !!supabase
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Login Debug Tool
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Test Login
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="password"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={testConnection}
                disabled={loading || !email || !password}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Login'}
              </button>

              <button
                onClick={checkUsers}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Check Users
              </button>

              <button
                onClick={checkSupabaseConfig}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Check Config
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Result
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Common Issues:
          </h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>User doesn't exist in database</li>
            <li>Wrong email or password</li>
            <li>Email not confirmed (check Supabase email settings)</li>
            <li>RLS policies blocking access</li>
            <li>Supabase URL or API key incorrect</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
