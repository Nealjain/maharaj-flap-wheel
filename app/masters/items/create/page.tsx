'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { 
  CheckIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export default function CreateItemPage() {
  const router = useRouter()
  const { createItem, items } = useData()
  const [loading, setLoading] = useState(false)
  const [taskType, setTaskType] = useState<'create' | 'adjust' | 'transfer' | ''>('')
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'pcs',
    physical_stock: 0,
    reserved_stock: 0
  })

  // Generate unique SKU
  const generateSKU = () => {
    const prefix = 'ITM'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const newSKU = `${prefix}-${timestamp}-${random}`
    
    setFormData(prev => ({
      ...prev,
      sku: newSKU
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.sku || !formData.name) {
      alert('Please fill in all required fields')
      return
    }

    // Check for duplicate SKU
    const duplicateSKU = items.find(item => item.sku.toLowerCase() === formData.sku.toLowerCase())
    if (duplicateSKU) {
      alert(`SKU "${formData.sku}" already exists. Please use a different SKU or generate a new one.`)
      return
    }

    // Check for duplicate name
    const duplicateName = items.find(item => item.name.toLowerCase() === formData.name.toLowerCase())
    if (duplicateName) {
      alert(`Item name "${formData.name}" already exists. Please use a different name.`)
      return
    }

    setLoading(true)

    try {
      const { error } = await createItem(formData)

      if (error) {
        console.error('Error creating item:', error)
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          alert('An item with this SKU or name already exists. Please use different values.')
        } else {
          alert('Failed to create item. Please try again.')
        }
      } else {
        router.push('/masters/items')
      }
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Failed to create item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'physical_stock' || name === 'reserved_stock' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a task to get started
          </p>
        </div>

        {/* Task Selector */}
        {!taskType && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              What would you like to do?
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTaskType('create')}
                className="p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">Create New Item</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a new product to inventory</div>
              </button>
              <button
                type="button"
                onClick={() => router.push('/stock')}
                className="p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">Adjust Stock</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update existing stock levels</div>
              </button>
              <button
                type="button"
                onClick={() => router.push('/orders/create')}
                className="p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">Create Order</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Place a new order</div>
              </button>
              <button
                type="button"
                onClick={() => router.push('/masters/items')}
                className="p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">View All Items</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse inventory catalog</div>
              </button>
            </div>
          </div>
        )}

        {taskType === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Item Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item ID (SKU) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter unique Item ID (e.g., FW-40-001)"
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter a unique SKU or click "Generate" to create one automatically
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="g">Grams</option>
                  <option value="m">Meters</option>
                  <option value="cm">Centimeters</option>
                  <option value="l">Liters</option>
                  <option value="ml">Milliliters</option>
                  <option value="box">Box</option>
                  <option value="set">Set</option>
                  <option value="pair">Pair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter item description"
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Initial Stock
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Physical Stock
                </label>
                <input
                  type="number"
                  name="physical_stock"
                  min="0"
                  value={formData.physical_stock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current physical inventory
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reserved Stock
                </label>
                <input
                  type="number"
                  name="reserved_stock"
                  min="0"
                  value={formData.reserved_stock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Stock reserved for orders
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Available Stock:</strong> {formData.physical_stock - formData.reserved_stock} {formData.unit}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setTaskType('')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Create Item
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </Layout>
  )
}
