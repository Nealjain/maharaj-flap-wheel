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
  price: number
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

  const filteredItems = items?.filter(item =>
    (item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
     item.sku.toLowerCase().includes(itemSearch.toLowerCase())) &&
    !orderItems.some(oi => oi.item_id === item.id)
  ) || []

  const handleAddItem = (itemId: string) => {
    const item = items?.find(i => i.id === itemId)
    if (item) {
      setOrderItems(prev => [
        ...prev,
        {
          item_id: item.id,
          quantity: 1,
          price: 0, // Default price, user can change
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

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.item_id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    )
  }

  const handleUpdateItemPrice = (itemId: string, price: number) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.item_id === itemId ? { ...item, price: Math.max(0, price) } : item
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
    if (!selectedCompany || orderItems.length === 0) {
      addToast('Please select a company and add at least one item.', 'error')
      return
    }

    setIsSubmitting(true)
    console.log('Starting order creation...')
    
    try {
      // Use the data provider's createOrder method
      const orderData = {
        company_id: selectedCompany,
        transport_company_id: selectedTransportCompany || null,
        created_by: user.id,
        status: 'reserved',
        notes: notes,
        order_items: orderItems.map(oi => ({
          item_id: oi.item_id,
          quantity: oi.quantity,
          price: oi.price
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
                      setShowCompanyDropdown(true)
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
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

            {/* Due Date */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
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
              
              {showItemDropdown && filteredItems.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleAddItem(item.id)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku} | Available: {item.physical_stock - item.reserved_stock} {item.unit}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Items */}
            <div className="space-y-4">
              {orderItems.map((orderItem, index) => (
                <div key={orderItem.item_id} className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{orderItem.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {orderItem.sku} | Available: {orderItem.available_stock} {orderItem.unit}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      max={orderItem.available_stock}
                      value={orderItem.quantity}
                      onChange={(e) => handleUpdateItemQuantity(orderItem.item_id, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Price:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderItem.price || ''}
                      onChange={(e) => handleUpdateItemPrice(orderItem.item_id, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{(orderItem.quantity * orderItem.price).toFixed(2)}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(orderItem.item_id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {orderItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ₹{orderItems.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2)}
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