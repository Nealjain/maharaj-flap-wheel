'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { 
  ArrowLeftIcon,
  ClockIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface ActivityPageProps {
  params: Promise<{
    id: string
  }>
}

export default function UserActivityPage({ params }: ActivityPageProps) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loginActivities, setLoginActivities] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'changes' | 'logins'>('changes')

  useEffect(() => {
    params.then(({ id }) => setUserId(id))
  }, [params])

  useEffect(() => {
    if (userId && isAdmin) {
      fetchActivity()
    }
  }, [userId, isAdmin])

  const fetchActivity = async () => {
    setLoading(true)
    try {
      // Get the session token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/users/${userId}/activity`, { headers })
      const result = await response.json()

      if (result.error) {
        console.error('Activity fetch error:', result)
        throw new Error(result.error)
      }

      setAuditLogs(result.auditLogs || [])
      setLoginActivities(result.loginActivities || [])
    } catch (error) {
      console.error('Error fetching activity:', error)
      alert('Failed to fetch user activity. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CREATE':
        return <PlusIcon className="h-4 w-4 text-green-600" />
      case 'UPDATE':
        return <PencilIcon className="h-4 w-4 text-blue-600" />
      case 'DELETE':
        return <TrashIcon className="h-4 w-4 text-red-600" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You need admin privileges to view user activity.
          </p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Activity Log
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View all actions and login history
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('changes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'changes'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Changes ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('logins')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logins'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Login History ({loginActivities.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'changes' ? (
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No activity yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This user hasn't made any changes.
                </p>
              </div>
            ) : (
              auditLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">{getEventIcon(log.event_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(log.event_type)}`}>
                            {log.event_type}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.entity}
                          </span>
                        </div>
                        {log.entity_id && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            ID: {log.entity_id}
                          </p>
                        )}
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loginActivities.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No login history
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No login records found for this user.
                </p>
              </div>
            ) : (
              loginActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {activity.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.success ? 'Successful Login' : 'Failed Login'}
                        </p>
                        {activity.ip && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            IP: {activity.ip}
                          </p>
                        )}
                        {activity.user_agent && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {activity.user_agent}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
