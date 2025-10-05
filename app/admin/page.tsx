'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { supabase, UserProfile, AuditLog, LoginActivity } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { 
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  MoonIcon,
  SunIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Fetch users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch audit logs
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch login activities
      const { data: loginData } = await supabase
        .from('login_activities')
        .select('*')
        .order('login_time', { ascending: false })
        .limit(10)

      setUsers(usersData || [])
      setAuditLogs(auditData || [])
      setLoginActivities(loginData || [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      addToast('Error fetching admin data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      // This would need to be implemented with proper confirmation
      addToast('Delete all functionality requires confirmation', 'warning')
      setShowDeleteConfirm(false)
    } catch (error) {
      addToast('Error deleting data', 'error')
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    addToast(`Dark mode ${!darkMode ? 'enabled' : 'disabled'}`, 'info')
  }

  if (loading) {
    return (
      <Layout requireAdmin>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAdmin>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 mt-1">System administration and user management</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={toggleDarkMode}
              className="btn-secondary flex items-center space-x-2"
            >
              {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button className="btn-primary flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Admin Users</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(user => user.role === 'admin').length}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Audit Logs</p>
                <p className="text-2xl font-bold text-white">{auditLogs.length}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Login Activities</p>
                <p className="text-2xl font-bold text-white">{loginActivities.length}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Users Management</h2>
            <button className="btn-primary flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="font-medium text-white">
                      {user.full_name}
                    </td>
                    <td className="text-gray-300">
                      {user.email}
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-400 transition-colors">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* System Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">System Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="btn-secondary text-center py-3">
              View Audit Logs
            </button>
            <button className="btn-secondary text-center py-3">
              View Login Activities
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger text-center py-3"
            >
              Delete All Data
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log, index) => (
              <div key={log.id} className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm">{log.event_type} on {log.entity}</span>
                <span className="text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete all data? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="btn-danger flex-1"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  )
}

export const dynamic = 'force-dynamic'
