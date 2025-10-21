'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/csv-export'
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

interface AuditLog {
  id: string
  event_type: string
  entity: string
  entity_id: string
  performed_by: string
  payload: any
  created_at: string
  user_email?: string
}

interface OrderLedgerProps {
  isOpen: boolean
  onClose: () => void
}

export default function OrderLedger({ isOpen, onClose }: OrderLedgerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // First, get audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity', 'orders')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logsError) {
        console.error('Error fetching logs:', logsError)
        throw logsError
      }

      // Then, get user profiles for the performed_by IDs
      const userIds = Array.from(new Set(logsData?.map(log => log.performed_by).filter(Boolean)))
      
      let userProfiles: any = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds)

        userProfiles = profiles?.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile
          return acc
        }, {}) || {}
      }

      // Combine logs with user info
      const logsWithEmail = logsData?.map(log => ({
        ...log,
        user_email: userProfiles[log.performed_by]?.email || 
                    userProfiles[log.performed_by]?.full_name || 
                    'System'
      })) || []

      setLogs(logsWithEmail)
    } catch (error: any) {
      console.error('Error fetching audit logs:', error?.message || error)
      // Set empty logs on error so UI doesn't break
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CREATE':
        return <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'UPDATE':
        return <PencilIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'DELETE':
        return <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatPayload = (payload: any) => {
    if (!payload) return null
    
    const items = []
    
    if (payload.company_id) items.push('Company updated')
    if (payload.transport_company_id) items.push('Transport updated')
    if (payload.status) items.push(`Status: ${payload.status}`)
    if (payload.notes) items.push('Notes updated')
    if (payload.items) items.push(`${payload.items.length} items`)
    if (payload.items_count) items.push(`${payload.items_count} items`)
    
    return items.length > 0 ? items.join(', ') : 'Order modified'
  }

  const renderDetailedPayload = (payload: any, eventType: string) => {
    if (!payload) return <p className="text-xs text-gray-500 dark:text-gray-400">No details available</p>

    return (
      <div className="space-y-2 text-xs">
        {payload.company_id && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Company:</span>
            <span className="text-gray-900 dark:text-white font-medium">{payload.company_id}</span>
          </div>
        )}
        
        {payload.transport_company_id && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Transport:</span>
            <span className="text-gray-900 dark:text-white font-medium">{payload.transport_company_id}</span>
          </div>
        )}
        
        {payload.status && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Status:</span>
            <span className="text-gray-900 dark:text-white font-medium capitalize">{payload.status}</span>
          </div>
        )}
        
        {payload.notes && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Notes:</span>
            <span className="text-gray-900 dark:text-white">{payload.notes}</span>
          </div>
        )}
        
        {payload.items && payload.items.length > 0 && (
          <div className="space-y-1">
            <span className="text-gray-500 dark:text-gray-400">Items ({payload.items.length}):</span>
            <div className="ml-4 space-y-1">
              {payload.items.map((item: any, idx: number) => (
                <div key={idx} className="text-gray-900 dark:text-white">
                  • Qty: {item.quantity}{item.price ? `, Price: ₹${item.price}` : ''}{item.due_date ? `, Due: ${item.due_date}` : ''}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {payload.items_count && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Items:</span>
            <span className="text-gray-900 dark:text-white font-medium">{payload.items_count} items deleted</span>
          </div>
        )}
        
        {eventType === 'CREATE' && !payload.items && (
          <div className="text-gray-500 dark:text-gray-400 italic">Order created</div>
        )}
        
        {eventType === 'DELETE' && (
          <div className="text-red-600 dark:text-red-400 italic">Order deleted</div>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Ledger Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Order Ledger
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log, index) => {
                    const isExpanded = expandedLog === log.id
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getEventIcon(log.event_type)}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(log.event_type)}`}>
                              {log.event_type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>

                        {/* Order ID */}
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Order #{log.entity_id?.substring(0, 8)}...
                        </div>

                        {/* Summary or Details */}
                        {isExpanded ? (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            {renderDetailedPayload(log.payload, log.event_type)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {formatPayload(log.payload)}
                          </div>
                        )}

                        {/* User */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            <UserIcon className="h-3 w-3" />
                            <span>{log.user_email}</span>
                          </div>
                          <span className="text-xs text-primary-600 dark:text-primary-400">
                            {isExpanded ? 'Click to collapse' : 'Click for details'}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={fetchLogs}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
