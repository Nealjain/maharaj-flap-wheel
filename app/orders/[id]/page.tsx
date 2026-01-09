'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeftIcon,
  ClockIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  TruckIcon,
  DocumentTextIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  TruckIcon as DeliveryIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDate, formatDateTime } from '@/lib/csv-export'
import { CheckCircleIcon } from '@heroicons/react/16/solid'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const { orders, updateOrder, refetch } = useData()
  const { isAdmin, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [orderId, setOrderId] = useState<string>('')
  const [showPartialModal, setShowPartialModal] = useState(false)
  const [partialDeliveries, setPartialDeliveries] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    params.then(({ id }) => setOrderId(id))
  }, [params])

  useEffect(() => {
    if (orderId) {
      const foundOrder = orders.find(o => o.id === orderId)
      setOrder(foundOrder)

      // Initialize partial deliveries from order items
      if (foundOrder?.order_items) {
        const deliveries: { [key: string]: number } = {}
        foundOrder.order_items.forEach((item: any) => {
          deliveries[item.item_id] = item.delivered_quantity || 0
        })
        setPartialDeliveries(deliveries)
      }
    }
  }, [orders, orderId])

  const handleCompleteOrder = async () => {
    console.log('✅ COMPLETE: Starting completion process')

    if (!isAdmin || !order) {
      console.error('❌ COMPLETE: Blocked - isAdmin:', isAdmin, 'hasOrder:', !!order)
      return
    }

    setLoading(true)
    try {
      console.log('✅ COMPLETE: Updating order status to completed:', order.id)

      // Update order status to completed
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (orderError) {
        console.error('❌ COMPLETE: Error updating order:', orderError)
        throw orderError
      }

      console.log('✅ COMPLETE: Order completed successfully')

      // Log audit event
      await supabase
        .from('audit_logs')
        .insert([{
          event_type: 'UPDATE',
          entity: 'orders',
          entity_id: order.id,
          performed_by: user?.id,
          payload: { action: 'complete', old_status: order.status, new_status: 'completed' }
        }])

      // Refresh and reload
      await refetch.orders()
      console.log('✅ COMPLETE: Complete, reloading page')
      window.location.reload()
    } catch (error: any) {
      console.error('❌ COMPLETE: Failed:', error)
      alert('Failed to complete order: ' + (error.message || 'Unknown error'))
      setLoading(false)
    }
  }



  const handlePartialDelivery = async () => {
    if (!isAdmin || !order) return

    setLoading(true)

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
      alert('❌ Request timed out. Please check your connection.')
    }, 10000) // 10 second timeout

    try {
      console.log('Updating delivery quantities:', partialDeliveries)

      // Check auth status
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated')
      console.log('User ID:', session?.user?.id)
      console.log('User role:', session?.user?.role)

      // Try using Supabase function first (bypasses RLS)
      try {
        const { data: funcResult, error: funcError } = await supabase
          .rpc('update_delivery_quantities', {
            p_order_id: order.id,
            p_deliveries: partialDeliveries
          })

        if (!funcError && funcResult?.success) {
          console.log('✅ Updated via function')

          // Update local state immediately
          setOrder((prev: any) => ({
            ...prev,
            order_items: prev.order_items.map((item: any) => ({
              ...item,
              delivered_quantity: partialDeliveries[item.item_id] || item.delivered_quantity
            }))
          }))

          clearTimeout(timeout)
          setShowPartialModal(false)
          alert('✅ Delivery recorded!')
          return
        }

        console.log('Function not available, trying direct update...')
      } catch (funcErr) {
        console.log('Function failed, trying direct update...', funcErr)
      }

      // Fallback: Direct update (requires RLS fix)
      const updates = Object.entries(partialDeliveries).map(([itemId, deliveredQty]) => {
        const qty = Number(deliveredQty)
        console.log(`Updating item ${itemId} to ${qty} (type: ${typeof qty})`)
        console.log(`Order ID: ${order.id}`)
        console.log(`Delivered quantity value:`, qty, `>= 0?`, qty >= 0)

        return supabase
          .from('order_items')
          .update({ delivered_quantity: qty })
          .eq('order_id', order.id)
          .eq('item_id', itemId)
      })

      console.log(`Executing ${updates.length} parallel updates...`)
      const results = await Promise.all(updates)
      console.log('Update results:', results)

      // Check for errors
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        console.error('Errors updating items:', errors)
        const errorDetails = errors[0].error
        console.error('Error details:', {
          message: errorDetails?.message,
          code: errorDetails?.code,
          details: errorDetails?.details,
          hint: errorDetails?.hint
        })

        // Show helpful error message
        alert(`❌ RLS Policy Error!

Please run URGENT_RLS_FIX.sql in Supabase SQL Editor.

Error: ${errorDetails?.message}`)
        throw new Error(errorDetails?.message || 'Update failed')
      }

      console.log('✅ All items updated successfully')

      // Update local state immediately
      const updatedOrderItems = order.order_items.map((item: any) => ({
        ...item,
        delivered_quantity: partialDeliveries[item.item_id] || item.delivered_quantity
      }))

      setOrder((prev: any) => ({
        ...prev,
        order_items: updatedOrderItems
      }))

      // Check if all items are fully delivered
      const allItemsDelivered = updatedOrderItems.every((item: any) =>
        (item.delivered_quantity || 0) >= item.quantity
      )

      // If all items are delivered, auto-complete the order
      if (allItemsDelivered) {
        console.log('✅ All items fully delivered, auto-completing order...')

        try {
          // Update order status to completed directly
          const { error: completeError } = await supabase
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', order.id)

          if (completeError) {
            throw completeError
          }

          console.log('✅ Order auto-completed successfully')

          // Log audit event
          await supabase
            .from('audit_logs')
            .insert([{
              event_type: 'UPDATE',
              entity: 'orders',
              entity_id: order.id,
              performed_by: user?.id,
              payload: { action: 'auto_complete', old_status: order.status, new_status: 'completed' }
            }])

          // Refresh data
          await refetch.orders()

          clearTimeout(timeout)
          setShowPartialModal(false)
          window.location.reload()
          return
        } catch (completeError: any) {
          console.error('❌ Error auto-completing order:', completeError)
          // Continue with partial delivery success message
        }
      }

      // Log audit event for delivery
      await supabase.from('audit_logs').insert([{
        event_type: 'UPDATE',
        entity: 'orders',
        entity_id: order.id,
        performed_by: user?.id,
        payload: {
          delivery_update: true,
          items: Object.entries(partialDeliveries).map(([item_id, delivered_quantity]) => ({
            item_id,
            delivered_quantity
          }))
        }
      }])

      clearTimeout(timeout)
      setShowPartialModal(false)
      if (!allItemsDelivered) {
        alert('✅ Delivery recorded!')
      }
    } catch (error: any) {
      console.error('Error recording delivery:', error)
      clearTimeout(timeout)
      if (!error.message.includes('RLS Policy')) {
        alert(`❌ Failed: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async () => {
    console.log('🗑️ DELETE: Starting deletion process')

    if (!isAdmin || !order) {
      console.error('❌ DELETE: Blocked - isAdmin:', isAdmin, 'hasOrder:', !!order)
      return
    }

    setDeleting(true)
    try {
      console.log('🗑️ DELETE: Deleting order:', order.id)

      // Get order items first to release stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', order.id)

      console.log('📦 DELETE: Order items to release:', orderItems)

      // Release reserved stock for each item
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const { data: currentItem } = await supabase
            .from('items')
            .select('reserved_stock')
            .eq('id', item.item_id)
            .single()

          if (currentItem) {
            const newReservedStock = Math.max(0, currentItem.reserved_stock - item.quantity)
            console.log(`📦 Releasing stock for item ${item.item_id}: ${currentItem.reserved_stock} -> ${newReservedStock}`)

            await supabase
              .from('items')
              .update({ reserved_stock: newReservedStock })
              .eq('id', item.item_id)
          }
        }
      }

      // Soft delete order
      const { error } = await supabase
        .from('orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', order.id)

      if (error) {
        console.error('❌ DELETE: Error deleting order:', error)
        throw error
      }

      console.log('✅ DELETE: Order deleted successfully')

      // Log audit event
      await supabase
        .from('audit_logs')
        .insert([{
          event_type: 'DELETE',
          entity: 'orders',
          entity_id: order.id,
          performed_by: user?.id,
          payload: { items_count: orderItems?.length || 0 }
        }])

      // Refresh and navigate
      await refetch.orders()
      console.log('✅ DELETE: Complete, navigating to orders page')
      router.push('/orders')
    } catch (error: any) {
      console.error('❌ DELETE: Failed:', error)
      alert('Failed to delete order: ' + (error.message || 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  const handleReopenOrder = async () => {
    console.log('🔄 REOPEN: Starting reopen process')

    if (!isAdmin || !order) {
      console.error('❌ REOPEN: Blocked - isAdmin:', isAdmin, 'hasOrder:', !!order)
      return
    }

    setLoading(true)
    try {
      console.log('🔄 REOPEN: Updating order status to pending:', order.id)

      const { error } = await supabase
        .from('orders')
        .update({ status: 'pending' })
        .eq('id', order.id)

      if (error) {
        console.error('❌ REOPEN: Error updating order:', error)
        throw error
      }

      console.log('✅ REOPEN: Order reopened successfully')

      // Log audit event
      await supabase
        .from('audit_logs')
        .insert([{
          event_type: 'UPDATE',
          entity: 'orders',
          entity_id: order.id,
          performed_by: user?.id,
          payload: { action: 'reopen', old_status: 'completed', new_status: 'pending' }
        }])

      // Refresh and reload
      await refetch.orders()
      console.log('✅ REOPEN: Complete, reloading page')
      window.location.reload()
    } catch (error: any) {
      console.error('❌ REOPEN: Failed:', error)
      alert('Failed to reopen order: ' + (error.message || 'Unknown error'))
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
        icon: ClockIcon,
        label: 'Pending'
      },
      completed: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        icon: ClockIcon,
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

  const totalQuantity = order.order_items?.reduce((sum: number, item: any) =>
    sum + item.quantity, 0
  ) || 0

  // Check if all items are fully delivered
  const allItemsDelivered = order.order_items?.every((item: any) =>
    (item.delivered_quantity || 0) >= item.quantity
  ) || false

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => router.push('/orders')}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                Order Details
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                Order ID: {order.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {getStatusBadge(order.status)}
            {/* DEBUG: isAdmin = {String(isAdmin)}, user = {user?.email} */}
            {isAdmin && (
              <>
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => router.push(`/orders/${order.id}/edit`)}
                      className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                    >
                      <PencilIcon className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit Order</span>
                    </button>
                    <button
                      onClick={() => setShowPartialModal(true)}
                      className="inline-flex items-center px-3 sm:px-4 py-2 border border-primary-600 dark:border-primary-500 rounded-md shadow-sm text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 whitespace-nowrap"
                    >
                      <DeliveryIcon className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Record Delivery</span>
                    </button>
                    {allItemsDelivered && (
                      <button
                        type="button"
                        onClick={handleCompleteOrder}
                        disabled={loading}
                        className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white sm:mr-2"></div>
                            <span className="hidden sm:inline">Completing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Complete Order</span>
                            <span className="sm:hidden">Complete</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
                {order.status === 'completed' && (
                  <button
                    type="button"
                    onClick={handleReopenOrder}
                    disabled={loading}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-orange-600 dark:border-orange-500 rounded-md shadow-sm text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 sm:mr-2"></div>
                        <span className="hidden sm:inline">Reopening...</span>
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Reopen Order</span>
                        <span className="sm:hidden">Reopen</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white sm:mr-2"></div>
                      <span className="hidden sm:inline">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Items ({order.order_items?.length || 0})
              </h2>

              {order.order_items && order.order_items.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden md:table-cell">SKU</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">Description</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden xl:table-cell">Due Date</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden sm:table-cell">Delivered</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden sm:table-cell">Pending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {order.order_items.map((item: any, index: number) => {
                        const delivered = item.delivered_quantity || 0
                        const pending = item.quantity - delivered
                        const dueDate = item.due_date ? new Date(item.due_date) : null
                        const isOverdue = dueDate && dueDate < new Date() && pending > 0
                        const isDueSoon = dueDate && !isOverdue && dueDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && pending > 0

                        return (
                          <motion.tr
                            key={item.item_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              <div className="max-w-[120px] sm:max-w-none truncate">
                                {item.item?.name || 'Unknown Item'}
                              </div>
                              <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.item?.sku || 'N/A'}
                              </div>
                              {dueDate && (
                                <div className={`xl:hidden text-xs mt-1 font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : isDueSoon ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                  Due: {formatDate(item.due_date)}
                                </div>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                              {item.item?.sku || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                              <div className="max-w-[200px] truncate">
                                {item.item?.description || '-'}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                              {dueDate ? (
                                <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : isDueSoon ? 'text-orange-600 dark:text-orange-400 font-medium' : ''}>
                                  {formatDate(item.due_date)}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-900 dark:text-white">
                              {item.quantity}
                              <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                                D:{delivered} P:{pending}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right hidden sm:table-cell">
                              <span className={delivered > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                {delivered}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right hidden sm:table-cell">
                              <span className={pending > 0 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                {pending}
                              </span>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
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
                    <span className="text-gray-900 dark:text-white">Total Quantity:</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      {totalQuantity}
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

        {/* Partial Delivery Modal */}
        {showPartialModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowPartialModal(false)}></div>

              <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 z-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Record Partial Delivery
                </h3>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {order.order_items?.map((item: any) => (
                    <div key={item.item_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.item?.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Ordered: {item.quantity} | Delivered: {partialDeliveries[item.item_id] || 0}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">Deliver:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={partialDeliveries[item.item_id] || 0}
                          onChange={(e) => setPartialDeliveries(prev => ({
                            ...prev,
                            [item.item_id]: Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0))
                          }))}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show Complete Order button if all items are fully delivered */}
                {allItemsDelivered && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                      ✓ All items are fully delivered. You can complete this order now.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPartialModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePartialDelivery}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Delivery'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
