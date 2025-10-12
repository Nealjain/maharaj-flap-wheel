'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useData } from '@/lib/optimized-data-provider'
import { supabase } from '@/lib/supabase'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import CSVExport from '@/components/CSVExport'

interface StockLedgerEntry {
  id: string
  item_id: string
  sku: string
  item_name: string
  unit: string
  custom_unit: string | null
  transaction_type: string
  quantity: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  notes: string | null
  created_by_name: string | null
  created_at: string
}

export default function StockLedgerPage() {
  const router = useRouter()
  const { items, loading } = useData()
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<StockLedgerEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [loadingLedger, setLoadingLedger] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addStockForm, setAddStockForm] = useState({
    item_id: '',
    quantity: 0,
    notes: ''
  })

  useEffect(() => {
    fetchLedger()
  }, [])

  useEffect(() => {
    let filtered = ledgerEntries

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.transaction_type === filterType)
    }

    if (selectedItem) {
      filtered = filtered.filter(entry => entry.item_id === selectedItem)
    }

    setFilteredEntries(filtered)
  }, [ledgerEntries, searchTerm, filterType, selectedItem])

  const fetchLedger = async () => {
    setLoadingLedger(true)
    try {
      const { data, error } = await supabase
        .from('stock_ledger_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      setLedgerEntries(data || [])
    } catch (error) {
      console.error('Error fetching ledger:', error)
    } finally {
      setLoadingLedger(false)
    }
  }

  const handleAddStock = async () => {
    if (!addStockForm.item_id || addStockForm.quantity === 0) {
      alert('Please select an item and enter quantity')
      return
    }

    try {
      const { data, error } = await supabase.rpc('add_stock_with_ledger', {
        p_item_id: addStockForm.item_id,
        p_quantity: addStockForm.quantity,
        p_notes: addStockForm.notes || null
      })

      if (error) throw error

      alert('Stock added successfully!')
      setShowAddModal(false)
      setAddStockForm({ item_id: '', quantity: 0, notes: '' })
      fetchLedger()
      
      // Refresh items data
      window.location.reload()
    } catch (error: any) {
      console.error('Error adding stock:', error)
      alert('Failed to add stock: ' + error.message)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <ArrowUpIcon className="h-4 w-4 text-green-600" />
      case 'removal':
        return <ArrowDownIcon className="h-4 w-4 text-red-600" />
      case 'adjustment':
        return <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-600" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'removal':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'adjustment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'order_reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'order_delivered':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'order_cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const exportData = filteredEntries.map(entry => ({
    date: new Date(entry.created_at).toLocaleString(),
    item_name: entry.item_name,
    sku: entry.sku,
    transaction_type: entry.transaction_type,
    quantity: entry.quantity,
    balance_after: entry.balance_after,
    unit: entry.custom_unit || entry.unit,
    notes: entry.notes || '',
    created_by: entry.created_by_name || 'System'
  }))

  if (loading.items || loadingLedger) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
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
              Stock Ledger
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track all stock movements with date-wise history
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Stock
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Items</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Transactions</option>
              <option value="addition">Additions</option>
              <option value="removal">Removals</option>
              <option value="adjustment">Adjustments</option>
              <option value="order_reserved">Order Reserved</option>
              <option value="order_delivered">Order Delivered</option>
              <option value="order_cancelled">Order Cancelled</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end">
            <CSVExport
              data={exportData}
              headers={['Date', 'Item Name', 'SKU', 'Transaction Type', 'Quantity', 'Balance After', 'Unit', 'Notes', 'Created By']}
              filename="stock_ledger"
              className="px-4 py-2"
            />
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No ledger entries found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start by adding stock to your items
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Transaction</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEntries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.item_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionColor(entry.transaction_type)}`}>
                          {getTransactionIcon(entry.transaction_type)}
                          <span className="ml-1">{entry.transaction_type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={entry.quantity > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                          {entry.quantity > 0 ? '+' : ''}{entry.quantity} {entry.custom_unit || entry.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        {entry.balance_after} {entry.custom_unit || entry.unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {entry.notes || '-'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Stock Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAddModal(false)}></div>
              
              <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 z-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Add Stock
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Item *
                    </label>
                    <select
                      value={addStockForm.item_id}
                      onChange={(e) => setAddStockForm(prev => ({ ...prev, item_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Choose an item...</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.sku}) - Current: {item.physical_stock} {item.custom_unit || item.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={addStockForm.quantity}
                      onChange={(e) => setAddStockForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter quantity to add"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter positive number to add stock, negative to remove
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={addStockForm.notes}
                      onChange={(e) => setAddStockForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Optional notes about this stock movement"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStock}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Add Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
