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
      description: 'New customer order',
      href: '/orders/create',
      icon: ShoppingCartIcon
    },
    {
      title: 'View Orders',
      description: 'Manage all orders',
      href: '/orders',
      icon: DocumentTextIcon
    },
    {
      title: 'Manage Stock',
      description: 'Inventory levels',
      href: '/stock',
      icon: CubeIcon
    },
    {
      title: 'Dashboard',
      description: 'View analytics',
      href: '/dashboard',
      icon: ChartBarIcon
    },
    {
      title: 'Add Item',
      description: 'New product',
      href: '/masters/items/create',
      icon: PlusIcon
    },
    {
      title: 'Add Company',
      description: 'New customer',
      href: '/masters/companies/create',
      icon: BuildingOfficeIcon
    },
    {
      title: 'Manage Users',
      description: 'User permissions',
      href: '/admin/users',
      icon: UserGroupIcon,
      adminOnly: true
    },
    {
      title: 'Reference IDs',
      description: 'Registration codes',
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

        {/* Actions Grid - 2 columns for mobile, 4 for desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {filteredActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={action.href}
                  className="group block h-full"
                >
                  <div className="relative h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg active:scale-95 transition-all duration-200">
                    {action.adminOnly && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                        ADMIN
                      </span>
                    )}
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1">
                          {action.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
