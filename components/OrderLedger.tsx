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
  enriched_payload?: any
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

      // Get all unique IDs from payloads
      const companyIds = new Set<string>()
      const transportIds = new Set<string>()
      const itemIds = new Set<string>()
      const userIds = new Set<string>()

      logsData?.forEach(log => {
        if (log.performed_by) userIds.add(log.performed_by)
        if (log.payload?.company_id) companyIds.add(log.payload.company_id)
        if (log.payload?.transport_company_id) transportIds.add(log.payload.transport_company_id)
        if (log.payload?.items) {
          log.payload.items.forEach((item: any) => {
            if (item.item_id) itemIds.add(item.item_id)
          })
        }
      })

      // Fetch all related data in parallel
      const [usersRes, companiesRes, transportsRes, itemsRes] = await Promise.all([
        userIds.size > 0 ? supabase.from('user_profiles').select('id, email, full_name').in('id', Array.from(userIds)) : { data: [] },
        companyIds.size > 0 ? supabase.from('companies').select('id, name').in('id', Array.from(companyIds)) : { data: [] },
        transportIds.size > 0 ? supabase.from('transport_companies').select('id, name').in('id', Array.from(transportIds)) : { data: [] },
        itemIds.size > 0 ? supabase.from('items').select('id, name, sku').in('id', Array.from(itemIds)) : { data: [] }
      ])

      // Create lookup maps
      const userMap = usersRes.data?.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u }), {}) || {}
      const companyMap = companiesRes.data?.reduce((acc: any, c: any) => ({ ...acc, [c.id]: c }), {}) || {}
      const transportMap = transportsRes.data?.reduce((acc: any, t: any) => ({ ...acc, [t.id]: t }), {}) || {}
      const itemMap = itemsRes.data?.reduce((acc: any, i: any) => ({ ...acc, [i.id]: i }), {}) || {}

      // Enrich logs with names
      const enrichedLogs = logsData?.map(log => ({
        ...log,
        user_email: userMap[log.performed_by]?.email || userMap[log.performed_by]?.full_name || 'System',
        enriched_payload: {
          ...log.payload,
          company_name: log.payload?.company_id ? companyMap[log.payload.company_id]?.name : null,
          transport_name: log.payload?.transport_company_id ? transportMap[log.payload.transport_company_id]?.name : null,
          items_with_names: log.payload?.items?.map((item: any) => ({
            ...item,
            name: itemMap[item.item_id]?.name || 'Unknown Item',
            sku: itemMap[item.item_id]?.sku
          }))
        }
      })) || []

      setLogs(enrichedLogs)
    } catch (error: any) {
      console.error('Error fetching audit logs:', error?.message || error)
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

  const formatPayload = (enrichedPayload: any) => {
    if (!enrichedPayload) return null
    
    const items = []
    
    if (enrichedPayload.company_name) items.push(`Company: ${enrichedPayload.company_name}`)
    if (enrichedPayload.transport_name) items.push(`Transport: ${enrichedPayload.transport_name}`)
    if (enrichedPayload.status) items.push(`Status: ${enrichedPayload.status}`)
    if (enrichedPayload.notes) items.push('Notes updated')
    if (enrichedPayload.items) items.push(`${enrichedPayload.items.length} items`)
    if (enrichedPayload.items_count) items.push(`${enrichedPayload.items_count} items deleted`)
    
    return items.length > 0 ? items.join(', ') : 'Order modified'
  }

  const renderDetailedPayload = (enrichedPayload: any, eventType: string) => {
    if (!enrichedPayload) return <p className="text-xs text-gray-500 dark:text-gray-400">No details available</p>

    return (
      <div className="space-y-2 text-xs">
        {enrichedPayload.company_name && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Company:</span>
            <span className="text-gray-900 dark:text-white font-medium">{enrichedPayload.company_name}</span>
          </div>
        )}
        
        {enrichedPayload.transport_name && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Transport:</span>
            <span className="text-gray-900 dark:text-white font-medium">{enrichedPayload.transport_name}</span>
          </div>
        )}
        
        {enrichedPayload.status && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Status:</span>
            <span className="text-gray-900 dark:text-white font-medium capitalize">{enrichedPayload.status}</span>
          </div>
        )}
        
        {enrichedPayload.notes && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Notes:</span>
            <span className="text-gray-900 dark:text-white">{enrichedPayload.notes}</span>
          </div>
        )}
        
        {enrichedPayload.items_with_names && enrichedPayload.items_with_names.length > 0 && (
          <div className="space-y-1">
            <span className="text-gray-500 dark:text-gray-400">Items ({enrichedPayload.items_with_names.length}):</span>
            <div className="ml-4 space-y-1">
              {enrichedPayload.items_with_names.map((item: any, idx: number) => (
                <div key={idx} className="text-gray-900 dark:text-white">
                  • <span className="font-medium">{item.name}</span> {item.sku && `(${item.sku})`}
                  <br />
                  <span className="ml-4 text-gray-600 dark:text-gray-400">
                    Qty: {item.quantity}{item.price ? `, Price: ₹${item.price}` : ''}{item.due_date ? `, Due: ${new Date(item.due_date).toLocaleDateString()}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {enrichedPayload.delivery_update && enrichedPayload.items && (
          <div className="space-y-1">
            <span className="text-green-600 dark:text-green-400 font-medium">Delivery Recorded:</span>
            <div className="ml-4 space-y-1">
              {enrichedPayload.items.map((item: any, idx: number) => (
                <div key={idx} className="text-gray-900 dark:text-white">
                  • Delivered: {item.delivered_quantity} units
                </div>
              ))}
            </div>
          </div>
        )}
        
        {enrichedPayload.items_count && (
          <div className="flex items-start space-x-2">
            <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">Items:</span>
            <span className="text-gray-900 dark:text-white font-medium">{enrichedPayload.items_count} items deleted</span>
          </div>
        )}
        
        {eventType === 'CREATE' && !enrichedPayload.items && (
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
                            {renderDetailedPayload(log.enriched_payload, log.event_type)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {formatPayload(log.enriched_payload)}
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
