'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/optimized-data-provider'
import { 
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  TruckIcon,
  ScaleIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function MastersPage() {
  const { items, companies, transportCompanies, loading } = useData()

  // Memoized stats calculations
  const stats = useMemo(() => {
    const itemCount = items?.length || 0
    const companyCount = companies?.length || 0
    const transportCount = transportCompanies?.length || 0

    // Calculate low stock items
    const lowStockItems = items?.filter(item => {
      const availableStock = item.physical_stock - item.reserved_stock
      return availableStock > 0 && availableStock <= 10
    }).length || 0

    // Calculate out of stock items
    const outOfStockItems = items?.filter(item => item.physical_stock === 0).length || 0

    // Calculate companies with GST
    const companiesWithGst = companies?.filter(company => company.gst_number).length || 0

    // Calculate companies with address
    const companiesWithAddress = companies?.filter(company => company.address).length || 0

    // Calculate transport companies with phone
    const transportWithPhone = transportCompanies?.filter(company => company.phone).length || 0

    // Calculate transport companies with address
    const transportWithAddress = transportCompanies?.filter(company => company.address).length || 0

    return {
      itemCount,
      companyCount,
      transportCount,
      lowStockItems,
      outOfStockItems,
      companiesWithGst,
      companiesWithAddress,
      transportWithPhone,
      transportWithAddress
    }
  }, [items, companies, transportCompanies])

  const masterSections = [
    {
      title: 'Items',
      description: 'Manage your product catalog and inventory items',
      href: '/masters/items',
      icon: WrenchScrewdriverIcon,
      color: 'bg-blue-500',
      count: items.length,
      stats: [
        { label: 'Total Items', value: stats.itemCount },
        { label: 'Out of Stock', value: stats.outOfStockItems },
        { label: 'Low Stock', value: stats.lowStockItems }
      ]
    },
    {
      title: 'Companies',
      description: 'Manage customer and supplier companies',
      href: '/masters/companies',
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
      count: companies.length,
      stats: [
        { label: 'Total Companies', value: stats.companyCount },
        { label: 'With GST', value: stats.companiesWithGst },
        { label: 'With Address', value: stats.companiesWithAddress }
      ]
    },
    {
      title: 'Transport Companies',
      description: 'Manage logistics and shipping partners',
      href: '/masters/transport-companies',
      icon: TruckIcon,
      color: 'bg-purple-500',
      count: transportCompanies.length,
      stats: [
        { label: 'Total Transport', value: stats.transportCount },
        { label: 'With Phone', value: stats.transportWithPhone },
        { label: 'With Address', value: stats.transportWithAddress }
      ]
    },
    {
      title: 'Units',
      description: 'Manage measurement units for your items',
      href: '/masters/units',
      icon: ScaleIcon,
      color: 'bg-orange-500',
      count: 0, // This would need to be fetched from a units table
      stats: [
        { label: 'Total Units', value: 0 },
        { label: 'Common Units', value: 0 },
        { label: 'Custom Units', value: 0 }
      ]
    }
  ]

  if (loading.items || loading.companies || loading.transportCompanies) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Master Data Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your reference data and system configuration
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {masterSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {section.title === 'Items' ? stats.itemCount :
                     section.title === 'Companies' ? stats.companyCount :
                     section.title === 'Transport Companies' ? stats.transportCount : 0}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Master Data Sections */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {masterSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {section.description}
                    </p>
                  </div>
                </div>
                <Link
                  href={section.href}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Manage
                </Link>
              </div>

              <div className="space-y-3">
                {section.stats.map((stat, statIndex) => (
                  <div key={statIndex} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.label}:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Link
                  href={section.href}
                  className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  View all {section.title.toLowerCase()}
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/masters/items/create"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
            >
              <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Add New Item
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Create a new product
                </p>
              </div>
            </Link>

            <Link
              href="/masters/companies/create"
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
            >
              <BuildingOfficeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Add Company
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Register new company
                </p>
              </div>
            </Link>

            <Link
              href="/masters/transport-companies/create"
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200"
            >
              <TruckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Add Transport
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  New logistics partner
                </p>
              </div>
            </Link>

            <Link
              href="/masters/units"
              className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200"
            >
              <ScaleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Manage Units
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Measurement units
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}