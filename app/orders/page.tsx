'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon, EyeIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useData } from '@/lib/optimized-data-provider'
import CSVExport from '@/components/CSVExport'
import ProgressiveLoader from '@/components/ProgressiveLoader'
import { Order } from '@/lib/supabase'

export default function OrdersPage() {
  const { orders, companies, transportCompanies, items, loading, refetch } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  const filteredOrders = useMemo(() => {
    let filtered = orders || []

    if (filterStatus !== 'All') {
      filtered = filtered.filter(order => order.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        order =>
          order.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return filtered
  }, [orders, searchTerm, filterStatus])

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'reserved':
        return <ClockIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const calculateOrderTotal = (order: Order) => {
    if (!order.order_items) return 0
    return order.order_items.reduce((total, item) => total + (item.quantity * item.price), 0)
  }

  const getTotalItems = (order: Order) => {
    if (!order.order_items) return 0
    return order.order_items.reduce((total, item) => total + item.quantity, 0)
  }

  const exportHeaders = [
    'Order ID',
    'Company Name',
    'Status',
    'Total Items',
    'Total Amount',
    'Transport Company',
    'Created At',
    'Items Details'
  ]

  const exportData = filteredOrders.map(order => ({
    'Order ID': order.id,
    'Company Name': order.company?.name || 'N/A',
    'Status': order.status,
    'Total Items': getTotalItems(order),
    'Total Amount': calculateOrderTotal(order).toFixed(2),
    'Transport Company': order.transport_company?.name || 'N/A',
    'Created At': new Date(order.created_at).toLocaleString(),
    'Items Details': order.order_items?.map(oi => `${oi.item?.name || 'N/A'} (${oi.item?.sku || 'N/A'}): ${oi.quantity} @ ₹${oi.price}`).join(', ') || '',
  }))

  if (loading.orders) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
          <ProgressiveLoader type="section" count={5} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Orders</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Manage customer orders and their status</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:space-x-4">
            <button
              onClick={() => refetch.orders()}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowPathIcon className="h-4 w-4 sm:-ml-1 sm:mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <CSVExport data={exportData} headers={exportHeaders} filename="orders_report" />
            <Link href="/orders/create" className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <PlusIcon className="h-4 w-4 sm:-ml-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Create Order</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 mb-4 sm:mb-6">
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-9 sm:pl-10 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['All', 'reserved', 'completed', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap ${
                      filterStatus === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status === 'reserved' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new order.</p>
                <div className="mt-6">
                  <Link href="/orders/create" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Order
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Order #{order.id.substring(0, 8)}...
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status === 'reserved' ? 'Pending' : order.status}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</p>
                            <p className="text-sm text-gray-900 dark:text-white">{order.company?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Transport</p>
                            <p className="text-sm text-gray-900 dark:text-white">{order.transport_company?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</p>
                            <p className="text-sm text-gray-900 dark:text-white">{getTotalItems(order)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">₹{calculateOrderTotal(order).toFixed(2)}</p>
                          </div>
                        </div>

                        {order.order_items && order.order_items.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Items:</p>
                            <div className="space-y-1">
                              {order.order_items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-900 dark:text-white">
                                    {item.item?.name || 'Unknown Item'} ({item.item?.sku || 'N/A'})
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {item.quantity} × ₹{item.price} = ₹{(item.quantity * item.price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
                          <span>Updated: {new Date(order.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}