'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import CSVExport from '@/components/CSVExport'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

import { useToast } from '@/lib/toast'

export default function ItemsPage() {
  const router = useRouter()
  const { items, loading, deleteItem } = useData()
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState(items)

  useEffect(() => {
    let filtered = items

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredItems(filtered)
  }, [items, searchTerm])

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    // Confirm removed for debugging
    addToast('Deleting item...', 'info')

    try {
      const { error } = await deleteItem(itemId)

      if (error) {
        console.error('Error deleting item:', error)
        // Check if it's a foreign key constraint error
        if (error.message?.includes('foreign key') || error.code === '23503') {
          addToast('Cannot delete: Item is used in orders. Remove it from orders first.', 'error')
        } else {
          addToast(`Failed to delete item: ${error.message}`, 'error')
        }
      } else {
        addToast('Item deleted successfully', 'success')
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error deleting item:', error)
      addToast(`Failed to delete item: ${error.message}`, 'error')
    }
  }

  const exportData = filteredItems.map(item => ({
    sku: item.sku,
    name: item.name,
    description: item.description || '',
    unit: item.unit,
    physical_stock: item.physical_stock,
    reserved_stock: item.reserved_stock,
    available_stock: item.physical_stock - item.reserved_stock,
    created_at: item.created_at,
    updated_at: item.updated_at
  }))

  if (loading.items) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Items Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your product catalog and inventory items
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => router.push('/masters/items/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <CSVExport
                data={exportData}
                headers={['SKU', 'Name', 'Description', 'Unit', 'Physical Stock', 'Reserved Stock', 'Available Stock', 'Created At', 'Updated At']}
                filename="items"
                className="px-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No items found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding your first item.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/masters/items/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Item Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Stock Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {item.sku}
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-4">
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Physical:</span>
                              <span className="ml-1 font-medium">{item.physical_stock}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Reserved:</span>
                              <span className="ml-1 font-medium">{item.reserved_stock}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Available:</span>
                              <span className="ml-1 font-medium text-primary-600 dark:text-primary-400">
                                {item.physical_stock - item.reserved_stock}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Unit: {item.unit}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <div>Created: {new Date(item.created_at).toLocaleDateString()}</div>
                          <div>Updated: {new Date(item.updated_at).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/masters/items/${item.id}/edit`)}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete item"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
