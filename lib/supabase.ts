import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fefudfesrzwigzinhpoe.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZnVkZmVzcnp3aWd6aW5ocG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjkwMTcsImV4cCI6MjA3NTA0NTAxN30.lCIKsSJJt6iyoWoXDaff69hsISBrHdwb1dp5Xr2Rt3Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'maharj-flap-wheel'
    }
  }
})

// Database types matching the schema
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'staff'
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  address?: string
  gst_number?: string
  created_at: string
  updated_at: string
}

export interface TransportCompany {
  id: string
  name: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  sku: string
  name: string
  description?: string
  unit: string
  physical_stock: number
  reserved_stock: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  company_id: string
  transport_company_id?: string
  created_by: string
  status: 'reserved' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  company?: Company
  transport_company?: TransportCompany
  order_items?: OrderItem[]
}

export interface OrderItem {
  order_id: string
  item_id: string
  quantity: number
  price: number
  delivered_quantity?: number
  item?: Item
}

export interface AuditLog {
  id: number
  event_type: string
  entity: string
  entity_id?: string
  performed_by?: string
  payload?: any
  created_at: string
}

export interface LoginActivity {
  id: number
  user_id: string
  ip?: string
  user_agent?: string
  success: boolean
  created_at: string
}

// Additional types for the ERP system
export interface Unit {
  id: string
  name: string
  abbreviation: string
  created_at: string
}

export interface StockStatus {
  outOfStock: number
  lowStock: number
  overStock: number
  totalItems: number
}

export interface DashboardKPIs {
  totalOrders: number
  todaysOrders: number
  pendingOrders: number
  completedOrders: number
  stockOverview: StockStatus
}

export interface CSVExportData {
  headers: string[]
  rows: any[]
  filename: string
}
