'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from './supabase'
import { Order, Item, Company, TransportCompany, AuditLog, DashboardKPIs, StockStatus } from './supabase'
import { useAuth } from './auth'

interface DataContextType {
  orders: Order[]
  items: Item[]
  companies: Company[]
  transportCompanies: TransportCompany[]
  auditLogs: AuditLog[]
  dashboardKPIs: DashboardKPIs | null
  loading: {
    orders: boolean
    items: boolean
    companies: boolean
    transportCompanies: boolean
    auditLogs: boolean
    dashboardKPIs: boolean
  }
  refetch: {
    orders: () => Promise<void>
    items: () => Promise<void>
    companies: () => Promise<void>
    transportCompanies: () => Promise<void>
    auditLogs: () => Promise<void>
    dashboardKPIs: () => Promise<void>
  }
  createOrder: (orderData: any) => Promise<{ error: any }>
  updateOrder: (id: string, updates: any) => Promise<{ error: any }>
  createItem: (itemData: any) => Promise<{ error: any }>
  updateItem: (id: string, updates: any) => Promise<{ error: any }>
  deleteItem: (id: string) => Promise<{ error: any }>
  createCompany: (companyData: any) => Promise<{ error: any }>
  updateCompany: (id: string, updates: any) => Promise<{ error: any }>
  deleteCompany: (id: string) => Promise<{ error: any }>
  createTransportCompany: (data: any) => Promise<{ error: any }>
  updateTransportCompany: (id: string, updates: any) => Promise<{ error: any }>
  deleteTransportCompany: (id: string) => Promise<{ error: any }>
  logAuditEvent: (eventType: string, entity: string, entityId?: string, payload?: any) => Promise<void>
}

interface PaginationOptions {
  page: number
  limit: number
  totalCount: number
}

interface DataCache {
  orders: { data: Order[]; timestamp: number; pagination: PaginationOptions }
  items: { data: Item[]; timestamp: number; pagination: PaginationOptions }
  companies: { data: Company[]; timestamp: number; pagination: PaginationOptions }
  transportCompanies: { data: TransportCompany[]; timestamp: number; pagination: PaginationOptions }
  auditLogs: { data: AuditLog[]; timestamp: number; pagination: PaginationOptions }
  dashboardKPIs: { data: DashboardKPIs | null; timestamp: number }
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function OptimizedDataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs | null>(null)

  const [loading, setLoading] = useState({
    orders: false,
    items: false,
    companies: false,
    transportCompanies: false,
    auditLogs: false,
    dashboardKPIs: false
  })

  const { user } = useAuth()

  // Data cache with 5-minute TTL
  const cacheRef = useRef<DataCache>({
    orders: { data: [], timestamp: 0, pagination: { page: 1, limit: 50, totalCount: 0 } },
    items: { data: [], timestamp: 0, pagination: { page: 1, limit: 100, totalCount: 0 } },
    companies: { data: [], timestamp: 0, pagination: { page: 1, limit: 100, totalCount: 0 } },
    transportCompanies: { data: [], timestamp: 0, pagination: { page: 1, limit: 100, totalCount: 0 } },
    auditLogs: { data: [], timestamp: 0, pagination: { page: 1, limit: 100, totalCount: 0 } },
    dashboardKPIs: { data: null, timestamp: 0 }
  })

  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  const isCacheValid = (timestamp: number) => Date.now() - timestamp < CACHE_TTL

  // Memoized KPI calculations
  const memoizedKPIs = useMemo(() => {
    if (!orders.length || !items.length) return null

    const totalOrders = orders.length
    const todaysOrders = orders.filter(o =>
      new Date(o.created_at).toDateString() === new Date().toDateString()
    ).length
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const completedOrders = orders.filter(o => o.status === 'completed').length

    const totalItems = items.length
    const outOfStock = items.filter(item => item.physical_stock === 0).length
    const lowStock = items.filter(item => item.physical_stock <= 5 && item.physical_stock > 0).length
    const overStock = items.filter(item => item.physical_stock > 100).length

    const stockOverview: StockStatus = {
      outOfStock,
      lowStock,
      overStock,
      totalItems,
    }

    return {
      totalOrders,
      todaysOrders,
      pendingOrders,
      completedOrders,
      stockOverview,
    }
  }, [orders, items])

  // Optimized data loading with caching and pagination
  const loadEssentialData = useCallback(async () => {
    if (!user) return

    try {
      // Add timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.warn('Data loading timeout - forcing completion')
        setLoading({
          orders: false,
          items: false,
          companies: false,
          transportCompanies: false,
          auditLogs: false,
          dashboardKPIs: false
        })
      }, 10000) // 10 second timeout

      // Set loading states
      setLoading(prev => ({
        ...prev,
        orders: true,
        items: true,
        companies: true
      }))

      // Check cache first
      const ordersCache = cacheRef.current.orders
      const itemsCache = cacheRef.current.items
      const companiesCache = cacheRef.current.companies

      // Initialize fetch tasks array
      const fetchTasks: Array<{
        type: 'orders' | 'items' | 'companies'
        fetch: () => Promise<any>
      }> = []

      // Check and prepare each data type
      if (!isCacheValid(ordersCache.timestamp)) {
        fetchTasks.push({
          type: 'orders',
          fetch: async () => {
            const result = await supabase.from('orders')
              .select(`
                *,
                company:companies!orders_company_id_fkey(id, name, address, gst_number),
                transport_company:transport_companies!orders_transport_company_id_fkey(id, name, phone, address),
                order_items!order_items_order_id_fkey(
                  item_id,
                  quantity,
                  price,
                  delivered_quantity,
                  item:items!order_items_item_id_fkey(id, name, sku, unit)
                )
              `)
              .order('created_at', { ascending: false })
              .limit(ordersCache.pagination.limit)
            return result
          }
        })
      } else {
        setOrders(ordersCache.data)
        setLoading(prev => ({ ...prev, orders: false }))
      }

      if (!isCacheValid(itemsCache.timestamp)) {
        fetchTasks.push({
          type: 'items',
          fetch: async () => {
            const result = await supabase.from('items')
              .select('*')
              .order('name')
              .limit(itemsCache.pagination.limit)
            return result
          }
        })
      } else {
        setItems(itemsCache.data)
        setLoading(prev => ({ ...prev, items: false }))
      }

      if (!isCacheValid(companiesCache.timestamp)) {
        fetchTasks.push({
          type: 'companies',
          fetch: async () => {
            const result = await supabase.from('companies')
              .select('*')
              .order('name')
              .limit(companiesCache.pagination.limit)
            return result
          }
        })
      } else {
        setCompanies(companiesCache.data)
        setLoading(prev => ({ ...prev, companies: false }))
      }

      // Execute all fetch tasks in parallel with timeout
      if (fetchTasks.length > 0) {
        const fetchWithTimeout = (task: any) => {
          return Promise.race([
            task.fetch(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`${task.type} fetch timeout`)), 15000)
            )
          ])
        }

        const results = await Promise.allSettled(fetchTasks.map(task => fetchWithTimeout(task)))

        // Process results and update state/cache
        results.forEach((result, index) => {
          const task = fetchTasks[index]
          if (result.status === 'fulfilled') {
            const data = result.value.data
            if (data) {
              switch (task.type) {
                case 'orders':
                  setOrders(data)
                  cacheRef.current.orders = {
                    data,
                    timestamp: Date.now(),
                    pagination: cacheRef.current.orders.pagination
                  }
                  break
                case 'items':
                  setItems(data)
                  cacheRef.current.items = {
                    data,
                    timestamp: Date.now(),
                    pagination: cacheRef.current.items.pagination
                  }
                  break
                case 'companies':
                  setCompanies(data)
                  cacheRef.current.companies = {
                    data,
                    timestamp: Date.now(),
                    pagination: cacheRef.current.companies.pagination
                  }
                  break
              }
            }
          } else if (result.status === 'rejected') {
            console.error(`Error loading ${task.type}:`, result.reason)
          }
          // Clear loading state for this task
          setLoading(prev => ({ ...prev, [task.type]: false }))
        })
      }

      clearTimeout(loadingTimeout)
    } catch (error) {
      console.error('Error loading essential data:', error)
      // Force clear all loading states on error
      setLoading({
        orders: false,
        items: false,
        companies: false,
        transportCompanies: false,
        auditLogs: false,
        dashboardKPIs: false
      })
    }
  }, [user])

  // Load secondary data with caching
  const loadSecondaryData = useCallback(async () => {
    if (!user) return

    try {
      const transportCache = cacheRef.current.transportCompanies
      const auditCache = cacheRef.current.auditLogs

      const promises = []
      const loadingStates: Array<'transportCompanies' | 'auditLogs'> = []

      if (!isCacheValid(transportCache.timestamp)) {
        setLoading(prev => ({ ...prev, transportCompanies: true }))
        loadingStates.push('transportCompanies')
        promises.push(
          supabase.from('transport_companies')
            .select('*')
            .order('name')
            .limit(transportCache.pagination.limit)
        )
      } else {
        setTransportCompanies(transportCache.data)
        setLoading(prev => ({ ...prev, transportCompanies: false }))
      }

      if (!isCacheValid(auditCache.timestamp)) {
        setLoading(prev => ({ ...prev, auditLogs: true }))
        loadingStates.push('auditLogs')
        promises.push(
          supabase.from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(auditCache.pagination.limit)
        )
      } else {
        setAuditLogs(auditCache.data)
        setLoading(prev => ({ ...prev, auditLogs: false }))
      }

      if (promises.length > 0) {
        const results = await Promise.all(promises)
        let resultIndex = 0

        if (loadingStates.includes('transportCompanies')) {
          const transportData = results[resultIndex].data || []
          setTransportCompanies(transportData)
          cacheRef.current.transportCompanies = { data: transportData, timestamp: Date.now(), pagination: transportCache.pagination }
          setLoading(prev => ({ ...prev, transportCompanies: false }))
          resultIndex++
        }

        if (loadingStates.includes('auditLogs')) {
          const auditData = results[resultIndex].data || []
          setAuditLogs(auditData)
          cacheRef.current.auditLogs = { data: auditData, timestamp: Date.now(), pagination: auditCache.pagination }
          setLoading(prev => ({ ...prev, auditLogs: false }))
        }
      }
    } catch (error) {
      console.error('Error loading secondary data:', error)
      setLoading(prev => ({ ...prev, transportCompanies: false, auditLogs: false }))
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadEssentialData()
      // Load secondary data after a short delay to prioritize essential data
      setTimeout(loadSecondaryData, 1000)
    }
  }, [user, loadEssentialData, loadSecondaryData])

  // Update dashboard KPIs when memoized KPIs change
  useEffect(() => {
    if (memoizedKPIs) {
      setDashboardKPIs(memoizedKPIs)
      cacheRef.current.dashboardKPIs = { data: memoizedKPIs, timestamp: Date.now() }
    }
  }, [memoizedKPIs])

  const refreshOrders = useCallback(async () => {
    console.log('refreshOrders called')
    setLoading(prev => ({ ...prev, orders: true }))
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
                  company:companies!orders_company_id_fkey(id, name, address, gst_number),
                  transport_company:transport_companies!orders_transport_company_id_fkey(id, name, phone, address),
                  order_items!order_items_order_id_fkey(
                    item_id,
                    quantity,
                    price,
                    delivered_quantity,
                    item:items!order_items_item_id_fkey(id, name, sku, unit)
                  )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      console.log('Orders fetched:', data?.length)
      if (error) throw error
      setOrders(data || [])
      // Update cache
      cacheRef.current.orders = {
        data: data || [],
        timestamp: Date.now(),
        pagination: cacheRef.current.orders.pagination
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(prev => ({ ...prev, orders: false }))
      console.log('refreshOrders finished')
    }
  }, [])

  const refreshItems = useCallback(async () => {
    setLoading(prev => ({ ...prev, items: true }))
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(prev => ({ ...prev, items: false }))
    }
  }, [])

  const refreshCompanies = useCallback(async () => {
    setLoading(prev => ({ ...prev, companies: true }))
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(prev => ({ ...prev, companies: false }))
    }
  }, [])

  const refreshTransportCompanies = useCallback(async () => {
    console.log('refreshTransportCompanies called')
    setLoading(prev => ({ ...prev, transportCompanies: true }))
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name')

      console.log('Transport companies fetch result:', { data, error })
      if (error) throw error
      setTransportCompanies(data || [])
      console.log('Transport companies state updated')
    } catch (error) {
      console.error('Error fetching transport companies:', error)
    } finally {
      setLoading(prev => ({ ...prev, transportCompanies: false }))
      console.log('refreshTransportCompanies finished')
    }
  }, [])

  const refreshAuditLogs = useCallback(async () => {
    setLoading(prev => ({ ...prev, auditLogs: true }))
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setAuditLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(prev => ({ ...prev, auditLogs: false }))
    }
  }, [])

  const refreshDashboardKPIs = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboardKPIs: true }))
    try {
      // Use memoized KPIs instead of recalculating
      if (memoizedKPIs) {
        setDashboardKPIs(memoizedKPIs)
        cacheRef.current.dashboardKPIs = { data: memoizedKPIs, timestamp: Date.now() }
      }
    } catch (error) {
      console.error('Error refreshing dashboard KPIs:', error)
    } finally {
      setLoading(prev => ({ ...prev, dashboardKPIs: false }))
    }
  }, [memoizedKPIs])

  // Auto-refresh disabled - was causing partial delivery to reset
  // Users can manually refresh by pulling down on mobile or clicking refresh button

  const createOrder = async (orderData: any) => {
    console.log('createOrder called with:', orderData)
    try {
      // Separate order_items from order data
      const { order_items, ...orderFields } = orderData
      console.log('Order fields:', orderFields)
      console.log('Order items:', order_items)

      const { data, error } = await supabase
        .from('orders')
        .insert([orderFields])
        .select()

      console.log('Order insert result:', { data, error })
      if (error) {
        console.error('Order insert error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No order data returned after insert')
      }

      const orderId = data[0].id
      console.log('Created order with ID:', orderId)

      // Insert order items
      if (order_items && order_items.length > 0) {
        console.log('Inserting order items...')
        const itemsToInsert = order_items.map((item: any) => ({
          order_id: orderId,
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price
        }))
        console.log('Items to insert:', itemsToInsert)

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert)

        if (itemsError) {
          console.error('Error inserting order items:', itemsError)
          throw itemsError
        }
        console.log('Order items inserted successfully')

        // Reserve stock for each item in parallel
        console.log('Updating stock reservations...')
        const stockUpdates = order_items.map(async (item: any) => {
          try {
            // First get current reserved stock
            const { data: currentItem, error: fetchError } = await supabase
              .from('items')
              .select('reserved_stock')
              .eq('id', item.item_id)
              .single()

            if (fetchError) {
              console.error('Error fetching item:', item.item_id, fetchError)
              return
            }

            // Update with calculated value
            const { error: stockError } = await supabase
              .from('items')
              .update({
                reserved_stock: currentItem.reserved_stock + item.quantity
              })
              .eq('id', item.item_id)

            if (stockError) {
              console.error('Error reserving stock for item:', item.item_id, stockError)
            }
          } catch (err) {
            console.error('Error updating stock for item:', item.item_id, err)
          }
        })

        await Promise.all(stockUpdates)
        console.log('Stock reservations updated')
      }

      // Log audit event (don't wait for it)
      supabase.from('audit_logs').insert([{
        event_type: 'CREATE',
        entity: 'orders',
        entity_id: orderId,
        performed_by: user?.id,
        payload: {
          company_id: orderFields.company_id,
          transport_company_id: orderFields.transport_company_id,
          notes: orderFields.notes,
          items: order_items?.map((oi: any) => ({ item_id: oi.item_id, quantity: oi.quantity, price: oi.price })) || [],
        },
      }]).then(({ error: auditError }) => {
        if (auditError) console.error('Error logging audit event:', auditError)
      })

      // Refresh data in background (don't wait for it)
      console.log('Triggering data refresh...')
      Promise.all([
        refreshOrders(),
        refreshItems()
      ]).then(() => {
        console.log('Data refreshed')
      }).catch(err => {
        console.error('Error refreshing data:', err)
      })

      return { error: null }
    } catch (error) {
      console.error('Error creating order:', error)
      return { error }
    }
  }

  const updateOrder = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Log audit event
      await logAuditEvent('UPDATE', 'orders', id, updates)

      refreshOrders().catch(err => console.error('Error refreshing orders:', err))

      return { error: null }
    } catch (error) {
      console.error('Error updating order:', error)
      return { error }
    }
  }

  const createItem = async (itemData: any) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([itemData])
        .select()

      if (error) throw error

      // Log audit event
      if (data && data[0]) {
        await logAuditEvent('CREATE', 'items', data[0].id, itemData)
      }

      refreshItems().catch(err => console.error('Error refreshing items:', err))

      return { error: null }
    } catch (error) {
      console.error('Error creating item:', error)
      return { error }
    }
  }

  const updateItem = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Log audit event
      await logAuditEvent('UPDATE', 'items', id, updates)

      refreshItems().catch(err => console.error('Error refreshing items:', err))

      return { error: null }
    } catch (error) {
      console.error('Error updating item:', error)
      return { error }
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log audit event
      await logAuditEvent('DELETE', 'items', id)

      refreshItems().catch(err => console.error('Error refreshing items:', err))

      return { error: null }
    } catch (error) {
      console.error('Error deleting item:', error)
      return { error }
    }
  }

  const createCompany = async (companyData: any) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()

      if (error) throw error

      // Log audit event
      if (data && data[0]) {
        await logAuditEvent('CREATE', 'companies', data[0].id, companyData)
      }

      refreshCompanies().catch(err => console.error('Error refreshing companies:', err))

      return { error: null }
    } catch (error) {
      console.error('Error creating company:', error)
      return { error }
    }
  }

  const updateCompany = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Log audit event
      await logAuditEvent('UPDATE', 'companies', id, updates)

      refreshCompanies().catch(err => console.error('Error refreshing companies:', err))

      return { error: null }
    } catch (error) {
      console.error('Error updating company:', error)
      return { error }
    }
  }

  const deleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log audit event
      await logAuditEvent('DELETE', 'companies', id)

      refreshCompanies().catch(err => console.error('Error refreshing companies:', err))

      return { error: null }
    } catch (error) {
      console.error('Error deleting company:', error)
      return { error }
    }
  }

  const createTransportCompany = async (data: any) => {
    console.log('createTransportCompany called with:', data)
    try {
      const { data: result, error } = await supabase
        .from('transport_companies')
        .insert([data])
        .select()

      console.log('Transport company insert result:', { error })
      if (error) throw error

      // Log audit event
      if (result && result[0]) {
        await logAuditEvent('CREATE', 'transport_companies', result[0].id, data)
      }

      console.log('Triggering transport companies refresh...')
      refreshTransportCompanies().then(() => {
        console.log('Transport companies refreshed')
      }).catch(err => {
        console.error('Error refreshing transport companies:', err)
      })

      return { error: null }
    } catch (error) {
      console.error('Error creating transport company:', error)
      return { error }
    }
  }

  const updateTransportCompany = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('transport_companies')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Log audit event
      await logAuditEvent('UPDATE', 'transport_companies', id, updates)

      refreshTransportCompanies().catch(err => console.error('Error refreshing transport companies:', err))

      return { error: null }
    } catch (error) {
      console.error('Error updating transport company:', error)
      return { error }
    }
  }

  const deleteTransportCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transport_companies')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log audit event
      await logAuditEvent('DELETE', 'transport_companies', id)

      refreshTransportCompanies().catch(err => console.error('Error refreshing transport companies:', err))

      return { error: null }
    } catch (error) {
      console.error('Error deleting transport company:', error)
      return { error }
    }
  }

  const logAuditEvent = async (eventType: string, entity: string, entityId?: string, payload?: any) => {
    try {
      await supabase.from('audit_logs').insert([{
        event_type: eventType,
        entity: entity,
        entity_id: entityId,
        performed_by: user?.id,
        payload: payload
      }])
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }

  const value = {
    orders,
    items,
    companies,
    transportCompanies,
    auditLogs,
    dashboardKPIs,
    loading,
    refetch: {
      orders: refreshOrders,
      items: refreshItems,
      companies: refreshCompanies,
      transportCompanies: refreshTransportCompanies,
      auditLogs: refreshAuditLogs,
      dashboardKPIs: refreshDashboardKPIs,
    },
    createOrder,
    updateOrder,
    createItem,
    updateItem,
    deleteItem,
    createCompany,
    updateCompany,
    deleteCompany,
    createTransportCompany,
    updateTransportCompany,
    deleteTransportCompany,
    logAuditEvent,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
