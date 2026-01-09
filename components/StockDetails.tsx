'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/csv-export'
import {
  XMarkIcon,
  CubeIcon,
  ShoppingCartIcon,
  BuildingOfficeIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  UserIcon,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

// Combined Activity Timeline Component
function CombinedActivityTimeline({ itemId, orders, loading: ordersLoading, onClose }: { 
  itemId: string
  orders: OrderDetail[]
  loading: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [ledger, setLedger] = useState<any[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'orders' | 'stock'>('all')

  useEffect(() => {
    fetchLedger()
  }, [itemId])

  const fetchLedger = async () => {
    setLedgerLoading(true)
    try {
      // Try with user profile join first
      let { data, error } = await supabase
        .from('stock_ledger')
        .select(`
          *,
          user_profiles!stock_ledger_performed_by_fkey (
            full_name,
            email
          )
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })

      // If join fails, try without it
      if (error) {
        console.log('Fetching stock ledger without user join...')
        const result = await supabase
          .from('stock_ledger')
          .select('*')
          .eq('item_id', itemId)
          .order('created_at', { ascending: false })
        
        data = result.data
        error = result.error
      }

      if (error) throw error
      setLedger(data || [])
    } catch (error) {
      console.error('Error fetching stock ledger:', error)
      setLedger([])
    } finally {
      setLedgerLoading(false)
    }
  }

  // Combine and sort all activities by date with filters
  const combinedActivities = useMemo(() => {
    let activities: any[] = []

    // Add stock ledger entries
    if (filterType === 'all' || filterType === 'stock') {
      ledger.forEach(entry => {
        activities.push({
          type: 'ledger',
          date: new Date(entry.created_at),
          data: entry
        })
      })
    }

    // Add orders
    if (filterType === 'all' || filterType === 'orders') {
      orders.forEach(order => {
        activities.push({
          type: 'order',
          date: new Date(order.order_created_at),
          data: order
        })
      })
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      activities = activities.filter(activity => {
        if (activity.type === 'order') {
          return activity.data.company_name.toLowerCase().includes(searchLower)
        } else {
          const entry = activity.data
          return (
            (entry.notes && entry.notes.toLowerCase().includes(searchLower)) ||
            (entry.user_profiles?.full_name && entry.user_profiles.full_name.toLowerCase().includes(searchLower)) ||
            (entry.user_profiles?.email && entry.user_profiles.email.toLowerCase().includes(searchLower))
          )
        }
      })
    }

    // Sort by date descending (newest first)
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [ledger, orders, searchTerm, filterType])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'adjustment_add':
      case 'order_cancelled':
        return <PlusIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'adjustment_remove':
      case 'order_delivered':
        return <MinusIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'adjustment_add':
        return 'Stock Added'
      case 'adjustment_remove':
        return 'Stock Removed'
      case 'adjustment_set':
        return 'Stock Set'
      case 'order_delivered':
        return 'Order Delivered'
      case 'order_cancelled':
        return 'Order Cancelled'
      default:
        return type
    }
  }

  const loading = ordersLoading || ledgerLoading

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          Activity Timeline ({combinedActivities.length})
        </h3>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-2">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('orders')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'orders'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Orders Only
          </button>
          <button
            onClick={() => setFilterType('stock')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'stock'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Stock Changes Only
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : combinedActivities.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combinedActivities.map((activity: any, index: number) => {
            if (activity.type === 'ledger') {
              const entry = activity.data
              const userName = entry.user_profiles?.full_name || entry.user_profiles?.email || 'System'
              
              return (
                <div
                  key={`ledger-${entry.id}`}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(entry.transaction_type)}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getTransactionLabel(entry.transaction_type)}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                          <UserIcon className="h-3 w-3" />
                          <span className="font-medium">{userName}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${
                      entry.quantity > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                    </span>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-6">
                      {entry.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 ml-6">
                    <span>{formatDateTime(entry.created_at)}</span>
                    <span className="font-medium">Balance: {entry.balance_after}</span>
                  </div>
                </div>
              )
            } else {
              // Order activity
              const order = activity.data
              const pending = order.quantity - order.delivered_quantity
              const isCompleted = order.order_status === 'completed'
              const isOverdue = order.due_date && new Date(order.due_date) < new Date() && !isCompleted

              return (
                <div
                  key={`order-${order.order_id}`}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <ShoppingCartIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {order.company_name}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isCompleted 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Ordered:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">{order.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Delivered:</span>
                      <span className="ml-1 font-medium text-green-600 dark:text-green-400">{order.delivered_quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Pending:</span>
                      <span className={`ml-1 font-medium ${pending > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {pending}
                      </span>
                    </div>
                  </div>

                  {!isCompleted && order.due_date && (
                    <div className={`text-xs mb-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                      Due: {new Date(order.due_date).toLocaleDateString()} {isOverdue && '(Overdue)'}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(order.order_created_at)}
                  </div>
                </div>
              )
            }
          })}
        </div>
      )}
    </div>
  )
}

interface OrderDetail {
  order_id: string
  company_name: string
  quantity: number
  delivered_quantity: number
  order_status: string
  order_created_at: string
  due_date: string | null
  transport_company: string | null
}

interface StockDetailsProps {
  isOpen: boolean
  onClose: () => void
  item: any
}

export default function StockDetails({ isOpen, onClose, item }: StockDetailsProps) {
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && item) {
      fetchOrderDetails()
    }
  }, [isOpen, item])

  const fetchOrderDetails = async () => {
    if (!item) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          order_id,
          quantity,
          delivered_quantity,
          due_date,
          orders!inner (
            id,
            status,
            created_at,
            companies!inner (
              name
            ),
            transport_companies (
              name
            )
          )
        `)
        .eq('item_id', item.id)

      if (error) throw error

      // Filter by status in JavaScript since we can't filter nested relations in Supabase
      const filteredData = data?.filter((oi: any) => 
        oi.orders && ['pending', 'completed'].includes(oi.orders.status)
      ) || []

      const formattedOrders = filteredData.map((oi: any) => ({
        order_id: oi.orders.id,
        company_name: oi.orders.companies.name,
        quantity: oi.quantity,
        delivered_quantity: oi.delivered_quantity,
        order_status: oi.orders.status,
        order_created_at: oi.orders.created_at,
        due_date: oi.due_date,
        transport_company: oi.orders.transport_companies?.name || null
      }))

      // Sort by created_at descending
      formattedOrders.sort((a, b) => 
        new Date(b.order_created_at).getTime() - new Date(a.order_created_at).getTime()
      )

      setOrders(formattedOrders)
    } catch (error) {
      console.error('Error fetching order details:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  const availableStock = item.physical_stock - item.reserved_stock
  const totalReserved = orders
    .filter(o => o.order_status === 'pending')
    .reduce((sum, o) => sum + (o.quantity - o.delivered_quantity), 0)

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

          {/* Details Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <CubeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stock Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Physical Stock</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {item.physical_stock}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Reserved</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                    {item.reserved_stock}
                  </div>
                </div>
                <div className={`${availableStock > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} rounded-lg p-4`}>
                  <div className={`text-sm ${availableStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-1`}>
                    Available
                  </div>
                  <div className={`text-2xl font-bold ${availableStock > 0 ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
                    {availableStock}
                  </div>
                </div>
              </div>

              {/* Item Details */}
              {item.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.custom_unit || item.unit}</p>
              </div>

              {/* Combined Activity Timeline */}
              <CombinedActivityTimeline itemId={item.id} orders={orders} loading={loading} onClose={onClose} />



              {/* Stock Alert */}
              {availableStock <= 0 && totalReserved > 0 && (
                <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                        Stock Alert
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        All stock is allocated to pending orders. You need to add {Math.abs(availableStock)} more units to fulfill them.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {availableStock > 0 && totalReserved > 0 && (
                <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                        Stock Available
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        You have {availableStock} units available after fulfilling all pending orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
