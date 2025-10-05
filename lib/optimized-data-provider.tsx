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
    const pendingOrders = orders.filter(o => o.status === 'reserved').length
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
          fetch: () => supabase.from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(ordersCache.pagination.limit)
        })
      } else {
        setOrders(ordersCache.data)
        setLoading(prev => ({ ...prev, orders: false }))
      }
      
      if (!isCacheValid(itemsCache.timestamp)) {
        fetchTasks.push({
          type: 'items',
          fetch: () => supabase.from('items')
            .select('*')
            .order('name')
            .limit(itemsCache.pagination.limit)
        })
      } else {
        setItems(itemsCache.data)
        setLoading(prev => ({ ...prev, items: false }))
      }
      
      if (!isCacheValid(companiesCache.timestamp)) {
        fetchTasks.push({
          type: 'companies',
          fetch: () => supabase.from('companies')
            .select('*')
            .order('name')
            .limit(companiesCache.pagination.limit)
        })
      } else {
        setCompanies(companiesCache.data)
        setLoading(prev => ({ ...prev, companies: false }))
      }
      
      // Execute all fetch tasks in parallel
      if (fetchTasks.length > 0) {
        const results = await Promise.allSettled(fetchTasks.map(task => task.fetch()))
        
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
    } catch (error) {
      console.error('Error loading essential data:', error)
    }
  }, [user])

  // Load secondary data with caching
  const loadSecondaryData = useCallback(async () => {
    if (!user) return

    try {
      const transportCache = cacheRef.current.transportCompanies
      const auditCache = cacheRef.current.auditLogs
      
      const promises = []
      
      if (!isCacheValid(transportCache.timestamp)) {
        promises.push(
          supabase.from('transport_companies')
            .select('*')
            .order('name')
            .limit(transportCache.pagination.limit)
        )
      } else {
        setTransportCompanies(transportCache.data)
      }
      
      if (!isCacheValid(auditCache.timestamp)) {
        promises.push(
          supabase.from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(auditCache.pagination.limit)
        )
      } else {
        setAuditLogs(auditCache.data)
      }
      
      if (promises.length > 0) {
        const results = await Promise.all(promises)
        let resultIndex = 0
        
        if (!isCacheValid(transportCache.timestamp)) {
          const transportData = results[resultIndex].data || []
          setTransportCompanies(transportData)
          cacheRef.current.transportCompanies = { data: transportData, timestamp: Date.now(), pagination: transportCache.pagination }
          resultIndex++
        }
        
        if (!isCacheValid(auditCache.timestamp)) {
          const auditData = results[resultIndex].data || []
          setAuditLogs(auditData)
          cacheRef.current.auditLogs = { data: auditData, timestamp: Date.now(), pagination: auditCache.pagination }
        }
      }
    } catch (error) {
      console.error('Error loading secondary data:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadEssentialData()
      // Load secondary data after a short delay to prioritize essential data
      setTimeout(loadSecondaryData, 1000)
    }
  }, [user, loadEssentialData, loadSecondaryData])

  // Update dashboard KPIs when orders or items change
  useEffect(() => {
    const updateKPIs = async () => {
      setLoading(prev => ({ ...prev, dashboardKPIs: true }))
      try {
        if (orders.length === 0 || items.length === 0) {
          // If we don't have data yet, try to fetch it
          if (!loading.orders && !loading.items) {
            await Promise.all([refreshOrders(), refreshItems()])
          }
        } else {
          // We have data, calculate KPIs
          refreshDashboardKPIs()
        }
      } finally {
        setLoading(prev => ({ ...prev, dashboardKPIs: false }))
      }
    }
    updateKPIs()
  }, [orders.length, items.length])

  const refreshOrders = useCallback(async () => {
    setLoading(prev => ({ ...prev, orders: true }))
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(prev => ({ ...prev, orders: false }))
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
    setLoading(prev => ({ ...prev, transportCompanies: true }))
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name')

      if (error) throw error
      setTransportCompanies(data || [])
    } catch (error) {
      console.error('Error fetching transport companies:', error)
    } finally {
      setLoading(prev => ({ ...prev, transportCompanies: false }))
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

  const createOrder = async (orderData: any) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()

      if (error) throw error

      // Insert order items
      if (orderData.order_items) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderData.order_items.map((item: any) => ({
            order_id: data[0].id,
            item_id: item.item_id,
            quantity: item.quantity,
            price: item.price
          })))

        if (itemsError) throw itemsError

        // Reserve stock for each item
        for (const item of orderData.order_items) {
          // First get current reserved stock
          const { data: currentItem, error: fetchError } = await supabase
            .from('items')
            .select('reserved_stock')
            .eq('id', item.item_id)
            .single()

          if (fetchError) {
            console.error('Error fetching item:', item.item_id, fetchError)
            continue
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
        }
      }

      // Log audit event
      await supabase.from('audit_logs').insert([{
        event_type: 'ORDER_CREATED',
        entity: 'orders',
        entity_id: data[0].id,
        payload: {
          company_id: orderData.company_id,
          transport_company_id: orderData.transport_company_id,
          notes: orderData.notes,
          items: orderData.order_items?.map((oi: any) => ({ item_id: oi.item_id, quantity: oi.quantity, price: oi.price })) || [],
        },
      }])

      await refreshOrders()
      await refreshItems()
      await refreshDashboardKPIs()

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

      await refreshOrders()
      await refreshDashboardKPIs()

      return { error: null }
    } catch (error) {
      console.error('Error updating order:', error)
      return { error }
    }
  }

  const createItem = async (itemData: any) => {
    try {
      const { error } = await supabase
        .from('items')
        .insert([itemData])

      if (error) throw error

      await refreshItems()
      await refreshDashboardKPIs()

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

      await refreshItems()
      await refreshDashboardKPIs()

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

      await refreshItems()
      await refreshDashboardKPIs()

      return { error: null }
    } catch (error) {
      console.error('Error deleting item:', error)
      return { error }
    }
  }

  const createCompany = async (companyData: any) => {
    try {
      const { error } = await supabase
        .from('companies')
        .insert([companyData])

      if (error) throw error

      await refreshCompanies()

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

      await refreshCompanies()

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

      await refreshCompanies()

      return { error: null }
    } catch (error) {
      console.error('Error deleting company:', error)
      return { error }
    }
  }

  const createTransportCompany = async (data: any) => {
    try {
      const { error } = await supabase
        .from('transport_companies')
        .insert([data])

      if (error) throw error

      await refreshTransportCompanies()

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

      await refreshTransportCompanies()

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

      await refreshTransportCompanies()

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
