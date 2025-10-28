'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  status: string
  created_at: string
  approved_at: string | null
  approved_by: string | null
}

export default function UserManagementPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    // Check if user is admin
    if (profile && profile.role !== 'admin') {
      addToast('Access denied. Admin only.', 'error')
      router.push('/')
      return
    }
    
    if (profile) {
      fetchUsers()
    }
  }, [profile])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      addToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      addToast('User approved successfully', 'success')
      fetchUsers()
    } catch (error: any) {
      console.error('Error approving user:', error)
      addToast('Failed to approve user', 'error')
    }
  }

  const rejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      addToast('User rejected', 'success')
      fetchUsers()
    } catch (error: any) {
      console.error('Error rejecting user:', error)
      addToast('Failed to reject user', 'error')
    }
  }

  const disableUser = async (userId: string) => {
    if (!confirm('Are you sure you want to disable this user? They will not be able to login.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: 'disabled' })
        .eq('id', userId)

      if (error) throw error

      addToast('User disabled successfully', 'success')
      fetchUsers()
    } catch (error: any) {
      console.error('Error disabling user:', error)
      addToast('Failed to disable user', 'error')
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete from user_profiles (auth.users will cascade)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      addToast('User deleted successfully', 'success')
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      addToast('Failed to delete user. Try disabling instead.', 'error')
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      addToast('User role updated', 'success')
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating role:', error)
      addToast('Failed to update role', 'error')
    }
  }

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true
    return u.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Rejected
          </span>
        )
      case 'disabled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Disabled
          </span>
        )
      default:
        return null
    }
  }

  if (profile?.role !== 'admin') {
    return null
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <UserGroupIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Approve, manage, and remove users
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Pending ({users.filter(u => u.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Approved ({users.filter(u => u.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Rejected ({users.filter(u => u.status === 'rejected').length})
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((userProfile, index) => (
                  <motion.tr
                    key={userProfile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {userProfile.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {userProfile.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userProfile.role}
                        onChange={(e) => updateUserRole(userProfile.id, e.target.value)}
                        disabled={userProfile.id === user?.id}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(userProfile.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {userProfile.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveUser(userProfile.id)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => rejectUser(userProfile.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Reject"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {userProfile.status === 'approved' && userProfile.id !== user?.id && (
                          <button
                            onClick={() => disableUser(userProfile.id)}
                            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                            title="Disable"
                          >
                            <ExclamationTriangleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {userProfile.status === 'rejected' && (
                          <button
                            onClick={() => approveUser(userProfile.id)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Approve"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {userProfile.id !== user?.id && (
                          <button
                            onClick={() => deleteUser(userProfile.id, userProfile.email)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
