'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { 
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface EditItemPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const router = useRouter()
  const { items, updateItem } = useData()
  const [loading, setLoading] = useState(false)
  const [item, setItem] = useState<any>(null)
  const [itemId, setItemId] = useState<string>('')
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'pcs',
<<<<<<< HEAD
    custom_unit: '',
    physical_stock: 0,
    reserved_stock: 0
  })
  const [useCustomUnit, setUseCustomUnit] = useState(false)
=======
    physical_stock: 0,
    reserved_stock: 0
  })
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d

  useEffect(() => {
    params.then(({ id }) => setItemId(id))
  }, [params])

  useEffect(() => {
    if (itemId) {
      const foundItem = items.find(i => i.id === itemId)
      if (foundItem) {
        setItem(foundItem)
<<<<<<< HEAD
        const hasCustomUnit = !!(foundItem.custom_unit && foundItem.custom_unit.trim() !== '')
        setUseCustomUnit(hasCustomUnit)
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
        setFormData({
          sku: foundItem.sku,
          name: foundItem.name,
          description: foundItem.description || '',
          unit: foundItem.unit,
<<<<<<< HEAD
          custom_unit: foundItem.custom_unit || '',
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
          physical_stock: foundItem.physical_stock,
          reserved_stock: foundItem.reserved_stock
        })
      } else {
        router.push('/masters/items')
      }
    }
  }, [items, itemId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.sku || !formData.name) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await updateItem(itemId, formData)

      if (error) {
        console.error('Error updating item:', error)
        alert('Failed to update item. Please try again.')
      } else {
        router.push('/masters/items')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Failed to update item. Please try again.')
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

  if (!item) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading item details...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Item
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update the item information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Item Details
            </h2>
            
            <div className="space-y-4">
<<<<<<< HEAD
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  required
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useCustomUnit"
                      checked={useCustomUnit}
                      onChange={(e) => {
                        setUseCustomUnit(e.target.checked)
                        if (!e.target.checked) {
                          setFormData(prev => ({ ...prev, custom_unit: '' }))
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useCustomUnit" className="text-sm text-gray-700 dark:text-gray-300">
                      Use custom unit
                    </label>
                  </div>
                  
                  {useCustomUnit ? (
                    <input
                      type="text"
                      name="custom_unit"
                      value={formData.custom_unit}
                      onChange={handleInputChange}
                      placeholder="e.g., Rolls, Bundles, Cartons"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
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
                  )}
=======
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter SKU"
                  />
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
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
                </div>
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
              Stock Information
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
              onClick={() => router.push('/masters/items')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Update Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
