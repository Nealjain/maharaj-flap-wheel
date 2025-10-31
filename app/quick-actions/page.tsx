'use client'

import { useAuth } from '@/lib/auth'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShoppingCartIcon,
  PlusIcon,
  BuildingOfficeIcon,
  TruckIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CubeIcon,
  ChartBarIcon,
  UserGroupIcon,
  KeyIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: any
  adminOnly?: boolean
}

export default function QuickActionsPage() {
  const { profile } = useAuth()

  const actions: QuickAction[] = [
    {
      title: 'Create Order',
      description: 'Start a new order for a customer',
      href: '/orders/create',
      icon: ShoppingCartIcon
    },
    {
      title: 'Add New Item',
      description: 'Add a new product to inventory',
      href: '/masters/items/create',
      icon: PlusIcon
    },
    {
      title: 'Manage Stock',
      description: 'View and adjust inventory levels',
      href: '/stock',
      icon: CubeIcon
    },
    {
      title: 'Add Company',
      description: 'Register a new customer company',
      href: '/masters/companies/create',
      icon: BuildingOfficeIcon
    },
    {
      title: 'Add Transport Company',
      description: 'Register a new transport carrier',
      href: '/masters/transport/create',
      icon: TruckIcon
    },
    {
      title: 'View All Orders',
      description: 'Browse and manage all orders',
      href: '/orders',
      icon: DocumentTextIcon
    },
    {
      title: 'Master Data',
      description: 'Manage items, companies, and transport',
      href: '/masters',
      icon: ChartBarIcon
    },
    {
      title: 'Manage Users',
      description: 'User management and permissions',
      href: '/admin/users',
      icon: UserGroupIcon,
      adminOnly: true
    },
    {
      title: 'Reference IDs',
      description: 'Generate registration reference codes',
      href: '/admin/reference-ids',
      icon: KeyIcon,
      adminOnly: true
    }
  ]

  const filteredActions = actions.filter(action => 
    !action.adminOnly || profile?.role === 'admin'
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            What would you like to do today?
          </p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={action.href}
                  className="group block h-full"
                >
                  <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                            <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          {action.adminOnly && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRightIcon className="flex-shrink-0 ml-4 h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Tip:</strong> You can also access these actions from the navigation menu or use keyboard shortcuts for faster navigation.
          </p>
        </div>
      </div>
    </Layout>
  )
}
