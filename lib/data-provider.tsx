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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user && !loading) {
      loadAllData()
    }
  }, [user])

  const loadAllData = async () => {
    if (loading) return // Prevent multiple simultaneous loads
    setLoading(true)
    try {
      await Promise.all([
        refreshOrders(),
        refreshItems(),
        refreshCompanies(),
        refreshTransportCompanies(),
        refreshDashboardKPIs()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          company:companies(*),
          transport_company:transport_companies(*),
          order_items:order_items(*, item:items(*))
        `)
        .order('created_at', { ascending: false })

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
      // Get orders count
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, created_at')

      if (ordersError) throw ordersError

      const today = new Date().toISOString().split('T')[0]
      const todaysOrders = ordersData?.filter(order => 
        order.created_at.startsWith(today)
      ).length || 0

      const pendingOrders = ordersData?.filter(order => 
        order.status === 'reserved'
      ).length || 0

      const completedOrders = ordersData?.filter(order => 
        order.status === 'completed'
      ).length || 0

      // Get stock overview
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('physical_stock, reserved_stock')

      if (itemsError) throw itemsError

      const stockOverview: StockStatus = {
        outOfStock: itemsData?.filter(item => item.physical_stock === 0).length || 0,
        lowStock: itemsData?.filter(item => item.physical_stock <= 10).length || 0,
        overStock: itemsData?.filter(item => item.physical_stock > 100).length || 0,
        totalItems: itemsData?.length || 0
      }

      setDashboardKPIs({
        totalOrders: ordersData?.length || 0,
        todaysOrders,
        pendingOrders,
        completedOrders,
        stockOverview
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

      // Insert order items and reserve stock
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

      await refreshOrders()
      await refreshItems()
      await refreshDashboardKPIs()
      await logAuditEvent('CREATE', 'orders', data[0].id, orderData)

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
      await logAuditEvent('UPDATE', 'orders', id, updates)

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

      await refreshItems()
      await refreshDashboardKPIs()
      await logAuditEvent('CREATE', 'items', data[0].id, itemData)

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
      await logAuditEvent('UPDATE', 'items', id, updates)

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
      await logAuditEvent('DELETE', 'items', id)

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

      await refreshCompanies()
      await logAuditEvent('CREATE', 'companies', data[0].id, companyData)

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
      await logAuditEvent('UPDATE', 'companies', id, updates)

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
      await logAuditEvent('DELETE', 'companies', id)

      return { error: null }
    } catch (error) {
      console.error('Error deleting company:', error)
      return { error }
    }
  }

  const createTransportCompany = async (data: any) => {
    try {
      const { data: result, error } = await supabase
        .from('transport_companies')
        .insert([data])
        .select()

      if (error) throw error

      await refreshTransportCompanies()
      await logAuditEvent('CREATE', 'transport_companies', result[0].id, data)

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
      await logAuditEvent('UPDATE', 'transport_companies', id, updates)

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
      await logAuditEvent('DELETE', 'transport_companies', id)

      return { error: null }
    } catch (error) {
      console.error('Error deleting transport company:', error)
      return { error }
    }
  }

  const logAuditEvent = async (eventType: string, entity: string, entityId?: string, payload?: any) => {
    if (!user) return

    try {
      await supabase
        .from('audit_logs')
        .insert([{
          event_type: eventType,
          entity,
          entity_id: entityId,
          performed_by: user.id,
          payload
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
    logAuditEvent
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
