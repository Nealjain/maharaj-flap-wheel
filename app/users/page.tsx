'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'staff'
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = users

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <ShieldCheckIcon className="w-3 h-3 mr-1" />
          @admin
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <UserIcon className="w-3 h-3 mr-1" />
        Staff
      </span>
    )
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage system users and their roles
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => router.push('/users/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding your first user.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/users/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {user.full_name || 'No name set'}
                            </h3>
                            {getRoleBadge(user.role)}
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{user.email}</span>
                            <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {user.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Admins
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter(user => user.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Staff
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter(user => user.role === 'staff').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
