export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: number
          event_type: string
          entity: string
          entity_id: string | null
          performed_by: string | null
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          event_type: string
          entity: string
          entity_id?: string | null
          performed_by?: string | null
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          event_type?: string
          entity?: string
          entity_id?: string | null
          performed_by?: string | null
          payload?: Json | null
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          address: string | null
          gst_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          gst_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          gst_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          unit: string
          physical_stock: number
          reserved_stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string | null
          unit?: string
          physical_stock?: number
          reserved_stock?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string | null
          unit?: string
          physical_stock?: number
          reserved_stock?: number
          created_at?: string
          updated_at?: string
        }
      }
      login_activities: {
        Row: {
          id: number
          user_id: string
          ip: string | null
          user_agent: string | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          ip?: string | null
          user_agent?: string | null
          success?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          ip?: string | null
          user_agent?: string | null
          success?: boolean
          created_at?: string
        }
      }
      order_items: {
        Row: {
          order_id: string
          item_id: string
          quantity: number
          price: number | null
        }
        Insert: {
          order_id: string
          item_id: string
          quantity: number
          price?: number | null
        }
        Update: {
          order_id?: string
          item_id?: string
          quantity?: number
          price?: number | null
        }
      }
      orders: {
        Row: {
          id: string
          company_id: string
          transport_company_id: string | null
          created_by: string
          status: 'reserved' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          transport_company_id?: string | null
          created_by: string
          status?: 'reserved' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          transport_company_id?: string | null
          created_by?: string
          status?: 'reserved' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transport_companies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'staff'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'staff'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'staff'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}