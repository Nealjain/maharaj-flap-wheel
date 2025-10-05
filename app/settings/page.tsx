'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import ConfirmDialog from '@/components/ConfirmDialog'
import { 
  SunIcon,
  MoonIcon,
  CogIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteType, setDeleteType] = useState('')

  const handleDeleteAll = async (type: string) => {
    if (!isAdmin) return

    try {
      const response = await fetch('/api/admin/delete-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      const result = await response.json()

      if (result.error) {
        alert(`Failed to delete all ${type}: ${result.error}`)
      } else {
        alert(`Successfully deleted all ${type}`)
        // Refresh the page to show updated data
        window.location.reload()
      }
    } catch (error) {
      console.error(`Error deleting all ${type}:`, error)
      alert(`Failed to delete all ${type}. Please try again.`)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const adminActions = [
    {
      title: 'Delete All Users',
      description: 'Remove all users from the system (except current user)',
      icon: TrashIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      onClick: () => {
        setDeleteType('users')
        setShowDeleteDialog(true)
      }
    },
    {
      title: 'Delete All Orders',
      description: 'Remove all orders from the system',
      icon: TrashIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      onClick: () => {
        setDeleteType('orders')
        setShowDeleteDialog(true)
      }
    },
    {
      title: 'Delete All Stock',
      description: 'Reset all inventory items',
      icon: TrashIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      onClick: () => {
        setDeleteType('stock')
        setShowDeleteDialog(true)
      }
    },
    {
      title: 'Delete All Transport',
      description: 'Remove all transport companies',
      icon: TrashIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      onClick: () => {
        setDeleteType('transport')
        setShowDeleteDialog(true)
      }
    }
  ]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your preferences and system configuration
          </p>
        </div>

        {/* User Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Profile
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.full_name || 'No name set'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
              <div className="mt-1">
                {isAdmin ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                    <ShieldCheckIcon className="w-3 h-3 mr-1" />
                    @admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    <UserIcon className="w-3 h-3 mr-1" />
                    Staff
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Theme
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose your preferred color scheme
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {theme === 'dark' ? (
                  <>
                    <SunIcon className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Admin Tools
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              These actions are destructive and cannot be undone. Use with caution.
            </p>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {adminActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={action.onClick}
                  className={`p-4 rounded-lg border ${action.borderColor} ${action.bgColor} hover:opacity-80 transition-opacity duration-200 text-left`}
                >
                  <div className="flex items-center">
                    <action.icon className={`h-5 w-5 ${action.color} mr-3`} />
                    <div>
                      <h3 className={`text-sm font-medium ${action.color}`}>
                        {action.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Session
          </h2>
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={() => {
            handleDeleteAll(deleteType)
            setShowDeleteDialog(false)
          }}
          title={`Delete All ${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)}`}
          message={`Are you sure you want to delete all ${deleteType}? This action cannot be undone and will permanently remove all ${deleteType} from the system.`}
          confirmText="Delete All"
          cancelText="Cancel"
          type="danger"
          requireTyping={true}
          confirmationText="DELETE"
        />
      </div>
    </Layout>
  )
}
