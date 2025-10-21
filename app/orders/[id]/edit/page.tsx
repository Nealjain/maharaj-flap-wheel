'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface SelectedItem {
  item_id: string
  quantity: number
  price: number
  name: string
  sku: string
  unit: string
  available_stock: number
  due_date?: string
}

interface EditOrderPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditOrderPage({ params }: EditOrderPageProps) {
  const router = useRouter()
  const { orders, items, companies, transportCompanies, updateOrder, refetch } = useData()
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [orderId, setOrderId] = useState<string>('')
  const [order, setOrder] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedTransportCompany, setSelectedTransportCompany] = useState<string>('')
  const [orderItems, setOrderItems] = useState<SelectedItem[]>([])
  const [notes, setNotes] = useState<string>('')
  
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

  useEffect(() => {
    params.then(({ id }) => setOrderId(id))
  }, [params])

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const foundOrder = orders.find(o => o.id === orderId)
      if (foundOrder) {
        setOrder(foundOrder)
        setSelectedCompany(foundOrder.company_id)
        setSelectedTransportCompany(foundOrder.transport_company_id || '')
        setNotes(foundOrder.notes || '')
        setCompanySearch(foundOrder.company?.name || '')
        setTransportSearch(foundOrder.transport_company?.name || '')
        
        // Load order items
        if (foundOrder.order_items) {
          const loadedItems = foundOrder.order_items.map((oi: any) => {
            // Find the full item data from items array to get stock info
            const fullItem = items?.find(item => item.id === oi.item_id)
            const physicalStock = fullItem?.physical_stock || 0
            const reservedStock = fullItem?.reserved_stock || 0
            
            return {
              item_id: oi.item_id,
              quantity: oi.quantity,
              price: oi.price,
              name: oi.item?.name || 'Unknown',
              sku: oi.item?.sku || 'N/A',
              unit: oi.item?.unit || 'pcs',
              available_stock: physicalStock - reservedStock + oi.quantity,
              due_date: oi.due_date || ''
            }
          })
          setOrderItems(loadedItems)
        }
      } else {
        addToast('Order not found', 'error')
        router.push('/orders')
      }
    }
  }, [orderId, orders, items, router, addToast])

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
          quantity: 1,
          price: 0,
          name: item.name,
          sku: item.sku,
          unit: item.unit,
          available_stock: item.physical_stock - item.reserved_stock,
          due_date: ''
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

  const handleUpdateItemDueDate = (itemId: string, dueDate: string) => {
    console.log('Updating due date for item:', itemId, 'to:', dueDate)
    setOrderItems(prev => {
      const updated = prev.map(item =>
        item.item_id === itemId ? { ...item, due_date: dueDate } : item
      )
      console.log('Updated orderItems:', updated)
      return updated
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.item_id !== itemId))
  }

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company.id)
    setCompanySearch(company.name)
    setShowCompanyDropdown(false)
  }

  const handleTransportSelect = (transport: any) => {
    setSelectedTransportCompany(transport.id)
    setTransportSearch(transport.name)
    setShowTransportDropdown(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      addToast('You must be logged in to edit an order.', 'error')
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

    // Show warning if quantities exceed available stock (but don't block)
    const overStockItems = orderItems.filter(item => item.quantity > item.available_stock)
    if (overStockItems.length > 0) {
      const itemNames = overStockItems.map(item => `${item.name} (Qty: ${item.quantity}, Available: ${item.available_stock})`).join(', ')
      console.warn('Updating order with insufficient stock:', itemNames)
      // Don't return - allow order update
    }

    setIsSubmitting(true)
    console.log('Starting order update...')
    
    try {
      // Import supabase
      const { supabase } = await import('@/lib/supabase')
      
      // Update order details
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          company_id: selectedCompany,
          transport_company_id: selectedTransportCompany || null,
          notes: notes
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // Get existing order_items with delivered_quantity
      const { data: existingItems } = await supabase
        .from('order_items')
        .select('item_id, delivered_quantity')
        .eq('order_id', orderId)

      // Create a map of existing delivered quantities
      const deliveredMap = new Map(
        existingItems?.map(item => [item.item_id, item.delivered_quantity]) || []
      )

      // Update each order item individually to preserve delivered_quantity and update due_date
      console.log('Updating order items with due dates:', orderItems)
      
      for (const oi of orderItems) {
        const existingDelivered = deliveredMap.get(oi.item_id) || 0
        
        // Try to update existing item first
        const { data: existing } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)
          .eq('item_id', oi.item_id)
          .single()

        if (existing) {
          // Update existing item
          const { error: updateError } = await supabase
            .from('order_items')
            .update({
              quantity: oi.quantity,
              price: oi.price,
              due_date: oi.due_date || null
            })
            .eq('order_id', orderId)
            .eq('item_id', oi.item_id)

          if (updateError) {
            console.error('Error updating item:', oi.item_id, updateError)
            throw updateError
          }
          console.log('Updated item:', oi.item_id, 'with due_date:', oi.due_date)
        } else {
          // Insert new item
          const { error: insertError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderId,
              item_id: oi.item_id,
              quantity: oi.quantity,
              price: oi.price,
              delivered_quantity: existingDelivered,
              due_date: oi.due_date || null
            })

          if (insertError) {
            console.error('Error inserting item:', oi.item_id, insertError)
            throw insertError
          }
          console.log('Inserted new item:', oi.item_id, 'with due_date:', oi.due_date)
        }
      }

      // Delete items that were removed
      const currentItemIds = orderItems.map(oi => oi.item_id)
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)
        .not('item_id', 'in', `(${currentItemIds.join(',')})`)

      if (deleteError) {
        console.error('Error deleting removed items:', deleteError)
      }

      console.log('All order items updated successfully')

      // Log audit event
      await supabase.from('audit_logs').insert([{
        event_type: 'UPDATE',
        entity: 'orders',
        entity_id: orderId,
        performed_by: user?.id,
        payload: {
          company_id: selectedCompany,
          transport_company_id: selectedTransportCompany || null,
          notes: notes,
          items: orderItems.map(oi => ({
            item_id: oi.item_id,
            quantity: oi.quantity,
            price: oi.price,
            due_date: oi.due_date || null
          }))
        }
      }])

      console.log('Order updated successfully, delivered quantities preserved')
      addToast('Order updated successfully!', 'success')
      
      // Refresh orders data before redirecting
      console.log('Refreshing orders data...')
      await refetch.orders()
      console.log('Orders data refreshed')
      
      // Verify the updated order has due dates
      const updatedOrder = orders.find(o => o.id === orderId)
      console.log('Updated order from state:', updatedOrder?.order_items?.map((i: any) => ({ item_id: i.item_id, due_date: i.due_date })))
      
      router.push(`/orders/${orderId}`)
    } catch (error: any) {
      console.error('Error updating order:', error)
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred'
      addToast(`Failed to update order: ${errorMessage}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading order...</p>
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/orders')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Order</h1>
            <p className="text-gray-500 dark:text-gray-400">Update order details and items.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Selection */}
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
                      setSelectedCompany('')
                      setShowCompanyDropdown(true)
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${
                      selectedCompany ? 'border-green-500 dark:border-green-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Search company..."
                    required
                  />
                </div>
                
                {showCompanyDropdown && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
                    {filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleCompanySelect(company)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{company.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transport Company Selection */}
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
                    placeholder="Search transport company..."
                  />
                </div>
                
                {showTransportDropdown && filteredTransportCompanies.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
                    {filteredTransportCompanies.map((transport) => (
                      <div
                        key={transport.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleTransportSelect(transport)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{transport.name}</div>
                      </div>
                    ))}
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
              {orderItems.map((orderItem) => {
                const isOverStock = orderItem.quantity > orderItem.available_stock
                return (
                  <div key={orderItem.item_id} className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3 ${isOverStock ? 'ring-2 ring-red-500' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{orderItem.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          SKU: {orderItem.sku} | Available: <span className={orderItem.available_stock > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>{isNaN(orderItem.available_stock) ? 0 : orderItem.available_stock}</span> {orderItem.unit}
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
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 ml-2"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={orderItem.quantity || ''}
                        onChange={(e) => handleUpdateItemQuantity(orderItem.item_id, parseInt(e.target.value) || 1)}
                        className={`flex-1 px-2 py-1 border rounded text-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white ${
                          isOverStock ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Due Date:</label>
                      <input
                        type="date"
                        value={orderItem.due_date || ''}
                        onChange={(e) => handleUpdateItemDueDate(orderItem.item_id, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
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

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || orderItems.length === 0}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating Order...' : 'Update Order'}
            </button>
          </div>
        </form>
      </motion.div>
    </Layout>
  )
}
