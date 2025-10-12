'use client'

import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/optimized-data-provider'
import Layout from '@/components/Layout'
import KPICard from '@/components/KPICard'
import { 
  ChartBarIcon, 
  ShoppingCartIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { dashboardKPIs, orders, items, loading } = useData()

  // Only show loading state if we're still loading essential data
  const isLoading = loading.orders || loading.items

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  const stockOverview = dashboardKPIs?.stockOverview

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.full_name || user?.email}!
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's what's happening with your ERP system today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Orders"
            value={dashboardKPIs?.totalOrders || 0}
            subtitle="All time"
            icon={ChartBarIcon}
            color="blue"
          />
          <KPICard
            title="Today's Orders"
            value={dashboardKPIs?.todaysOrders || 0}
            subtitle="Created today"
            icon={ShoppingCartIcon}
            color="green"
          />
          <KPICard
            title="Pending Orders"
            value={dashboardKPIs?.pendingOrders || 0}
            subtitle="Awaiting completion"
            icon={ClockIcon}
            color="yellow"
          />
          <KPICard
            title="Completed Orders"
            value={dashboardKPIs?.completedOrders || 0}
            subtitle="Successfully delivered"
            icon={CheckCircleIcon}
            color="purple"
          />
        </div>

        {/* Stock Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stock Overview
            </h2>
            <Link
              href="/stock"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              View all stock →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {stockOverview?.outOfStock || 0}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
            >
              <ArrowDownIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Low Stock
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {stockOverview?.lowStock || 0}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <ArrowUpIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Over Stock
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stockOverview?.overStock || 0}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <CubeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Total Items
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stockOverview?.totalItems || 0}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/orders/create"
              className="flex items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors duration-200"
            >
              <ShoppingCartIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                  Create New Order
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400">
                  Start a new order process
                </p>
              </div>
            </Link>

            <Link
              href="/stock"
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
            >
              <CubeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Manage Stock
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Update inventory levels
                </p>
              </div>
            </Link>

            <Link
              href="/masters"
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200"
            >
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Master Data
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Manage items, companies, units
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {stockOverview && stockOverview.outOfStock === 0 && stockOverview.lowStock === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  All stock levels are healthy! 🎉
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  No items are out of stock or running low.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}