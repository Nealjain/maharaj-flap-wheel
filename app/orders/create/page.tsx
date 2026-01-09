'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { useRouter } from 'next/navigation'
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'

interface SelectedItem {
  item_id: string
  quantity: number
  due_date?: string
  name: string
  sku: string
  unit: string
  available_stock: number
}

interface Company {
  id: string
  name: string
}

interface TransportCompany {
  id: string
  name: string
}

export default function CreateOrderPage() {
  const { companies, items, transportCompanies, createOrder, loading } = useData()
  const { user } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()


  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedTransportCompany, setSelectedTransportCompany] = useState<string>('')
  const [orderItems, setOrderItems] = useState<SelectedItem[]>([])
  const [notes, setNotes] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-complete states
  const [companySearch, setCompanySearch] = useState('')
  const [transportSearch, setTransportSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showTransportDropdown, setShowTransportDropdown] = useState(false)
  const [showItemDropdown, setShowItemDropdown] = useState(false)

  // Refs for click outside detection
  const companyRef = useRef<HTMLDivElement>(null)
  const transportRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false)
      }
      if (transportRef.current && !transportRef.current.contains(event.target as Node)) {
        setShowTransportDropdown(false)
      }
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setShowItemDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtered options for auto-complete
  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  ) || []

  const filteredTransportCompanies = transportCompanies?.filter(tc =>
    tc.name.toLowerCase().includes(transportSearch.toLowerCase())
  ) || []

  const filteredItems = items?.filter(item => {
    return (
      (item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(itemSearch.toLowerCase())) &&
      !orderItems.some(oi => oi.item_id === item.id)
      // Allow all items, even out of stock
    )
  }) || []

  const handleAddItem = (itemId: string) => {
    const item = items?.find(i => i.id === itemId)
    if (item) {
      setOrderItems(prev => [
        ...prev,
        {
          item_id: item.id,
          quantity: 0,
          due_date: '',
          name: item.name,
          sku: item.sku,
          unit: item.unit,
          available_stock: item.physical_stock - item.reserved_stock,
        },
      ])
      setItemSearch('')
      setShowItemDropdown(false)
    }
  }

  const handleUpdateItemQuantity = (itemId: string, value: string) => {
    // Allow empty string to clear the input
    if (value === '') {
      setOrderItems(prev =>
        prev.map(item =>
          item.item_id === itemId ? { ...item, quantity: 0 } : item
        )
      )
      return
    }

    const parsed = parseInt(value)
    if (!isNaN(parsed) && parsed >= 0) {
      setOrderItems(prev =>
        prev.map(item =>
          item.item_id === itemId ? { ...item, quantity: parsed } : item
        )
      )
    }
  }

  const handleUpdateItemDueDate = (itemId: string, dueDate: string) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.item_id === itemId ? { ...item, due_date: dueDate } : item
      )
    )
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.item_id !== itemId))
  }

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company.id)
    setCompanySearch(company.name)
    setShowCompanyDropdown(false)
  }

  const handleTransportSelect = (transport: TransportCompany) => {
    setSelectedTransportCompany(transport.id)
    setTransportSearch(transport.name)
    setShowTransportDropdown(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      addToast('You must be logged in to create an order.', 'error')
      return
    }
    if (!selectedCompany) {
      addToast('Please select a company from the dropdown.', 'error')
      return
    }
    if (orderItems.length === 0) {
      addToast('Please add at least one item to the order.', 'error')
      return
    }

    // Validate that all items have quantity > 0
    const invalidItems = orderItems.filter(item => item.quantity <= 0)
    if (invalidItems.length > 0) {
      addToast('Please enter a valid quantity for all items (must be greater than 0).', 'error')
      return
    }

    // Show warning if quantities exceed available stock (but don't block)
    const overStockItems = orderItems.filter(item => item.quantity > item.available_stock)
    if (overStockItems.length > 0) {
      const itemNames = overStockItems.map(item => `${item.name} (Qty: ${item.quantity}, Available: ${item.available_stock})`).join(', ')
      console.warn('Creating order with insufficient stock:', itemNames)
      // Don't return - allow order creation
    }

    setIsSubmitting(true)
    console.log('Starting order creation...')

    try {
      // Use the data provider's createOrder method
      const orderData = {
        company_id: selectedCompany,
        transport_company_id: selectedTransportCompany || null,
        created_by: user.id,
        status: 'pending',
        notes: notes,
        order_items: orderItems.map(oi => ({
          item_id: oi.item_id,
          quantity: oi.quantity,
          price: 0, // Price removed from UI but kept in DB for compatibility
          due_date: oi.due_date || null
        }))
      }

      console.log('Order data:', orderData)
      const result = await createOrder(orderData)
      console.log('Create order result:', result)

      if (result.error) {
        console.error('Order creation error:', result.error)
        throw result.error
      }

      addToast('Order created successfully!', 'success')
      router.push('/orders')
    } catch (error: any) {
      console.error('Error creating order:', error)
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred'
      addToast(`Failed to create order: ${errorMessage}`, 'error')
    } finally {
      setIsSubmitting(false)
      console.log('Order creation finished')
    }
  }

  // Show loading state if data is not ready
  if (loading.orders || loading.items || loading.companies || loading.transportCompanies) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-6">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Show error if no data is available
  if (!companies || companies.length === 0 || !items || items.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Data Not Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please ensure you have companies and items in your system before creating orders.
            </p>
            <div className="space-x-4">
              <Link
                href="/masters/companies/create"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add Company
              </Link>
              <Link
                href="/masters/items/create"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add Item
              </Link>
            </div>
          </div>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Order</h1>
          <p className="text-gray-500 dark:text-gray-400">Fill in the details to create a new customer order.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Selection with Auto-complete */}
              <div className="relative" ref={companyRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value)
                      setSelectedCompany('') // Clear selection when typing
                      setShowCompanyDropdown(true)
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${selectedCompany ? 'border-green-500 dark:border-green-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    placeholder="Search or type company name..."
                    required
                  />
                  {companySearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompanySearch('')
                        setSelectedCompany('')
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  )}
                </div>

                {showCompanyDropdown && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleCompanySelect(company)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{company.name}</div>
                      </div>
                    ))}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600">
                      <Link
                        href="/masters/companies/create"
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                        onClick={() => setShowCompanyDropdown(false)}
                      >
                        + Add New Company
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Transport Company Selection with Auto-complete */}
              <div className="relative" ref={transportRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transport Company
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={transportSearch}
                    onChange={(e) => {
                      setTransportSearch(e.target.value)
                      setShowTransportDropdown(true)
                    }}
                    onFocus={() => setShowTransportDropdown(true)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Search or type transport company..."
                  />
                  {transportSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setTransportSearch('')
                        setSelectedTransportCompany('')
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  )}
                </div>

                {showTransportDropdown && filteredTransportCompanies.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {filteredTransportCompanies.map((transport) => (
                      <div
                        key={transport.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleTransportSelect(transport)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{transport.name}</div>
                      </div>
                    ))}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600">
                      <Link
                        href="/masters/transport-companies/create"
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                        onClick={() => setShowTransportDropdown(false)}
                      >
                        + Add New Transport Company
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>

            {/* Add Item Search */}
            <div className="mb-6 relative" ref={itemRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Item
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value)
                    setShowItemDropdown(true)
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Search by item name or SKU..."
                />
              </div>

              {showItemDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const availableStock = item.physical_stock - item.reserved_stock
                      return (
                        <div
                          key={item.id}
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleAddItem(item.id)}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {item.sku} | Available: <span className={availableStock > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>{availableStock}</span> {item.unit}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400">
                      {itemSearch ? 'No items found' : 'Start typing to search items'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Items */}
            <div className="space-y-4">
              {orderItems.map((orderItem, index) => {
                const isOverStock = orderItem.quantity > orderItem.available_stock
                return (
                  <div key={orderItem.item_id} className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg ${isOverStock ? 'ring-2 ring-red-500' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{orderItem.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          SKU: {orderItem.sku} | Available: <span className={orderItem.available_stock > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>{orderItem.available_stock}</span> {orderItem.unit}
                        </p>
                        {isOverStock && (
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                            ⚠️ Quantity exceeds available stock!
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(orderItem.item_id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={orderItem.quantity === 0 ? '' : orderItem.quantity}
                          onChange={(e) => handleUpdateItemQuantity(orderItem.item_id, e.target.value)}
                          className={`w-full px-3 py-2 border rounded text-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white ${isOverStock ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                          placeholder="Enter quantity"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Due Date (Optional)</label>
                        <input
                          type="date"
                          value={orderItem.due_date || ''}
                          onChange={(e) => handleUpdateItemDueDate(orderItem.item_id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {orderItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Items:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {orderItems.length}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Quantity:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {orderItems.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || orderItems.length === 0}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>
      </motion.div>
    </Layout>
  )
}