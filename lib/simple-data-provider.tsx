'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
  loading: boolean
  refreshOrders: () => Promise<void>
  refreshItems: () => Promise<void>
  refreshCompanies: () => Promise<void>
  refreshTransportCompanies: () => Promise<void>
  refreshDashboardKPIs: () => Promise<void>
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

const DataContext = createContext<DataContextType | undefined>(undefined)

export function SimpleDataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // Load data only when needed
  const loadInitialData = async () => {
    if (loading) return
    setLoading(true)
    try {
      // Load only essential data first
      const [ordersResult, itemsResult, companiesResult] = await Promise.all([
        supabase.from('orders').select('*').limit(50),
        supabase.from('items').select('*'),
        supabase.from('companies').select('*')
      ])

      if (ordersResult.data) setOrders(ordersResult.data)
      if (itemsResult.data) setItems(itemsResult.data)
      if (companiesResult.data) setCompanies(companiesResult.data)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadInitialData()
    }
  }, [user])

  const refreshOrders = async () => {
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
    }
  }

  const refreshItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const refreshCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const refreshTransportCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name')

      if (error) throw error
      setTransportCompanies(data || [])
    } catch (error) {
      console.error('Error fetching transport companies:', error)
    }
  }

  const refreshDashboardKPIs = async () => {
    try {
      // Simple KPI calculation
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

      setDashboardKPIs({
        totalOrders,
        todaysOrders,
        pendingOrders,
        completedOrders,
        stockOverview,
      })
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error)
    }
  }

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
      }

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
    refreshOrders,
    refreshItems,
    refreshCompanies,
    refreshTransportCompanies,
    refreshDashboardKPIs,
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
