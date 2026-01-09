'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/csv-export'
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  TruckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface StockLog {
  id: string
  item_id: string
  transaction_type: string
  quantity: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  item_name?: string
  item_sku?: string
  user_email?: string
}

interface StockLedgerProps {
  isOpen: boolean
  onClose: () => void
  refreshTrigger?: number
}

export default function StockLedger({ isOpen, onClose, refreshTrigger }: StockLedgerProps) {
  const [logs, setLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen, refreshTrigger])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Get stock ledger entries
      const { data: logsData, error: logsError } = await supabase
        .from('stock_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logsError) {
        console.error('Error fetching stock logs:', logsError)
        throw logsError
      }

      // Get unique IDs
      const itemIds = Array.from(new Set(logsData?.map(log => log.item_id).filter(Boolean)))
      const userIds = Array.from(new Set(logsData?.map(log => log.created_by).filter(Boolean)))

      // Fetch related data
      const [itemsRes, usersRes] = await Promise.all([
        itemIds.length > 0 ? supabase.from('items').select('id, name, sku').in('id', itemIds) : { data: [] },
        userIds.length > 0 ? supabase.from('user_profiles').select('id, email, full_name').in('id', userIds) : { data: [] }
      ])

      // Create lookup maps
      const itemMap = itemsRes.data?.reduce((acc: any, i: any) => ({ ...acc, [i.id]: i }), {}) || {}
      const userMap = usersRes.data?.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u }), {}) || {}

      // Enrich logs
      const enrichedLogs = logsData?.map(log => ({
        ...log,
        item_name: itemMap[log.item_id]?.name || 'Unknown Item',
        item_sku: itemMap[log.item_id]?.sku,
        user_email: userMap[log.created_by]?.email || userMap[log.created_by]?.full_name || 'System'
      })) || []

      setLogs(enrichedLogs)
    } catch (error: any) {
      console.error('Error fetching stock logs:', error?.message || error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'removal':
        return <MinusIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
      case 'adjustment':
        return <ArrowPathIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'order_reserved':
        return <ShoppingCartIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      case 'order_delivered':
        return <TruckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case 'order_cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'removal':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'adjustment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'order_reserved':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'order_delivered':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'order_cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
                  Stock Ledger
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
                  <p className="text-gray-500 dark:text-gray-400">No stock activity recorded yet</p>
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
                        {/* Transaction Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getTransactionIcon(log.transaction_type)}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTransactionColor(log.transaction_type)}`}>
                              {formatTransactionType(log.transaction_type)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>

                        {/* Item Name */}
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {log.item_name} {log.item_sku && <span className="text-gray-500">({log.item_sku})</span>}
                        </div>

                        {/* Quantity Change */}
                        <div className="flex items-center space-x-4 text-sm mb-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Change: </span>
                            <span className={`font-medium ${log.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {log.quantity > 0 ? '+' : ''}{log.quantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Balance: </span>
                            <span className="font-medium text-gray-900 dark:text-white">{log.balance_after}</span>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2 text-xs">
                            {log.reference_type && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Reference: </span>
                                <span className="text-gray-900 dark:text-white">{log.reference_type}</span>
                              </div>
                            )}
                            {log.notes && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Notes: </span>
                                <span className="text-gray-900 dark:text-white">{log.notes}</span>
                              </div>
                            )}
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
