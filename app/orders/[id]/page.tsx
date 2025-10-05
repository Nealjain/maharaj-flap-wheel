'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { useAuth } from '@/lib/auth'
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  TruckIcon,
  DocumentTextIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from '@/lib/csv-export'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const { orders, updateOrder } = useData()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [orderId, setOrderId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => setOrderId(id))
  }, [params])

  useEffect(() => {
    if (orderId) {
      const foundOrder = orders.find(o => o.id === orderId)
      setOrder(foundOrder)
    }
  }, [orders, orderId])

  const handleCompleteOrder = async () => {
    if (!isAdmin || !order) return

    setLoading(true)
    try {
      const { error } = await updateOrder(order.id, { status: 'completed' })
      
      if (error) {
        console.error('Error completing order:', error)
        alert('Failed to complete order. Please try again.')
      } else {
        setOrder({ ...order, status: 'completed' })
        alert('Order marked as completed!')
      }
    } catch (error) {
      console.error('Error completing order:', error)
      alert('Failed to complete order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!isAdmin || !order) return
    
    if (!confirm(`Are you sure you want to delete this order? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      // Delete order (cascade will delete order_items)
      const { error } = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE'
      }).then(res => res.json())
      
      if (error) {
        console.error('Error deleting order:', error)
        alert('Failed to delete order. Please try again.')
      } else {
        alert('Order deleted successfully!')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Failed to delete order. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      reserved: { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
        icon: ClockIcon,
        label: 'Reserved'
      },
      completed: { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        icon: CheckCircleIcon,
        label: 'Completed'
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        icon: XCircleIcon,
        label: 'Cancelled'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </span>
    )
  }

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading order details...</p>
        </div>
      </Layout>
    )
  }

  const totalAmount = order.order_items?.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.price), 0
  ) || 0

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Order Details
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Order ID: {order.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(order.status)}
            {isAdmin && (
              <>
                {order.status === 'reserved' && (
                  <button
                    onClick={handleCompleteOrder}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Order
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company & Transport */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.company?.name || 'Unknown Company'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Company
                    </p>
                  </div>
                </div>

                {order.transport_company && (
                  <div className="flex items-start space-x-3">
                    <TruckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.transport_company.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Transport Company
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created Date
                    </p>
                  </div>
                </div>

                {order.notes && (
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {order.notes}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Items ({order.order_items?.length || 0})
              </h2>
              
              {order.order_items && order.order_items.length > 0 ? (
                <div className="space-y-3">
                  {order.order_items.map((item: any, index: number) => (
                    <motion.div
                      key={item.item_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.item?.name || 'Unknown Item'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {item.item?.sku || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ₹{item.price.toFixed(2)} each
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No items in this order
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Items:</span>
                  <span className="text-gray-900 dark:text-white">
                    {order.order_items?.length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Quantity:</span>
                  <span className="text-gray-900 dark:text-white">
                    {order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900 dark:text-white">Total Amount:</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Status
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(order.created_at)}
                  </span>
                </div>
                
                {order.updated_at !== order.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Updated:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDateTime(order.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
